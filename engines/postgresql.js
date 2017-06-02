const exec = require('child_process').exec
const ora = require('ora')
const emoji = require('node-emoji')
const prettyMs = require('pretty-ms')
const { timerStart, timerEnd, error } = require('../utils')
const printError = error

module.exports = async function (config) {
  timerStart('global')
  const commands = [
    {
      message: `Generate and download ${ emoji.get(':poop:') } file.`,
      command: `${ config.source.ssh ? `ssh -p ${ config.source.port || 22 } ${ config.source.host } ` : '' }PGPASSWORD="${ config.source.db.password }" pg_dump -O -Fc -h localhost -U ${ config.source.db.username } ${ config.source.db.database} > /tmp/clonedbdump`
    },
    {
      message: 'Drop database at target location.',
      command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }PGPASSWORD="${ config.target.db.password }" psql -h localhost -U ${ config.target.db.username } -c "drop database if exists ${ config.target.db.database };"`,
      skipWarnings: [
        'does not exist, skipping'
      ]
    },
    {
      message: 'Create database.',
      command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }PGPASSWORD="${ config.target.db.password }" psql -h localhost -U ${ config.target.db.username } -c "create database ${ config.target.db.database };"`
    },
    {
      message: 'Restore.',
      command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }PGPASSWORD="${ config.target.db.password }" pg_restore -O -e -Fc -h localhost -U ${ config.target.db.username } -d ${ config.target.db.database } /tmp/clonedbdump`
    }
  ]
  for (let { message, command, skipWarnings } of commands) {
    timerStart()
    let spinner = ora(message).start()
    try {
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          stderr = stderr
            .split('\n')
            .filter(line => !skipWarnings || skipWarnings.every(warning => !line.includes(warning)))
            .join()
          for (thing of [error, stderr]) {
            if (thing) {
              reject(thing)
            }
          }
          resolve(stdout)
        })
      })
      spinner.succeed(`${ spinner.text } ${ prettyMs(timerEnd()) }`)
    }
    catch (error) {
      spinner.fail()
      printError(error)
    }
  }
  console.log(`Done! Total duration: ${ prettyMs(timerEnd('global')) }`)
}