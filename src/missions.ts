import type { WorldState } from './simulation';

export type Mission = {
  id: string;
  number: number;
  title: string;
  from: string;
  to: string;
  date: string;
  startDateIso: string;
  start: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  headingDeg: number;
  briefing: string;
  completion: string;
  historicalNote: string;
  tutorialSteps?: { title: string; text: string }[];
};

export type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  missions: Mission[];
};

const tutorialMission: Mission = {
  id: 'tutorial-0',
  number: 0,
  title: 'Road to the expedition',
  from: 'San Sebastián',
  to: 'A Coruña',
  date: 'July 1525',
  startDateIso: '1525-07-01T12:00:00Z',
  start: { lat: 43.3183, lon: -1.9812 },
  destination: { lat: 43.3623, lon: -8.4115 },
  headingDeg: 285,
  briefing: 'Sail from San Sebastián to A Coruña and learn to read wind, current, heading and track before joining the historical expedition.',
  completion: 'A Coruña reached. The Loaísa–Elcano fleet is ready to depart for the Moluccas.',
  historicalNote: 'This San Sebastián → A Coruña voyage is a playable tutorial prelude, not a documented leg of the historical expedition. The Loaísa fleet departed A Coruña on 24 July 1525.',
  tutorialSteps: [
    { title: '0.1 Read the Bay of Biscay', text: 'Depart San Sebastián and study the northern Spanish coastline. White arrows show prevailing wind; blue arrows show surface current. A Coruña is your destination on the Galician coast.' },
    { title: '0.2 Make way west', text: 'Set sail and work west across the Bay of Biscay. Do not simply point at A Coruña: compare heading with wind, current and actual track.' },
    { title: '0.3 Approach Galicia', text: 'As you close the Galician coast, adjust your route for the final approach to A Coruña, where the Loaísa–Elcano fleet departed for the Moluccas on 24 July 1525.' },
  ],
};

// Playable checkpoints divide the three-year expedition; each historical note identifies abstractions.
const magellanElcanoMissions: Mission[] = [
  ['magellan-1',1,'Out of Sanlúcar','Sanlúcar de Barrameda','Tenerife','20–26 September 1519','1519-09-20T12:00:00Z',[36.7783,-6.3515],[28.2916,-16.6291],220,'Lead the five ships southwest from Sanlúcar to Tenerife. Provision before committing to the Atlantic.','Tenerife reached. The fleet can now turn south and west.','The fleet entered the Atlantic from Sanlúcar on 20 September 1519 and stopped at Tenerife on 26 September for supplies.'],
  ['magellan-2',2,'Across to Brazil','Tenerife','Rio de Janeiro','3 October – 13 December 1519','1519-10-03T12:00:00Z',[28.2916,-16.6291],[-22.9068,-43.1729],230,'Use the Atlantic winds for the long southwest crossing to the Brazilian coast.','Rio de Janeiro reached. Begin the southern search for a passage.','After leaving the Canaries on 3 October, the fleet reached Rio de Janeiro in December 1519.'],
  ['magellan-3',3,'South to San Julián','Rio de Janeiro','Puerto San Julián','December 1519 – March 1520','1519-12-27T12:00:00Z',[-22.9068,-43.1729],[-49.306,-67.728],205,'Follow the coast south through increasingly cold waters to the Patagonian winter harbour.','Puerto San Julián reached. Prepare the fleet.','The expedition wintered at Puerto San Julián from late March to August 1520; this leg condenses its southern coastal run.'],
  ['magellan-4',4,'Santa Cruz','Puerto San Julián','Río Santa Cruz','August – October 1520','1520-08-24T12:00:00Z',[-49.306,-67.728],[-50.02,-68.53],195,'Continue south after winter, reading the coast and avoiding shoaling water.','Río Santa Cruz reached. Cape Virgenes is next.','Río Santa Cruz is used as a playable coastal checkpoint after the fleet resumed its search south.'],
  ['magellan-5',5,'Cape Virgenes','Río Santa Cruz','Cape Virgenes','October 1520','1520-10-18T12:00:00Z',[-50.02,-68.53],[-52.33,-68.35],160,'Push south to the eastern landmark of the long-sought passage.','Cape Virgenes reached. The strait opens westward.','On 21 October 1520 the fleet sighted the cape it named Cape Virgenes and identified the strait beyond it.'],
  ['magellan-6',6,'The Strait to the Pacific','Cape Virgenes','Cape Pillar','October – 28 November 1520','1520-10-21T12:00:00Z',[-52.33,-68.35],[-52.72,-74.67],255,'Use manoeuvring mode, anchoring and favourable tide windows to take the confined channel west.','Cape Pillar reached. You have entered the Pacific.','The expedition entered the strait in late October and reached the Pacific on 28 November 1520; San Antonio deserted during the passage.'],
  ['magellan-7',7,'Into the Great Ocean','Cape Pillar','Pacific crossing checkpoint','28 November 1520 – January 1521','1520-11-28T12:00:00Z',[-52.72,-74.67],[-20,-130],300,'Leave the American coast and find a west-northwest course across a far larger ocean than expected.','The open Pacific is behind you. Keep west for the Marianas.','This is a gameplay checkpoint, not a documented landfall; the expedition crossed the Pacific without reaching easier resupply islands.'],
  ['magellan-8',8,'The Marianas','Pacific crossing checkpoint','Guam','January – 6 March 1521','1521-01-15T12:00:00Z',[-20,-130],[13.4443,144.7937],290,'Complete the immense crossing; the world wraps, so choose the westbound route to Guam.','Guam reached. Fresh land and water lie ahead.','After about three months at sea, the fleet reached Guam on 6 March 1521.'],
  ['magellan-9',9,'Landfall at Homonhon','Guam','Homonhon','9–16 March 1521','1521-03-09T12:00:00Z',[13.4443,144.7937],[10.743,125.722],245,'Turn southwest from the Marianas for the first Philippine landfall.','Homonhon reached. The expedition has reached the Philippine archipelago.','The fleet reached Homonhon on 16 March 1521.'],
  ['magellan-10',10,'To Cebu','Homonhon','Cebu','March – 7 April 1521','1521-03-16T12:00:00Z',[10.743,125.722],[10.3157,123.8854],280,'Navigate through the Philippine islands to Cebu, keeping the ship under control in confined waters.','Cebu reached. The expedition pauses before its leadership changes.','Magellan reached Cebu on 7 April 1521. He died at nearby Mactan on 27 April; that battle is not a sailing objective.'],
  ['magellan-11',11,'South to Bohol','Cebu','Bohol','May 1521','1521-05-02T12:00:00Z',[10.3157,123.8854],[9.85,124.14],145,'After Magellan’s death, take the remaining ships toward Bohol.','Bohol reached. Continue for the Spice Islands.','The surviving expedition left Cebu in May and burned Concepción at Bohol after deciding it could no longer be crewed.'],
  ['magellan-12',12,'The Moluccas','Bohol','Tidore','May – 8 November 1521','1521-05-03T12:00:00Z',[9.85,124.14],[0.683,127.4],165,'Sail south and east through island waters to Tidore, the Spice Islands destination.','Tidore reached. The expedition has reached the Moluccas.','Victoria and Trinidad reached Tidore on 8 November 1521, with Juan Sebastián Elcano among the surviving officers.'],
  ['magellan-13',13,'Elcano’s Homeward Course','Tidore','Timor','December 1521 – January 1522','1521-12-21T12:00:00Z',[0.683,127.4],[-10.17,123.61],220,'Command Victoria southwest from Tidore to Timor, beginning the return through Portuguese waters.','Timor reached. The Indian Ocean crossing begins.','Elcano sailed Victoria from Tidore on 21 December 1521 and stopped at Timor before crossing the Indian Ocean.'],
  ['magellan-14',14,'Round the Cape','Timor','Cape of Good Hope','January – 6 May 1522','1522-01-25T12:00:00Z',[-10.17,123.61],[-34.3568,18.474],245,'Cross the Indian Ocean and round the Cape of Good Hope on the hazardous western route home.','The Cape is rounded. Turn north into the Atlantic.','Victoria rounded the Cape of Good Hope on 6 May 1522. This is a continuous ocean-crossing gameplay leg.'],
  ['magellan-15',15,'Cape Verde','Cape of Good Hope','Cape Verde','May – 9 July 1522','1522-05-06T12:00:00Z',[-34.3568,18.474],[16,-24],330,'Follow the west African coast north to Cape Verde for the final Atlantic approach.','Cape Verde reached. Spain is within reach.','Victoria called at Portuguese Cape Verde for provisions in July 1522; several crew members were detained there.'],
  ['magellan-16',16,'The First Circumnavigation','Cape Verde','Sanlúcar de Barrameda','July – 6 September 1522','1522-07-10T12:00:00Z',[16,-24],[36.7783,-6.3515],35,'Bring Victoria northeast across the final Atlantic leg and complete the voyage home.','Sanlúcar reached. Victoria has completed the first circumnavigation.','Victoria returned to Sanlúcar on 6 September 1522 under Juan Sebastián Elcano, completing the first circumnavigation.'],
].map(([id, number, title, from, to, date, startDateIso, start, destination, headingDeg, briefing, completion, historicalNote]) => ({
  id: id as string, number: number as number, title: title as string, from: from as string, to: to as string, date: date as string, startDateIso: startDateIso as string,
  start: { lat: (start as number[])[0], lon: (start as number[])[1] }, destination: { lat: (destination as number[])[0], lon: (destination as number[])[1] },
  headingDeg: headingDeg as number, briefing: briefing as string, completion: completion as string, historicalNote: historicalNote as string,
}));

const loaísaMissions: Mission[] = [
  {
    id: 'loaisa-1', number: 1, title: 'Departure for La Gomera', from: 'A Coruña', to: 'La Gomera', date: '24 July – 1 August 1525', startDateIso: '1525-07-24T12:00:00Z',
    start: { lat: 43.3623, lon: -8.4115 }, destination: { lat: 28.0916, lon: -17.1133 }, headingDeg: 210,
    briefing: 'Take the seven-ship expedition southwest from A Coruña to La Gomera, the fleet’s first documented stop.',
    completion: 'La Gomera reached. Reprovision before the long descent into the tropical Atlantic.',
    historicalNote: 'The fleet left A Coruña on 24 July 1525 and reached La Gomera on 1 August, remaining there until 14 August to replenish water, food and stores.',
  },
  {
    id: 'loaisa-2', number: 2, title: 'South to San Mateo', from: 'La Gomera', to: 'Annobón / San Mateo', date: '14 August – 15 October 1525', startDateIso: '1525-08-14T12:00:00Z',
    start: { lat: 28.0916, lon: -17.1133 }, destination: { lat: -1.434, lon: 5.632 }, headingDeg: 170,
    briefing: 'Sail south along the eastern Atlantic, past the latitude of Sierra Leone, to the island then called San Mateo, now Annobón.',
    completion: 'San Mateo reached. Repair and reprovision before turning west for South America.',
    historicalNote: 'The expedition reached the island of San Mateo, modern Annobón, on 15 October 1525 and used the stop for food and repairs.',
  },
  {
    id: 'loaisa-3', number: 3, title: 'Atlantic crossing', from: 'Annobón / San Mateo', to: 'Cape Frio region', date: 'October – December 1525', startDateIso: '1525-10-20T12:00:00Z',
    start: { lat: -1.434, lon: 5.632 }, destination: { lat: -22.98, lon: -42.02 }, headingDeg: 235,
    briefing: 'Turn west across the South Atlantic and make the Brazilian coast near the Cape Frio region.',
    completion: 'South America is in sight. Begin the long coastal run toward Patagonia.',
    historicalNote: 'The fleet sighted the American coast in December 1525 and then began coasting south. Cape Frio is used here as a practical geographic anchor for that documented Brazilian landfall region.',
  },
  {
    id: 'loaisa-4', number: 4, title: 'Down to Santa Cruz', from: 'Cape Frio region', to: 'Río Santa Cruz', date: 'December 1525 – 12 January 1526', startDateIso: '1525-12-10T12:00:00Z',
    start: { lat: -22.98, lon: -42.02 }, destination: { lat: -50.02, lon: -68.53 }, headingDeg: 205,
    briefing: 'Follow the South American coast deep into Patagonia and reach the Río Santa Cruz rendezvous area.',
    completion: 'Río Santa Cruz reached. The approach to Magellan’s Strait begins.',
    historicalNote: 'Five ships reached the Río Santa Cruz on 12 January 1526 while the capitana and San Gabriel were still separated from them.',
  },
  {
    id: 'loaisa-5', number: 5, title: 'The false entrance', from: 'Río Santa Cruz', to: 'Río Gallegos', date: 'January 1526', startDateIso: '1526-01-12T12:00:00Z',
    start: { lat: -50.02, lon: -68.53 }, destination: { lat: -51.62, lon: -69.22 }, headingDeg: 185,
    briefing: 'Continue south and identify the opening the fleet initially mistook for the Strait of Magellan.',
    completion: 'Río Gallegos reached. This is not the strait—work farther south toward Cape Virgenes.',
    historicalNote: 'The expedition first entered the mouth of the Río Gallegos by mistake, grounding ships there before the rising tide freed them.',
  },
  {
    id: 'loaisa-6', number: 6, title: 'Cape Virgenes', from: 'Río Gallegos', to: 'Cape Virgenes', date: 'January 1526', startDateIso: '1526-01-14T12:00:00Z',
    start: { lat: -51.62, lon: -69.22 }, destination: { lat: -52.33, lon: -68.35 }, headingDeg: 155,
    briefing: 'Round the Patagonian coast to Cape Virgenes and find the true eastern entrance of Magellan’s Strait.',
    completion: 'Cape Virgenes reached. The dangerous strait passage lies ahead.',
    historicalNote: 'At Cape Virgenes violent southwesterly weather drove ships onto the coast. Elcano’s Sancti Spiritus was wrecked during the attempt.',
  },
  {
    id: 'loaisa-7', number: 7, title: 'Through Magellan’s Strait', from: 'Cape Virgenes', to: 'Cape Pillar', date: 'January – 26 May 1526', startDateIso: '1526-01-20T12:00:00Z',
    start: { lat: -52.33, lon: -68.35 }, destination: { lat: -52.72, lon: -74.67 }, headingDeg: 255,
    briefing: 'Make the full westbound passage through the Strait of Magellan. Use manual waypoints and anchoring to negotiate the confined channels safely.',
    completion: 'Cape Pillar reached. The surviving expedition has finally entered the Pacific.',
    historicalNote: 'After repeated storms, repairs and losses, the surviving ships emerged from the strait at Cape Deseado, now Cape Pillar, on 26 May 1526.',
  },
  {
    id: 'loaisa-8', number: 8, title: 'The fleet scatters', from: 'Cape Pillar', to: 'Equatorial Pacific', date: '26 May – 26 June 1526', startDateIso: '1526-05-26T12:00:00Z',
    start: { lat: -52.72, lon: -74.67 }, destination: { lat: 0.0, lon: -132.0 }, headingDeg: 305,
    briefing: 'Leave South America behind and drive northwest into the Pacific. This mission ends at a gameplay checkpoint near the documented equator crossing.',
    completion: 'The equatorial Pacific has been reached. The surviving flagship continues alone westward.',
    historicalNote: 'Storms dispersed the surviving fleet after 31 May. The capitana crossed the equator on 26 June 1526. The exact longitude is represented here by a gameplay checkpoint rather than a claimed historical fix.',
  },
  {
    id: 'loaisa-9', number: 9, title: 'San Bartolomé', from: 'Equatorial Pacific', to: 'Maloelap / San Bartolomé', date: 'June – 21 August 1526', startDateIso: '1526-06-26T12:00:00Z',
    start: { lat: 0.0, lon: -132.0 }, destination: { lat: 8.77, lon: 171.03 }, headingDeg: 285,
    briefing: 'Continue the immense westward crossing to the island the expedition named San Bartolomé, in the Marshall Islands region.',
    completion: 'San Bartolomé sighted. Guam is the next major landfall.',
    historicalNote: 'The flagship sighted San Bartolomé on 21 August 1526. Modern identifications vary in older literature; Maloelap is used here as the campaign location.',
  },
  {
    id: 'loaisa-10', number: 10, title: 'The Marianas', from: 'Maloelap / San Bartolomé', to: 'Guam', date: '21 August – 5 September 1526', startDateIso: '1526-08-21T12:00:00Z',
    start: { lat: 8.77, lon: 171.03 }, destination: { lat: 13.4443, lon: 144.7937 }, headingDeg: 275,
    briefing: 'Sail west from the Marshalls to Guam, crossing the wrapped edge of the world map if needed.',
    completion: 'Guam reached. Turn southwest toward the Philippines.',
    historicalNote: 'The Santa María de la Victoria reached Guam on 5 September 1526, where the crew encountered Gonzalo de Vigo, a Spanish survivor from the earlier Magellan expedition.',
  },
  {
    id: 'loaisa-11', number: 11, title: 'Toward Mindanao', from: 'Guam', to: 'Mindanao', date: 'September 1526', startDateIso: '1526-09-05T12:00:00Z',
    start: { lat: 13.4443, lon: 144.7937 }, destination: { lat: 8.0, lon: 125.0 }, headingDeg: 250,
    briefing: 'Leave the Marianas and navigate southwest toward Mindanao and the Philippine archipelago.',
    completion: 'Mindanao reached. Continue through the island passages toward Cebu.',
    historicalNote: 'The surviving flagship continued from Guam toward Mindanao before making a series of stops in the Philippines and Celebes on the way to the Moluccas.',
  },
  {
    id: 'loaisa-12', number: 12, title: 'Across to Cebu', from: 'Mindanao', to: 'Cebu', date: 'September – October 1526', startDateIso: '1526-09-20T12:00:00Z',
    start: { lat: 8.0, lon: 125.0 }, destination: { lat: 10.3157, lon: 123.8854 }, headingDeg: 300,
    briefing: 'Navigate northwest through the Philippine islands to Cebu, one of the documented stops before the expedition turned south again.',
    completion: 'Cebu reached. The route now bends south toward the Celebes.',
    historicalNote: 'The Armada account records stops at Mindanao and Cebu before the Santa María de la Victoria proceeded toward Talao in the Celebes.',
  },
  {
    id: 'loaisa-13', number: 13, title: 'Talao in the Celebes', from: 'Cebu', to: 'Talao / Celebes', date: 'October 1526', startDateIso: '1526-10-05T12:00:00Z',
    start: { lat: 10.3157, lon: 123.8854 }, destination: { lat: 2.75, lon: 125.37 }, headingDeg: 165,
    briefing: 'Sail south from Cebu toward Talao in the Celebes and find fresh provisions after the Pacific crossing.',
    completion: 'Talao reached. The Moluccas are now only a short regional passage away.',
    historicalNote: 'The expedition reached Talao in the Celebes on 22 October 1526 and obtained badly needed fresh food from the local ruler.',
  },
  {
    id: 'loaisa-14', number: 14, title: 'Sight Gilolo', from: 'Talao / Celebes', to: 'Gilolo / Halmahera', date: '22 – 29 October 1526', startDateIso: '1526-10-22T12:00:00Z',
    start: { lat: 2.75, lon: 125.37 }, destination: { lat: 1.2, lon: 127.9 }, headingDeg: 125,
    briefing: 'Make the short but island-dense passage east toward Gilolo, modern Halmahera.',
    completion: 'Gilolo sighted. Find a safe anchorage at Zamaso.',
    historicalNote: 'The crew sighted Gilolo on 29 October 1526 but calm conditions delayed the final approach.',
  },
  {
    id: 'loaisa-15', number: 15, title: 'Anchor at Zamaso', from: 'Gilolo / Halmahera', to: 'Zamaso', date: '29 October – 1 November 1526', startDateIso: '1526-10-29T12:00:00Z',
    start: { lat: 1.2, lon: 127.9 }, destination: { lat: 1.05, lon: 127.65 }, headingDeg: 235,
    briefing: 'Work along Halmahera and enter the anchorage at Zamaso, completing the ocean voyage from Spain to the Moluccas.',
    completion: 'Zamaso reached. After more than fifteen months, the surviving expedition has reached the Moluccas.',
    historicalNote: 'The Santa María de la Victoria anchored at Zamaso on 1 November 1526. Only one of the original seven ships had completed the full passage.',
  },
  {
    id: 'loaisa-16', number: 16, title: 'To Tidore', from: 'Zamaso', to: 'Tidore', date: 'November 1526 – January 1527', startDateIso: '1526-11-05T12:00:00Z',
    start: { lat: 1.05, lon: 127.65 }, destination: { lat: 0.683, lon: 127.4 }, headingDeg: 205,
    briefing: 'Complete the campaign with the regional passage from Halmahera to Tidore, where the Spanish expedition establishes its base amid Portuguese opposition.',
    completion: 'Tidore reached. The sailing campaign is complete.',
    historicalNote: 'After arrival in the Moluccas, the surviving expedition eventually sailed to Tidore and established a fortified position there in early 1527. This final mission represents that last maritime movement rather than the subsequent years of fighting.',
  },
];

export const campaigns: Campaign[] = [
  {
    id: 'tutorial',
    title: 'Tutorial',
    subtitle: 'Mission 0',
    description: 'A short playable prelude from San Sebastián to A Coruña that teaches the sailing controls before the historical expedition begins.',
    missions: [tutorialMission],
  },
  {
    id: 'magellan-elcano',
    title: 'Magellan–Elcano Circumnavigation',
    subtitle: 'First circumnavigation · 1519–1522',
    description: 'Sail the first circumnavigation from Sanlúcar through the Atlantic, Magellan’s Strait, the Pacific, the Philippines, the Moluccas, the Indian Ocean and back to Spain under Elcano.',
    missions: magellanElcanoMissions,
  },
  {
    id: 'loaisa-elcano',
    title: 'Loaísa–Elcano Expedition',
    subtitle: 'To the Moluccas · 1525–1527',
    description: 'Follow the documented westbound route from A Coruña through La Gomera, Annobón, Patagonia, Magellan’s Strait, the Pacific, the Philippines and the Moluccas one sailing leg at a time.',
    missions: loaísaMissions,
  },
];

export const allMissions = campaigns.flatMap((campaign) => campaign.missions);

export function missionFromUrl(): Mission {
  const selected = new URLSearchParams(window.location.search).get('mission');
  return allMissions.find((mission) => mission.id === selected) ?? tutorialMission;
}

export function campaignForMission(mission: Mission): Campaign {
  return campaigns.find((campaign) => campaign.missions.some((candidate) => candidate.id === mission.id)) ?? campaigns[0];
}

export function worldStateForMission(mission: Mission): WorldState {
  return {
    time: new Date(mission.startDateIso),
    elapsedHours: 0,
    ship: { position: { ...mission.start }, headingDeg: mission.headingDeg, speed: 0 },
    destination: { ...mission.destination },
  };
}
