import React, { useState } from "react"

export function Error404Page(args={}) {
  return <div id="404-page" className="page">
      <h2 className="title">Page Not Found</h2>
      <p className="content">Sorry, we couldn't find this page, please try again or contact @synfonaut</p>
  </div>
}
