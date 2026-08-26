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
