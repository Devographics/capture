import { mkdirSync } from 'fs'
import path from 'path'
import { Sitemap } from './types'
import { capturePages } from './pages'
import { logger } from './logger'

/**
 * Run captures for each locale in parallel.
 */
export const captureLocales = async ({
    baseUrl,
    outputDir,
    sitemap,
}: {
    baseUrl: string
    outputDir: string
    sitemap: Sitemap
}) => {
    logger.info(
        `${sitemap.contents.length} section(s) and ${sitemap.locales.length} locale(s) to capture`
    )
    logger.info(`baseUrl: ${baseUrl} | outputDir: ${outputDir}`)

    await Promise.all(
        sitemap.locales.map((locale) => {
            mkdirSync(path.join(outputDir, locale.id), { recursive: true })

            return capturePages({
                baseUrl,
                outputDir,
                pages: sitemap.contents,
                locale: locale.id,
            })
        })
    )

    logger.info(`done`)
}
