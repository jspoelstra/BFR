// Airport Signs, Markings & Lights data extracted from FAA_Airport_Signs_Markings_Lights.md
// Source: assets/FAA_Airport_Signs_Markings_Lights.md

export const AIRPORT_SIGNS = [
  {
    id: 'runway-location-sign',
    number: 1,
    category: 'Location',
    name: 'Runway Location Sign',
    meaning: 'This sign identifies the runway upon which your aircraft is currently located.',
    image: '/assets/runway/n.png',
    keywords: ['runway', 'location', 'identifier']
  },
  {
    id: 'distance-remaining-sign',
    number: 2,
    category: 'Information',
    name: 'Distance Remaining Sign',
    meaning: 'This sign indicates thousands of feet remaining to the end of the runway.',
    image: '/assets/runway/t.png',
    keywords: ['distance', 'remaining', 'runway', 'thousands']
  },
  {
    id: 'closed-runway-marking',
    number: 3,
    category: 'Runway Markings',
    name: 'Closed Runway/Taxiway Marking',
    meaning: 'This marking means the runway or taxiway is closed.',
    image: '/assets/runway/m.png',
    keywords: ['closed', 'marking', 'X']
  },
  {
    id: 'runway-edge-lights',
    number: 4,
    category: 'Lighting',
    name: 'Runway Edge Lights',
    meaning: 'These lights outline the edges of a runway.',
    image: '/assets/runway/s.png',
    keywords: ['runway', 'edge', 'lights', 'outline']
  },
  {
    id: 'runway-taxiway-intersection',
    number: 5,
    category: 'Lighting',
    name: 'Runway-Taxiway Intersection Lights',
    meaning: 'This array is located at the intersection of two runways and a taxiway.',
    image: '/assets/runway/g.png',
    keywords: ['intersection', 'runway', 'taxiway', 'lights']
  },
  {
    id: 'hold-position-marking',
    number: 6,
    category: 'Taxiway Markings',
    name: 'Hold Position Marking',
    meaning: 'When seen on a taxiway in conjunction with a red and white runway identifier sign, this surface-painted marking indicates that an aircraft or vehicle may taxi up to but not cross the double solid lines until instructed to proceed by ATC.',
    image: '/assets/runway/b.png',
    keywords: ['hold', 'position', 'double', 'solid', 'lines', 'ATC']
  },
  {
    id: 'ils-critical-area-sign',
    number: 7,
    category: 'Mandatory Instruction',
    name: 'ILS Critical Area Sign',
    meaning: 'An aircraft that taxis past this sign may interfere with the navigational landing aid signals that an approaching aircraft is using. Stop if directed to by ATC.',
    image: '/assets/runway/a.png',
    keywords: ['ILS', 'critical', 'area', 'navaid', 'interference']
  },
  {
    id: 'wingtip-clearance-marking',
    number: 8,
    category: 'Taxiway Markings',
    name: 'Wingtip Clearance Marking',
    meaning: 'Stopping behind this marking will ensure wingtip clearance for aircraft on an intersecting taxiway.',
    image: '/assets/runway/q.png',
    keywords: ['wingtip', 'clearance', 'intersection']
  },
  {
    id: 'ils-critical-area-marking',
    number: 9,
    category: 'Taxiway Markings',
    name: 'ILS Critical Area Marking',
    meaning: 'This painted marking indicates the edge of the ILS critical area. Ground control may ask you to hold short of this marking if an aircraft is using the ILS.',
    image: '/assets/runway/f.png',
    keywords: ['ILS', 'critical', 'area', 'marking', 'hold', 'short']
  },
  {
    id: 'runway-approach-sign',
    number: 10,
    category: 'Mandatory Instruction',
    name: 'Runway Approach Sign',
    meaning: 'This sign alerts of an approaching runway and is accompanied by a yellow, surface-painted runway holding position marking.',
    image: '/assets/runway/e.png',
    keywords: ['runway', 'approach', 'alert', 'holding', 'position']
  },
  {
    id: 'no-entry-sign',
    number: 11,
    category: 'Mandatory Instruction',
    name: 'No Entry Sign',
    meaning: 'This no entry sign denotes that aircraft are prohibited from proceeding beyond it.',
    image: '/assets/runway/j.png',
    keywords: ['no', 'entry', 'prohibited']
  },
  {
    id: 'runway-operations-sign',
    number: 12,
    category: 'Mandatory Instruction',
    name: 'Runway Operations Sign',
    meaning: 'Taxiing past this sign may interfere with operations on the runway. Stop if directed to by ATC.',
    image: '/assets/runway/c.png',
    keywords: ['runway', 'operations', 'interference', 'stop']
  },
  {
    id: 'taxiway-edge-lights',
    number: 13,
    category: 'Lighting',
    name: 'Taxiway Edge Lights',
    meaning: 'These lights outline the edges of a taxiway.',
    image: '/assets/runway/r.png',
    keywords: ['taxiway', 'edge', 'lights', 'outline']
  },
  {
    id: 'runway-intersection-lights',
    number: 14,
    category: 'Lighting',
    name: 'Runway Intersection Lights',
    meaning: 'These lights are sometimes installed on each side of a taxiway prior to its intersection with a runway.',
    image: '/assets/runway/w.png',
    keywords: ['runway', 'intersection', 'lights', 'taxiway']
  },
  {
    id: 'taxiway-location-sign',
    number: 15,
    category: 'Location',
    name: 'Taxiway Location Sign',
    meaning: 'This sign identifies the taxiway upon which you are located.',
    image: '/assets/runway/d.png',
    keywords: ['taxiway', 'location', 'identifier']
  },
  {
    id: 'vehicle-roadway-marking',
    number: 16,
    category: 'Taxiway Markings',
    name: 'Vehicle Roadway Marking',
    meaning: 'This marking indicates the edge of a path for vehicle traffic on areas also intended for aircraft.',
    image: '/assets/runway/k.png',
    keywords: ['vehicle', 'roadway', 'edge', 'traffic']
  },
  {
    id: 'taxiway-intersection-lights-array',
    number: 17,
    category: 'Lighting',
    name: 'Taxiway Intersection Lights',
    meaning: 'This array indicates that you are approaching the intersection of two taxiways.',
    image: '/assets/runway/h.png',
    keywords: ['taxiway', 'intersection', 'approach']
  },
  {
    id: 'runway-direction-sign',
    number: 18,
    category: 'Direction',
    name: 'Runway Direction Sign',
    meaning: 'This sign indicates the direction to a destination runway.',
    image: '/assets/runway/l.png',
    keywords: ['runway', 'direction', 'destination']
  },
  {
    id: 'runway-exit-sign',
    number: 19,
    category: 'Direction',
    name: 'Runway Exit Sign',
    meaning: 'This sign indicates an exit from a runway onto the designated taxiway.',
    image: '/assets/runway/p.png',
    keywords: ['runway', 'exit', 'taxiway']
  },
  {
    id: 'movement-area-boundary',
    number: 20,
    category: 'Taxiway Markings',
    name: 'Movement Area Boundary Marking',
    meaning: 'This surface-painted marking separates the movement and non-movement areas on the airport. ATC clearance is needed to move beyond the solid line onto the movement area.',
    image: '/assets/runway/v.png',
    keywords: ['movement', 'area', 'boundary', 'ATC', 'clearance']
  },
  {
    id: 'enhanced-centerline-marking',
    number: 21,
    category: 'Taxiway Markings',
    name: 'Enhanced Taxiway Centerline Marking',
    meaning: 'This surface-painted enhanced taxiway centerline marking runs up to 150 feet back from the holding position marking and alerts of an approaching runway.',
    image: '/assets/runway/u.png',
    keywords: ['enhanced', 'centerline', 'marking', 'approaching', 'runway']
  }
];

// Group signs by category for easier navigation
export const SIGN_CATEGORIES = {
  'Mandatory Instruction': {
    title: 'Mandatory Instruction Signs',
    description: 'Red background with white text - locations where aircraft must stop',
    color: '#dc3545'
  },
  'Location': {
    title: 'Location Signs', 
    description: 'Black background with yellow text - identify current location',
    color: '#ffc107'
  },
  'Direction': {
    title: 'Direction Signs',
    description: 'Yellow background with black text - indicate direction to destinations',
    color: '#28a745'
  },
  'Information': {
    title: 'Information Signs',
    description: 'Provide useful information to pilots',
    color: '#17a2b8'
  },
  'Runway Markings': {
    title: 'Runway Markings',
    description: 'Surface markings on runways',
    color: '#6f42c1'
  },
  'Taxiway Markings': {
    title: 'Taxiway Markings', 
    description: 'Surface markings on taxiways',
    color: '#fd7e14'
  },
  'Lighting': {
    title: 'Airport Lighting',
    description: 'Various lighting systems for runway and taxiway guidance',
    color: '#20c997'
  }
};

// Get signs by category
export function getSignsByCategory(category) {
  return AIRPORT_SIGNS.filter(sign => sign.category === category);
}

// Get all categories with sign counts
export function getCategoriesWithCounts() {
  return Object.entries(SIGN_CATEGORIES).map(([key, info]) => ({
    id: key,
    ...info,
    count: getSignsByCategory(key).length
  }));
}