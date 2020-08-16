const log = require("debug")("neuralfm:core:normalizers");
const database = require("../db").db;
const utils = require("../../utils");
const scrapers = require("../scrapers");
const extractorsCore = require("../extractors");
const plugins = require("../../plugins");

require("../compatibility");

const allNormalizers = Object.values(plugins.normalizers);

export async function normalize(extractors, normalizer, opts={}) {
    log("normalizing");
    for (const extractor of extractors) {
        const compatibleScrapers = scrapers.getCompatible(extractor);
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

if (require.main === module) {
    (async function() {
        for (const normalizer of allNormalizers) {
            const compatibleExtractors = extractorsCore.getCompatible(normalizer);
            if (compatibleExtractors.length === 0) {
                log(`no extractors for normalizer ${normalizer.name}`);
                continue;
            }

            let results;
            do {
                results =  await normalize(compatibleExtractors, normalizer)
            } while (results.length > 0);
        }

        process.exit();
    })();

}
