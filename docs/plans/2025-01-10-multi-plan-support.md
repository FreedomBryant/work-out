# 多计划管理系统实现计划

> **Goal:** 将单"俯卧撑"小程序改造为支持多种锻炼计划（俯卧撑、引体向上、深蹲等）的管理系统

**架构：** 数据层新增 plans 集合，每条记录关联 planId。首页改为计划卡片列表，锻炼页接收 planId 参数使用对应计划设置

**Tech Stack:** 微信小程序原生

---

### Task 1: 数据层改造 (storage.js)

- [ ] **Step 1: 重写 storage.js**
  - `getPlans()` / `getPlan(id)` / `savePlan(plan)` / `deletePlan(id)`
  - `addRecord(record)` 接受 planId
  - `getRecords(planId?)` 可选筛选
  - `getTodayRecords(planId?)`
  - 首次运行自动创建 3 个预置计划
  - `getSettings()` 只含 soundEnabled / vibrationEnabled

- [ ] **Step 2: 验证文件写入无误**

- [ ] **Step 3: git commit**

### Task 2: 页面创建 - 计划列表页

- [ ] **Step 1: 创建 pages/plans/index.js**
- [ ] **Step 2: 创建 pages/plans/index.wxml**
- [ ] **Step 3: 创建 pages/plans/index.wxss**
- [ ] **Step 4: 创建 pages/plans/index.json**
- [ ] **Step 5: git commit**

### Task 3: 页面创建 - 计划编辑页

- [ ] **Step 1: 创建 pages/plans/edit.js** - 新建/编辑计划的表单
- [ ] **Step 2: 创建 pages/plans/edit.wxml**
- [ ] **Step 3: 创建 pages/plans/edit.wxss**
- [ ] **Step 4: 创建 pages/plans/edit.json**
- [ ] **Step 5: git commit**

### Task 4: 改造锻炼页

- [ ] **Step 1: 重写 pages/workout/index.js** - 接收 planId 参数
- [ ] **Step 2: 重写 pages/workout/index.wxml** - 显示计划名称
- [ ] **Step 3: 更新 pages/workout/index.wxss**
- [ ] **Step 4: git commit**

### Task 5: 精简设置页

- [ ] **Step 1: 重写 pages/settings/index.js** - 只保留全局设置
- [ ] **Step 2: 重写 pages/settings/index.wxml**
- [ ] **Step 3: 更新 pages/settings/index.wxss**
- [ ] **Step 4: git commit**

### Task 6: 改造历史页

- [ ] **Step 1: 重写 pages/history/index.js** - 增加按计划筛选
- [ ] **Step 2: 更新 pages/history/index.wxml**
- [ ] **Step 3: 更新 pages/history/index.wxss**
- [ ] **Step 4: git commit**

### Task 7: 更新 app.json

- [ ] **Step 1: 更新 pages 列表 + tabBar**
- [ ] **Step 2: 更新 title**
- [ ] **Step 3: git commit**

### Task 8: Tab图标

- [ ] **Step 1: 创建/确认 Tab 图标文件**
- [ ] **Step 2: git commit**
