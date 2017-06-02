const exec = require('child_process').exec
const ora = require('ora')
const emoji = require('node-emoji')
const prettyMs = require('pretty-ms')
const { timerStart, timerEnd, error } = require('../utils')
const printError = error

function handleError (error, stderr, spinner = null) {
  function handle (thing) {
    if (spinner) {
      spinner.fail()
    }
    printError(thing)
  }

  if (error) {
    handle (error)
  }

  stderr = stderr
    .split('\n')
    .filter(line => !line.includes('Using a password'))
    .join()

  if (stderr) {
    handle (stderr)
  }

  if (spinner) {
    spinner.succeed(`${ spinner.text } ${ prettyMs(timerEnd()) }`)
  }
}

module.exports = function (config) {
  timerStart('global')
  timerStart()
  let spinner = ora(`Generate and download ${ emoji.get(':poop:') } file.`).start()
  exec(`${ config.source.ssh ? `ssh ${ config.source.host } ` : '' }mysqldump -u ${ config.source.db.username } --password=${ config.source.db.password} ${ config.source.db.database} | sed -e 's/DEFINER[ ]*=[ ]*[^*]*\\*/\\*/' > /tmp/clonedbdump`, (error, stdout, stderr) => {
    handleError(error, stderr, spinner)

    timerStart()
    spinner = ora(`Drop and create database at target location.`).start()
    exec(`${ config.target.ssh ? `ssh ${ config.target.host } ` : '' }mysql -u ${ config.target.db.username } --password=${ config.target.db.password } -e 'drop database if exists ${ config.target.db.database }; create database ${ config.target.db.database };'`, (error, stdout, stderr) => {
      handleError(error, stderr, spinner)

      timerStart()
      spinner = ora(`Restore.`).start()
      exec(`${ config.target.ssh ? `ssh ${ config.target.host } ` : '' }mysql -u ${ config.target.db.username } --password=${ config.target.db.password } ${ config.target.db.database } < /tmp/clonedbdump`, (error, stdout, stderr) => {
        handleError(error, stderr, spinner)
        console.log(`Done! Total duration: ${ prettyMs(timerEnd('global')) }`)
      })
    })
  })
}