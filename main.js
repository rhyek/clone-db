#! /usr/bin/env node
const exec = require('child_process').exec
const path = require('path')
const os = require('os')
const fs = require('fs')

const configFileInitContent = `
{
  "test": {
    "source": {
      "ssh": true,
      "host": "test@test",
      "db": {
        "username": "test",
        "password": "test",
        "database": "test_remote"
      }
    },
    "target": {
      "ssh": false,
      "db": {
        "username": "test",
        "password": "test",
        "database": "test_local"
      }
    }
  }
}
`

const text = process.argv[2]
const configFilePath = path.join(os.homedir(), '.clonedb')

if (text === 'init') {
  if (fs.existsSync(configFilePath)) {
    console.log('Config file already exists.')
    process.exit(1)
  }
  else {
    fs.writeFileSync(configFilePath, configFileInitContent)
    console.log(`Config file created at ${ configFilePath }`)
    process.exit(0)
  }
}

const configs = JSON.parse(fs.readFileSync(configFilePath))

const config = configs[text]

if (!config) {
  console.log('Config not found.')
  process.exit(1)
}

function stripWarnings (text) {
  return text
    .split('\n')
    .filter(line => !line.includes('Using a password'))
    .join()
}

exec(`${ config.source.ssh ? `ssh ${ config.source.host } ` : '' }mysqldump -u ${ config.source.db.username } --password=${ config.source.db.password} ${ config.source.db.database} | sed -e 's/DEFINER[ ]*=[ ]*[^*]*\\*/\\*/' > /tmp/clonedbdump`, (error, stdout, stderr) => {
  if (error) {
    console.log(error)
  }
  else if (stripWarnings(stderr)) {
    console.log(stderr)
  }
  else {
    exec(`${ config.target.ssh ? `ssh ${ config.target.host } ` : '' }mysql -u ${ config.target.db.username } --password=${ config.target.db.password } -e 'drop database if exists ${ config.target.db.database }; create database ${ config.target.db.database };'`, (error, stdout, stderr) => {
      if (error) {
        console.log(error)
      }
      else if (stripWarnings(stderr)) {
        console.log(stderr)
      }
      else {
        exec(`${ config.target.ssh ? `ssh ${ config.target.host } ` : '' }mysql -u ${ config.target.db.username } --password=${ config.target.db.password } ${ config.target.db.database } < /tmp/clonedbdump`, (error, stdout, stderr) => {
          if (error) {
            console.log(error)
          }
          else if (stripWarnings(stderr)) {
            console.log(stderr)
          }
          else {
            console.log('Done!')
          }
        })
      }
    })
  }
})
