const timers = {
  default: null
}

module.exports = {
  timerStart (name = 'default') {
    timers[name] = new Date()
  },
  timerEnd (name = 'default') {
    return new Date () - timers[name]
  },
  error (text) {
    console.error(text)
    process.exit(1)
  }
}