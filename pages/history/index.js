const { getRecords, clearRecords, getPlans } = require('../../utils/storage')

Page({
  data: {
    allRecords: [],
    records: [],
    plans: [],
    currentPlanId: '',
    chartReady: false,
    chartMode: 'week',
    chartTitle: '📊 近7天锻炼统计',
    chartTotal: 0,
    exerciseTotals: []
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

  switchChartMode(e) {
    const mode = e.currentTarget.dataset.mode
    const titles = {
      week: '📊 近7天锻炼统计',
      month: '📊 近30天锻炼统计',
      year: '📊 近12个月锻炼统计'
    }
    this.setData({ chartMode: mode, chartTitle: titles[mode] })
    this.drawChart()
  },

  drawChart(retryCount = 0) {
    const { records, chartMode } = this.data
    if (!records || records.length === 0) return

    // 计算当前模式的总计
    const { total } = computeChartData(records, chartMode)
    this.setData({ chartTotal: total })

    // 计算各动作总个数
    const plans = this.data.plans || []
    const planMap = {}
    plans.forEach(p => { planMap[p.name] = p })
    const exerciseMap = {}
    records.forEach(r => {
      const name = r.planName || '未知'
      const plan = planMap[name] || {}
      const isTimed = plan.exerciseType === 'timed' || r.exerciseType === 'timed'
      // timed 类型用 duration（秒），reps 类型用 totalReps（个）
      const value = isTimed ? (r.duration || r.totalReps || 0) : r.totalReps
      exerciseMap[name] = (exerciseMap[name] || 0) + value
    })
    const exerciseTotals = Object.entries(exerciseMap)
      .map(([name, totalReps]) => {
        const plan = planMap[name] || {}
        const isTimed = plan.exerciseType === 'timed'
        return { name, totalReps, emoji: plan.emoji || '', color: plan.color || '#999', unit: isTimed ? '秒' : '个' }
      })
      .sort((a, b) => b.totalReps - a.totalReps)
    this.setData({ exerciseTotals })

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
    const { records, chartMode } = this.data

    // 根据模式计算数据
    const { labels, values } = computeChartData(records, chartMode)

    const maxVal = Math.max(...values, 1)
    const padding = { top: 20, right: 20, bottom: 50, left: 40 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const barCount = values.length
    const barGap = barCount > 20 ? 3 : barCount > 12 ? 5 : 8
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
      drawRoundRect(ctx, x, y, barWidth, barH, [4, 4, 0, 0])
      ctx.fill()

      // 数值标签（柱子上方）
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
      // 月模式30根柱子，标签太多，隔5个显示一个
      if (chartMode === 'month' && i % 5 !== 0) return
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

/**
 * 绘制圆角矩形路径
 * 兼容不支持 roundRect 的 XWeb 引擎（微信真机）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {[number,number,number,number]} radii 四个角半径：[tl, tr, br, bl]
 */
function drawRoundRect(ctx, x, y, w, h, radii) {
  const [tl, tr, br, bl] = radii
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h)
  ctx.lineTo(x + bl, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl)
  ctx.lineTo(x, y + tl)
  ctx.quadraticCurveTo(x, y, x + tl, y)
  ctx.closePath()
}

/**
 * 根据模式计算图表数据
 * @param {Array} records 记录列表
 * @param {'week'|'month'|'year'} mode 模式
 * @returns {{ labels: string[], values: number[] }}
 */
function computeChartData(records, mode) {
  // 按日期汇总每天总个数
  const dailyMap = {}
  records.forEach(r => {
    const day = r.date
    dailyMap[day] = (dailyMap[day] || 0) + r.totalReps
  })

  const today = new Date()

  if (mode === 'week') {
    const labels = []
    const values = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = formatDate(d)
      labels.push(dateStr.slice(5)) // MM-DD
      values.push(dailyMap[dateStr] || 0)
    }
    return { labels, values, total: values.reduce((a, b) => a + b, 0) }
  }

  if (mode === 'month') {
    const labels = []
    const values = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = formatDate(d)
      labels.push(dateStr.slice(5)) // MM-DD
      values.push(dailyMap[dateStr] || 0)
    }
    return { labels, values, total: values.reduce((a, b) => a + b, 0) }
  }

  // year: 按月度汇总
  const monthMap = {}
  records.forEach(r => {
    const month = r.date.slice(0, 7) // YYYY-MM
    monthMap[month] = (monthMap[month] || 0) + r.totalReps
  })

  const labels = []
  const values = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthStr = formatDate(d).slice(0, 7) // YYYY-MM
    labels.push(monthStr.slice(5) + '月') // MM月
    values.push(monthMap[monthStr] || 0)
  }
  return { labels, values, total: values.reduce((a, b) => a + b, 0) }
}
