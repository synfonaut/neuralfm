import React, { useState } from "react"
import { Link } from "caldera"


export function NavigationBar(args={}) {

  function handleClickHomepage() {
    args.history.push("/");
  }

  function handleClickCreate() {
    args.history.push("/create");
  }

  return <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
    <div className="navbar-brand">
      <div className="logo">
        <a onClick={handleClickHomepage}><h1 className="title">NeuralFM</h1></a>
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
        <a className="navbar-item" onClick={handleClickCreate}>Create</a>
      </div>

      <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>
  </nav>
}
