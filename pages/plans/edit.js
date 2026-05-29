const { getPlan, savePlan, generateId } = require('../../utils/storage')

Page({
  data: {
    isEdit: false,
    planId: '',
    form: {
      name: '',
      groupsPerDay: 5,
      repsPerGroup: 20,
      restSeconds: 60,
      coverImage: '',
      emoji: '💪',
      color: '#ff6b6b'
    },
    type: 'custom',
    saving: false
  },

  onLoad(options) {
    if (options && options.planId) {
      const plan = getPlan(options.planId)
      if (plan) {
        this.setData({
          isEdit: true,
          planId: plan.id,
          exerciseType: plan.exerciseType || 'reps',
          form: {
            name: plan.name,
            groupsPerDay: plan.groupsPerDay,
            repsPerGroup: plan.repsPerGroup,
            restSeconds: plan.restSeconds,
            targetDuration: plan.targetDuration || 120,
            coverImage: plan.coverImage || '',
            emoji: plan.emoji || '💪',
            color: plan.color || '#ff6b6b'
          }
        })
      }
    }
  },

  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value })
  },

  increaseGroups() {
    this.setData({ 'form.groupsPerDay': Math.min(this.data.form.groupsPerDay + 1, 50) })
  },
  decreaseGroups() {
    this.setData({ 'form.groupsPerDay': Math.max(this.data.form.groupsPerDay - 1, 1) })
  },

  increaseReps() {
    this.setData({ 'form.repsPerGroup': Math.min(this.data.form.repsPerGroup + 1, 200) })
  },
  decreaseReps() {
    this.setData({ 'form.repsPerGroup': Math.max(this.data.form.repsPerGroup - 1, 1) })
  },

  increaseRest() {
    this.setData({ 'form.restSeconds': Math.min(this.data.form.restSeconds + 10, 600) })
  },
  decreaseRest() {
    this.setData({ 'form.restSeconds': Math.max(this.data.form.restSeconds - 10, 10) })
  },

  increaseTargetDuration() {
    this.setData({ 'form.targetDuration': Math.min(this.data.form.targetDuration + 10, 600) })
  },
  decreaseTargetDuration() {
    this.setData({ 'form.targetDuration': Math.max(this.data.form.targetDuration - 10, 10) })
  },

  // 可选颜色
  selectColor(e) {
    const { color } = e.currentTarget.dataset
    this.setData({ 'form.color': color })
  },

  // 可选 emoji
  selectEmoji(e) {
    const { emoji } = e.currentTarget.dataset
    this.setData({ 'form.emoji': emoji })
  },

  // 选择封面图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
        // 保存到本地持久文件
        wx.saveFile({
          tempFilePath: tempPath,
          success: (saveRes) => {
            this.setData({ 'form.coverImage': saveRes.savedFilePath })
          },
          fail: () => {
            // 如果保存失败，至少用临时路径
            this.setData({ 'form.coverImage': tempPath })
          }
        })
      }
    })
  },

  // 清除封面图片（恢复 emoji 显示）
  clearCover() {
    this.setData({ 'form.coverImage': '' })
  },

  save() {
    const { form, isEdit, planId, type, exerciseType } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入计划名称', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    const plan = {
      id: isEdit ? planId : generateId(),
      name: form.name.trim(),
      type: isEdit ? type : 'custom',
      exerciseType: exerciseType || 'reps',
      coverImage: form.coverImage,
      groupsPerDay: form.groupsPerDay,
      repsPerGroup: form.repsPerGroup,
      restSeconds: form.restSeconds,
      targetDuration: form.targetDuration || 120,
      emoji: form.emoji,
      color: form.color
    }

    savePlan(plan)

    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 800)
  }
})
