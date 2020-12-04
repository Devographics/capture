import path from 'path'
import { existsSync } from 'fs'
import YAML from 'yamljs'
import { CaptureConfig, Sitemap } from './types'
import { captureLocales } from './locales'
import { logger, flushLogs } from './logger'

const CONFIG_DIR = 'config'
const CAPTURE_CONFIG_FILE = 'capture.yml'
const SITEMAP_FILE = 'sitemap.yml'

export const capture = async () => {
    const args = process.argv
    const resultsPath = args[2]
    if (!resultsPath) {
        logger.error(`no survey results path provided`)
        await flushLogs()
        process.exit(1)
    }

    const configDirPath = path.join(process.cwd(), resultsPath, CONFIG_DIR)
    console.log(configDirPath)
    if (!existsSync(configDirPath)) {
        logger.error(`unable to locate config dir: ${configDirPath}`)
        await flushLogs()
        process.exit(1)
    }

    const configFilePath = path.join(configDirPath, CAPTURE_CONFIG_FILE)
    if (!existsSync(configFilePath)) {
        logger.error(`unable to locate config file: ${configFilePath}`)
        await flushLogs()
        process.exit(1)
    }
    const config: CaptureConfig = YAML.load(configFilePath)

    const sitemapPath = path.join(configDirPath, SITEMAP_FILE)
    if (!existsSync(sitemapPath)) {
        logger.error(`unable to locate sitemap: ${sitemapPath}`)
        await flushLogs()
        process.exit(1)
    }
    const sitemap: Sitemap = YAML.load(sitemapPath)

    await captureLocales({
        baseUrl: config.baseUrl,
        outputDir: config.outputDir,
        sitemap,
    })
}