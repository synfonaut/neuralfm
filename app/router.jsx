import React, { useState } from "react"

import { Timeline } from "./timeline"
import { Sidebar } from "./sidebar"
import { CreateNetwork, CreateNetworkSidebar } from "./network"

function getRouteForLocation(location) {
  if (location.pathname.indexOf("/create") == 0) {
    return "create";
  }

  return "homepage";
}

export function Router(args={}) {
  const route = getRouteForLocation(args.location);
  if (route == "create") {
    return <div id="create">
        <div className="columns">
            <div className="column is-8">
                <CreateNetwork {...args} />
            </div>
            <div className="column is-4">
                <CreateNetworkSidebar {...args} />
            </div>
        </div>
      </div>
  } else if (route == "homepage") {
    return <div id="homepage">
        <div className="columns">
            <div className="column is-8">
                <Timeline {...args} />
            </div>
            <div className="column is-4">
                <Sidebar {...args} />
            </div>
        </div>
      </div>
  } else {
      return <div>404</div>
  }
}

