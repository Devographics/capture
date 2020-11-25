'use strict'
const puppeteer = require('puppeteer')
const chalk = require('chalk')
const Path = require('path')
const { isDirectory } = require('./fs')
const { mkdirSync } = require('fs')
const { logToFile } = require('./helpers.js')

const separator = '---------------------------------------------------'

const isHeadless = true

/*

Capture a specific URL

*/
const captureUrl = async (page, baseUrl, { path, selector, filename: _filename }, outputDir, localeId = 'en-US') => {
    const url = `${baseUrl}/${localeId}${path}`
    console.log(chalk`{yellow Capturing {white ${path}}} {dim (selector: ${selector})}`)

    await page.goto(url)

    const element = await page.$(selector)
    if (element === null) {
        const error = `Unable to find element matching selector: '${selector}' (url: ${url})`
        logToFile('errors.txt', error, { mode: 'append' })
        console.log(chalk`{red ${error}}`)
        // throw new Error(`Unable to find element matching selector: '${selector}' (url: ${url})`)
        return
    }

    const clip = await element.boundingBox()
    clip.x = clip.x - 20
    clip.y = clip.y - 20
    clip.width = clip.width + 40
    clip.height = clip.height + 40

    const filename = `${_filename}.png`
    const fullPath = Path.join(`${outputDir}/${localeId}`, filename)

    await page.screenshot({ path: fullPath, clip })

    console.log(chalk`  {green saved to {white ${filename}}} {dim (${fullPath})}`)
    console.log('')
}

/*

Get page config

*/
const getPageConfig = ({ path, blockId }) => ({
    path: `${path}?capture`,
    selector: `#${blockId}`,
    filename: blockId,
})

/*

Capture a page sitemap (array of pages) recursively

*/
const captureSitemap = async ({ browserPage, baseUrl, outputDir, sitemap, pathSegments = [], level = 0, localeId }) => {
    
    for (let page of sitemap) {

        console.log(chalk`  {dim ${' '.repeat(level*2)} page: {blue ${page.id}}}`)

        if (page.blocks) {
            for (let block of page.blocks) {
                if (block.enableExport) {
                    const pageConfig = getPageConfig({ path: page.path, blockId: block.id })
                    console.log(chalk`      {dim filename: {white ${pageConfig.filename}}}`)
                    await captureUrl(browserPage, baseUrl, pageConfig, outputDir, localeId)
                }
            }
        }

        if (page.children) {
           await captureSitemap({ browserPage, baseUrl, outputDir, sitemap: page.children, level: level+1, pathSegments: [...pathSegments, page.id], localeId})
        }
    }
}

/*

Start capture process

*/
 const startCapture = async ({ baseUrl, outputDir, sitemap }) => {

    const sectionsMessage = `${sitemap.contents.length} section(s) to capture`
    const localesMessage = `${sitemap.locales.length} locale(s) to capture`

    logToFile('errors.txt', `${separator}\n${sectionsMessage}\n${localesMessage}\n${new Date()}\n${separator}`, { mode: 'overwrite' })

    console.log(chalk`{yellow ${sectionsMessage}}`)
    console.log(chalk`{yellow ${localesMessage}}`)
    console.log(chalk`  {dim baseUrl:   {white ${baseUrl}}}`)
    console.log(chalk`  {dim outputDir: {white ${outputDir}}}`)
    console.log('')

    const browser = await puppeteer.launch({ headless: isHeadless, slowMo: 150 })
    const browserPage = await browser.newPage()
    await browserPage.setViewport({ width: 1400, height: 10000, deviceScaleFactor: 2 })
    await browserPage.emulateMedia('screen')

    const locales = sitemap.locales

    for (const locale of locales) {
        console.log(chalk`  {dim locale: {white ${locale.id}}}`)
        mkdirSync(`${outputDir}/${locale.id}`, { recursive: true })
        await captureSitemap({ browserPage, baseUrl, outputDir, sitemap: sitemap.contents, localeId: locale.id })
    }
    
    logToFile('errors.txt', `${separator}\n${new Date()}`, { mode: 'append' })

    await browser.close()
}

module.exports = startCapture