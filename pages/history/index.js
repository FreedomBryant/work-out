const { getRecords, clearRecords, getPlans } = require('../../utils/storage')

Page({
  data: {
    allRecords: [],
    records: [],
    plans: [],
    currentPlanId: '',
    chartReady: false
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const plans = getPlans()
    const allRecords = getRecords().reverse() // 最新在前
    this.setData({ plans, allRecords })

    // 筛选当前计划的记录
    this.filterRecords(this.data.currentPlanId)

    // 绘制图表
    this.drawChart()
  },

  filterRecords(planId) {
    this.setData({ currentPlanId: planId })
    if (!planId) {
      this.setData({ records: this.data.allRecords })
    } else {
      const filtered = this.data.allRecords.filter(r => r.planId === planId)
      this.setData({ records: filtered })
    }
    this.drawChart()
  },

  selectAll() {
    this.filterRecords('')
  },

  selectPlan(e) {
    const { planid } = e.currentTarget.dataset
    this.filterRecords(planid)
  },

  drawChart(retryCount = 0) {
    const { records } = this.data
    if (!records || records.length === 0) return

    const query = wx.createSelectorQuery()
    query.select('#chart-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          // 真机上手机会在 setData 后异步渲染 wx:else 块的 canvas 节点，
          // 此时节点可能尚未就绪，延迟重试（最多 3 次）
          if (retryCount < 3) {
            setTimeout(() => this.drawChart(retryCount + 1), 200)
          }
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        const width = res[0].width
        const height = res[0].height

        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        this.renderChart(ctx, width, height)
        this.setData({ chartReady: true })
      })
  },

  renderChart(ctx, width, height) {
    const records = this.data.records

    // 按日期汇总每天总个数
    const dailyMap = {}
    records.forEach(r => {
      const day = r.date
      dailyMap[day] = (dailyMap[day] || 0) + r.totalReps
    })

    // 获取近7天数据（含今天）
    const today = new Date()
    const labels = []
    const values = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = formatDate(d)
      labels.push(dateStr.slice(5)) // MM-DD
      values.push(dailyMap[dateStr] || 0)
    }

    const maxVal = Math.max(...values, 1)
    const padding = { top: 20, right: 20, bottom: 50, left: 40 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const barGap = 8
    const barCount = 7
    const totalGap = barGap * (barCount - 1)
    const barWidth = (chartW - totalGap) / barCount

    // 清空
    ctx.clearRect(0, 0, width, height)

    // 水平网格线
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // 柱子
    const barColor = this.data.currentPlanId
      ? (getPlans().find(p => p.id === this.data.currentPlanId)?.color || '#ff6b6b')
      : '#ff6b6b'

    values.forEach((val, i) => {
      const barH = (val / maxVal) * chartH
      const x = padding.left + i * (barWidth + barGap)
      const y = padding.top + chartH - barH

      // 渐变填充
      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartH)
      gradient.addColorStop(0, barColor)
      gradient.addColorStop(1, barColor + '44')
      ctx.fillStyle = gradient

      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0])
      ctx.fill()

      // 数值标签
      if (val > 0) {
        ctx.fillStyle = '#666'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(val, x + barWidth / 2, y - 8)
      }
    })

    // X 轴日期标签
    ctx.fillStyle = '#999'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    labels.forEach((label, i) => {
      const x = padding.left + i * (barWidth + barGap) + barWidth / 2
      ctx.fillText(label, x, height - padding.bottom + 20)
    })

    // Y 轴标签
    ctx.fillStyle = '#ccc'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i
      const val = Math.round(maxVal - (maxVal / 4) * i)
      ctx.fillText(val, padding.left - 6, y + 3)
    }
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          clearRecords()
          this.setData({ records: [], allRecords: [] })
        }
      }
    })
  }
})

/** 格式化日期 YYYY-MM-DD */
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
