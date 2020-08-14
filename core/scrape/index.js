const log = require("debug")("neuralfm:core:scrape");
const database = require("../db").db;

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

/*
if (require.main === module) {
    (async function() {
        const database = db();
        console.log("DB", database);

        //await scrape()
    })();

}
*/
