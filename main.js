#! /usr/bin/env node
const path = require('path')
const os = require('os')
const fs = require('fs')
const commandLineArgs = require('command-line-args')
const getUsage = require('command-line-usage')
const { error } = require('./utils')

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
  const configFilePath = path.join(os.homedir(), '.clonedb')
  if (options.init) {
    if (fs.existsSync(configFilePath)) {
      error('Config file already exists.')
    }
    else {
      fs.writeFileSync(configFilePath, fs.readFileSync(path.join(__dirname, 'sample-config.json')))
      console.log(`Config file created at ${ configFilePath }.`)
    }
  }
  else if (options['config-path']) {
    console.log(configFilePath)
  }
  else {
    const configs = JSON.parse(fs.readFileSync(configFilePath))
    if (options.list) {
      console.log('Available configurations:')
      for (let [name, config] of Object.entries(configs)) {
        console.log(` ${ name }${ config.description ? ` - ${ config.description }` : '' }`)
      }
    }
    else if (!options.config) {
      error('clonedb: Missing configuration name.\nTry \'clonedb --help\' for more information.')
    }
    else {
      const config = configs[options.config]
      if (!config) {
        error('Configuration not found.')
      }
      else {
        require(`./engines/${ config.engine }`)(config)
      }
    }
  }
}
