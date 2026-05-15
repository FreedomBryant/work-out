const { getSettings, saveSettings } = require('../../utils/storage')
const { clearRecords, getRecords } = require('../../utils/storage')

Page({
  data: {
    settings: {},
    recordCount: 0
  },

  onLoad() {
    this.loadSettings()
  },

  onShow() {
    this.loadSettings()
  },

  loadSettings() {
    const settings = getSettings()
    const records = getRecords()
    this.setData({ settings, recordCount: records.length })
  },

  toggleSound() {
    const { settings } = this.data
    settings.soundEnabled = !settings.soundEnabled
    this.setData({ settings })
    saveSettings(settings)
  },

  toggleVibration() {
    const { settings } = this.data
    settings.vibrationEnabled = !settings.vibrationEnabled
    this.setData({ settings })
    saveSettings(settings)
  },

  clearAllHistory() {
    wx.showModal({
      title: '清空历史',
      content: '确定要清空所有锻炼记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          clearRecords()
          this.setData({ recordCount: 0 })
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }
})
