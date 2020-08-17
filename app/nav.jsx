import React, { useState } from "react"
import { Link } from "caldera"

const core = require("../core");

export function NavigationBar(args={}) {

  const [channels, setChannels] = useState([]);
  core.channels.getTop().then(setChannels);

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

  return <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
    <div className="navbar-brand">
      <div className="logo">
        <a onClick={handleClickHomepage}><h1 className="title">NeuralFM</h1></a>
        <p className="subtitle">AI Information Radio</p>
      </div>

      <a onClick={handleToggleMobileNavigation} role="button" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div id="navbarBasicExample" className={"navbar-menu" + (isShowingMobileNavigation ? " is-active": "")}>
      <div className="navbar-start">
          <a className="navbar-item" href="">Bitcoin</a>
          <a className="navbar-item" href="">Business</a>
          <a className="navbar-item" href="">Technology</a>
          <a className="navbar-item" href="">Metanet</a>
          <a className="navbar-item" href="">Proof of Work</a>
          <a className="navbar-item" href="">Decentralized Applications</a>
          <a className="navbar-item" href="">Wallets</a>
          {channels.map(channel => {
              return <a key={channel.name} className="navbar-item" href="">{channel.name}</a>
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

