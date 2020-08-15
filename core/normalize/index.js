const log = require("debug")("neuralfm:core:normalize");
const database = require("../db").db;
const scrape = require("../scrape");

export async function normalize(extractors, normalizer, opts={}) {
    log("normalizing");
    for (const extractor of extractors) {
        const compatibleScrapers = scrape.getCompatible(extractor);
        if (compatibleScrapers.length > 0) {
            for (const scraper of compatibleScrapers) {
                const dbname = scraper.getDatabaseName();
                const db = await database(dbname);

                const options = Object.assign({}, opts);

                const scraperInstance = new scraper(db, options);
                const extractorInstance = new extractor(db, scraperInstance, options);
                log(`normalizing ${scraper.name} data with ${extractor.name} features using ${normalizer.name}`);
                const instance = new normalizer(db, scraperInstance, extractorInstance);
                const results = await instance.run();
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

/*
export function isCompatible(scraper, extractor) {
    for (const compatiableExtractor of scraper.compatibleExtractors) {
        if (compatiableExtractor === extractor) {
            return true;
        }
    }
    return false;
}

export function getCompatible(extractor) {
    const compatible = [];
    for (const scraper of allScrapers) {
        if (scraper.compatibleExtractors.indexOf(extractor) !== -1) {
            compatible.push(scraper);
        }
    }
    return compatible;
}

if (require.main === module) {
    (async function() {
        const utils = require("../../utils");
        let results;
        do {
            results = await scrape(allScrapers);
            log("sleeping");
            await utils.sleep(1000);
        } while (results.length > 0);

        process.exit();
    })();

}
*/
