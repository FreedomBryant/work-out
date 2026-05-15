const { getPlans, getTodayRecords, deletePlan } = require('../../utils/storage')

Page({
  data: {
    plans: [],
    todayData: {}
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const plans = getPlans()
    const todayData = {}
    plans.forEach(p => {
      const records = getTodayRecords(p.id)
      const totalGroups = records.reduce((sum, r) => sum + r.groupsComplete, 0)
      todayData[p.id] = {
        done: totalGroups,
        total: p.groupsPerDay
      }
    })
    this.setData({ plans, todayData })
  },

  startWorkout(e) {
    const { planid } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/workout/index?planId=${planid}` })
  },

  editPlan(e) {
    const { planid } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/plans/edit?planId=${planid}` })
  },

  addPlan() {
    wx.navigateTo({ url: '/pages/plans/edit' })
  },

  deletePlan(e) {
    const { planid, name } = e.currentTarget.dataset
    wx.showModal({
      title: '删除计划',
      content: `确定要删除「${name}」吗？相关记录也会被删除。`,
      success: (res) => {
        if (res.confirm) {
          deletePlan(planid)
          this.loadData()
        }
      }
    })
  }
})
