import path from 'path'
import puppeteer from 'puppeteer'
import { SitemapBlock, SitemapPage } from './types'
import { logger } from './logger'

// define the viewport dimensions, which have to be
// pretty large in order to have everything visible
const VIEWPORT_WIDTH = 1400
const VIEWPORT_HEIGHT = 10000

// add some extra space around the captures
const CAPTURE_AREA_MARGIN = 20

/**
 * Capture all blocks for a page,
 * using a dedicated browser instance with a single page.
 */
const capturePage = async ({
    url,
    pathSegments,
    blocks,
    outputDir,
    locale,
}: {
    url: string
    pathSegments: string[]
    blocks: SitemapBlock[]
    outputDir: string
    locale: string
}) => {
    const browser = await puppeteer.launch({ headless: true })
    const browserPage = await browser.newPage()
    await browserPage.setViewport({
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT,
        deviceScaleFactor: 2,
    })
    await browserPage.emulateMediaType('screen')
    await browserPage.goto(url)

    for (const block of blocks) {
        const blockSelector = `#${block.id}`
        const element = await browserPage.$(blockSelector)
        if (element === null) {
            logger.error(
                `[${locale}] Unable to find element matching selector: '${blockSelector}' (url: ${url})`
            )
            continue
        }

        const filename = path.join(outputDir, locale, `${block.id}.png`)
        const clip = await element.boundingBox()
        if (clip !== null) {
            await browserPage.screenshot({
                path: filename,
                clip: {
                    x: clip.x - CAPTURE_AREA_MARGIN,
                    y: clip.y - CAPTURE_AREA_MARGIN,
                    width: clip.width + CAPTURE_AREA_MARGIN * 2,
                    height: clip.height + CAPTURE_AREA_MARGIN * 2,
                },
            })

            logger.debug(`[${locale}] ${pathSegments.join('/')}${blockSelector} (${filename})`)
        }
    }

    await browser.close()
}

/**
 * Capture several pages, it's used both to start the capture
 * of a sitemap for a given locale, but also to capture child pages.
 */
export const capturePages = async ({
    baseUrl,
    outputDir,
    pages,
    pathSegments = [],
    locale,
}: {
    baseUrl: string
    outputDir: string
    pages: SitemapPage[]
    pathSegments?: string[]
    locale: string
}) => {
    for (const page of pages) {
        if (Array.isArray(page.blocks)) {
            const exportableBlocks = page.blocks.filter((block) => block.enableExport)
            if (exportableBlocks.length > 0) {
                await capturePage({
                    url: `${baseUrl}/${locale}${page.path}?capture`,
                    pathSegments: [...pathSegments, page.id],
                    blocks: exportableBlocks,
                    outputDir,
                    locale,
                })
            }
        }

        if (Array.isArray(page.children)) {
            await capturePages({
                baseUrl,
                outputDir,
                pages: page.children,
                pathSegments: [...pathSegments, page.id],
                locale,
            })
        }
    }
}
