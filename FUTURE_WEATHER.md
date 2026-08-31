# Future Weather & Current Systems

Keep these additions deterministic, data-driven and separate from rendering/UI.

Implemented foundation: ordinary background wind already varies deterministically through advecting synoptic anomalies. Broad primary/secondary fields provide the navigation-scale pattern, while a weaker faster ~350 nm component prevents tropical trade and monsoon regions from appearing static over multi-day voyages. The combined variation remains centred on monthly climatology and leaves major extremes to explicit storms.

1. **Storm lifecycle and seasonal activity** — all current basin tracks now form, intensify, peak, weaken and dissipate with overlapping deterministic systems. Their count, size, cadence, and intensity mix now vary by basin and season. Later, add formation/dissipation areas and recurvature rather than fixed tracks.
2. **Indian Ocean monsoon** — seasonal reversal of prevailing wind and major surface currents, including the Somali Current.
3. **Southern Ocean / Cape Horn belt** — make the Antarctic Circumpolar Current an explicit, persistent eastbound force alongside fast mid-latitude lows.
4. **Strait of Magellan local water** — tidal currents, channel jets, wind funneling and sheltered anchoring windows.
5. **Named current corridors** — playable Gulf Stream, Kuroshio, Agulhas, Brazil and East Australian Current corridors.
6. [x] **Weather fronts** — extratropical lows now carry deterministic warm and cold frontal bands aligned to their track. Cold fronts extend about 1.7–2.2× the parent radius and warm fronts about 1.25–1.65×, with weaker frontal wind-shift influence continuing outside the circular low. Tropical cyclones retain the simpler circular model. Later work may add occlusion, front age, and more explicit front visualization.
7. **Pacific climate modes** — later El Niño / La Niña voyage-scale changes to Pacific winds and currents.

Do not add waves, rain, visibility, damage, live weather, or opaque randomness before these navigation systems are clear and fun.
