# Seas, Winds, Currents & Weather

This is Elcano's gameplay reference for the world's major sailing regions. It distinguishes real climatological patterns from the deliberately readable, deterministic weather model used by the game.

## How to read this document

- **Prevailing winds and currents** come from monthly modern reference fields: CCMP V2 10 m winds and OSCAR surface currents (with a high-resolution Bay of Biscay wind/current field). They represent plausible modern climatology for a mission month, not literal weather in the 1500s.
- Wind arrows in Elcano show where air travels **toward**. They are not meteorological “wind from” bearings.
- **Ordinary day-to-day wind** is a deterministic synoptic variation around the monthly prevailing field. It is spatially coherent, evolves smoothly over multiple days and differs by wind regime instead of rerolling independent random values.
- **Storm systems** are procedural gameplay systems. Their locations, intensity and movement are deterministic from simulation time, so a given voyage remains reproducible.
- The simplified systems below represent ordinary synoptic variability plus the large-scale storm belts and tropical-cyclone seasons. They are not a weather forecast and do not simulate fronts, pressure gradients, tides, waves, or land effects yet.

## Environmental composition

```text
varied background wind = monthly prevailing wind × day-scale speed factor, rotated by a day-scale direction shift
local wind            = varied background wind + weather-system wind
local current         = monthly background current + small weather-driven deflection
```

The ordinary variation layer changes only the prevailing wind. Storms are added afterwards, so ordinary variability cannot weaken the storm model itself. Storm current influence remains only 0.8% of the local rotating storm-wind contribution, preserving major ocean-current structure.

## Ordinary day-to-day wind variation

The monthly wind field describes the prevailing climate, not identical weather every day. Elcano therefore applies a deterministic ordinary-weather layer before explicit storms:

- the field is generated from simulation position and time, so replaying the same place at the same simulated time gives the same wind;
- broad patches are about 18° across north/south — roughly 1,000 nautical miles — and neighbouring waters are blended together;
- successive deterministic states are three days apart and smoothly interpolated, so there is no midnight reset or daily dice roll;
- speed multipliers are centred on **1.0×** and direction changes on **0°**, preserving the monthly climatology as the long-term centre;
- regime boundaries are feathered rather than hard-edged, so crossing a latitude or longitude does not create an artificial wind discontinuity;
- this layer represents ordinary calms, freshening and directional shifts. Major gale/storm extremes remain the job of the explicit weather-system layer.

| Wind regime | Approximate ordinary speed range | Approximate direction range | Gameplay character |
|---|---:|---:|---|
| Doldrums / ITCZ | about **0.30–1.70×** prevailing speed | up to about **±55°** | Fickle and often light; meaningful calms can appear without a storm. |
| Trade winds | about **0.75–1.25×** | up to about **±12°** | Comparatively dependable, preserving their value as historical route corridors. |
| Mid-latitude westerlies | about **0.55–1.45×** | up to about **±32°** | Changeable ordinary weather, but dramatic storm-strength events still require explicit systems. |
| Monsoon-dominated waters | about **0.65–1.35×** | up to about **±22°** | The monthly climatology supplies the seasonal reversal; this layer adds shorter-lived variability around it. |
| Southern Ocean westerlies | about **0.65–1.35×** | up to about **±20°** | Strong baseline with moderate ordinary variability; large extremes come from the dense Southern Ocean storm tracks. |

The quoted ranges are maximum profile envelopes. Spatial and temporal interpolation means typical changes are smaller and evolve gradually. The profiles blend between regimes: for example, the trades fade into the westerlies across the subtropics instead of changing abruptly at a single latitude.

## Global circulation at a glance

| Latitude | Typical wind belt | Navigation character |
|---|---|---|
| 0–5° | Intertropical convergence zone / doldrums | Variable and often light winds; avoid assuming dependable progress. |
| 5–30°N | Northeast trades | Broadly toward the southwest/west. |
| 30–60°N | Westerlies | Broadly toward the east; North Atlantic and North Pacific lows travel here. |
| 5–30°S | Southeast trades | Broadly toward the northwest/west. |
| 30–60°S | Roaring Forties / Southern Ocean westerlies | Strong eastbound flow and the game's stormiest major belt. |

## Basin profiles

| Region | Prevailing wind/current character | Dynamic systems in Elcano |
|---|---|---|
| North Atlantic | Trades in the subtropics; westerlies north of them. North Atlantic gyre, Gulf Stream/North Atlantic Drift and Canary Current shape currents. | One smaller, weaker, poleward summer low; 2–3 larger and stronger winter lows on the western-to-northeastern Atlantic track. |
| South Atlantic | Southeast trades north of the subtropical high; strong westerlies toward Patagonia. Brazil, Benguela and South Atlantic currents form the gyre. | A broad eastbound westerly track: typically 1–2 lows in austral summer and three larger, stronger lows in austral winter. Tropical cyclones are not generated here. |
| North Pacific | Trades in the subtropics; vigorous westerly storm track farther north. Kuroshio, North Pacific Drift and California Current shape the gyre. | A dense western winter track plus a weaker eastern branch; about two low systems in summer and four in northern winter, plus a year-round western-Pacific typhoon track that peaks July–October. |
| East Pacific | Northeast trades and the California Current in the north; tropical eastward/westward variations near Central America. | Compact tropical systems only June–November; activity, size, strength, and overlap peak August–October. |
| North Indian Ocean | Monsoon reversal is important: southwest monsoon in boreal summer and northeast monsoon in winter. Currents reverse with it. | Compact tropical systems only in the pre- and post-monsoon windows: April–May and October–December, with the strongest overlap in May and October–November. |
| Southwest Indian Ocean | Southeast trades and subtropical gyre; Agulhas Current is the dominant southwest-bound boundary current near Africa. | Compact tropical cyclones November–April, strongest and most frequent in January–March, moving broadly west/southwest. |
| Australian / Southeast Indian | Trade-wind and monsoonal region north of Australia; Leeuwin and broader subtropical circulation affect surface flow. | Compact tropical cyclones November–April, strongest and most frequent in January–March. |
| South Pacific | Southeast trades and South Pacific gyre; stronger westerlies south of about 30°S. | Compact southwest-Pacific tropical cyclones November–April, strongest and most frequent in January–March. |
| Southern Ocean | Persistent, fast eastward westerlies and the Antarctic Circumpolar Current. | The most persistent and severe belt: two fast, large low tracks in austral summer and six in austral winter, with the highest gale/severe-storm share. |

### Storm profile quick reference

| Sea / basin | Short gameplay identity |
|---|---|
| North Atlantic | Quiet, weaker summer track; strong and crowded winter lows. |
| South Atlantic | Broad westerly lows, especially powerful in austral winter. |
| North Pacific | Strong western winter track with a weaker eastern branch. |
| East Pacific | Summer-to-autumn tropical cyclones, peaking late in the season. |
| North Indian Ocean | Compact pre- and post-monsoon cyclones. |
| Southwest Indian Ocean | November–April cyclones, strongest in January–March. |
| Australian waters | November–April tropical cyclones, strongest in January–March. |
| South Pacific | Southwest-Pacific tropical cyclones during the southern summer. |
| Southern Ocean | Fast, large, persistent, and the most severe storm belt. |

## Storm model

Every generated system is a low-pressure circulation:

- counter-clockwise north of the Equator and clockwise south of it;
- visibly marked as 🌩️ only when its centre is in discovered water;
- calm at the centre;
- gradually stronger from the centre to a broad peak-wind ring at 70% of its radius;
- sharply weaker between that ring and the outer edge;
- moving through its basin on a deterministic track, usually about 10–13 kn eastward for mid-latitude lows.

Every procedural system still follows the same readable lifecycle: its wind contribution rises from zero, peaks halfway through, then fades to zero. The profiles intentionally differ by basin: lifetime, birth cadence, size, movement, intensity distribution, and seasonal activation are all defined per track. This produces handover overlap rather than abrupt replacement without treating every ocean as the same storm belt.

### Intensity classes

| Class | Added wind at the peak ring | Meaning in the game |
|---|---:|---|
| Ordinary low | 10–18 kn | Bends, reinforces, or locally cancels prevailing wind. |
| Gale | 18–30 kn | Often dominates the local wind direction. |
| Severe storm | 30–40 kn | Overcomes the prevailing field over much of its peak ring. |

The displayed local wind is the vector sum of the background field and that rotating contribution. Consequently, one side of a storm may have dramatically strengthened winds while the opposite side can be calm or reversed.

## What is deliberately not modelled yet

- high-pressure systems and fronts;
- storm formation, dissipation and recurvature based on live atmospheric physics;
- tides, coastal jets and terrain-driven wind outside the dedicated Strait of Magellan local-navigation layer;

## Strait of Magellan local navigation

The Cape Virgenes → Cape Pillar mission uses plausible modern local navigation behaviour, not reconstructed 1526 weather. Primera Angostura has a 2–8 kn reversing spring–neap tide; Segunda Angostura has a separately phased tide up to 6 kn with a usable westbound handover. Elsewhere the unrelated global current is suppressed: Paso Tortuoso alone adds a crossing-current hazard up to 3.5 kn, while Cabo Pilar has a small southeastward ocean set. Regional westerly/NW wind is channelled along local reaches; Paso Tortuoso adds deterministic signalled gust periods.
- waves, swell, rain, visibility or ship damage;
- historical uncertainty: discovered water currently shows the live simulated field rather than a stale observation.

These omissions are intentional. Elcano currently prioritizes legible route decisions and a deterministic, static-first sailing simulation.
