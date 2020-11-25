'use strict'
const path = require('path')
const program = require('commander')
const chalk = require('chalk')
const YAML = require('yamljs')
const { isDirectory } = require('./lib/fs')
const capture = require('./lib/capture')
const { mkdirSync } = require('fs')

program.arguments('<surveypath>').parse(process.argv)

if (program.args.length === 0) {
    console.error(chalk.red('✘ missing <surveypath> argument'))
    program.help()
}

const [survey] = program.args

const run = async () => {
    const surveyDir = path.join(__dirname, survey)
    const isDir = await isDirectory(surveyDir)

    if (!isDir) {
        console.error(chalk`{red ✘ '${survey}' is not a valid survey}`)
        process.exit(1)
    }

    try {
        console.log(chalk`{yellow starting capture for {white ${survey}} survey}`)

        const config = YAML.load(path.join(surveyDir, 'config/capture.yml'))
        
        const sitemap = YAML.load(path.join(surveyDir, config.sitemap))

        const outputDir = path.join(surveyDir, config.outputDir)

        await capture({
            ...config,
            sitemap,
            outputDir,
        })
    } catch (err) {
        console.error(chalk`{red ✘ an unexpected error occurred while capturing}`)
        console.error(err)
        process.exit(1)
    }
}

run()
