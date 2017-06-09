const path = require('path')
const os = require('os')
const fs = require('fs')

const timers = {
  default: null
}

function logError (text) {
  console.error(text)
  process.exit(1)
}

module.exports = {
  timerStart (name = 'default') {
    timers[name] = new Date()
  },
  timerEnd (name = 'default') {
    return new Date () - timers[name]
  },
  logError,
  configuration: {
    currentVersion: 2,
    path: path.join(os.homedir(), '.clonedb'),
    get exists () {
      return fs.existsSync(this.path)
    },
    existsOrFail () {
      if (!this.exists) {
        logError(`No configuration file found at ${ this.path }.`)
      }
      return true
    },
    get meta () {
      this.existsOrFail()
      const defaults = {
        version: 1
      }
      const meta = JSON.parse(fs.readFileSync(this.path)).meta
      return Object.assign(defaults, meta)
    },
    get version () {
      return this.meta.version
    },
    get needsUpgrade () {
      return this.version < this.currentVersion
    },
    getConfigs (checkVersion = true) {
      this.existsOrFail()
      if (checkVersion && this.needsUpgrade) {
        logError('Configuration file needs to be upgraded. Try \'clonedb -u\'.')
      }
      const configs = JSON.parse(fs.readFileSync(this.path))
      delete configs.meta
      return configs
    },
    get configs () {
      return this.getConfigs()
    }
  }
}