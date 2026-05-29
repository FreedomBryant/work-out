/**
 * 数据存储层
 * 管理多计划、锻炼记录、全局设置
 */

const STORAGE_KEYS = {
  PLANS: 'plans',
  RECORDS: 'records',
  SETTINGS: 'settings',
  MIGRATED: 'data_migrated_v2'
}

// 默认预置计划
const DEFAULT_PLANS = [
  {
    id: 'pushups',
    name: '俯卧撑',
    type: 'preset',
    exerciseType: 'reps',
    coverImage: '',
    groupsPerDay: 5,
    repsPerGroup: 20,
    restSeconds: 60,
    createdAt: 0,
    emoji: '💪',
    color: '#ff6b6b'
  },
  {
    id: 'pullups',
    name: '引体向上',
    type: 'preset',
    exerciseType: 'reps',
    coverImage: '',
    groupsPerDay: 3,
    repsPerGroup: 8,
    restSeconds: 90,
    createdAt: 0,
    emoji: '🏋️',
    color: '#4ecdc4'
  },
  {
    id: 'squats',
    name: '深蹲',
    type: 'preset',
    exerciseType: 'reps',
    coverImage: '',
    groupsPerDay: 5,
    repsPerGroup: 30,
    restSeconds: 60,
    createdAt: 0,
    emoji: '🦵',
    color: '#45b7d1'
  },
  {
    id: 'plank',
    name: '平板支撑',
    type: 'preset',
    exerciseType: 'timed',
    coverImage: '',
    targetDuration: 120,
    createdAt: 0,
    emoji: '🧘',
    color: '#9b59b6'
  }
]

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true
}

// ---- 初始化/数据迁移 ----
function ensureMigrated() {
  // v3：更新预置计划图标（引体向上 💪 → 🏋️）
  const EMOJI_V3_KEY = 'data_emoji_v3'
  if (!wx.getStorageSync(EMOJI_V3_KEY)) {
    const storedPlans = wx.getStorageSync(STORAGE_KEYS.PLANS)
    if (Array.isArray(storedPlans)) {
      let changed = false
      const updated = storedPlans.map(p => {
        if (p.id === 'pullups' && p.emoji === '💪') {
          changed = true
          return { ...p, emoji: '🏋️' }
        }
        return p
      })
      if (changed) {
        wx.setStorageSync(STORAGE_KEYS.PLANS, updated)
      }
    }
    wx.setStorageSync(EMOJI_V3_KEY, true)
  }

  // v4：添加平板支撑预置计划（给已有用户追加）
  const PLANK_V4_KEY = 'data_plank_v4'
  if (!wx.getStorageSync(PLANK_V4_KEY)) {
    const storedPlans = wx.getStorageSync(STORAGE_KEYS.PLANS)
    if (Array.isArray(storedPlans)) {
      const hasPlank = storedPlans.some(p => p.id === 'plank')
      if (!hasPlank) {
        storedPlans.push({
          id: 'plank',
          name: '平板支撑',
          type: 'preset',
          exerciseType: 'timed',
          coverImage: '',
          targetDuration: 120,
          createdAt: Date.now(),
          emoji: '🧘',
          color: '#9b59b6'
        })
        wx.setStorageSync(STORAGE_KEYS.PLANS, storedPlans)
      }
    }
    wx.setStorageSync(PLANK_V4_KEY, true)
  }

  if (wx.getStorageSync(STORAGE_KEYS.MIGRATED)) return

  // 从旧设置中提取音效/震动
  const oldSettings = wx.getStorageSync('settings')
  if (oldSettings && typeof oldSettings === 'object') {
    const settings = {
      soundEnabled: oldSettings.soundEnabled !== false,
      vibrationEnabled: oldSettings.vibrationEnabled !== false
    }
    wx.setStorageSync(STORAGE_KEYS.SETTINGS, settings)
  }

  // 创建默认预置计划
  const plans = DEFAULT_PLANS.map((p, i) => ({ ...p, createdAt: Date.now() + i }))
  wx.setStorageSync(STORAGE_KEYS.PLANS, plans)

  // 迁移旧记录：补充 planId
  const oldRecords = wx.getStorageSync(STORAGE_KEYS.RECORDS)
  if (Array.isArray(oldRecords) && oldRecords.length > 0) {
    const migrated = oldRecords.map(r => ({
      ...r,
      planId: r.planId || 'pushups',
      planName: r.planName || '俯卧撑'
    }))
    wx.setStorageSync(STORAGE_KEYS.RECORDS, migrated)
  }

  wx.setStorageSync(STORAGE_KEYS.MIGRATED, true)
}

// ---- 计划操作 ----
function getPlans() {
  ensureMigrated()
  return wx.getStorageSync(STORAGE_KEYS.PLANS) || DEFAULT_PLANS.map((p, i) => ({ ...p, createdAt: Date.now() + i }))
}

function getPlan(id) {
  const plans = getPlans()
  return plans.find(p => p.id === id) || null
}

function savePlan(plan) {
  ensureMigrated()
  const plans = getPlans()
  const idx = plans.findIndex(p => p.id === plan.id)
  if (idx >= 0) {
    plans[idx] = plan
  } else {
    if (!plan.createdAt) plan.createdAt = Date.now()
    plans.push(plan)
  }
  wx.setStorageSync(STORAGE_KEYS.PLANS, plans)
}

function deletePlan(id) {
  const plans = getPlans()
  const target = plans.find(p => p.id === id)
  if (target && target.type === 'preset') {
    console.warn('[storage] 预置计划不可删除')
    return false
  }
  const filtered = plans.filter(p => p.id !== id)
  wx.setStorageSync(STORAGE_KEYS.PLANS, filtered)

  // 同时删除关联记录
  const records = getRecords()
  const remaining = records.filter(r => r.planId !== id)
  wx.setStorageSync(STORAGE_KEYS.RECORDS, remaining)
  return true
}

function generateId() {
  return 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
}

// ---- 记录操作 ----
function getRecords(planId) {
  ensureMigrated()
  const all = wx.getStorageSync(STORAGE_KEYS.RECORDS) || []
  if (planId) {
    return all.filter(r => r.planId === planId)
  }
  return all
}

function addRecord(record) {
  ensureMigrated()
  const records = wx.getStorageSync(STORAGE_KEYS.RECORDS) || []
  records.push({
    ...record,
    planId: record.planId || 'pushups',
    planName: record.planName || '俯卧撑'
  })
  wx.setStorageSync(STORAGE_KEYS.RECORDS, records)
}

function clearRecords(planId) {
  if (planId) {
    const records = getRecords()
    const remaining = records.filter(r => r.planId !== planId)
    wx.setStorageSync(STORAGE_KEYS.RECORDS, remaining)
  } else {
    wx.setStorageSync(STORAGE_KEYS.RECORDS, [])
  }
}

function getTodayRecords(planId) {
  const today = new Date()
  const dateStr = today.getFullYear() + '-'
    + String(today.getMonth() + 1).padStart(2, '0') + '-'
    + String(today.getDate()).padStart(2, '0')

  const records = getRecords(planId)
  return records.filter(r => r.date === dateStr)
}

// ---- 设置操作 ----
function getSettings() {
  ensureMigrated()
  return wx.getStorageSync(STORAGE_KEYS.SETTINGS) || { ...DEFAULT_SETTINGS }
}

function saveSettings(settings) {
  wx.setStorageSync(STORAGE_KEYS.SETTINGS, settings)
}

function updateTodayRecord(record) {
  ensureMigrated()
  const today = new Date()
  const dateStr = today.getFullYear() + '-'
    + String(today.getMonth() + 1).padStart(2, '0') + '-'
    + String(today.getDate()).padStart(2, '0')

  const records = wx.getStorageSync(STORAGE_KEYS.RECORDS) || []
  const idx = records.findIndex(r => r.date === dateStr && r.planId === record.planId)

  if (idx >= 0) {
    // 更新今日记录
    records[idx].groupsComplete = record.groupsComplete
    records[idx].totalReps = record.totalReps
    records[idx].finishTime = record.finishTime
    records[idx].planName = record.planName
    records[idx].repsPerGroup = record.repsPerGroup
    records[idx].completedGroups = record.completedGroups
    records[idx].exerciseType = record.exerciseType
    if (record.duration !== undefined) records[idx].duration = record.duration
  } else {
    // 新建今日记录
    records.push({
      ...record,
      date: dateStr,
      planId: record.planId || 'pushups',
      planName: record.planName || '俯卧撑'
    })
  }
  wx.setStorageSync(STORAGE_KEYS.RECORDS, records)
}

module.exports = {
  getPlans,
  getPlan,
  savePlan,
  deletePlan,
  generateId,
  getRecords,
  addRecord,
  updateTodayRecord,
  clearRecords,
  getTodayRecords,
  getSettings,
  saveSettings
}
