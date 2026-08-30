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
  /** Enables the dedicated tidal chart and sheltered anchorages for Magellan's Strait. */
  isStraitPassage?: boolean;
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
  completion: 'A Coruña reached. Your whaling voyage can now provision for the North Atlantic.',
  historicalNote: 'This San Sebastián → A Coruña voyage is a playable tutorial prelude, not a documented leg of one particular whaling voyage. Basque transatlantic whaling grew into a major seasonal enterprise in the sixteenth century.',
  tutorialSteps: [
    { title: '0.1 Read the Bay of Biscay', text: 'Depart San Sebastián and study the northern Spanish coastline. White arrows show prevailing wind; blue arrows show surface current. A Coruña is your destination on the Galician coast.' },
    { title: '0.2 Make way west', text: 'Set sail and work west across the Bay of Biscay. Do not simply point at A Coruña: compare heading with wind, current and actual track.' },
    { title: '0.3 Approach Galicia', text: 'As you close the Galician coast, adjust your route for the final approach to A Coruña. It is your last familiar port before the tutorial campaign opens into the North Atlantic.' },
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
})).map((mission) => mission.id === 'magellan-6' ? { ...mission, isStraitPassage: true } : mission);

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
    isStraitPassage: true,
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

type Leg = [string, string, string, string, string, [number, number], [number, number], number, string, string];

function campaignLegs(prefix: string, year: number, legs: Leg[]): Mission[] {
  return legs.map(([title, from, to, date, note, start, destination, headingDeg, briefing, completion], index) => ({
    id: `${prefix}-${index + 1}`,
    number: index + 1,
    title,
    from,
    to,
    date,
    startDateIso: `${year + Math.floor(index / 5)}-06-01T12:00:00Z`,
    start: { lat: start[0], lon: start[1] },
    destination: { lat: destination[0], lon: destination[1] },
    headingDeg,
    briefing,
    completion,
    historicalNote: note,
  }));
}

const basqueWhalingMissions: Mission[] = [
  tutorialMission,
  ...campaignLegs('whaling', 1565, [
    ['Out to the Azores', 'A Coruña', 'Horta, Azores', 'Spring 1565', 'The Azores are a useful gameplay staging point for a North Atlantic crossing, not a claim that every Basque whaling vessel called there.', [43.3623, -8.4115], [38.536, -28.63], 250, 'Leave Iberia and use the Atlantic winds to make the Azores.', 'Horta reached. The open North Atlantic lies ahead.'],
    ['The Grand Banks', 'Horta, Azores', 'Grand Banks', 'Late spring 1565', 'Basque crews had crossed to the Newfoundland fisheries from the early sixteenth century; this offshore bank is a gameplay waypoint.', [38.536, -28.63], [47.0, -52.0], 285, 'Choose a safe westbound route through changing North Atlantic weather and fog.', 'The Grand Banks reached. Work north toward the Strait of Belle Isle.'],
    ['Gran Baya', 'Grand Banks', 'Red Bay, Labrador', 'Summer 1565', 'Red Bay (Gran Baya) was a seasonal sixteenth-century Basque whaling station on the Strait of Belle Isle. This mission is a navigation scenario, not a simulation of whale hunting.', [47.0, -52.0], [51.73, -56.43], 330, 'Navigate the cold banks and approach Red Bay through fog and coastal water.', 'Red Bay reached. The summer shore station is secure.'],
    ['Homeward Atlantic', 'Red Bay, Labrador', 'Azores', 'Autumn 1565', 'The return route is presented as a plausible navigation leg using the North Atlantic’s changing winds and currents.', [51.73, -56.43], [38.536, -28.63], 100, 'Wait for a favourable window, then ride the North Atlantic westerlies east.', 'The Azores reached. Iberia is within reach.'],
    ['Back to Euskadi', 'Azores', 'San Sebastián', 'Autumn 1565', 'This final leg represents the return of a seasonal whaling voyage to the Basque coast.', [38.536, -28.63], [43.3183, -1.9812], 65, 'Finish the tutorial campaign by making a careful final approach to the Bay of Biscay.', 'San Sebastián reached. The Basque whaling tutorial campaign is complete.'],
  ]),
];

const daGamaMissions = campaignLegs('da-gama', 1497, [
  ['From Lisbon to São Tiago', 'Lisbon', 'Santiago, Cape Verde', '8 July – August 1497', 'Vasco da Gama’s fleet left Lisbon on 8 July 1497 and called at Santiago in Cape Verde.', [38.7223, -9.1393], [15.1, -23.6], 215, 'Begin the first India voyage with the familiar Atlantic run south.', 'Cape Verde reached. Commit to the open-ocean volta do mar.'],
  ['The great Atlantic arc', 'Santiago, Cape Verde', 'St Helena Bay', 'August – November 1497', 'Da Gama used a wide South Atlantic arc to exploit winds rather than coast directly south; St Helena Bay is the next documented South African stop.', [15.1, -23.6], [-32.7, 17.95], 165, 'Stand far into the South Atlantic before turning east for Africa.', 'South Africa reached. The Cape route opens.'],
  ['Round the Cape', 'St Helena Bay', 'Mossel Bay', 'November 1497', 'The fleet rounded the Cape of Good Hope in November 1497 and reached Mossel Bay later that month.', [-32.7, 17.95], [-34.18, 22.15], 110, 'Read the fierce south-western weather and round the Cape safely.', 'Mossel Bay reached. Turn north along East Africa.'],
  ['To Malindi', 'Mossel Bay', 'Malindi', 'December 1497 – April 1498', 'The voyage made several East African calls; Malindi is the key departure point for the Indian Ocean crossing.', [-34.18, 22.15], [-3.22, 40.12], 15, 'Work north along the African coast, timing winds and currents.', 'Malindi reached. The monsoon crossing is ready.'],
  ['The monsoon to Calicut', 'Malindi', 'Calicut / Kozhikode', 'April – May 1498', 'With a pilot from Malindi, the fleet reached Calicut on 20 May 1498. The crossing is central to the campaign’s monsoon lesson.', [-3.22, 40.12], [11.26, 75.78], 55, 'Use the seasonal Indian Ocean wind to cross northeast to India.', 'Calicut reached. Europe has reached India by sea.'],
  ['Return around Africa', 'Calicut / Kozhikode', 'Lisbon', '1498–1499', 'The homeward journey is compressed into one gameplay leg; da Gama returned to Portugal in 1499.', [11.26, 75.78], [38.7223, -9.1393], 285, 'Plan a long return across the monsoon system, around Africa and into the Atlantic.', 'Lisbon reached. The India voyage is complete.'],
]);

const urdanetaMissions = campaignLegs('urdaneta', 1565, [
  ['Cebu to the open Pacific', 'Cebu', 'San Bernardino Strait', '1 June 1565', 'Andrés de Urdaneta departed Cebu on 1 June 1565 seeking the eastbound return route.', [10.3157, 123.8854], [12.7, 124.1], 35, 'Leave the Philippines and find clear water for the long northeastward search.', 'San Bernardino cleared. Head north for the westerlies.'],
  ['Find the westerlies', 'San Bernardino Strait', 'North Pacific', 'June–July 1565', 'Urdaneta deliberately sailed north into the North Pacific before turning east, using the prevailing westerlies.', [12.7, 124.1], [38, 155], 35, 'Choose latitude over the short line: climb north until west winds can carry you east.', 'North Pacific westerlies reached. Turn east.'],
  ['Across to California', 'North Pacific', 'Cape Mendocino', 'July–September 1565', 'The San Pedro reached the California coast near Cape Mendocino on 18 September 1565.', [38, 155], [40.44, -124.4], 75, 'Hold an eastbound course across the world-wrapping ocean.', 'California reached. Follow the coast south.'],
  ['New Spain', 'Cape Mendocino', 'Acapulco', 'September–October 1565', 'Urdaneta’s ship arrived at Acapulco on 8 October 1565, establishing the tornaviaje used by the Manila galleons.', [40.44, -124.4], [16.85, -99.9], 130, 'Descend the American coast and finish the return route at Acapulco.', 'Acapulco reached. The tornaviaje is complete.'],
]);

const columbusMissions = campaignLegs('columbus', 1492, [
  ['Canaries departure', 'Palos de la Frontera', 'La Gomera', '3 August – 6 September 1492', 'Columbus’s fleet departed Palos in August 1492 and made its final Canarian stop at La Gomera.', [37.23, -6.89], [28.0916, -17.1133], 220, 'Provision at the Canaries before following the trade winds west.', 'La Gomera reached. The Atlantic lies open.'],
  ['West with the trades', 'La Gomera', 'Guanahani', '6 September – 12 October 1492', 'The landfall traditionally associated with Guanahani followed a westbound trade-wind crossing; its precise modern identification remains debated.', [28.0916, -17.1133], [24.1, -74.5], 270, 'Use the dependable easterly trade winds to cross west.', 'Landfall reached. The Bahamas are ahead.'],
  ['Among the islands', 'Guanahani', 'Hispaniola', 'October–December 1492', 'The expedition explored several islands before reaching Hispaniola in December.', [24.1, -74.5], [19.0, -72.3], 135, 'Navigate through island waters and make Hispaniola safely.', 'Hispaniola reached. Prepare the northward return.'],
  ['The northern return', 'Hispaniola', 'Santa Maria, Azores', 'January–February 1493', 'Columbus turned north into the North Atlantic westerlies; the Niña reached the Azores in February 1493.', [19.0, -72.3], [36.97, -25.17], 55, 'Leave the trades, find the westerlies and bring the ship east.', 'Azores reached. Iberia is close.'],
  ['Home to Palos', 'Santa Maria, Azores', 'Palos de la Frontera', 'February–March 1493', 'The Niña returned to Palos on 15 March 1493.', [36.97, -25.17], [37.23, -6.89], 75, 'Cross the final Atlantic leg and complete the first voyage.', 'Palos reached. The first Columbus campaign is complete.'],
]);

const cabralMissions = campaignLegs('cabral', 1500, [
  ['Lisbon to Cape Verde', 'Lisbon', 'Santiago, Cape Verde', 'March 1500', 'Pedro Álvares Cabral’s India fleet left Lisbon in March 1500 and passed Cape Verde.', [38.7223, -9.1393], [15.1, -23.6], 215, 'Leave Portugal with an India-bound fleet.', 'Cape Verde reached. Make the South Atlantic arc.'],
  ['Brazilian landfall', 'Santiago, Cape Verde', 'Porto Seguro', 'March–April 1500', 'Cabral made landfall on the Brazilian coast in April 1500 before continuing for India.', [15.1, -23.6], [-16.44, -39.06], 235, 'Use the broad Atlantic swing; landfall in Brazil changes the voyage.', 'Brazil reached. Recover the Cape route to India.'],
  ['The Cape recovery', 'Porto Seguro', 'Cape of Good Hope', 'May–June 1500', 'The fleet returned east across the South Atlantic and rounded southern Africa; several ships were lost in storms.', [-16.44, -39.06], [-34.36, 18.47], 135, 'Turn southeast and survive the exposed Cape waters.', 'The Cape reached. India lies beyond the monsoon.'],
  ['To Calicut', 'Cape of Good Hope', 'Calicut / Kozhikode', '1500', 'Cabral reached Calicut in September 1500 after calls on the East African coast.', [-34.36, 18.47], [11.26, 75.78], 35, 'Use the Indian Ocean’s seasonal winds for the final approach.', 'Calicut reached. The Brazil-and-India voyage is complete.'],
]);

const zhengHeMissions = campaignLegs('zheng-he', 1405, [
  ['Into Southeast Asia', 'Nanjing', 'Malacca', '1405–1406', 'Zheng He’s first voyage departed in 1405; Malacca became a key entrepôt across his voyages.', [32.06, 118.79], [2.19, 102.25], 185, 'Sail south through the South China Sea and the Malacca Strait.', 'Malacca reached. Wait for the Indian Ocean monsoon.'],
  ['Across the Bay of Bengal', 'Malacca', 'Calicut / Kozhikode', '1406', 'The treasure fleets visited Calicut, an important Indian Ocean trading port, on the first voyage.', [2.19, 102.25], [11.26, 75.78], 290, 'Cross the Bay of Bengal and approach India through seasonal winds.', 'Calicut reached. Turn west for Arabia.'],
  ['To Hormuz', 'Calicut / Kozhikode', 'Hormuz', '1413–1414', 'Hormuz was reached during the fourth voyage; this leg joins documented destinations as a playable Indian Ocean route.', [11.26, 75.78], [27.1, 56.46], 310, 'Use the monsoon to reach the Persian Gulf entrance.', 'Hormuz reached. The western Indian Ocean opens.'],
  ['East African coast', 'Hormuz', 'Malindi', '1417–1419', 'The fourth voyage reached East African ports including Malindi; exact intermediate tracks are simplified for gameplay.', [27.1, 56.46], [-3.22, 40.12], 210, 'Work southwest down the African coast under a changing monsoon.', 'Malindi reached. Begin the long return east.'],
  ['Return to China', 'Malindi', 'Nanjing', '1419–1421', 'This return is a gameplay compression of the monsoon-timed Indian Ocean and Southeast Asian route home.', [-3.22, 40.12], [32.06, 118.79], 55, 'Time the seasonal winds home through India and Southeast Asia.', 'Nanjing reached. Zheng He’s Indian Ocean campaign is complete.'],
]);

const drakeMissions = campaignLegs('drake', 1577, [
  ['South from Plymouth', 'Plymouth', 'Rio de Janeiro', '1577–1578', 'Francis Drake departed Plymouth in December 1577 and reached the South American coast in 1578.', [50.37, -4.14], [-22.91, -43.17], 205, 'Take the expedition down the Atlantic toward South America.', 'Rio reached. Patagonia is next.'],
  ['Patagonia to the Strait', 'Rio de Janeiro', 'Cape Virgenes', '1578', 'Drake wintered in Patagonia before entering the Strait of Magellan in August 1578.', [-22.91, -43.17], [-52.33, -68.35], 200, 'Follow the coast south through colder, stormier waters.', 'Cape Virgenes reached. The strait opens west.'],
  ['Drake’s Strait passage', 'Cape Virgenes', 'Cape Pillar', 'August 1578', 'Drake passed west through the Strait of Magellan in 1578; the dedicated local-tide model is a gameplay abstraction.', [-52.33, -68.35], [-52.72, -74.67], 255, 'Use the confined-water tools to make the westbound passage.', 'The Pacific reached. Severe weather lies ahead.'],
  ['The Pacific coast', 'Cape Pillar', 'California coast', '1578–1579', 'After storms scattered the fleet, Drake sailed north along the Pacific coast to a harbour commonly associated with California.', [-52.72, -74.67], [38.0, -123.0], 345, 'Work north against the Pacific weather and reach the coast.', 'California reached. Turn west into the open Pacific.'],
  ['Across and home', 'California coast', 'Plymouth', '1579–1580', 'Drake returned to Plymouth in September 1580; this mission condenses his Pacific, Indian Ocean and Atlantic return.', [38.0, -123.0], [50.37, -4.14], 255, 'Complete a long world-wrapping route home.', 'Plymouth reached. Drake’s circumnavigation is complete.'],
]).map((mission) => mission.id === 'drake-3' ? { ...mission, isStraitPassage: true } : mission);

const norseMissions = campaignLegs('norse', 1000, [
  ['Greenland departure', 'Brattahlíð, Greenland', 'Baffin Island / Helluland', 'c. 1000', 'Norse sagas describe a westward sequence of Helluland, Markland and Vinland. The route and identifications are represented cautiously as gameplay geography.', [61.2, -45.5], [63.7, -68.5], 285, 'Sail west from Greenland through cold current and fog.', 'Helluland reached. Continue south along the new coast.'],
  ['South to Markland', 'Baffin Island / Helluland', 'Labrador / Markland', 'c. 1000', 'Markland is generally associated with a forested Labrador coast, but the saga geography is not exact.', [63.7, -68.5], [54.5, -58.0], 155, 'Follow the coast south, watching for fog and ice.', 'Markland reached. The route continues toward Vinland.'],
  ['Vinland landfall', 'Labrador / Markland', 'L’Anse aux Meadows', 'c. 1000', 'Norse presence at L’Anse aux Meadows is securely attested; treating it as Vinland is a useful campaign shorthand rather than a claim to settle every saga-geography question.', [54.5, -58.0], [51.6, -55.5], 145, 'Make the final coastal landfall at the known Norse site.', 'Vinland reached. The Norse North Atlantic campaign is complete.'],
]);

const classicalMissions = campaignLegs('classical', 1, [
  ['Piraeus to Naxos', 'Piraeus', 'Naxos', 'Classical era', 'This is a fictionalized Mediterranean navigation campaign inspired by ancient Greek merchant and warship travel, not a reconstruction of one named expedition.', [37.94, 23.64], [37.1, 25.38], 100, 'Learn short open-water island navigation in an ancient Mediterranean vessel.', 'Naxos reached. Island-hop east.'],
  ['Across the Aegean', 'Naxos', 'Rhodes', 'Classical era', 'The mission uses real Aegean geography and seasonal winds as a historical-era gameplay setting.', [37.1, 25.38], [36.43, 28.22], 105, 'Read the island chain and make a careful eastbound passage.', 'Rhodes reached. The Levant lies ahead.'],
  ['To Alexandria', 'Rhodes', 'Alexandria', 'Classical era', 'Alexandria is used as a major Mediterranean destination; the campaign intentionally avoids claiming one specific voyage.', [36.43, 28.22], [31.2, 29.92], 190, 'Cross the eastern Mediterranean and approach Egypt.', 'Alexandria reached. The classical Mediterranean campaign is complete.'],
]);

export const campaigns: Campaign[] = [
  {
    id: 'basque-whaling',
    title: 'Basque Whaling',
    subtitle: 'Campaign 0 · North Atlantic tutorial',
    description: 'Begin with the San Sebastián → A Coruña sailing tutorial, then take a seasonal sixteenth-century Basque whaling voyage across the North Atlantic to Red Bay and home.',
    missions: basqueWhalingMissions,
  },
  {
    id: 'magellan-elcano',
    title: 'Magellan–Elcano Circumnavigation',
    subtitle: 'Campaign 1 · First circumnavigation · 1519–1522',
    description: 'Sail the first circumnavigation from Sanlúcar through the Atlantic, Magellan’s Strait, the Pacific, the Philippines, the Moluccas, the Indian Ocean and back to Spain under Elcano.',
    missions: magellanElcanoMissions,
  },
  {
    id: 'loaisa-elcano',
    title: 'Loaísa–Elcano Expedition',
    subtitle: 'Campaign 2 · To the Moluccas · 1525–1527',
    description: 'Follow the documented westbound route from A Coruña through La Gomera, Annobón, Patagonia, Magellan’s Strait, the Pacific, the Philippines and the Moluccas one sailing leg at a time.',
    missions: loaísaMissions,
  },
  { id: 'vasco-da-gama', title: 'Vasco da Gama: India Voyage', subtitle: 'Campaign 3 · 1497–1499', description: 'Learn the South Atlantic ocean arc, Cape weather and Indian Ocean monsoons on the first Portuguese sea route to India.', missions: daGamaMissions },
  { id: 'urdaneta', title: 'Urdaneta: The Tornaviaje', subtitle: 'Campaign 4 · 1565', description: 'Find the North Pacific westerlies and open the Manila-to-Acapulco return route.', missions: urdanetaMissions },
  { id: 'columbus', title: 'Columbus: First Voyage', subtitle: 'Campaign 5 · 1492–1493', description: 'A compact Atlantic campaign: trade winds west, the island passages, then the westerlies home.', missions: columbusMissions },
  { id: 'cabral', title: 'Cabral: Brazil and India', subtitle: 'Campaign 6 · 1500', description: 'Use the South Atlantic swing to reach Brazil, then recover the Cape route to India.', missions: cabralMissions },
  { id: 'zheng-he', title: 'Zheng He: Indian Ocean', subtitle: 'Campaign 7 · 1405–1433', description: 'Sail a monsoon-timed route from China through Southeast Asia and India to East Africa.', missions: zhengHeMissions },
  { id: 'drake', title: 'Drake’s Circumnavigation', subtitle: 'Campaign 8 · 1577–1580', description: 'A stormier northern counterpart to Magellan’s route, through the Strait and around the world.', missions: drakeMissions },
  { id: 'norse-vinland', title: 'Norse: Road to Vinland', subtitle: 'Campaign 9 · c. 1000', description: 'Sail a drakkar-style North Atlantic route from Greenland through Helluland and Markland to the known Norse site at L’Anse aux Meadows.', missions: norseMissions },
  { id: 'classical-mediterranean', title: 'Classical Mediterranean', subtitle: 'Campaign 10 · historical-era expansion', description: 'An explicitly fictionalized Greek-inspired island-navigation campaign across the Aegean and eastern Mediterranean.', missions: classicalMissions },
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
