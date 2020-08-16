const log = require("debug")("neuralfm:app:network");

const core = require("../core");

import React, { useState } from "react"

export function CreateNetwork(args={}) {

  function handleFormSubmit() {
    const scraper = core.plugins.scrapers.BSVTwitterScraper;
    const extractor = core.plugins.extractors.TwitterFeatureExtractor;
    const normalizer = core.plugins.normalizers.StandardFeatureNormalizer;
    const network = core.plugins.networks.BrainNeuralNetwork;

    console.log(scraper);
    console.log(extractor);
    console.log(normalizer);
    console.log(network);
    log("submitting form");
  }

  return <div id="create-network">
       <h2 className="title">Create a NeraulFM AI</h2>
       <p className="content">Creating your own NeuralFM AI is as simple as clicking the <strong>Create Neural Network</strong> button below.</p>

       <div className="columns">
         <div className="column is-6">
            <div className="field">
              <label className="label">Data Source</label>
              <div className="control">
                <div className="select">
                  <select>
                    <option>BSV Twitter</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

       <div className="columns">
         <div className="column is-6">
            <div className="field">
              <label className="label">Feature Extractor</label>
              <div className="control">
                <div className="select">
                  <select>
                    <option>TwitterFeatureExtractor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

       <div className="columns">
         <div className="column is-6">
            <div className="field">
              <label className="label">Normalizer</label>
              <div className="control">
                <div className="select">
                  <select>
                    <option>StandardFeatureNormalizer</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

       <div className="columns">
         <div className="column is-6">
            <div className="field">
              <label className="label">Neural Network</label>
              <div className="control">
                <div className="select">
                  <select>
                    <option>BrainNeuralNetwork</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      
       <div className="columns">
         <div className="column is-6">
           <div className="field">
              <label className="label">Name</label>
              <div className="control">
                <input className="input" type="text" placeholder="What's the name of your channel?" />
              </div>
            </div>
          </div>
        </div>

        <div className="field is-grouped">
          <div className="control">
            <button className="button is-link" onClick={handleFormSubmit}>Create Neural Network</button>
          </div>
        </div> 
    </div>
}

export function CreateNetworkSidebar(args={}) {
  return <div id="sidebar">
        <p className="content"><strong>NeuralFM</strong>'s mission is to put you in control of the AI's feeding you information.</p>
        <p className="content">This page is where you'll create your own NeuralFM channel, an AI that you control on any topic you care about.</p>
        <p className="content">Right now NeuralFM is limited to the BSV ecosystem, but additional data sources are coming soon.</p>

    </div>
}
