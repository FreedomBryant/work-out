# 俯卧撑微信小程序 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `D:\atom_space\work-out` 下创建可运行的微信小程序，包含设置、锻炼、历史三个页面，实现完整俯卧撑锻炼流程。

**架构:** 原生微信小程序（WXML + WXSS + JS），数据通过 wx.setStorage/wx.getStorage 持久化到本地。

**Tech Stack:** 微信小程序原生开发

---

### 文件结构

```
work-out/
  project.config.json       # 项目配置
  app.js                    # 应用入口
  app.json                  # 应用配置（页面注册、窗口样式）
  app.wxss                  # 全局样式
  pages/
    settings/
      index.js              # 设置页逻辑
      index.json            # 设置页配置
      index.wxml            # 设置页模板
      index.wxss            # 设置页样式
    workout/
      index.js              # 锻炼页逻辑（核心）
      index.json            # 锻炼页配置
      index.wxml            # 锻炼页模板
      index.wxss            # 锻炼页样式
    history/
      index.js              # 历史记录页逻辑
      index.json            # 历史记录页配置
      index.wxml            # 历史记录页模板
      index.wxss            # 历史记录页样式
  utils/
    storage.js              # 本地存储封装
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `D:\atom_space\work-out\project.config.json`
- Create: `D:\atom_space\work-out\app.json`
- Create: `D:\atom_space\work-out\app.js`
- Create: `D:\atom_space\work-out\app.wxss`

- [ ] **Step 1: 创建 project.config.json**

```json
{
  "description": "俯卧撑锻炼小程序",
  "packOptions": {
    "ignore": [],
    "include": []
  },
  "setting": {
    "bundle": false,
    "userConfirmedBundleSwitch": false,
    "urlCheck": true,
    "scopeDataCheck": false,
    "coverView": true,
    "es6": true,
    "postcss": true,
    "compileHotReLoad": false,
    "linter": true,
    "enableServerModule": false
  },
  "appid": "touristappid",
  "projectname": "俯卧撑锻炼",
  "libVersion": "3.7.9",
  "condition": {},
  "editorSetting": {
    "tabIndent": "insertSpaces",
    "tabSize": 2
  }
}
```

- [ ] **Step 2: 创建 app.json — 注册三个页面 + 配置窗口**

```json
{
  "pages": [
    "pages/settings/index",
    "pages/workout/index",
    "pages/history/index"
  ],
  "window": {
    "navigationBarTitleText": "俯卧撑锻炼",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5"
  }
}
```

- [ ] **Step 3: 创建 app.js**

```javascript
App({
  onLaunch() {
    // 小程序启动时初始化
  }
})
```

- [ ] **Step 4: 创建 app.wxss（空文件或基础全局样式）**

```css
/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

### Task 2: 本地存储工具模块

**Files:**
- Create: `D:\atom_space\work-out\utils\storage.js`

- [ ] **Step 1: 实现 storage.js**

```javascript
const SETTINGS_KEY = 'settings'
const RECORDS_KEY = 'records'

// 默认设置
const DEFAULT_SETTINGS = {
  groupsPerDay: 5,
  restSeconds: 60,
  repsPerGroup: 20
}

/**
 * 获取设置，若无则返回默认值
 */
function getSettings() {
  try {
    const data = wx.getStorageSync(SETTINGS_KEY)
    return data ? { ...DEFAULT_SETTINGS, ...data } : { ...DEFAULT_SETTINGS }
  } catch (e) {
    return { ...DEFAULT_SETTINGS }
  }
}

/**
 * 保存设置
 */
function saveSettings(settings) {
  wx.setStorageSync(SETTINGS_KEY, settings)
}

/**
 * 获取所有历史记录
 */
function getRecords() {
  try {
    const data = wx.getStorageSync(RECORDS_KEY)
    return Array.isArray(data) ? data : []
  } catch (e) {
    return []
  }
}

/**
 * 添加一条记录
 */
function addRecord(record) {
  const records = getRecords()
  records.unshift({
    date: record.date,
    groupsComplete: record.groupsComplete,
    repsPerGroup: record.repsPerGroup,
    totalReps: record.totalReps,
    finishTime: record.finishTime
  })
  wx.setStorageSync(RECORDS_KEY, records)
}

/**
 * 清空历史记录
 */
function clearRecords() {
  wx.setStorageSync(RECORDS_KEY, [])
}

module.exports = {
  getSettings,
  saveSettings,
  getRecords,
  addRecord,
  clearRecords
}
```

---

### Task 3: 设置页

**Files:**
- Create: `D:\atom_space\work-out\pages\settings\index.js`
- Create: `D:\atom_space\work-out\pages\settings\index.json`
- Create: `D:\atom_space\work-out\pages\settings\index.wxml`
- Create: `D:\atom_space\work-out\pages\settings\index.wxss`

- [ ] **Step 1: index.json**

```json
{
  "navigationBarTitleText": "锻炼设置"
}
```

- [ ] **Step 2: index.wxml — 三个输入 + 按钮**

```xml
<view class="container">
  <view class="card">
    <view class="setting-item">
      <text class="label">每日组数</text>
      <view class="stepper">
        <view class="step-btn" bindtap="decreaseGroups">−</view>
        <text class="value">{{settings.groupsPerDay}}</text>
        <view class="step-btn" bindtap="increaseGroups">+</view>
      </view>
    </view>
    <view class="setting-item">
      <text class="label">每组个数</text>
      <view class="stepper">
        <view class="step-btn" bindtap="decreaseReps">−</view>
        <text class="value">{{settings.repsPerGroup}}</text>
        <view class="step-btn" bindtap="increaseReps">+</view>
      </view>
    </view>
    <view class="setting-item">
      <text class="label">组间休息(秒)</text>
      <view class="stepper">
        <view class="step-btn" bindtap="decreaseRest">−</view>
        <text class="value">{{settings.restSeconds}}</text>
        <view class="step-btn" bindtap="increaseRest">+</view>
      </view>
    </view>
  </view>
  <view class="btn-row">
    <button class="btn-primary" bindtap="startWorkout">开始锻炼</button>
    <button class="btn-secondary" bindtap="goHistory">历史记录</button>
  </view>
</view>
```

- [ ] **Step 3: index.wxss**

```css
.container {
  padding: 30rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 40rpx;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 32rpx;
  color: #333;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.step-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #ff6b6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  line-height: 1;
}

.value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  min-width: 60rpx;
  text-align: center;
}

.btn-row {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.btn-primary {
  background: #ff6b6b !important;
  color: #fff !important;
  border-radius: 50rpx;
  font-size: 32rpx;
  padding: 24rpx 0;
}

.btn-secondary {
  background: #fff !important;
  color: #666 !important;
  border: 2rpx solid #ddd;
  border-radius: 50rpx;
  font-size: 32rpx;
  padding: 24rpx 0;
}
```

- [ ] **Step 4: index.js**

```javascript
const { getSettings, saveSettings } = require('../../utils/storage')

Page({
  data: {
    settings: {}
  },

  onLoad() {
    const settings = getSettings()
    this.setData({ settings })
  },

  increaseGroups() {
    const { settings } = this.data
    settings.groupsPerDay = Math.min(settings.groupsPerDay + 1, 50)
    this.setData({ settings })
    saveSettings(settings)
  },

  decreaseGroups() {
    const { settings } = this.data
    settings.groupsPerDay = Math.max(settings.groupsPerDay - 1, 1)
    this.setData({ settings })
    saveSettings(settings)
  },

  increaseReps() {
    const { settings } = this.data
    settings.repsPerGroup = Math.min(settings.repsPerGroup + 1, 200)
    this.setData({ settings })
    saveSettings(settings)
  },

  decreaseReps() {
    const { settings } = this.data
    settings.repsPerGroup = Math.max(settings.repsPerGroup - 1, 1)
    this.setData({ settings })
    saveSettings(settings)
  },

  increaseRest() {
    const { settings } = this.data
    settings.restSeconds = Math.min(settings.restSeconds + 10, 600)
    this.setData({ settings })
    saveSettings(settings)
  },

  decreaseRest() {
    const { settings } = this.data
    settings.restSeconds = Math.max(settings.restSeconds - 10, 10)
    this.setData({ settings })
    saveSettings(settings)
  },

  startWorkout() {
    wx.navigateTo({ url: '/pages/workout/index' })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/index' })
  }
})
```

---

### Task 4: 锻炼页（核心逻辑）

**Files:**
- Create: `D:\atom_space\work-out\pages\workout\index.js`
- Create: `D:\atom_space\work-out\pages\workout\index.json`
- Create: `D:\atom_space\work-out\pages\workout\index.wxml`
- Create: `D:\atom_space\work-out\pages\workout\index.wxss`

- [ ] **Step 1: index.json**

```json
{
  "navigationBarTitleText": "开始锻炼"
}
```

- [ ] **Step 2: index.wxml — 状态 + 倒计时 + 按钮**

```xml
<view class="container">
  <!-- 进度信息 -->
  <view class="progress-card">
    <view class="progress-title">第 {{currentGroup}} / {{totalGroups}} 组</view>
    <view class="progress-bar">
      <view class="progress-fill" style="width: {{progressPercent}}%"></view>
    </view>
  </view>

  <!-- 状态显示 -->
  <view class="status-card">
    <view wx:if="{{phase === 'working'}}" class="status working">
      <text class="status-icon">💪</text>
      <text class="status-text">正在锻炼... 加油！</text>
    </view>
    <view wx:elif="{{phase === 'resting'}}" class="status resting">
      <text class="status-icon">⏳</text>
      <text class="status-text">组间休息</text>
      <text class="countdown">{{restCountdown}}s</text>
    </view>
    <view wx:elif="{{phase === 'finished'}}" class="status finished">
      <text class="status-icon">🎉</text>
      <text class="status-text">全部完成！</text>
    </view>
    <view wx:else class="status ready">
      <text class="status-icon">🏋️</text>
      <text class="status-text">准备开始</text>
    </view>
  </view>

  <!-- 操作按钮 -->
  <view class="action-area">
    <button
      wx:if="{{phase === 'ready' || phase === 'resting'}}"
      class="btn-action"
      bindtap="startGroup"
    >开始一组</button>
    <button
      wx:elif="{{phase === 'working'}}"
      class="btn-action btn-complete"
      bindtap="completeGroup"
    >完成本组</button>
    <button
      wx:elif="{{phase === 'finished'}}"
      class="btn-action"
      bindtap="goHistory"
    >查看历史</button>
  </view>

  <!-- 本次已完成组数 -->
  <view class="summary" wx:if="{{completedGroups.length > 0}}">
    <text class="summary-title">本日完成</text>
    <view class="group-list">
      <view class="group-item" wx:for="{{completedGroups}}" wx:key="index">
        第 {{item}} 组 ✓
      </view>
    </view>
  </view>

  <!-- 结束按钮 -->
  <button class="btn-end" bindtap="endWorkout">结束锻炼</button>
</view>
```

- [ ] **Step 3: index.wxss**

```css
.container {
  padding: 30rpx;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 30rpx;
  width: 100%;
  margin-bottom: 30rpx;
  text-align: center;
}

.progress-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.progress-bar {
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ee5a24);
  border-radius: 6rpx;
  transition: width 0.3s;
}

.status-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  width: 100%;
  margin-bottom: 30rpx;
  text-align: center;
}

.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.status-icon {
  font-size: 80rpx;
}

.status-text {
  font-size: 36rpx;
  color: #333;
}

.countdown {
  font-size: 96rpx;
  font-weight: bold;
  color: #ff6b6b;
  margin-top: 16rpx;
}

.action-area {
  width: 100%;
  margin-bottom: 40rpx;
}

.btn-action {
  background: #ff6b6b !important;
  color: #fff !important;
  border-radius: 50rpx;
  font-size: 36rpx;
  padding: 28rpx 0;
  width: 80%;
  margin: 0 auto;
}

.btn-complete {
  background: #10b981 !important;
}

.summary {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  width: 100%;
  margin-bottom: 30rpx;
}

.summary-title {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 16rpx;
  display: block;
}

.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.group-item {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
}

.btn-end {
  background: transparent !important;
  color: #999 !important;
  font-size: 28rpx;
  border: none !important;
  text-decoration: underline;
}
```

- [ ] **Step 4: index.js（核心逻辑）**

```javascript
const { getSettings, addRecord } = require('../../utils/storage')

Page({
  data: {
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

  onLoad() {
    const settings = getSettings()
    const totalGroups = settings.groupsPerDay || 5
    this.setData({
      totalGroups,
      repsPerGroup: settings.repsPerGroup || 20,
      restSeconds: settings.restSeconds || 60,
      progressPercent: 0
    })
    wx.setKeepScreenOn({ keepScreenOn: true })
  },

  onUnload() {
    this.clearRestTimer()
  },

  // 开始一组
  startGroup() {
    this.setData({ phase: 'working' })
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
      return
    }

    // 进入休息状态
    const nextGroup = currentGroup + 1
    this.setData({
      phase: 'resting',
      restCountdown: this.data.restSeconds,
      completedGroups: newCompleted,
      progressPercent: Math.round((nextGroup - 1) / totalGroups * 100)
    })
    this.startRestTimer()
  },

  // 开始休息倒计时
  startRestTimer() {
    this.clearRestTimer()
    this.restTimer = setInterval(() => {
      const count = this.data.restCountdown - 1
      if (count <= 0) {
        this.clearRestTimer()
        const { currentGroup } = this.data
        this.setData({
          phase: 'ready',
          currentGroup: currentGroup + 1,
          restCountdown: 0
        })
      } else {
        this.setData({ restCountdown: count })
      }
    }, 1000)
  },

  clearRestTimer() {
    if (this.restTimer) {
      clearInterval(this.restTimer)
      this.restTimer = null
    }
  },

  // 保存本次记录
  saveRecord(groupsComplete) {
    const { repsPerGroup } = this.data
    const now = new Date()
    const dateStr = this.formatDate(now)
    const timeStr = this.formatTime(now)
    addRecord({
      date: dateStr,
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
    const { completedGroups } = this.data
    if (completedGroups.length > 0) {
      this.saveRecord(completedGroups.length)
    }
    wx.showModal({
      title: '锻炼结束',
      content: completedGroups.length > 0
        ? `已完成 ${completedGroups.length} 组，已保存记录`
        : '本次未完成任何组',
      success: () => {
        wx.navigateBack()
      }
    })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/index' })
  }
})
```

---

### Task 5: 历史记录页

**Files:**
- Create: `D:\atom_space\work-out\pages\history\index.js`
- Create: `D:\atom_space\work-out\pages\history\index.json`
- Create: `D:\atom_space\work-out\pages\history\index.wxml`
- Create: `D:\atom_space\work-out\pages\history\index.wxss`

- [ ] **Step 1: index.json**

```json
{
  "navigationBarTitleText": "历史记录"
}
```

- [ ] **Step 2: index.wxml**

```xml
<view class="container">
  <view wx:if="{{records.length === 0}}" class="empty">
    <text class="empty-icon">📋</text>
    <text class="empty-text">暂无记录</text>
    <text class="empty-hint">开始你的第一次锻炼吧！</text>
  </view>

  <view wx:else class="record-list">
    <view class="record-item" wx:for="{{records}}" wx:key="index">
      <view class="record-header">
        <text class="record-date">{{item.date}}</text>
        <text class="record-time">{{item.finishTime}}</text>
      </view>
      <view class="record-stats">
        <view class="stat">
          <text class="stat-value">{{item.groupsComplete}}</text>
          <text class="stat-label">组</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{item.repsPerGroup}}</text>
          <text class="stat-label">个/组</text>
        </view>
        <view class="stat">
          <text class="stat-value">{{item.totalReps}}</text>
          <text class="stat-label">总个数</text>
        </view>
      </view>
    </view>
  </view>

  <button
    wx:if="{{records.length > 0}}"
    class="btn-clear"
    bindtap="clearHistory"
  >清空历史</button>
</view>
```

- [ ] **Step 3: index.wxss**

```css
.container {
  padding: 30rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 36rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 28rpx;
  color: #ccc;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-date {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.record-time {
  font-size: 26rpx;
  color: #999;
}

.record-stats {
  display: flex;
  justify-content: space-around;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.btn-clear {
  margin-top: 40rpx;
  background: transparent !important;
  color: #e74c3c !important;
  font-size: 28rpx;
  border: 2rpx solid #e74c3c !important;
  border-radius: 50rpx;
  padding: 20rpx 0;
}
```

- [ ] **Step 4: index.js**

```javascript
const { getRecords, clearRecords } = require('../../utils/storage')

Page({
  data: {
    records: []
  },

  onLoad() {
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    const records = getRecords()
    this.setData({ records })
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          clearRecords()
          this.setData({ records: [] })
        }
      }
    })
  }
})
```

---

### Task 6: 验证与提交

- [ ] **Step 1: 确认所有文件已创建**

确保以下所有文件存在：
```
project.config.json
app.js, app.json, app.wxss
utils/storage.js
pages/settings/index.js, .json, .wxml, .wxss
pages/workout/index.js, .json, .wxml, .wxss
pages/history/index.js, .json, .wxml, .wxss
```

- [ ] **Step 2: 用微信开发者工具导入 `D:\atom_space\work-out` 确认界面正常**
