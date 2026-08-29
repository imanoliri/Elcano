# Seas, Winds, Currents & Weather

This is Elcano's gameplay reference for the world's major sailing regions. It distinguishes real climatological patterns from the deliberately readable, deterministic weather model used by the game.

## How to read this document

- **Prevailing winds and currents** come from monthly modern reference fields: CCMP V2 10 m winds and OSCAR surface currents (with a high-resolution Bay of Biscay wind/current field). They represent plausible modern climatology for a mission month, not literal weather in the 1500s.
- Wind arrows in Elcano show where air travels **toward**. They are not meteorological “wind from” bearings.
- **Storm systems** are procedural gameplay systems. Their locations, intensity and movement are deterministic from simulation time, so a given voyage remains reproducible.
- The simplified systems below represent the large-scale storm belts and tropical-cyclone seasons. They are not a weather forecast and do not simulate fronts, pressure gradients, tides, waves, or land effects yet.

## Environmental composition

```text
local wind    = monthly prevailing wind + weather-system wind
local current = monthly background current + small weather-driven deflection
```

Storms principally alter wind. Their current effect is only 0.8% of their local rotating wind contribution, preserving major ocean-current structure.

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
- tides, coastal jets and terrain-driven wind;
- waves, swell, rain, visibility or ship damage;
- historical uncertainty: discovered water currently shows the live simulated field rather than a stale observation.

These omissions are intentional. Elcano currently prioritizes legible route decisions and a deterministic, static-first sailing simulation.
