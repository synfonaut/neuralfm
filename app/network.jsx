const log = require("debug")("neuralfm:app:network");

const core = require("../core");

import React, { useState } from "react"

export function CreateNetwork(args={}) {

  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");

  async function handleUpdateNameField(e) {
    setName(e.target.value);
  }

  async function handleFormSubmit() {
    log("submitting form");

    if (!name) {
      setError("Please create a name for your AI");
      return;
    }

    setError("");

    const network = await core.networks.create(
      core.plugins.scrapers.BSVTwitterScraper,
      core.plugins.extractors.TwitterFeatureExtractor,
      core.plugins.normalizers.StandardFeatureNormalizer,
      core.plugins.networks.BrainNeuralNetwork,
      name,
    );

    if (!network) {
      setError("Unable to create network, please try again or contact @synfonaut");
      return;
    }

    const channel = await core.channels.create(name, network);

    console.log("CHANNLE", channel);
  }

  return <div id="create-network">
       <h2 className="title">Create a NeraulFM AI</h2>
       <p className="content">Creating your own NeuralFM AI is as simple as clicking the <strong>Create Neural Network</strong> button below.</p>
       {error && <p className="content error has-text-danger">ERROR: {error}</p>}

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
         <div className="column is-5">
           <div className="field">
              <label className="label">Name</label>
              <div className="control">
                <input className="input" type="text" placeholder="What's the name of your channel?" value={name} onChange={handleUpdateNameField} />
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
