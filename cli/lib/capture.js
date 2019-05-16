'use strict'
const puppeteer = require('puppeteer')
const chalk = require('chalk')
const Path = require('path')
const { isDirectory } = require('./fs')

/*

Capture a specific URL

*/
const captureUrl = async (page, baseUrl, { path, selector, filename: _filename }, outputDir) => {
    const url = `${baseUrl}${path}`
    console.log(url)
    console.log(chalk`{yellow Capturing {white ${path}}} {dim (selector: ${selector})}`)

    await page.goto(url)

    const element = await page.$(selector)
    if (element === null) {
        throw new Error(`Unable to find element matching selector: '${selector}' (url: ${url})`)
    }

    const clip = await element.boundingBox()
    clip.x = clip.x - 20
    clip.y = clip.y - 20
    clip.width = clip.width + 40
    clip.height = clip.height + 40

    const filename = `${_filename}.png`
    const fullPath = Path.join(outputDir, filename)

    await page.screenshot({ path: fullPath, clip })

    console.log(chalk`  {green saved to {white ${filename}}} {dim (${fullPath})}`)
    console.log('')
}

/*

Get page config

*/
const getPageConfig = ({ pathSegments, blockId }) => ({
    path: `/${pathSegments.join('/')}?capture`,
    selector: `#${blockId}`,
    filename: `${pathSegments.join('_')}_${blockId}`,
})

/*

Capture a page sitemap (array of pages) recursively

*/
const captureSitemap = async ({ browserPage, baseUrl, outputDir, sitemap, pathSegments = [], level = 0 }) => {
    
    for (let page of sitemap) {

        console.log(chalk`  {dim ${' '.repeat(level*2)} page: {blue ${page.id}}}`)

        if (page.blocks) {
            for (let block of page.blocks) {
                const pageConfig = getPageConfig({ pathSegments: [...pathSegments, page.id], blockId: block.id })
                console.log(chalk`      {dim filename: {white ${pageConfig.filename}}}`)
                await captureUrl(browserPage, baseUrl, pageConfig, outputDir)
            }
        }

        if (page.children) {
           await captureSitemap({ baseUrl, outputDir, sitemap: page.children, level: level+1, pathSegments: [...pathSegments, page.id]})
        }
    }
}

/*

Start capture process

*/
 const startCapture = async ({ baseUrl, outputDir, sitemap }) => {
    console.log(chalk`{yellow {white ${sitemap.length}} section(s) to capture}`)
    console.log(chalk`  {dim baseUrl:   {white ${baseUrl}}}`)
    console.log(chalk`  {dim outputDir: {white ${outputDir}}}`)
    console.log('')

    const isDir = await isDirectory(outputDir)
    if (!isDir) {
        throw new Error(`'${outputDir}' is not a valid directory`)
    }

    const browser = await puppeteer.launch({ headless: false, slowMo: 150 })
    const browserPage = await browser.newPage()
    await browserPage.setViewport({ width: 1400, height: 10000, deviceScaleFactor: 2 })
    await browserPage.emulateMedia('screen')

    await captureSitemap({ browserPage, baseUrl, outputDir, sitemap})

    await browser.close()
}

module.exports = startCapture