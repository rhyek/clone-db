const emoji = require('node-emoji')

function db (context, program, suffix) {
  let command = ''
  if (context.db.password) {
    command += `MYSQL_PWD="${ context.db.password }" `
  }
  command += `${ program } -h ${ context.db.host ? context.db.host : 'localhost' } -P ${ context.db.port ? context.db.port : 3306 } -u ${ context.db.username } `
  command += suffix
  return command
}

function build (context, commands, redirect) {
  let command = ''
  if (context.ssh) {
    command += `ssh -p ${ context.ssh.port || 22 } ${ context.ssh.host }`
  }
  else {
    command += 'sh -c'
  }
  command +=  ` '${ commands }'`
  if (redirect) {
    if (redirect.out) {
      command += ` > ${ redirect.out }`
    }
    if (redirect.in) {
      command += ` < ${ redirect.in }`
    }
  }
  return command
}

module.exports = {
  commands (config) {
    return [
      {
        message: `Generate and download ${ emoji.get(':poop:') }  file.`,
        command: build(
          config.source,
          db(
            config.source,
            'LLANG=C LC_CTYPE=C LC_ALL=C mysqldump',
            `--single-transaction --quick -R ${ config.source.db.database} | LLANG=C LC_CTYPE=C LC_ALL=C sed -e "s/DEFINER[ ]*=[ ]*[^*]*\\*/\\*/" -e "s/DEFINER[ ]*=[ ]*[^*]*PROCEDURE/PROCEDURE/" -e "s/DEFINER[ ]*=[ ]*[^*]*FUNCTION/FUNCTION/" | gzip -c9`
          ),
          { out: '/tmp/clonedbdump.gz' }
        )
      },
      {
        message: 'Drop and create database at target location.',
        command: build(
          config.target,
          db(
            config.target,
            'mysql',
            `-e "drop database if exists ${ config.target.db.database }; create database ${ config.target.db.database };"`
          )
        )
      },
      {
        message: 'Restore.',
        command: build(
          config.target,
          'gzip -dc | ' + db(
            config.target,
            'mysql',
            config.target.db.database
          ),
          { in: '/tmp/clonedbdump.gz' }
        )
      },
      {
        message: `Delete ${ emoji.get(':poop:') }  file.`,
        command: 'rm /tmp/clonedbdump*'
      }
    ]
  },
  runSQL (config, sql) {
    return build(
      config.target,
      db(
        config.target,
        'mysql',
        `-e "${ sql.replace(/'/g, `''`) }" ${ config.target.db.database }`
      )
    )
  }
}
