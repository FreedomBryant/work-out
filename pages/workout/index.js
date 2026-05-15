const { getSettings, addRecord, getPlan } = require('../../utils/storage')
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

    if (currentGroup >= totalGroups) {
      // 所有组完成
      this.setData({
        phase: 'finished',
        completedGroups: newCompleted,
        progressPercent: 100
      })
      this.saveRecord(newCompleted.length)
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

  // 保存记录
  saveRecord(groupsComplete) {
    const { totalGroups, repsPerGroup, planId, planName } = this.data
    const now = new Date()
    const dateStr = this.formatDate(now)
    const timeStr = this.formatTime(now)
    addRecord({
      date: dateStr,
      planId: planId,
      planName: planName,
      groupsComplete: groupsComplete,
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
        this.setData({
          phase: 'ready',
          currentGroup: 1,
          restCountdown: 0,
          progressPercent: 0,
          completedGroups: []
        })
      }
    })
  },

  // 返回计划列表
  goBack() {
    wx.navigateBack()
  }
})
