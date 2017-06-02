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
      command: `${ config.source.ssh ? `ssh ${ config.source.host } ` : '' }mysqldump -u ${ config.source.db.username } --password=${ config.source.db.password} ${ config.source.db.database} | sed -e 's/DEFINER[ ]*=[ ]*[^*]*\\*/\\*/' > /tmp/clonedbdump`
    },
    {
      message: 'Drop and create database at target location.',
      command: `${ config.target.ssh ? `ssh ${ config.target.host } ` : '' }mysql -u ${ config.target.db.username } --password=${ config.target.db.password } -e 'drop database if exists ${ config.target.db.database }; create database ${ config.target.db.database };'`
    },
    {
      message: 'Restore.',
      command: `${ config.target.ssh ? `ssh ${ config.target.host } ` : '' }mysql -u ${ config.target.db.username } --password=${ config.target.db.password } ${ config.target.db.database } < /tmp/clonedbdump`
    }
  ]
  for (let { message, command } of commands) {
    timerStart()
    let spinner = ora(message).start()
    try {
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          stderr = stderr
            .split('\n')
            .filter(line => !line.includes('Using a password'))
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