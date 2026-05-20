const { getSettings, updateTodayRecord, getPlan, getTodayRecords } = require('../../utils/storage')
const { playRestEnd, playWorkoutComplete } = require('../../utils/voice')

Page({
  data: {
    planId: '',
    planName: '',
    emoji: '💪',
    planColor: '#ff6b6b',
    phase: 'ready',          // ready | working | resting | finished
    currentGroup: 1,
    totalGroups: 5,
    repsPerGroup: 20,
    restCountdown: 0,
    restSeconds: 60,
    progressPercent: 0,
    completedGroups: []
  },

  restTimer: null,

  onLoad(options) {
    const planId = (options && options.planId) || 'pushups'
    const plan = getPlan(planId) || {}
    
    this.setData({
      planId: planId,
      planName: plan.name || '俯卧撑',
      emoji: plan.emoji || '💪',
      planColor: plan.color || '#ff6b6b',
      totalGroups: plan.groupsPerDay || 5,
      repsPerGroup: plan.repsPerGroup || 20,
      restSeconds: plan.restSeconds || 60,
      progressPercent: 0
    })

    wx.setKeepScreenOn({ keepScreenOn: true })

    // 检查是否有未完成的今日记录，尝试恢复进度
    this.tryRestoreProgress(plan)
  },

  onUnload() {
    this.clearRestTimer()
  },

  onHide() {
    this.clearRestTimer()
  },

  onShow() {
    const { phase, restSeconds } = this.data
    if (phase === 'resting') {
      this.setData({ restCountdown: restSeconds })
      this.clearRestTimer()
      this.startRestTimer()
    }
  },

  // 尝试恢复未完成的进度
  tryRestoreProgress(plan) {
    const { planId, totalGroups } = this.data
    const todayRecords = getTodayRecords(planId)
    if (todayRecords.length === 0) return

    const lastRecord = todayRecords[todayRecords.length - 1]
    const savedGroups = lastRecord.completedGroups
    const savedCount = lastRecord.groupsComplete

    // 未达标（有已完成的组，但未达目标）
    if (savedCount > 0 && savedCount < totalGroups) {
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

  // 保存/更新今日记录（upsert，每天每计划一条）
  saveRecord(groupsComplete, completedGroupsArr) {
    const { totalGroups, repsPerGroup, planId, planName } = this.data
    const groups = completedGroupsArr || this.data.completedGroups
    const now = new Date()
    const dateStr = this.formatDate(now)
    const timeStr = this.formatTime(now)
    updateTodayRecord({
      planId: planId,
      planName: planName,
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

  // 主动结束锻炼
  endWorkout() {
    this.clearRestTimer()
    const { phase, completedGroups } = this.data
    if (phase === 'finished') return
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
  },

  // 返回计划列表
  goBack() {
    wx.navigateBack()
  }
})
