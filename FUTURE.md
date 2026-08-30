# Future Features & Ideas

Elcano should stay simple. New features should strengthen the core loop: choose a ship, read the wind and currents, pick a route, and complete a voyage.

For the intentionally deferred weather/current roadmap, see [FUTURE_WEATHER.md](./FUTURE_WEATHER.md).

## 1. Real-world map

Replace the abstract test world with real geography.

- [x] Use real coastlines and islands.
- [x] Use geographic coordinates rather than abstract canvas coordinates.
- [x] Keep the existing sailing simulation and controls layered on top of the map.
- Keep geography static-first and progressively increase coastline detail with zoom.
- Add sparse real-world coastline, port, island and sea labels that appear by zoom level.
- Add a nautical-mile scale bar that updates with zoom.
- Add optional compass/cardinal ticks at useful zoom levels.
- Add tap/click measurement: distance and bearing from the ship to a chosen map point.
- [x] Add a two-state camera control: static camera or follow ship. Static preserves the current view; follow keeps the ship centered while allowing zoom.

### Future map-label architecture

The current label layer intentionally uses one centralized label list with zoom thresholds, priorities and collision suppression. Keep that simple architecture for now. If several more historical campaigns make the list unwieldy, refactor the data without changing the renderer: separate global geography from campaign-specific label packs, allow labels to declare one or more campaign IDs, and derive primary mission start/destination labels automatically from campaign mission definitions so mission coordinates are not duplicated manually.

The player should eventually be able to navigate the real Atlantic and the wider world.

## 2. Environmental navigation and weather visualization

- [x] Load real-world environment tiles beyond the Bay of Biscay only around the visible map area, with caching and a deterministic fallback when remote data is unavailable.
- [x] Add separate wind/current visibility toggles.
- [x] Make the zoom-aware wind/current overlay use the same persistent fog-of-war discovery cells as the map: undiscovered cells expose no environmental vectors, while discovered cells retain readable environmental information after the ship leaves.
- [x] Improve map-readable wind/current arrows with zoom-adaptive sampling so zooming in reveals finer environmental detail without creating a separate discovery system.
- [x] Add a thin course trail showing the ship's actual travelled path.
- [x] Add two forward navigation vectors at the ship: a heading vector showing where the bow is pointed and a track/course-over-ground vector showing the actual direction of movement. Their angular difference is the ship's slip/drift angle.
- Keep an optional bearing-to-target reference line as a separate future aid so desired bearing can be compared with heading and track without confusing it with either vector.
- [x] Add deterministic day-to-day wind variation around the monthly climatology so voyages encounter plausible calms, stronger winds and directional shifts while remaining reproducible and static-first. The implemented field is spatially coherent at roughly 1,000 nm, evolves continuously through overlapping roughly 2.6–4.4 day and 5.5–8.5 day cycles, uses regime-specific variability, and remains centred on the climatological speed and direction.
- Add post-voyage route debriefs using the existing logbook data: route map, time, distance, average speed, weather encountered and readable personal-best comparisons.
- Add a short weather-window tutorial that explicitly teaches observing the forecast, anchoring, waiting and departing in favourable conditions.
- Keep historical missions explicit that modern observed/reanalysis data represents plausible prevailing conditions, not literal weather from the 16th century.

For the current game, discovered environmental knowledge should remain intentionally arcade-readable: once an area has been explored, the player may inspect its current simulated wind/current field. Do not make this historically restrictive yet.

### Dynamic weather and current simulation

Evolve the environment from mostly static climatological vectors into a time-varying simulation that makes waiting, anchoring and route timing meaningful parts of navigation.

- [x] Add deterministic global basin-level low-pressure systems: year-round mid-latitude tracks in the Atlantic, North Pacific and Southern Ocean, plus season-gated tropical systems in the Pacific and Indian oceans. Systems have ordinary-low, gale, or severe-storm intensity, with a calm centre, a broad peak-wind ring, and a sharp outer fall-off. A discovered storm centre is marked with 🌩️ on the chart. See `SEAS_AND_WEATHER.md` for the current model.

Model the environment in three layers:

1. **Background climate** — persistent regional wind patterns and major ocean currents derived from climatology, with deterministic regime-aware day-to-day wind variation layered onto the prevailing wind.
2. **Dynamic weather systems** — moving highs, lows, storms and eventually fronts with position, radius, strength, movement and rotational wind fields. These systems modify the already varied background wind as they move across the map.
3. **Local coastal and tidal effects** — coastlines, islands, channels and tides can alter currents independently of large-scale weather, especially in constrained waters such as the Strait of Magellan.

Use a simple conceptual composition:

- actual wind = day-to-day varied prevailing wind + weather-system influence;
- actual current = base ocean current + coastal/tidal influence + smaller weather influence.

Do not make major ocean currents rotate wholesale around storms. Storms can alter surface flow, but persistent currents should retain their larger-scale structure.

The gameplay goal is to create changing sailing windows. A passage that is difficult now may become favorable several hours or days later as a weather system moves and the local wind rotates. The player can anchor, wait, observe and then exploit a favorable window instead of simply forcing a route through adverse conditions.

Keep the weather simulation separate from rendering/UI. Weather systems should be simulation objects queried through functions such as `weatherAt(lat, lon, time)`, while the map only visualizes the resulting local conditions.

### Environmental knowledge and fog of war

The simulation can know the conditions everywhere without giving the player perfect global knowledge.

- Reuse the existing discovered/known-tile state for wind and current information.
- Show environmental information only for discovered/known tiles rather than revealing the entire world.
- Initially, known tiles can display current simulated conditions for simplicity.
- In a later historical-uncertainty mode, tiles should retain the **last observed** wind/current state and become stale while the ship is elsewhere.
- Unexplored waters should require actual exploration rather than providing perfect meteorological information in advance.

This creates a progression from readable arcade navigation toward optional historical uncertainty without making the base game unnecessarily difficult.

## 3. Small ship roster and rig selection

Add roughly four or five selectable historical ship presets. This is a high-value next sailing feature because the existing polar model can make each rig feel meaningfully different without adding more controls.

Possible examples:

- Caravel — light, agile, comparatively good at tighter wind angles.
- Nao / carrack — balanced exploration ship.
- Galleon — heavier and less agile, but strong with favorable winds.
- Lateen-focused vessel — strong across and into the wind.
- Square-rigged vessel — strongest with following winds, weaker upwind.

Ship behavior should be driven mainly by hull + rig:

- Square sails: strong downwind performance, poorer ability to sail close to the wind.
- Triangular / lateen sails: better performance at tighter wind angles, somewhat less dominant directly downwind.
- Mixed rigs can sit between those extremes.

Represent this with data-driven polar curves rather than complex sail simulation or branching code. Avoid large stat sheets. The player should feel the difference immediately by choosing different headings in the same wind.

## 4. Historical navigation instruments

Add useful navigation information without turning Elcano into a cockpit simulator.

Possible instruments:

- compass and heading;
- latitude readout;
- ship speed / log;
- distance and bearing measurements;
- simple dead-reckoning support;
- later, historically appropriate instruments where they improve gameplay.

The emphasis should remain on reading the sea and making route decisions, not operating many individual controls.

### Later historical uncertainty mode

Keep the present sailing mode comparatively arcade-like and readable. Exact ship position, current local conditions and discovered environmental fields can remain available for now.

A later historical-navigation layer may deliberately separate **world truth** from **what a 16th-century navigator could know**. Possible mechanics include:

- hide or blur the exact ship position on the map;
- estimate position from heading, speed and elapsed time through dead reckoning;
- accumulate navigational error from currents, steering and imperfect speed estimates;
- use latitude observations from the Sun or stars to correct part of that uncertainty;
- make remembered wind/current knowledge approximate or stale instead of showing magically current conditions far from the ship;
- distinguish observed local weather from learned prevailing regional patterns.

This should be an optional later direction, not a requirement for the current core game. First make the arcade navigation, exploration, environmental reading and historical missions consistently fun and clear.

### Navigation and history learning layer

Use the simulation to explain *why* a route worked or failed, rather than adding information panels that merely describe history. Keep every learning element optional, short and tied to a real player decision.

1. **Post-voyage navigation debriefs** — route map, time, distance, weather encountered, personal best, and plain-language explanations of decisive route gains or losses.
2. **Mission-specific learning objectives** — one to three explicit skills per leg, such as using trade winds, avoiding a current, finding westerlies or waiting for tidal slack.
3. **Contextual “why this worked” cards** — optional, event-triggered explanations of monsoons, the *volta do mar*, westerlies, gyres, tides and fog banks.
4. **Historical-route comparison** — reveal the expedition’s broad documented route after completion, clearly separating known track from gameplay checkpoints and compressed legs.
5. **Interactive navigation lessons** — short exercises for tacking, jibing, points of sail, apparent wind, drift/leeway and course over ground.
6. **Weather-window tutorial and forecast view** — teach observing a limited known forecast, anchoring, waiting, and departing in favourable wind or tide without exposing a perfect global forecast.
7. **Campaign-specific expedition context** — compact chapters between missions covering purpose, leadership, losses, ports, political setting and consequences.
8. **Current-corridor lessons** — explain named currents when a player enters or exploits them, including their historical effect on the route.
9. **Seasonal wind-system lessons** — make monsoons, trade-wind shifts and seasonal North Atlantic behaviour explicit and teachable.
10. **Optional historical-navigation mode** — the uncertainty mechanics above: dead reckoning, latitude observations, accumulating current error and stale observations.
11. **Coastal pilotage and landmarks** — capes, islands, soundings, shoals, safe channels, harbour approaches and visual landmarks as meaningful local-navigation information.
12. **Standalone scenario challenges** — concise lessons such as crossing the Bay of Biscay, finding Urdaneta’s westerlies, or escaping an adverse Strait tide.
13. **Ship-choice briefings** — explain how each rig changes the route and the lesson it supports before a voyage begins.
14. **Accessible glossary** — tap any nautical term for a plain-language definition and a tiny supporting diagram.
15. **Route replay** — replay a completed voyage with wind, current, decisions, anchoring and speed changes over time.

### Achievements and exploration milestones

Add a small, meaningful achievement collection that celebrates navigation understanding and historical exploration without turning Elcano into a grind or a generic checklist.

- Award achievements for demonstrated sailing knowledge, not arbitrary repetition: first successful tack, first favourable tide window, first use of a major current, first weather-window departure, and first safe strait passage.
- Add campaign and historical milestones: complete a campaign, reach the Moluccas, return from the Pacific, find Urdaneta’s westerlies, or make the Norse landfall at Vinland.
- Add exploration milestones for chart knowledge: discover a named current, chart a sea or strait, and connect previously explored regions through a completed route.
- Each achievement should contain a short explanation of the navigation or historical idea it recognizes, and link to the relevant glossary/lesson when that learning layer exists.
- Make achievements local and replay-friendly. Never lock missions, ships or core information behind them; they should record understanding and encourage varied routes.

## 5. Historical campaigns and missions

Historical voyages should be organized as **Campaign → Missions**.

A campaign represents one historical expedition or coherent voyage. Each mission is one playable leg with its own start, destination, date/context, objective and briefing. Long expeditions should therefore become a sequence of manageable sub-missions rather than one enormous uninterrupted sail.

The player should not have to reproduce the historical route exactly. The interesting part is trying their own route under similar geographic and sailing constraints. Completed missions may later compare the player's route, time or distance with the historical route.

### Implemented campaign catalog

- [x] **Campaign 0 — Basque Whaling, 16th century.** The San Sebastián → A Coruña introductory mission now begins the tutorial campaign, followed by a seasonal North Atlantic route via the Azores, Grand Banks and Red Bay, Labrador. It teaches the game first, and treats whaling as historical context rather than a hunting mechanic.
- [x] **Campaign 1 — Magellan–Elcano Circumnavigation, 1519–1522.** Sixteen legs from Sanlúcar to Tenerife, Brazil, Patagonia, the Strait, the Pacific, the Philippines, Tidore, Timor, the Cape, Cape Verde and home.
- [x] **Campaign 2 — Loaísa–Elcano Expedition, 1525–1527.** Sixteen legs from A Coruña through La Gomera, Annobón, Patagonia, the Strait, the Pacific, the Philippines and the Moluccas. García Jofre de Loaísa commanded; Elcano served as second-in-command and died during the Pacific crossing.
- [x] **Campaign 3 — Vasco da Gama, 1497–1499.** South Atlantic route choice, the Cape of Good Hope and Indian Ocean monsoons.
- [x] **Campaign 4 — Urdaneta’s Tornaviaje, 1565.** Find the North Pacific westerlies and descend the American coast to Acapulco.
- [x] **Campaign 5 — Columbus’s First Voyage, 1492–1493.** Trade winds west from the Canaries, island navigation, and a North Atlantic westerly return.
- [x] **Campaign 6 — Cabral: Brazil and India, 1500.** A South Atlantic swing to Brazil, then the Cape route to India.
- [x] **Campaign 7 — Zheng He: Indian Ocean, 1405–1433.** Monsoon-timed legs from China through Southeast Asia and India to East Africa.
- [x] **Campaign 8 — Drake’s Circumnavigation, 1577–1580.** A stormier Atlantic, Strait and world return; it reuses the dedicated Strait navigation tools.
- [x] **Campaign 9 — Norse Road to Vinland, c. 1000.** Greenland, Helluland, Markland and the securely attested Norse site at L’Anse aux Meadows. Saga geography is explicitly treated as uncertain.
- [x] **Campaign 10 — Classical Mediterranean.** A clearly fictionalized Greek-inspired island-navigation expansion from Piraeus to Alexandria, rather than a claim to reproduce a named ancient voyage.

Every campaign is a sequence of independent, replayable missions. Historical notes distinguish documented landfalls from practical gameplay checkpoints and compressed legs.

### Campaign progress, logbook and persistent chart knowledge

Turn completed voyages into a coherent expedition without preventing replay or making the game grindy.


This makes exploration cumulative: a player who crossed the Atlantic on an earlier leg can use the charted waters while preparing a later voyage, but must still personally discover unfamiliar seas.

### Later campaigns

Future campaigns should add a distinct navigation lesson or environment, rather than another route reskin. Good candidates include regional Atlantic challenges and additional Indian Ocean routes with richer local geography.

## 5a. Historical-era expansions

Elcano can later expand beyond the Age of Sail’s Iberian expeditions without losing its core identity: each era should add ships and campaign contexts that make wind, currents, geography and route planning feel different, not merely reskin the same voyage.

- [x] **Viking / Norse expansion** — represented by the Road to Vinland campaign. A future dedicated drakkar ship preset can deepen the distinction.
- [x] **Greek and Roman expansion** — represented by the Classical Mediterranean campaign. Future merchant and warship-inspired ship presets can deepen the distinction.
- Future eras should earn new hull/rig performance profiles, environmental contexts and navigation decisions. Do not add combat, empire management or generic historical reskins merely because a period is available.

## 6. Coastal navigation phase 2

Build on coastline collision, anchoring and manual waypoint routes without adding automatic coast-hugging.

- [x] Prevent normal sailing across land / stop the ship when grounded.
- [x] Add contextual anchoring in coastal water.
- [x] Add manual waypoint route planning and automatic helm following while keeping sails manual.
- [x] Add a direct-destination mode to the same map control: one map tap sets a single autopilot target, and each later tap replaces the previous target. Toggle the control into waypoint mode to append multiple route points instead.
- Allow editing individual waypoints.
- Allow inserting/removing route points without clearing the full route.
- Show route-leg distance and bearing.
- Define a clear waypoint-arrival radius and route completion state.

### Strait of Magellan local navigation

Make the campaign's most constrained historical passage feel distinct from open-ocean sailing.

- [x] Add deterministic tidal currents and channel jets.
- [x] Model wind funneling through narrow channels and more sheltered anchorages.
- [x] Make favorable passage windows possible through waiting, observation and route choice.
- Keep this local system separate from the global weather/current layers and avoid adding damage, waves or opaque randomness.

## 7. Weather windows and route timing

Build on moving deterministic weather systems so anchoring and time acceleration become meaningful route decisions.

- Add a small, readable forecast for conditions the player has already discovered: local wind/current trend and nearby known storm movement over a limited future window.
- Do not reveal undiscovered weather systems or create a perfect global forecast.
- Make it clear when waiting at anchor could produce a better departure window than forcing an unfavorable passage.
- Preserve deterministic results so forecasts, replays and tests remain reproducible.

## 8. Named ocean-current corridors

Make major currents legible as routes a player can deliberately find and exploit.

- [x] Identify the Gulf Stream, Brazil Current, Kuroshio, Agulhas Current and East Australian Current as persistent current corridors.
- Add compact map labels or chart cues at useful zoom levels; preserve fog-of-war so they are learned through exploration.
- Keep the corridors compatible with the existing regional environment data and dynamic-weather influence.

## 9. Nautical chart scale

Add light-touch map aids without turning the game into a dense instrument panel.

- Add a zoom-aware nautical-mile scale bar.
- Optionally add sparse compass/cardinal ticks at useful zoom levels.
- Keep distance/bearing measurement and dead reckoning for the later historical-uncertainty direction, not the current arcade-readable mode.

## 10. Expedition resources, crew, and vessel condition

Only introduce this as a deliberate later expansion of Elcano beyond the navigation-first game. It should add meaningful expedition choices without becoming a dense survival, combat, or management game.

### Provisions and armament

- Track a compact set of expedition resources: **food**, **weapons/ammunition**, and **gold**. Do not add freshwater unless a later voyage design makes it necessary.
- Before a mission, let the player choose a limited crew complement of sailors and soldiers. The choice should have readable trade-offs: sailors improve sailing capability and recovery, while soldiers provide security for specifically designed encounters.
- Use gold to pay sailors and soldiers, fund repairs and provisions, and resolve some encounter choices. Unpaid crew should affect morale gradually and visibly rather than fail the expedition without warning.
- Let successful fishing, trading, resupply, or other contextual encounters replenish food; do not make resource collection a repetitive grind.
- Let selected encounters offer gold gains, costs, or trade-offs, while avoiding a broad buy-low/sell-high trading economy.
- Make shortages affect morale and expedition options rather than instantly causing opaque failure states.

### Ship and mast integrity

- Give the hull a small, readable integrity track of roughly three to six points.
- Give each mast its own one- or two-point integrity track.
- Severe storms, grounding, and other clearly signalled hazards can cause damage. Mast damage should reduce the associated sail plan/performance; hull damage should make continued voyaging riskier.
- Provide limited, legible repair and mitigation options at safe anchorages or through crew/resources. Damage must be deterministic or explicitly seed-driven for reproducible voyages.
- Keep the system connected to real sailing decisions—seeking shelter, waiting for a weather window, and choosing a route—not as random attrition.

### Morale, incidents, and coastal encounters

- Add a small morale state driven by food, damage, weather exposure, progress, and major decisions. Low morale can create warnings, refusals, and eventually a mutiny situation; it should not produce arbitrary surprise game-overs.
- Add authored or seeded voyage situations: fishing sightings, found supplies, distress signals, damaged rigging, illness, storms, and other navigational decisions with clear choices and consequences.
- At coasts, support historically grounded encounters with local inhabitants that can lead to observation, diplomacy, trade, resupply, retreat, or—only where the mission context supports it—conflict using the selected soldiers and weapons.
- Do not portray Indigenous people as generic random attackers. Encounters should have named/contextual framing and avoid making violence the default or rewarding response.
- Keep combat abstract, brief, and consequence-focused if it is included at all; Elcano remains a sailing-navigation game rather than a combat game.

## 11. Near-term implementation order

1. Campaign progress, logbook and persistent chart knowledge.
2. Weather windows and route timing.
3. Strait of Magellan local navigation.
4. Named ocean-current corridors.
5. Nautical chart scale.
6. Continue hardening global environment tiling and caching for long voyages.
7. [x] Add deterministic day-to-day wind variation; current variability remains a separate future decision.

## Scope rule

Do not add dense crew management, survival simulation, trading economies, RPG progression, detailed damage systems, politics, or combat systems as a default direction. The later expedition layer above is an explicit, deliberately lightweight exception if the project chooses to broaden in that direction.

The intended game remains primarily about **real-world sailing navigation, winds, currents, ship/rig choice, and historical voyages**.
