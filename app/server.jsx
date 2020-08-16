import React, { useState } from "react"
import { renderCalderaApp, makeSharedResource, useSharedState, useLocation, useHistory } from "caldera"
import { Router } from "./router"
import { NavigationBar } from "./nav"


function NeuralFMApplicationWrapper(args={}) {
  const location = useLocation();
  const history = useHistory();

  const search = new URLSearchParams(location.search);

  const params = Object.assign({}, args, {
    location,
    history,
    search,
  });

  return <NeuralFMApplication {...params} />
};

function NeuralFMApplication(args={}) {
    return <div id="app">
        <NavigationBar {...args} />
        <section className="section">
          <div className="container">
            <div id="app-wrapper">
              <Router {...args} />
            </div>
          </div>
        </section>
    </div>
}

/*
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
*/

renderCalderaApp(<NeuralFMApplicationWrapper />, {
    port: 7777,
    rootDir: "./app/public"
});

