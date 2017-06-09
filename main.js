#! /usr/bin/env node
const path = require('path')
const os = require('os')
const fs = require('fs')
const exec = require('child_process').exec
const ora = require('ora')
const prettyMs = require('pretty-ms')
const commandLineArgs = require('command-line-args')
const getUsage = require('command-line-usage')
const inquirer = require('inquirer')
const chalk = require('chalk')
const { timerStart, timerEnd, logError, configuration } = require('./utils')

const optionDefinitions = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,

    description: 'Display this usage guide.'
  },
  {
    name: 'init',
    alias: 'i',
    type: Boolean,

    description: 'Create a sample configuration file in the current user\'s home directory.'
  },
  {
    name: 'upgrade-config',
    alias: 'u',
    type: Boolean,

    description: 'Upgrade the configuration file.'
  },
  {
    name: 'config-path',
    alias: 'p',
    type: Boolean,

    description: 'Print configuration file path.'
  },
  {
    name: 'list',
    alias: 'l',
    type: Boolean,

    description: 'List available configurations.'
  },
  {
    name: 'config',
    alias: 'c',
    type: String,
    defaultOption: true,

    description: 'Specify the configuration to use.',
    typeLabel: '[underline]{config}'
  },
  {
    name: 'select',
    alias: 's',
    type: Boolean,

    description: 'Choose from one of the available configurations.'
  },
  {
    name: 'version',
    alias: 'v',
    type: Boolean,

    description: 'Display the version number.'
  },
  {
    name: 'debug',
    alias: 'd',
    type: Boolean,

    description: 'Show shell commands.'
  }
]

const options = commandLineArgs(optionDefinitions)

if (options.help) {
  const sections = [
    {
      header: 'Clone DB',
      content: 'A utility for cloning databases using pre-configured settings.'
    },
    {
      header: 'Synopsis',
      content: [
        '$ clonedb',
        '$ clonedb [underline]{config}',
        '$ clonedb [bold]{--config} [underline]{config}'
      ]
    },
    {
      header: 'Options',
      optionList: optionDefinitions
    }
  ]
  console.log(getUsage(sections))
}
else {
  if (options.init) {
    if (configuration.exists) {
      logError('Config file already exists.')
    }
    else {
      fs.writeFileSync(configuration.path, fs.readFileSync(path.join(__dirname, 'sample-config.json')))
      console.log(`Config file created at ${ configuration.path }.`)
    }
  }
  else if (options['upgrade-config']) {
    require('./upgrade-config')
  }
  else if (options['config-path']) {
    console.log(configuration.path)
  }
  else if (options.version) {
    console.log(require('./package.json').version)
  }
  else {
    const configs = configuration.configs
    if (options.list) {
      for (let config of Object.keys(configs)) {
        console.log(config)
      }
    }
    else {
      let p
      if (options.select || !options.config) {
        p = inquirer
          .prompt([
            {
              type: 'list',
              name: 'config',
              message: 'Choose the configuration.',
              choices: Object.keys(configs)
            }
          ])
          .then(answers => answers.config)
      }
      else {
        p = Promise.resolve(options.config)
      }
      p.then(async name => {
        const config = configs[name]
        if (!config) {
          logError('Configuration not found.')
        }
        else {
          const engine = require(`./engines/${ config.engine }`)
          const commands = engine.commands(config)
          // if (config.after) {
          //   commands.push({
          //     message: '\nRunning SQL statements on target database.'
          //   })
          //   for (let sql of config.after) {
          //     commands.push({
          //       message: chalk.cyan(sql),
          //       command: engine.runSQL(config, sql),
          //       print: true
          //     })
          //   }
          // }
          timerStart('global')
          for (let { message, command, skipWarnings, print } of commands) {
            if (command) {
              timerStart()
              if (options.debug) {
                console.log(chalk.red(command))
              }
              let spinner = ora(message).start()
              try {
                let stdout = (await new Promise((resolve, reject) => {
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
                })).trim()
                spinner.succeed(`${ spinner.text } ${ prettyMs(timerEnd()) }`)
                if (print && stdout) {
                  if (typeof print === 'function') {
                    stdout = print(stdout)
                  }
                  console.log(chalk.yellow(stdout))
                }
              }
              catch (error) {
                spinner.fail()
                logError(error)
              }
            }
            else {
              console.log(message)
            }
          }
          console.log(`\nDone! Total duration: ${ prettyMs(timerEnd('global')) }`)
        }
      })
    }
  }
}
