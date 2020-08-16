import React, { useState } from "react"

const core = require("../core");

const DEFAULT_NETWORK_FINGERPRINT = "";

export function Timeline(args) {

    /*
    const search = params.search;
    let trainer = params.trainer;
    let manager = params.manager;

    let searchLimit = Number(search.get("limit"));
    if (searchLimit < 1 || searchLimit > 1000) { searchLimit = DEFAULT_SEARCH_LIMIT }

    let searchPage = Number(search.get("page"));
    if (searchPage < 1) { searchPage = 1 }

    const searchDir = search.get("dir");
    const searchSort = search.get("sort");
    const searchSearch = search.get("search");
    const oppositeDir = (searchDir == "asc" ? "desc" : "asc");
    */

    // get neural networks
    // display data from top rated neural networks
    //const networks = core.networks.getAllNetworks();
    //console.log("CORE", core.plugins);

    return <div id="timeline">
        <h2 className="title">Top News</h2>
        <p className="content">NeuralFM's mission is to put you in control of the AI's feeding you information.</p>
        <p className="content">Every channel on NeuralFM is an AI trained by an editor, with all data and training parameters snapshotted into the blockchain.</p>
        <p className="content">Stay goodbye to filter bubbles, disinformation, fake news and algorithm bias. Hello Bitcoin.</p>
    </div>
}


