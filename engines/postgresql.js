const emoji = require('node-emoji')

module.exports = function (config) {
  return [
    {
      message: `Generate and download ${ emoji.get(':poop:') } file.`,
      command: `${ config.source.ssh ? `ssh -p ${ config.source.port || 22 } ${ config.source.host } ` : '' }${ config.source.db.password ? `PGPASSWORD="${ config.source.db.password }"` : '' } pg_dump -O -Fc -h localhost -U ${ config.source.db.username } ${ config.source.db.database} > /tmp/clonedbdump`
    },
    {
      message: 'Drop database at target location.',
      command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }${ config.target.db.password ? `PGPASSWORD="${ config.target.db.password }"` : '' } psql -h localhost -U ${ config.target.db.username } -c "drop database if exists ${ config.target.db.database };"`,
      skipWarnings: [
        'does not exist, skipping'
      ]
    },
    {
      message: 'Create database.',
      command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }${ config.target.db.password ? `PGPASSWORD="${ config.target.db.password }"` : '' } psql -h localhost -U ${ config.target.db.username } -c "create database ${ config.target.db.database };"`
    },
    {
      message: 'Restore.',
      command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }${ config.target.db.password ? `PGPASSWORD="${ config.target.db.password }"` : '' } pg_restore -O -e -Fc -h localhost -U ${ config.target.db.username } -d ${ config.target.db.database } /tmp/clonedbdump`
    },
    {
      message: `Delete ${ emoji.get(':poop:') } file.`,
      command: 'rm /tmp/clonedbdump*'
    }
  ]
}