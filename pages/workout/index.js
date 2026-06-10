const { getSettings, updateTodayRecord, getPlan, getTodayRecords } = require('../../utils/storage')
const { playRestEnd, playWorkoutComplete } = require('../../utils/voice')

Page({
  data: {
    planId: '',
    planName: '',
    emoji: '💪',
    planColor: '#ff6b6b',
    exerciseType: 'reps',        // reps | timed
    phase: 'ready',              // ready | working | resting | finished
    // reps 模式
    currentGroup: 1,
    totalGroups: 5,
    repsPerGroup: 20,
    restCountdown: 0,
    restSeconds: 60,
    progressPercent: 0,
    completedGroups: [],
    // timed 模式（平板支撑）
    targetDuration: 120,
    elapsedSeconds: 0,
    startTime: 0
  },

  restTimer: null,
  plankTimer: null,

  onLoad(options) {
    const planId = (options && options.planId) || 'pushups'
    const plan = getPlan(planId) || {}
    const exerciseType = plan.exerciseType || 'reps'

    const data = {
      planId: planId,
      planName: plan.name || '俯卧撑',
      emoji: plan.emoji || '💪',
      planColor: plan.color || '#ff6b6b',
      exerciseType: exerciseType,
      progressPercent: 0
    }

    if (exerciseType === 'timed') {
      data.targetDuration = plan.targetDuration || 120
      data.elapsedSeconds = 0
      data.timerDisplay = this.formatDuration(0)
      data.targetDisplay = this.formatDuration(data.targetDuration)
    } else {
      data.totalGroups = plan.groupsPerDay || 5
      data.repsPerGroup = plan.repsPerGroup || 20
      data.restSeconds = plan.restSeconds || 60
      data.currentGroup = 1
      data.completedGroups = []
      data.phase = 'ready'
    }

    this.setData(data)

    wx.setKeepScreenOn({ keepScreenOn: true })

    // 仅 reps 模式需要恢复进度
    if (exerciseType !== 'timed') {
      this.tryRestoreProgress(plan)
    }
  },

  onUnload() {
    this.clearRestTimer()
    this.clearPlankTimer()
    this.saveProgressOnExit()
  },

  onHide() {
    this.clearRestTimer()
    this.clearPlankTimer()
  },

  onShow() {
    const { phase, restSeconds, exerciseType } = this.data
    if (exerciseType === 'timed') {
      // 如果正在计时中，恢复计时
      if (phase === 'working' && this.data.startTime > 0) {
        this.startPlankTimer()
      }
    } else if (phase === 'resting') {
      this.setData({ restCountdown: restSeconds })
      this.clearRestTimer()
      this.startRestTimer()
    }
  },

  // 尝试恢复未完成的进度（仅 reps 模式）
  tryRestoreProgress(plan) {
    const { planId, totalGroups } = this.data
    const todayRecords = getTodayRecords(planId)
    if (todayRecords.length === 0) return

    const lastRecord = todayRecords[todayRecords.length - 1]
    const savedGroups = lastRecord.completedGroups
    const savedCount = lastRecord.groupsComplete

    // 已达标（已完成所有组）
    if (savedCount >= totalGroups) {
      const groups = (Array.isArray(savedGroups) && savedGroups.length > 0)
        ? savedGroups
        : Array.from({ length: totalGroups }, (_, i) => i + 1)
      this.setData({
        phase: 'finished',
        currentGroup: totalGroups,
        completedGroups: groups,
        progressPercent: 100
      })
      return
    }

    // 未达标（有已完成的组，但未达目标）
    if (savedCount > 0) {
      // 如果 completedGroups 数组是空（旧数据），从 groupsComplete 重建
      const groups = (Array.isArray(savedGroups) && savedGroups.length > 0)
        ? savedGroups
        : Array.from({ length: savedCount }, (_, i) => i + 1)

      wx.showModal({
        title: '发现上次未完成的锻炼',
        content: `已完成 ${savedCount} 组，是否继续？`,
        cancelText: '重新开始',
        confirmText: '继续锻炼',
        success: (res) => {
          if (res.confirm) {
            // 继续上次进度
            this.setData({
              phase: 'ready',
              currentGroup: groups[groups.length - 1] + 1,
              completedGroups: groups,
              progressPercent: (savedCount / totalGroups) * 100
            })
          } else {
            // 重新开始：清除今日记录
            this.clearTodayProgress(planId)
            this.setData({
              phase: 'ready',
              currentGroup: 1,
              completedGroups: [],
              progressPercent: 0
            })
          }
        }
      })
    }
  },

  // 清除今日记录的已保存进度
  clearTodayProgress(planId) {
    const records = wx.getStorageSync('records') || []
    const today = new Date()
    const dateStr = today.getFullYear() + '-'
      + String(today.getMonth() + 1).padStart(2, '0') + '-'
      + String(today.getDate()).padStart(2, '0')
    const filtered = records.filter(r => !(r.date === dateStr && r.planId === planId))
    wx.setStorageSync('records', filtered)
  },

  // 震动反馈
  tryVibrate(type = 'medium') {
    const settings = getSettings()
    if (settings.vibrationEnabled) {
      wx.vibrateShort({ type })
    }
  },

  // 声音反馈
  tryPlaySound(type) {
    const settings = getSettings()
    if (settings.soundEnabled) {
      if (type === 'complete') {
        playWorkoutComplete()
      } else {
        playRestEnd()
      }
    }
  },

  // ==================== reps 模式 ====================

  // 开始一组
  startGroup() {
    const { phase, currentGroup } = this.data
    if (phase === 'resting') {
      this.clearRestTimer()
      this.setData({
        phase: 'working',
        currentGroup: currentGroup + 1,
        restCountdown: 0
      })
    } else {
      this.setData({ phase: 'working' })
    }
  },

  // 完成本组
  completeGroup() {
    const { currentGroup, totalGroups, completedGroups } = this.data
    const newCompleted = [...completedGroups, currentGroup]

    // 每完成一组立即保存进度（传入最新的组号数组，避免读到 this.data 中旧值）
    this.saveRecord(newCompleted.length, newCompleted)

    if (currentGroup >= totalGroups) {
      // 所有组完成
      this.setData({
        phase: 'finished',
        completedGroups: newCompleted,
        progressPercent: 100
      })
      this.clearRestTimer()
      this.tryVibrate('heavy')
      this.tryPlaySound('complete')
    } else {
      // 进入休息
      const { restSeconds } = this.data
      this.setData({
        phase: 'resting',
        completedGroups: newCompleted,
        restCountdown: restSeconds,
        progressPercent: (newCompleted.length / totalGroups) * 100
      })
      this.startRestTimer()
      this.tryVibrate('medium')
    }
  },

  // 休息倒计时
  startRestTimer() {
    this.clearRestTimer()
    this.restTimer = setInterval(() => {
      const { restCountdown } = this.data
      if (restCountdown <= 1) {
        // 休息结束
        this.clearRestTimer()
        this.setData({
          phase: 'ready', // 下一组前的就绪状态
          restCountdown: 0
        })
        this.tryVibrate('medium')
        this.tryPlaySound('rest')
      } else {
        this.setData({ restCountdown: restCountdown - 1 })
      }
    }, 1000)
  },

  clearRestTimer() {
    if (this.restTimer) {
      clearInterval(this.restTimer)
      this.restTimer = null
    }
  },

  // ==================== timed 模式（平板支撑） ====================

  // 开始计时
  startPlank() {
    this.setData({
      phase: 'working',
      elapsedSeconds: 0,
      startTime: Date.now()
    })
    this.startPlankTimer()
  },

  startPlankTimer() {
    this.clearPlankTimer()
    const tick = () => {
      const elapsed = Math.floor((Date.now() - this.data.startTime) / 1000)
      this.setData({
        elapsedSeconds: elapsed,
        timerDisplay: this.formatDuration(elapsed)
      })
    }
    tick()
    this.plankTimer = setInterval(tick, 1000)
  },

  clearPlankTimer() {
    if (this.plankTimer) {
      clearInterval(this.plankTimer)
      this.plankTimer = null
    }
  },

  // 完成平板支撑
  stopPlank() {
    this.clearPlankTimer()
    const duration = this.data.elapsedSeconds
    this.savePlankRecord(duration)
    this.tryVibrate('heavy')
    this.tryPlaySound('complete')
    this.setData({ phase: 'finished' })
  },

  savePlankRecord(duration) {
    const { planId, planName, targetDuration } = this.data
    const now = new Date()
    const dateStr = this.formatDate(now)
    const timeStr = this.formatTime(now)
    updateTodayRecord({
      planId: planId,
      planName: planName,
      exerciseType: 'timed',
      groupsComplete: 1,
      totalReps: duration,
      duration: duration,
      targetDuration: targetDuration,
      finishTime: `${dateStr} ${timeStr}`
    })
  },

  // ==================== 通用 ====================

  // 保存/更新今日记录（reps 模式，upsert，每天每计划一条）
  saveRecord(groupsComplete, completedGroupsArr) {
    const { totalGroups, repsPerGroup, planId, planName } = this.data
    const groups = completedGroupsArr || this.data.completedGroups
    const now = new Date()
    const dateStr = this.formatDate(now)
    const timeStr = this.formatTime(now)
    updateTodayRecord({
      planId: planId,
      planName: planName,
      exerciseType: 'reps',
      groupsComplete: groupsComplete,
      completedGroups: groups,
      repsPerGroup: repsPerGroup,
      totalReps: groupsComplete * repsPerGroup,
      finishTime: `${dateStr} ${timeStr}`
    })
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },

  formatDuration(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
  },

  // 主动结束锻炼
  endWorkout() {
    this.clearRestTimer()
    this.clearPlankTimer()
    const { phase, completedGroups, exerciseType, elapsedSeconds, planId } = this.data
    if (phase === 'finished') return

    if (exerciseType === 'timed') {
      if (elapsedSeconds > 0) {
        this.savePlankRecord(elapsedSeconds)
      }
      wx.showModal({
        title: '锻炼结束',
        content: elapsedSeconds > 0
          ? `已坚持 ${elapsedSeconds} 秒，已保存记录`
          : '本次未完成锻炼',
        success: () => {
          wx.switchTab({ url: '/pages/plans/index' })
        }
      })
    } else {
      if (completedGroups.length > 0) {
        this.saveRecord(completedGroups.length)
      }
      wx.showModal({
        title: '锻炼结束',
        content: completedGroups.length > 0
          ? `已完成 ${completedGroups.length} 组，已保存记录`
          : '本次未完成任何组',
        success: () => {
          wx.switchTab({ url: '/pages/plans/index' })
        }
      })
    }
  },

  // 退出时静默保存进度（左滑返回、点返回按钮触发）
  saveProgressOnExit() {
    const { phase, completedGroups, exerciseType, elapsedSeconds } = this.data
    if (phase === 'finished') return
    if (exerciseType === 'timed') {
      if (elapsedSeconds > 0) {
        this.savePlankRecord(elapsedSeconds)
      }
    } else {
      if (completedGroups && completedGroups.length > 0) {
        this.saveRecord(completedGroups.length)
      }
    }
  },

  // 返回计划列表
  goBack() {
    wx.navigateBack()
  }
})
