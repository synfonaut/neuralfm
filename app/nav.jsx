const log = require("debug")("neuralfm:app:nav");

import React, { useState } from "react"
import { Link } from "caldera"

const core = require("../core");

export function NavigationBar(args={}) {

  const [isLoaded, setIsLoaded] = useState(false);

  const [channels, setChannels] = useState([]);

  if (!isLoaded) {
    setIsLoaded(true);

    core.channels.getTop().then(newChannels => {
      log("setting channels");
      setChannels(newChannels);
    });
  }

  const [isShowingMobileNavigation, setIsShowingMobileNavigation] = React.useState(false);
  function handleToggleMobileNavigation() {
    setIsShowingMobileNavigation(!isShowingMobileNavigation);
  }

  function hideMobileNavigation() {
    setIsShowingMobileNavigation(false);
  }

  function handleClickHomepage() {
    args.history.push("/");
    hideMobileNavigation();
  }

  function handleClickCreate() {
    args.history.push("/create");
    hideMobileNavigation();
  }

  function handleClickChannel(slug) {
    args.history.push("/" + slug);
    hideMobileNavigation();
  }

  return <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
    <div className="navbar-brand">
      <div className="logo">
        <a onClick={handleClickHomepage}><h1 className="title">NeuralFM</h1></a>
        <p className="subtitle">Tune In To Information</p>
      </div>

      <a onClick={handleToggleMobileNavigation} role="button" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div id="navbarBasicExample" className={"navbar-menu" + (isShowingMobileNavigation ? " is-active": "")}>
      <div className="navbar-start">
          {channels.map(channel => {
              return <a key={channel.name} onClick={() => { handleClickChannel(channel.slug) }} className="navbar-item">{channel.name}</a>
          })}
          <hr className="navbar-divider is-hidden-desktop" />
          <a className="navbar-item is-hidden-desktop" onClick={handleClickCreate}>
            Create
          </a>
        </div>
      </div>

      <div className="navbar-end is-hidden-mobile">
        <div className="navbar-item">
          <div className="buttons">
            <a className="button create-button" onClick={handleClickCreate}>
              Create
            </a>
          </div>
        </div>
      </div>
  </nav>
}

