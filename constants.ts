// Initial dummy data to load before API calls
export const INITIAL_GRAPH_DATA = {
  nodes: [
    { id: '1', label: 'Metformin', type: 'DRUG', val: 8 },
    { id: '2', label: 'Type 2 Diabetes', type: 'DISEASE', val: 10 },
    { id: '3', label: 'AMPK', type: 'GENE', val: 5 },
    { id: '4', label: 'Aging', type: 'DISEASE', val: 7 },
    { id: '5', label: 'MTOR', type: 'GENE', val: 6 },
  ],
  links: [
    { source: '1', target: '2', relation: 'treats', weight: 1 },
    { source: '1', target: '3', relation: 'activates', weight: 0.8 },
    { source: '3', target: '5', relation: 'inhibits', weight: 0.7 },
    { source: '5', target: '4', relation: 'associated', weight: 0.5 },
  ]
};
