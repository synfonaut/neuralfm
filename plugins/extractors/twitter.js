export class TwitterFeatureExtractor {

    constructor(db, opts={}) {
        if (!db) { throw "expected DB" }
        this.db = db;

        this.opts = opts;
    }

    run() {
    }
}
