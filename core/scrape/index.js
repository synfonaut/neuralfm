const log = require("debug")("neuralfm:core:scrape");
const database = require("../db").db;
const plugins = require("../../plugins");
const utils = require("../../utils");

async function scrape(scrapers, opts={}) {
    log("scraping");
    for (const scraper of scrapers) {
        log(`scraping ${scraper.name}`);
        const db = await database(scraper.name);
        const options = Object.assign({}, opts, { db });
        const results = await scraper(db, options);
        db.close();
        if (results && results.length > 0) {
            return results;
        }
    }
    return [];
}

module.exports = scrape;

if (require.main === module) {
    (async function() {
        const scrapers = Object.values(plugins.scrapers);
        let results;
        do {
            results = await scrape(scrapers);
            log("sleeping");
            await utils.sleep(2502);
        } while (results.length > 0);

        process.exit();
        //await scrape()
    })();

}
