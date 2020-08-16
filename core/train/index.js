const log = require("debug")("neuralfm:core:train");
const database = require("../db").db;

export async function train(network, opts={}) {
    log(`training ${network.name}`);
    await network.run();
}

/*
const plugins = require("../../plugins");
const allScrapers = Object.values(plugins.scrapers);

export async function scrape(scrapers, opts={}) {
    log("scraping");
    for (const scraper of scrapers) {
        log(`scraping ${scraper.name}`);
        const dbname = scraper.getDatabaseName();
        const db = await database(dbname);
        if (scraper.createIndexes) {
            await scraper.createIndexes(db);
        }
        const options = Object.assign({}, opts, { db });
        const instance = new scraper(db, options);
        const results = await instance.run();
        db.close();
        if (results && results.length > 0) {
            return results;
        }
    }
    return [];
}

export function isCompatible(scraper, extractor) {
    const compatibleExtractors = scraper.compatibleExtractors || [];
    for (const compatibleExtractor of compatibleExtractors) {
        if (compatibleExtractor === extractor) {
            return true;
        }
    }
    return false;
}

export function getCompatible(extractor) {
    const compatible = [];
    for (const scraper of allScrapers) {
        const compatibleExtractors = scraper.compatibleExtractors || [];
        if (compatibleExtractors.indexOf(extractor) !== -1) {
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
