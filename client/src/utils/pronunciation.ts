// 发音工具函数

export const playPronunciation = async (word: string): Promise<void> => {
  try {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1
      
      speechSynthesis.speak(utterance)
    }
  } catch (error) {
    console.error('播放发音失败:', error)
  }
}

export const playSuccessSound = (): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // 成功音效 - 上升音调
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.error('播放成功音效失败:', error)
  }
}

export const playErrorSound = (): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // 错误音效 - 下降音调
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.2)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (error) {
    console.error('播放错误音效失败:', error)
  }
}