import confetti from 'canvas-confetti'

export const celebrations = {
  basic: () => {
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 }
    })
  },

  fireworks: () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      })
    }, 250)
  },

  shower: () => {
    const end = Date.now() + 2000
    
    const colors = ['#ff0000', '#00ff00', '#0000ff']
    ;(function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }())
  }
}
