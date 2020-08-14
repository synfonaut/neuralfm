const log = require("debug")("neuralfm:core:scrape");
const db = require("../db");

async function scrape(db, scrapers) {
    if (!db) { throw "expected DB" }

    const opts = { db };
    log("scraping");
    for (const scraper of scrapers) {
        log(`scraping ${scraper.name}`);
        const results = await scraper(opts);
        if (results && results.length > 0) {
            return results;
        }
    }
    return [];
}

module.exports = scrape;

if (require.main === module) {
    (async function() {
        console.log("DB", db);

        //await scrape()
    });

}
