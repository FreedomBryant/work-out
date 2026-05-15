# 俯卧撑锻炼微信小程序 — 设计文档

## 概述

一款给自己用的俯卧撑锻炼微信小程序。支持设置每日组数、组间休息时间、每组个数，按流程完成锻炼并保存历史记录到本地存储。

## 技术栈

- 微信小程序原生开发（WXML + WXSS + JavaScript）
- 数据存储：微信小程序 `wx.setStorage` / `wx.getStorage`

## 页面结构

```
pages/
  settings/     ← 设置页
  workout/      ← 锻炼页（核心交互）
  history/      ← 历史记录页
utils/
  storage.js    ← 本地存储封装（读取/写入设置 + 历史记录）
```

## 数据模型

### 设置数据（key: `settings`）

```json
{
  "groupsPerDay": 5,
  "restSeconds": 60,
  "repsPerGroup": 20
}
```

### 历史记录（key: `records`）

```json
[
  {
    "date": "2025-06-15",
    "groupsComplete": 5,
    "repsPerGroup": 20,
    "totalReps": 100,
    "finishTime": "2025-06-15 10:30"
  }
]
```

## 页面设计

### 设置页（settings）

UI 元素：
- "每日组数"数字输入框（带步进按钮 +/-, 最小值 1）
- "每组个数"数字输入框（带步进按钮 +/-, 最小值 1）
- "组间休息(秒)"数字输入框（带步进按钮 +/-, 最小值 10）
- "开始锻炼"按钮 → 跳转到锻炼页

逻辑：
- 进入页面时从本地存储读取已有设置并回填
- 修改后自动保存到本地存储
- 点击"开始锻炼"跳转到 workout 页

### 锻炼页（workout）

UI 元素：
- 当前状态信息区（显示：第 X / Y 组）
- 状态切换按钮（"开始一组" ↔ "完成本组"）
- 组间休息倒计时（显示剩余秒数 + 进度环或数字）
- "结束锻炼"按钮（灰色，可在任意时刻结束）

锻炼流程：

```
[初始态] 显示"第 1 / 5 组"，按钮为"开始一组"
  ↓ 点击"开始一组"
[锻炼中] 页面提示"正在锻炼...", 按钮变为"完成本组"
  ↓ 用户做俯卧撑 → 点击"完成本组"
[组完成] 记录本组，自动进入组间休息
  ↓ 倒计时开始（60秒）
[倒计时] 显示剩余秒数，结束后自动进入下一组
  ↓ 所有组都完成
[完成] 自动保存本次锻炼记录，弹窗提示，跳转历史页
```

逻辑：
- 进入时读取设置（groupsPerDay, restSeconds, repsPerGroup）
- 维护状态：`currentGroup`（从1开始）、`phase`（resting/working/finished）
- 组间休息用 `setInterval` 倒计时，每秒更新 UI
- 所有组完成后调用 `saveRecord()` 写入 localStorage

### 历史记录页（history）

UI 元素：
- 记录列表从上到下按日期倒序排列
- 每条显示：日期、组数、每组个数、总个数
- 空数据时显示"暂无记录"

逻辑：
- 进入时从 localStorage 读取所有记录
- 支持清空历史（确认后删除）

## 数据流

```
设置页 ──保存设置──→ localStorage (key: settings)
                    ↓
锻炼页 ──读取设置──→ localStorage (key: settings)
锻炼页 ──保存记录──→ localStorage (key: records)
                    ↓
历史页 ──读取记录──→ localStorage (key: records)
```

## 路由设计

| 路径 | 页面 | 跳转方式 |
|------|------|----------|
| pages/settings/index | 设置页 | 首页（入口页） |
| pages/workout/index | 锻炼页 | wx.navigateTo |
| pages/history/index | 历史记录页 | wx.navigateTo |

## 非功能性需求

- 倒计时期间保持屏幕常亮（`wx.setKeepScreenOn`）
- 锻炼中用 vibrating 提示？(可选)
- 数据量：自己使用，历史记录仅存为数组，无需分页

## 不需要的功能

- 用户登录 / 多用户
- 云端同步
- 分享 / 排行榜
- 计时器倒计时精度（无需后台保活）
- 统计分析/图表
