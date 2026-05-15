/**
 * 声音反馈工具 - 使用 Web Audio API 合成提示音
 * 无需外部音频文件
 */
let audioCtx = null

function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = wx.createWebAudioContext()
    } catch (e) {
      return null
    }
  }
  return audioCtx
}

/**
 * 播放一个音调
 * @param {number} frequency - 频率 (Hz)
 * @param {number} duration - 持续时长 (ms)
 * @param {string} type - 波形类型 (sine|square|triangle|sawtooth)
 */
function playTone(frequency = 600, duration = 300, type = 'sine') {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return false

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency
    gainNode.gain.value = 0.25

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start()
    oscillator.stop(ctx.currentTime + duration / 1000)
    return true
  } catch (e) {
    console.warn('[voice] 播放失败:', e)
    return false
  }
}

/**
 * 休息结束提示音 - 低沉短促
 */
function playRestEnd() {
  playTone(440, 250, 'sine')
}

/**
 * 全部完成提示音 - 高亢庆祝
 */
function playWorkoutComplete() {
  // 升调效果：先低后高
  try {
    const ctx = getAudioCtx()
    if (!ctx) return false

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    const gain2 = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.value = 523
    gain1.gain.value = 0.25
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start()
    osc1.stop(ctx.currentTime + 0.3)

    osc2.type = 'sine'
    osc2.frequency.value = 784
    gain2.gain.value = 0.25
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.25)
    osc2.stop(ctx.currentTime + 0.55)

    return true
  } catch (e) {
    console.warn('[voice] 庆祝音播放失败:', e)
    return false
  }
}

module.exports = {
  playRestEnd,
  playWorkoutComplete
}
