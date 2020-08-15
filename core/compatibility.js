const plugins = require("../plugins");

// connections
for (const scraper of Object.values(plugins.scrapers)) {
    if (!scraper.compatibleExtractors) {
        scraper.compatibleExtractors = [];
    }
}

for (const extractor of Object.values(plugins.extractors)) {
    if (!extractor.compatibleNormalizers) {
        extractor.compatibleNormalizers = [];
    }
}

plugins.scrapers.BSVTwitterScraper.compatibleExtractors.push(plugins.extractors.TwitterFeatureExtractor);
plugins.extractors.TwitterFeatureExtractor.compatibleNormalizers.push(plugins.normalizers.StandardFeatureNormalizer);
