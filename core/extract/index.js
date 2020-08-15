const log = require("debug")("neuralfm:core:extract");
const database = require("../db").db;
const scrape = require("../scrape");

require("../compatibility");

async function extract(extractors, opts={}) {
    log("extracting");
    for (const extractor of extractors) {
        const compatibleScrapers = scrape.getCompatible(extractor);

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

module.exports = extract;

if (require.main === module) {
    (async function() {
        const utils = require("../../utils");
        const plugins = require("../../plugins");

        const extractors = Object.values(plugins.extractors);
        let results;
        do {
            results = await extract(extractors);
            if (results.length > 0) {
                log("sleeping");
                await utils.sleep(1000);
            }
        } while (results.length > 0);

        process.exit();
    })();

}
