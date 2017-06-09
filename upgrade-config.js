const path = require('path')
const os = require('os')
const fs = require('fs-extra')
const inquirer = require('inquirer')
const { configuration, logError } = require('./utils')

function writeConfig (configs) {
  const meta = configuration.meta
  meta.version++
  const data = Object.assign(
    { meta },
    configs
  )
  const str = JSON.stringify(data, null, 2) + '\n'
  fs.writeFileSync(configuration.path, str)
}

async function main () {
  configuration.existsOrFail()
  if (configuration.needsUpgrade) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'This will upgrade your configuration file. A backup will be created beforehand. Continue?',
        default: false
      }
    ])
    if (answers.confirm) {
      const backupPath = configuration.path + '.bak'
      fs.copySync(configuration.path, backupPath)
      while (configuration.needsUpgrade) {
        const configs = configuration.getConfigs(false)
        switch (configuration.version) {
          case 1: {
            for (let [name, config] of Object.entries(configs)) {
              for (let contextName of ['source', 'target']) {
                const context = config[contextName]
                if (context.ssh === true) {
                  context.ssh = {
                    host: context.host,
                    port: context.port
                  }
                }
                else {
                  delete context.ssh
                }
                delete context.host
                delete context.port
              }
            }
            break
          }
        }
        writeConfig(configs)
      }
      console.log(`Done! Backup created at ${ backupPath }.`)
    }
  }
  else {
    console.log('Upgrade not needed.')
  }
}

main()
