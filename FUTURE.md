# Future Features & Ideas

This document is the evolving backlog of gameplay ideas, systems, experiments, and technical improvements for Elcano.

The goal is not to implement everything. Items should be promoted into concrete work only when they strengthen the core experience: reading the sea, planning routes, navigating uncertainty, and exploring an Age-of-Sail world.

## Near-term priorities

### Navigation and camera
- Preserve 1:1 map proportions on every device.
- Improve camera behavior around UI overlays and safe areas.
- Add a "recenter on ship" action.
- Optionally follow the ship automatically until the player manually pans away.
- Add smoother inertial panning on touch devices.
- Add zoom limits based on useful world detail rather than arbitrary values.
- Keep off-screen objective indicators readable without covering controls.

### Sailing model
- Replace abstract speed labels with calibrated nautical units.
- Use nautical heading conventions: 0° = North, 90° = East.
- Define wind using meteorological convention: wind direction indicates where it comes from.
- Add better polar curves per ship type.
- Make sail trim affect performance by point of sail, not only total power.
- Distinguish heading, course over ground, leeway, and current drift clearly.
- Add inertia and turning response appropriate to ship size.

### World and map
- Move from abstract canvas coordinates toward geographic coordinates.
- Add real coastlines and islands.
- Start with an Atlantic / Iberian / Canary route prototype.
- Introduce trade-wind belts and major ocean-current systems.
- Add variable weather layered on top of prevailing climate patterns.
- Preserve deterministic world generation where practical for testing and replays.

### Player knowledge
- Separate world truth from what the player actually knows.
- Hide exact wind/current values outside observed areas.
- Let the player gradually build charts from exploration.
- Record previously observed conditions with age / uncertainty.
- Allow landmarks and coastline sightings to improve positional confidence.

## Exploration and navigation systems

- Fog of war based on observation and charting rather than a simple reveal radius.
- Dead reckoning.
- Position uncertainty that grows over time without sightings.
- Celestial navigation.
- Latitude estimation from sun/stars.
- Longitude as a later-game challenge depending on historical period / instruments.
- Compass error and instrument quality.
- Soundings near coasts.
- Landmark bearings.
- Chart annotations and player-created waypoints.
- Route planning with estimated travel time rather than straight-line distance only.
- Historical navigation techniques introduced gradually through missions.

## Weather and ocean

- Persistent prevailing winds.
- Daily / multi-day weather variation.
- Storm systems.
- Squalls.
- Calms / doldrums.
- Seasonal wind changes.
- Major currents and counter-currents.
- Coastal currents.
- Tides near ports and narrow passages.
- Wave / sea-state effects on speed and damage.
- Visibility, fog, rain, and cloud cover.
- Storm avoidance becoming a route-planning decision.

## Ships

- Multiple historical ship classes.
- Nao / carrack.
- Caravel.
- Galleon.
- Smaller coastal vessels.
- Different hull speed, draft, cargo, crew, maneuverability, and durability.
- Ship-specific polar diagrams.
- Sail plans with different behavior upwind / downwind.
- Damage to hull, masts, rudder, and sails.
- Repairs at sea versus repairs in port.
- Upgrades that stay historically plausible.

## Crew

- Crew size and required minimum crew.
- Morale.
- Fatigue.
- Experience.
- Sickness and injury.
- Officer roles.
- Navigator / pilot skill.
- Sail handling efficiency.
- Watch rotations.
- Crew decisions affecting risk and speed.
- Historical expedition personalities for campaign scenarios.

## Supplies and expedition management

- Food.
- Fresh water.
- Medical supplies.
- Spare timber / sailcloth / rope.
- Ammunition if combat is eventually included.
- Cargo capacity trade-offs.
- Spoilage.
- Resupply in ports.
- Fishing / emergency rationing.
- Expedition planning before departure.
- Risk versus speed versus supplies as a central strategic triangle.

## Ports and settlements

- Ports as navigation objectives and safe havens.
- Repair and resupply.
- Local markets.
- Information gathering.
- Hiring crew.
- Buying charts.
- Local pilots for dangerous waters.
- Political access restrictions in historical scenarios.
- Different port capabilities depending on size and era.

## Missions and campaign ideas

- Tutorial voyage focused only on reading wind and current.
- Canary Islands navigation challenge.
- Atlantic crossing using trade winds.
- Cape rounding challenge.
- Strait navigation with strong currents.
- Storm avoidance mission.
- Limited-supply expedition.
- Search for an unknown island using imperfect reports.
- Recreate parts of the Magellan-Elcano expedition.
- Historical scenarios with constrained technology and known events.
- Alternate-history / sandbox expeditions after the historical campaign.

## Discovery and cartography

- Coastline discovery.
- Named landmarks.
- Player chart progressively becoming more accurate.
- Different chart layers: coast, depths, currents, prevailing winds, hazards.
- Historical map aesthetics as an optional presentation layer.
- Reward useful discoveries rather than simply revealing tiles.
- Share / compare expedition maps in future online features.

## Hazards

- Reefs.
- Shoals.
- Rocks.
- Uncharted coastlines.
- Strong currents near capes and straits.
- Grounding.
- Storm damage.
- Sail damage from excessive wind.
- Crew illness.
- Water shortage.
- Navigation error.
- Piracy or hostile ships only if combat eventually serves the navigation game rather than replacing it.

## Progression

- Better navigation instruments.
- More capable ships.
- Improved charts.
- Experienced officers and crew.
- Access to longer expeditions.
- Reputation with ports / sponsors.
- Historical knowledge unlocked through exploration.
- Avoid generic RPG stat inflation; progression should mostly expand capability and information.

## User interface

- Mobile-first interaction remains mandatory.
- Recenter / follow-ship camera control.
- Map scale indicator.
- Optional compass rose overlay.
- Better visualization of apparent versus true wind.
- Clearer course-over-ground versus heading visualization.
- Route-planning mode.
- Waypoint placement by long-press / right-click.
- Contextual map information without large permanent panels.
- Collapsible instruments for small screens.
- Accessibility options for vector colors, contrast, and text size.

## Audio and atmosphere

- Wind intensity linked to apparent wind.
- Sea ambience based on weather state.
- Creaking hull and rigging.
- Bells / watch changes.
- Port ambience.
- Minimal historical music that does not overwhelm navigation cues.

## Persistence and replayability

- Local save games first.
- Multiple expedition saves.
- Deterministic seeds for reproducible scenarios.
- Voyage log with route, weather, discoveries, and decisions.
- Replay a completed voyage on the chart.
- Compare alternate routes for the same mission.
- Export voyage summaries.

## Optional online features

These should remain optional and must not become dependencies of the core simulation.

- Cloud saves.
- Shared expedition records.
- Leaderboards for historical challenges.
- Community route comparisons.
- Shared chart discoveries.
- Daily / weekly seeded navigation challenges.

## Technical TODO

- Introduce explicit camera state instead of relying primarily on DOM transforms.
- Separate rendering from simulation state more strongly.
- Move world constants out of UI modules.
- Replace hard-coded destination coordinates with scenario data.
- Introduce scenario files for start position, objective, weather seed, and tutorial steps.
- Add deterministic fixed-timestep simulation.
- Consider moving simulation updates to a Web Worker when complexity grows.
- Add unit tests for sailingVelocity, currentAt, windAt, heading conversion, and camera math.
- Add integration tests for tutorial completion and landfall.
- Add mobile interaction tests for pan / pinch / sliders.
- Add deployment checks so failed Netlify previews are detected before reporting completion.
- Remove temporary augmentation modules once their behavior belongs naturally in the main architecture.
- Refactor telemetry UI into reusable components / functions.
- Define canonical units for distance, time, speed, direction, and world coordinates.
- Define data schemas for ships, scenarios, weather, currents, and geography.

## Design questions to resolve

- How realistic should sailing physics become before realism hurts playability?
- Should the ship automatically remain near the camera center while underway, or should the camera remain entirely manual?
- How much exact numerical information should the player see versus infer from instruments?
- Should current and wind forecasts exist, and if so, how reliable are they?
- What historical period should define the default technology level?
- Should Elcano be primarily a historical campaign, a sandbox, or both?
- How important should crew and supplies become relative to pure navigation?
- Should combat exist at all?
- How should failure work: reload, expedition loss, rescue, or persistent consequences?
- How geographically accurate should the first real-world map be?

## Ideas parking lot

Interesting ideas that should not distract from the core navigation loop yet:

- Dynamic political borders.
- Trade and economics.
- Sponsorship by crowns / merchants.
- Scientific expeditions.
- Natural-history discoveries.
- Ship logbook written automatically from voyage events.
- Historical encyclopedia tied to places discovered.
- Procedural islands for non-historical sandbox mode.
- Multiplayer cooperative expeditions.
- Spectator / teaching mode for classrooms.
- Scenario editor.
- Community-created missions.
- Weather-data visualization mode.

## Rule for promoting ideas

Before implementing a feature from this document, answer:

1. Does it deepen route planning, navigation, exploration, or expedition decision-making?
2. Can it be tested independently?
3. Does it preserve the simulation/UI separation described in `ARCHITECTURE.md`?
4. Does it work well on a phone?
5. Is it valuable enough to justify the added complexity?

If the answer is mostly no, leave it here rather than adding it to the game.
