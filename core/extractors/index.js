const log = require("debug")("neuralfm:core:extract");
const database = require("../db").db;
const scrapers = require("../scrapers");

const utils = require("../../utils");
const plugins = require("../../plugins");

const allExtractors = Object.values(plugins.extractors);

require("../compatibility");

export async function extract(extractors, opts={}) {
    log("extracting");
    for (const extractor of extractors) {
        const compatibleScrapers = scrapers.getCompatible(extractor);

        if (compatibleScrapers.length > 0) {
            for (const scraper of compatibleScrapers) {
                log(`attempting to extract features from ${scraper.name} with ${extractor.name}`);
                const dbname = scraper.getDatabaseName();
                const db = await database(dbname);

                const options = Object.assign({}, opts);

                const scraperInstance = new scraper(db, options);
                const instance = new extractor(db, scraperInstance, options);

                if (scraper.createIndexes) {
                    await scraper.createIndexes(db);
                }

                if (extractor.createIndexes) {
                    await extractor.createIndexes(db);
                }

                const results = await instance.run();
                db.close();
                if (results && results.length > 0) {
                    return results;
                }
            }
        } else {
            log(`found 0 compatible scrapers for ${extractor.name}, skipping...`);
        }
    }

    return [];
}

export function getCompatible(normalizer) {
    const compatible = [];
    for (const extractor of allExtractors) {
        const compatibleNormalizers = extractor.compatibleNormalizers || [];
        if (compatibleNormalizers.indexOf(normalizer) !== -1) {
            compatible.push(extractor);
        }
    }
    return compatible;
}


if (require.main === module) {
    (async function() {
        let results;
        do {
            results = await extract(allExtractors);
            if (results.length > 0) {
                log("sleeping");
                await utils.sleep(1000);
            }
        } while (results.length > 0);

        process.exit();
    })();

}
