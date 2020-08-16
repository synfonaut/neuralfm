import React, { useState } from "react"
import { renderCalderaApp, makeSharedResource, useSharedState, useLocation, useHistory } from "caldera"

import { Timeline } from "./timeline"
import { Sidebar } from "./sidebar"

function NeuralFMApplicationWrapper(args={}) {
    const [data, setData]  = useState([]);
    const [isLoaded, setIsLoaded]  = useState(true);

    if (!isLoaded) {
        setTimeout(function() {
            setIsLoaded(true);
        }, 1000);
    }

    const params = Object.assign({}, args, {
        isLoaded,
    });

    return <>
        <LoadingScreen {...params} />
        <NeuralFMApplication {...params} />
    </>
};

function NeuralFMApplication(args={}) {
    return <div id="app">
        <NavigationBar {...args} />
        <section className="section">
          <div className="container">
            <div id="app-wrapper">
              <div className="columns">
                  <div className="column is-8">
                      <Timeline {...args} />
                  </div>
                  <div className="column is-4">
                      <Sidebar {...args} />
                  </div>
              </div>
            </div>
          </div>
        </section>
    </div>
}

function NavigationBar() {
    return <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <div className="logo">
          <h1 className="title">NeuralFM</h1>
          <p className="subtitle">AI Information Radio</p>
        </div>

        <div className="navbar-menu">
          <a className="navbar-item" href="">Bitcoin</a>
          <a className="navbar-item" href="">Business</a>
          <a className="navbar-item" href="">Technology</a>
          <a className="navbar-item" href="">Metanet</a>
          <a className="navbar-item" href="">Proof of Work</a>
          <a className="navbar-item" href="">Decentralized Applications</a>
          <a className="navbar-item" href="">Wallets</a>
        </div>

        <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
    </nav>
}


function LoadingScreen(args={}) {
  return <div id="loading" className={args.isLoaded ? "loaded" : "unloaded"}>
    <div className="columns is-vcentered">
      <div className="column has-text-centered">
        <p className="bd-notification is-primary breathe">NeuralFM</p>
        <p className="is-size-6 breathe">Loading...</p>
      </div>
    </div>
  </div>
}

renderCalderaApp(<NeuralFMApplicationWrapper />, {
    port: 7777,
    rootDir: "./app/public"
});

