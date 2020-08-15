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
                if (scraper.createIndexes) {
                    await scraper.createIndexes(db);
                }

                const extractorInstance = new extractor(db, scraperInstance, options);
                if (extractor.createIndexes) {
                    await extractor.createIndexes(db);
                }

                log(`normalizing ${scraper.name} data with ${extractor.name} features using ${normalizer.name}`);
                const instance = new normalizer(db, scraperInstance, extractorInstance);
                if (normalizer.createIndexes) {
                    await normalizer.createIndexes(db);
                }

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
