const emoji = require('node-emoji')

function build (context, program, suffix, redirect) {
  let command = ''
  if (context.ssh) {
    command += `ssh -p ${ context.ssh.port || 22 } ${ context.ssh.host } '`
  }
  if (context.db.password) {
    command += `PGPASSWORD="${ context.db.password }" ` 
  }
  command += `${ program } -h ${ context.db.host ? context.db.host : 'localhost' } -p ${ context.db.port ? context.db.port : 5432 } -U ${ context.db.username } `
  command += suffix
  if (context.ssh) {
    command += `'`
  }
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
          'pg_dump',
          `-O -Fc ${ config.source.db.database}`,
          { out: '/tmp/clonedbdump' }
        )
      },
      {
        message: 'Drop database at target location.',
        command: build(
          config.target,
          'psql',
          `-c "drop database if exists ${ config.target.db.database };"`
        ),
        skipWarnings: [
          'does not exist, skipping'
        ]
      },
      {
        message: 'Create database.',
        command: build(
          config.target,
          'psql',
          `-c "create database ${ config.target.db.database };"`
        )
      },
      {
        message: 'Restore.',
        command: build(
          config.target,
          'pg_restore',
          `-O -e -Fc -d ${ config.target.db.database }`,
          { in: '/tmp/clonedbdump' }
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
      'psql',
      `-c "${ sql }" ${ config.target.db.database }`
    )
  }
}