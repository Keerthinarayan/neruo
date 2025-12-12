export enum NodeType {
  DRUG = 'Compound',
  DISEASE = 'Disease',
  GENE = 'Gene',
  PATHWAY = 'Pathway',
  ANATOMY = 'Anatomy',
  SIDE_EFFECT = 'SideEffect',
  SYMPTOM = 'Symptom',
  PHARMACOLOGIC_CLASS = 'PharmacologicClass',
  BIOLOGICAL_PROCESS = 'BiologicalProcess',
  MOLECULAR_FUNCTION = 'MolecularFunction',
  CELLULAR_COMPONENT = 'CellularComponent'
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  val: number; // For visualization sizing
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

export interface SymbolicPath {
  step: string;
  logic: string; // e.g., "Upregulates", "Binds to"
}

export interface PredictionResult {
  source: string;
  target: string;
  neuralScore: number; // 0.0 to 1.0
  symbolicConfidence: number; // 0.0 to 1.0
  explanation: string;
  reasoningChain: SymbolicPath[];
  noveltyScore: number;
}

export interface AnalysisRequest {
  entityName: string; // Drug or Disease name
  entityType: 'drug' | 'disease';
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  EXPLORER = 'EXPLORER',
  PREDICTOR = 'PREDICTOR'
}

export interface DrugCandidate {
  drug: string;
  originalIndication: string;
  newIndication: string;
  score: number;
  status: 'approved' | 'clinical-trial' | 'validation' | 'predicted';
  mechanism: string;
  evidence: string[];
}

export interface KnowledgeStats {
  totalNodes: number;
  totalEdges: number;
  drugs: number;
  diseases: number;
  genes: number;
  pathways: number;
}