import React, { useState } from "react"
import { renderCalderaApp, makeSharedResource, useSharedState, useLocation, useHistory } from "caldera"
import { Router } from "./router"
import { NavigationBar } from "./nav"

const core = require("../core");

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

(async function() {
  await core.setup();

  renderCalderaApp(<NeuralFMApplicationWrapper />, {
      port: 7777,
      rootDir: "./app/public"
  });

})();
