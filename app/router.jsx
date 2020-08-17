import React, { useState } from "react"

import { Sidebar } from "./sidebar"
import { CreateNetwork, CreateNetworkSidebar } from "./network"
import { Channel, ChannelSidebar } from "./channel"
import { Error404Page } from "./error"

// return ["route", "identifier"] from location
function getRouteForLocation(location) {
  if (location.pathname.indexOf("/create") == 0) {
    return ["create"];
  } else if (location.pathname === "/") {
    return ["homepage"];
  }

  const parts = location.pathname.split("/");
  if (parts.length == 2) {
    const slug = parts[1];
    return ["channel", slug];
  }

  return ["404"];
}

export function Router(args={}) {
  const [route, slug] = getRouteForLocation(args.location);

  const params = Object.assign({}, args, {
    route,
    slug,
  });

  if (route == "create") {
    return <div id="create">
        <div className="columns">
            <div className="column is-8">
                <CreateNetwork {...params} />
            </div> <div className="column is-4">
                <CreateNetworkSidebar {...params} />
            </div>
        </div>
      </div>
  } else if (route == "homepage") {
    return <div id="homepage">
        <div className="columns">
            <div className="column is-8">
                DEFAULT CHANNEL!!!!
            </div>
            <div className="column is-4">
                <Sidebar {...params} />
            </div>
        </div>
      </div>
  } else if (route == "channel") {
    return <div id="channel">
        <div className="columns">
            <div className="column is-8">
                <Channel {...params} />
            </div>
            <div className="column is-4">
                <ChannelSidebar {...params} />
            </div>
        </div>
      </div>
  } else {
      return <Error404Page {...params} />
  }
}

