#! /usr/bin/env node
const exec = require('child_process').exec
const path = require('path')
const os = require('os')
const fs = require('fs')

// const configs = {
//   test: {
//     host: 'root@git.cs.com.gt',
//     remotedb: {
//       username: 'cgonzales',
//       password: 'cgonzales',
//       database: 'clone_db_test_1'
//     },
//     localdb: {
//       username: 'root',
//       password: 'root',
//       database: 'clone_db_test_1_local'
//     }
//   }
// }

const configs = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.clonedb')))

const config = configs[process.argv[2]]

exec(`ssh ${ config.host } mysqldump -u ${ config.remotedb.username } --password=${ config.remotedb.password} ${ config.remotedb.database} | sed -e 's/DEFINER[ ]*=[ ]*[^*]*\\*/\\*/' > /tmp/clonedbdump`, (error, stdout, stderr) => {
  if (error) {
    console.log(error)
  }
  else {
    exec(`mysql -u ${ config.localdb.username } --password=${ config.localdb.password } -e 'drop database if exists ${ config.localdb.database }; create database ${ config.localdb.database };'`, (error, stdout, stderr) => {
      if (error) {
        console.log(error)
      }
      else {
        exec(`mysql -u ${ config.localdb.username } --password=${ config.localdb.password } ${ config.localdb.database } < /tmp/clonedbdump`, (error, stdout, stderr) => {
          if (error) {
            console.log(error)
          }
          else {
            console.log('Done!')
          }
        })
      }
    })
  }
})
