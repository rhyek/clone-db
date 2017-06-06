const emoji = require('node-emoji')

module.exports = function (config) {
  return [
    {
      message: `Generate and download ${ emoji.get(':poop:') } file.`,
      command: `${ config.source.ssh ? `ssh -p ${ config.source.port || 22 } ${ config.source.host } ` : '' }${ config.source.db.password ? `MYSQL_PWD="${ config.source.db.password }"` : '' } mysqldump -u ${ config.source.db.username } -R ${ config.source.db.database} | sed -e 's/DEFINER[ ]*=[ ]*[^*]*\\*/\\*/' | sed -e 's/DEFINER[ ]*=[ ]*[^*]*PROCEDURE/PROCEDURE/' | sed -e 's/DEFINER[ ]*=[ ]*[^*]*FUNCTION/FUNCTION/' > /tmp/clonedbdump`
    },
    {
      message: 'Drop and create database at target location.',
      command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }${ config.source.db.password ? `MYSQL_PWD="${ config.target.db.password }"` : '' } mysql -u ${ config.target.db.username } -e 'drop database if exists ${ config.target.db.database }; create database ${ config.target.db.database };'`
    },
    {
      message: 'Restore.',
      command: `${ config.target.ssh ? `ssh -p ${ config.target.port || 22 } ${ config.target.host } ` : '' }${ config.source.db.password ? `MYSQL_PWD="${ config.target.db.password }"` : '' } mysql -u ${ config.target.db.username } ${ config.target.db.database } < /tmp/clonedbdump`
    }
  ]
}