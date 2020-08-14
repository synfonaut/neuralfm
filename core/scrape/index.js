
async function scrape(db, scrapers) {
    if (!db) { throw "expected DB" }

    const opts = { db };
    for (const scraper of scrapers) {
        const results = await scraper(opts);
        if (results && results.length > 0) {
            return results;
        }
    }
    return [];
}

module.exports = scrape;
