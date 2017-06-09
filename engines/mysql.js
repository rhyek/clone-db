const emoji = require('node-emoji')

module.exports = {
  commands (config) {
    return [
      {
        message: `Generate and download ${ emoji.get(':poop:') }  file.`,
        command: `${ config.source.ssh ? `ssh -p ${ config.source.port || 22 } ${ config.source.host } ` : '' }${ config.source.db.password ? `MYSQL_PWD="${ config.source.db.password }"` : '' } mysqldump -h ${ config.source.db.host ? config.source.db.host : 'localhost' } -u ${ config.source.db.username } -R ${ config.source.db.database} | sed -e 's/DEFINER[ ]*=[ ]*[^*]*\\*/\\*/' | sed -e 's/DEFINER[ ]*=[ ]*[^*]*PROCEDURE/PROCEDURE/' | sed -e 's/DEFINER[ ]*=[ ]*[^*]*FUNCTION/FUNCTION/' | gzip -c9 > /tmp/clonedbdump.gz`
      },
      {
        message: 'Decompress.',
        command: 'gzip -dc /tmp/clonedbdump.gz > /tmp/clonedbdump'
      },
      {
        message: 'Drop and create database at target location.',
        command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }${ config.source.db.password ? `MYSQL_PWD="${ config.target.db.password }"` : '' } mysql -h ${ config.target.db.host ? config.target.db.host : 'localhost' } -u ${ config.target.db.username } -e 'drop database if exists ${ config.target.db.database }; create database ${ config.target.db.database };'`
      },
      {
        message: 'Restore.',
        command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }${ config.source.db.password ? `MYSQL_PWD="${ config.target.db.password }"` : '' } mysql -h ${ config.target.db.host ? config.target.db.host : 'localhost' } -u ${ config.target.db.username } ${ config.target.db.database } < /tmp/clonedbdump`
      },
      {
        message: `Delete ${ emoji.get(':poop:') }  file.`,
        command: 'rm /tmp/clonedbdump*'
      }
    ]
  },
  runSQL (config, sql) {
    return `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }${ config.source.db.password ? `MYSQL_PWD="${ config.target.db.password }"` : '' } mysql -h ${ config.target.db.host ? config.target.db.host : 'localhost' } -u ${ config.target.db.username } -e "${ sql }" ${ config.target.db.database }`
  }
}