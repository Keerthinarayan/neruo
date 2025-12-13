import React, { useState, useEffect } from 'react';
import { GraphData, NodeType, PredictionResult } from '../types';
import { api, Disease } from '../services/api';
import NetworkGraph from './NetworkGraph';
import { generateKnowledgeSubgraph, analyzeRepurposing } from '../services/groqService';
import { Search, BookOpen, Beaker, Heart, Brain, ChevronRight, Loader2, Zap, ArrowRight, GitBranch, Database, Activity, Pill, Dna, CheckCircle2, XCircle, MapPin, Target } from 'lucide-react';

interface KnowledgeExplorerProps {
  diseases?: Disease[];
  stats?: any;
}

// Pre-defined example subgraphs
const EXAMPLE_GRAPHS: Record<string, { title: string; description: string; graph: GraphData }> = {
  metformin: {
    title: "Metformin & Aging",
    description: "AMPK-mTOR pathway modulation for longevity",
    graph: {
      nodes: [
        { id: '1', label: 'Metformin', type: NodeType.DRUG, val: 10 },
        { id: '2', label: 'Type 2 Diabetes', type: NodeType.DISEASE, val: 8 },
        { id: '3', label: 'AMPK', type: NodeType.GENE, val: 7 },
        { id: '4', label: 'mTOR', type: NodeType.GENE, val: 7 },
        { id: '5', label: 'Aging', type: NodeType.DISEASE, val: 9 },
        { id: '6', label: 'Insulin Signaling', type: NodeType.PATHWAY, val: 6 },
        { id: '7', label: 'Autophagy', type: NodeType.PATHWAY, val: 6 },
        { id: '8', label: 'SIRT1', type: NodeType.GENE, val: 5 },
        { id: '9', label: 'Cancer', type: NodeType.DISEASE, val: 7 },
        { id: '10', label: 'p53', type: NodeType.GENE, val: 5 },
      ],
      links: [
        { source: '1', target: '2', relation: 'treats', weight: 1 },
        { source: '1', target: '3', relation: 'activates', weight: 0.9 },
        { source: '3', target: '4', relation: 'inhibits', weight: 0.8 },
        { source: '4', target: '5', relation: 'associated', weight: 0.7 },
        { source: '3', target: '6', relation: 'regulates', weight: 0.6 },
        { source: '4', target: '7', relation: 'inhibits', weight: 0.7 },
        { source: '7', target: '5', relation: 'prevents', weight: 0.6 },
        { source: '1', target: '8', relation: 'activates', weight: 0.5 },
        { source: '8', target: '5', relation: 'prevents', weight: 0.6 },
        { source: '4', target: '9', relation: 'promotes', weight: 0.5 },
        { source: '10', target: '9', relation: 'suppresses', weight: 0.7 },
        { source: '3', target: '10', relation: 'activates', weight: 0.4 },
      ]
    }
  },
  sildenafil: {
    title: "Sildenafil & Alzheimer's",
    description: "PDE5-cGMP-CREB signaling pathway",
    graph: {
      nodes: [
        { id: '1', label: 'Sildenafil', type: NodeType.DRUG, val: 10 },
        { id: '2', label: 'Erectile Dysfunction', type: NodeType.DISEASE, val: 7 },
        { id: '3', label: 'PDE5', type: NodeType.GENE, val: 8 },
        { id: '4', label: 'cGMP', type: NodeType.PATHWAY, val: 6 },
        { id: '5', label: "Alzheimer's Disease", type: NodeType.DISEASE, val: 9 },
        { id: '6', label: 'CREB', type: NodeType.GENE, val: 6 },
        { id: '7', label: 'Tau Protein', type: NodeType.GENE, val: 7 },
        { id: '8', label: 'Neuroinflammation', type: NodeType.PATHWAY, val: 5 },
        { id: '9', label: 'BDNF', type: NodeType.GENE, val: 5 },
        { id: '10', label: 'Synaptic Plasticity', type: NodeType.PATHWAY, val: 6 },
      ],
      links: [
        { source: '1', target: '2', relation: 'treats', weight: 1 },
        { source: '1', target: '3', relation: 'inhibits', weight: 0.9 },
        { source: '3', target: '4', relation: 'degrades', weight: 0.8 },
        { source: '4', target: '6', relation: 'activates', weight: 0.7 },
        { source: '6', target: '9', relation: 'upregulates', weight: 0.6 },
        { source: '9', target: '10', relation: 'enhances', weight: 0.7 },
        { source: '10', target: '5', relation: 'protects from', weight: 0.6 },
        { source: '7', target: '5', relation: 'causes', weight: 0.8 },
        { source: '4', target: '7', relation: 'reduces', weight: 0.5 },
        { source: '8', target: '5', relation: 'promotes', weight: 0.6 },
        { source: '4', target: '8', relation: 'inhibits', weight: 0.5 },
      ]
    }
  },
  aspirin: {
    title: "Aspirin & Cancer",
    description: "COX-2 and Wnt pathway modulation",
    graph: {
      nodes: [
        { id: '1', label: 'Aspirin', type: NodeType.DRUG, val: 10 },
        { id: '2', label: 'Pain/Inflammation', type: NodeType.DISEASE, val: 7 },
        { id: '3', label: 'COX-2', type: NodeType.GENE, val: 8 },
        { id: '4', label: 'Prostaglandin E2', type: NodeType.PATHWAY, val: 6 },
        { id: '5', label: 'Colorectal Cancer', type: NodeType.DISEASE, val: 9 },
        { id: '6', label: 'Wnt/β-catenin', type: NodeType.PATHWAY, val: 7 },
        { id: '7', label: 'APC', type: NodeType.GENE, val: 6 },
        { id: '8', label: 'NF-κB', type: NodeType.GENE, val: 6 },
        { id: '9', label: 'Apoptosis', type: NodeType.PATHWAY, val: 5 },
        { id: '10', label: 'Cell Proliferation', type: NodeType.PATHWAY, val: 5 },
      ],
      links: [
        { source: '1', target: '2', relation: 'treats', weight: 1 },
        { source: '1', target: '3', relation: 'inhibits', weight: 0.9 },
        { source: '3', target: '4', relation: 'produces', weight: 0.8 },
        { source: '4', target: '5', relation: 'promotes', weight: 0.7 },
        { source: '6', target: '5', relation: 'drives', weight: 0.8 },
        { source: '7', target: '6', relation: 'inhibits', weight: 0.7 },
        { source: '3', target: '6', relation: 'activates', weight: 0.6 },
        { source: '1', target: '8', relation: 'inhibits', weight: 0.6 },
        { source: '8', target: '10', relation: 'promotes', weight: 0.5 },
        { source: '10', target: '5', relation: 'leads to', weight: 0.6 },
        { source: '1', target: '9', relation: 'induces', weight: 0.5 },
      ]
    }
  }
};

const ExampleCard: React.FC<{
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  isSelected: boolean;
  onClick: () => void;
}> = ({ title, description, icon: Icon, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected
        ? 'bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-cyan-500/30'
        : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]'
      }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
        <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{title}</h4>
        <p className="text-[10px] text-slate-500 truncate">{description}</p>
      </div>
      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
    </div>
  </button>
);

// Path Finder Result Interface
interface PathResult {
  drug: { id: string; name: string };
  disease: { id: string; name: string };
  paths: {
    direct: { type: string; relationship: string } | null;
    gene_mediated: { type: string; gene: string; drug_gene_rel: string; gene_disease_rel: string }[];
    via_similar_drugs: { type: string; similar_drug: string }[];
    via_similar_diseases: { type: string; similar_disease: string }[];
  };
}

interface DrugOption {
  id: string;
  name: string;
}

const KnowledgeExplorer: React.FC<KnowledgeExplorerProps> = ({ diseases = [], stats }) => {
  // Tab state
  const [activeMainTab, setActiveMainTab] = useState<'pathfinder' | 'explore'>('pathfinder');

  // Path Finder State
  const [selectedDrugId, setSelectedDrugId] = useState<string>('');
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>('');
  const [drugSearch, setDrugSearch] = useState('');
  const [diseaseSearchPF, setDiseaseSearchPF] = useState('');
  const [drugs, setDrugs] = useState<DrugOption[]>([]);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [showDiseaseDropdownPF, setShowDiseaseDropdownPF] = useState(false);

  // Explore tab state (existing)
  const [selectedExample, setSelectedExample] = useState<string>('metformin');
  const [isLoading, setIsLoading] = useState(false);
  const [customSearch, setCustomSearch] = useState('');
  const [customGraph, setCustomGraph] = useState<GraphData | null>(null);
  const [customPrediction, setCustomPrediction] = useState<PredictionResult | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Local disease state (in case not passed from parent)
  const [localDiseases, setLocalDiseases] = useState<Disease[]>([]);

  // Use passed diseases or local ones
  const availableDiseases = diseases.length > 0 ? diseases : localDiseases;

  // Load drugs and diseases on mount
  useEffect(() => {
    loadDrugs();
    if (diseases.length === 0) {
      loadDiseases();
    }
  }, [diseases.length]);

  const loadDrugs = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/drugs?limit=100');
      const data = await response.json();
      if (data.status === 'success') {
        setDrugs(data.data);
      }
    } catch (e) {
      console.error('Failed to load drugs:', e);
    }
  };

  const loadDiseases = async () => {
    try {
      const diseaseList = await api.getDiseases();
      setLocalDiseases(diseaseList);
    } catch (e) {
      console.error('Failed to load diseases:', e);
    }
  };

  const findPath = async () => {
    if (!selectedDrugId || !selectedDiseaseId) {
      setPathError('Please select both a drug and a disease');
      return;
    }

    setPathLoading(true);
    setPathError(null);
    setPathResult(null);

    try {
      const result = await api.getDrugDiseasePath(selectedDrugId, selectedDiseaseId);
      setPathResult(result);
    } catch (e: any) {
      setPathError(e.message || 'Failed to find paths');
    } finally {
      setPathLoading(false);
    }
  };

  const filteredDrugs = drugs.filter(d =>
    drugSearch === '' || d.name.toLowerCase().includes(drugSearch.toLowerCase())
  ).slice(0, 15);

  const filteredDiseasesPF = availableDiseases.filter(d =>
    diseaseSearchPF === '' || d.name.toLowerCase().includes(diseaseSearchPF.toLowerCase())
  ).slice(0, 15);

  const getRelationshipColor = (rel: string) => {
    const colors: Record<string, string> = {
      TREATS: 'text-green-400 bg-green-500/20',
      PALLIATES: 'text-emerald-400 bg-emerald-500/20',
      BINDS: 'text-blue-400 bg-blue-500/20',
      TARGETS: 'text-cyan-400 bg-cyan-500/20',
      UPREGULATES: 'text-orange-400 bg-orange-500/20',
      DOWNREGULATES: 'text-red-400 bg-red-500/20',
      ASSOCIATES: 'text-purple-400 bg-purple-500/20',
      INTERACTS: 'text-pink-400 bg-pink-500/20',
      RESEMBLES: 'text-yellow-400 bg-yellow-500/20',
      LOCALIZES: 'text-teal-400 bg-teal-500/20',
    };
    return colors[rel] || 'text-gray-400 bg-gray-500/20';
  };

  const handleExampleSelect = (id: string) => {
    if (id === selectedExample && !isCustomMode) return;
    setIsLoading(true);
    setIsCustomMode(false);
    setCustomGraph(null);
    setCustomPrediction(null);
    setTimeout(() => {
      setSelectedExample(id);
      setIsLoading(false);
    }, 500);
  };

  const handleCustomSearch = async () => {
    if (!customSearch.trim()) return;

    setIsLoading(true);
    setIsCustomMode(true);
    setSearchError(null);
    setCustomPrediction(null);

    try {
      const [graph, prediction] = await Promise.all([
        generateKnowledgeSubgraph(customSearch),
        analyzeRepurposing(customSearch, 'drug')
      ]);
      setCustomGraph(graph);
      setCustomPrediction(prediction);
    } catch (err) {
      console.error(err);
      setSearchError('Failed to generate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentGraph = isCustomMode && customGraph ? customGraph : EXAMPLE_GRAPHS[selectedExample]?.graph;
  const currentTitle = isCustomMode ? `${customSearch} Knowledge Graph` : EXAMPLE_GRAPHS[selectedExample]?.title;
  const currentDescription = isCustomMode
    ? `Simulated knowledge subgraph for "${customSearch}"`
    : EXAMPLE_GRAPHS[selectedExample]?.description;

  const iconMap: Record<string, React.ElementType> = {
    metformin: Beaker,
    sildenafil: Brain,
    aspirin: Heart,
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Database className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Graph Explorer</h1>
            <p className="text-gray-400 text-sm">
              Explore {stats?.nodes?.total?.toLocaleString() || '25,000+'} biomedical entities and {stats?.relationships?.toLocaleString() || '76,000+'} relationships
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMainTab('pathfinder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeMainTab === 'pathfinder'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <GitBranch className="w-4 h-4" />
            Path Finder
          </button>
          <button
            onClick={() => setActiveMainTab('explore')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeMainTab === 'explore'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Zap className="w-4 h-4" />
            Graph Generator
          </button>
        </div>
      </div>

      {/* PATH FINDER TAB */}
      {activeMainTab === 'pathfinder' && (
        <div className="bg-gray-900/50 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Find Real Biological Connections</h2>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Live Neo4j Data</span>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            Query our Hetionet knowledge graph to discover how a drug might be connected to a disease through genes, pathways, or similar compounds.
          </p>

          {/* Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end mb-6">
            {/* Drug Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Drug</label>
              <div className="relative">
                <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Search drugs..."
                  value={drugSearch}
                  onChange={(e) => {
                    setDrugSearch(e.target.value);
                    setShowDrugDropdown(true);
                  }}
                  onFocus={() => setShowDrugDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDrugDropdown(false), 200)}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
                {selectedDrugId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                )}
              </div>
              {showDrugDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-auto">
                  {filteredDrugs.length > 0 ? (
                    filteredDrugs.map(drug => (
                      <button
                        key={drug.id}
                        onMouseDown={() => {
                          setSelectedDrugId(drug.id);
                          setDrugSearch(drug.name);
                          setShowDrugDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        {drug.name}
                      </button>
                    ))
                  ) : drugs.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading drugs...</div>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No drugs found</div>
                  )}
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center py-3">
              <div className="p-2 bg-purple-500/20 rounded-full">
                <ArrowRight className="w-5 h-5 text-purple-400" />
              </div>
            </div>

            {/* Disease Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Disease</label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                <input
                  type="text"
                  placeholder="Search diseases..."
                  value={diseaseSearchPF}
                  onChange={(e) => {
                    setDiseaseSearchPF(e.target.value);
                    setShowDiseaseDropdownPF(true);
                  }}
                  onFocus={() => setShowDiseaseDropdownPF(true)}
                  onBlur={() => setTimeout(() => setShowDiseaseDropdownPF(false), 200)}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                />
                {selectedDiseaseId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                )}
              </div>
              {showDiseaseDropdownPF && (
                <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-auto">
                  {filteredDiseasesPF.length > 0 ? (
                    filteredDiseasesPF.map(disease => (
                      <button
                        key={disease.id}
                        onMouseDown={() => {
                          setSelectedDiseaseId(disease.id);
                          setDiseaseSearchPF(disease.name);
                          setShowDiseaseDropdownPF(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        {disease.name}
                      </button>
                    ))
                  ) : availableDiseases.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading diseases...</div>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No diseases found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Find Path Button */}
          <button
            onClick={findPath}
            disabled={pathLoading || !selectedDrugId || !selectedDiseaseId}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {pathLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching paths in Neo4j...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Find Biological Connections
              </>
            )}
          </button>

          {/* Error */}
          {pathError && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 rounded-xl flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{pathError}</p>
            </div>
          )}

          {/* Results */}
          {pathResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="font-medium">Connection Paths Found</span>
              </div>

              {/* Direct Connection */}
              {pathResult.paths.direct && pathResult.paths.direct.relationship && (
                <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Direct Connection!</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm">{pathResult.drug.name}</span>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span className={`px-2 py-1 rounded text-sm font-mono ${getRelationshipColor(pathResult.paths.direct.relationship)}`}>
                      {pathResult.paths.direct.relationship}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">{pathResult.disease.name}</span>
                  </div>
                </div>
              )}

              {/* Gene-Mediated Paths */}
              {pathResult.paths.gene_mediated && pathResult.paths.gene_mediated.length > 0 && (
                <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Dna className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-400 font-medium">Gene-Mediated Connections ({pathResult.paths.gene_mediated.length})</span>
                  </div>
                  <div className="space-y-2">
                    {pathResult.paths.gene_mediated.slice(0, 5).map((path, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">{pathResult.drug.name}</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className={`px-2 py-0.5 rounded font-mono text-xs ${getRelationshipColor(path.drug_gene_rel)}`}>
                          {path.drug_gene_rel}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">{path.gene}</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className={`px-2 py-0.5 rounded font-mono text-xs ${getRelationshipColor(path.gene_disease_rel)}`}>
                          {path.gene_disease_rel}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">{pathResult.disease.name}</span>
                      </div>
                    ))}
                    {pathResult.paths.gene_mediated.length > 5 && (
                      <p className="text-gray-500 text-xs">+ {pathResult.paths.gene_mediated.length - 5} more gene pathways</p>
                    )}
                  </div>
                </div>
              )}

              {/* Similar Drugs Path */}
              {pathResult.paths.via_similar_drugs && pathResult.paths.via_similar_drugs.length > 0 && (
                <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Pill className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Similar Drug Connections ({pathResult.paths.via_similar_drugs.length})</span>
                  </div>
                  <div className="space-y-2">
                    {pathResult.paths.via_similar_drugs.slice(0, 3).map((path, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">{pathResult.drug.name}</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-mono text-xs">RESEMBLES</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded">{path.similar_drug}</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded font-mono text-xs">TREATS</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">{pathResult.disease.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Paths Found */}
              {(!pathResult.paths.direct || !pathResult.paths.direct.relationship) &&
                (!pathResult.paths.gene_mediated || pathResult.paths.gene_mediated.length === 0) &&
                (!pathResult.paths.via_similar_drugs || pathResult.paths.via_similar_drugs.length === 0) &&
                (!pathResult.paths.via_similar_diseases || pathResult.paths.via_similar_diseases.length === 0) && (
                  <div className="p-4 bg-gray-800/50 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400">No direct biological connections found in the knowledge graph.</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                      This could indicate a potential novel repurposing opportunity worth investigating!
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Schema Info */}
          <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium text-sm">Graph Schema</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { rel: 'TREATS', color: 'green' },
                { rel: 'BINDS', color: 'blue' },
                { rel: 'ASSOCIATES', color: 'purple' },
                { rel: 'RESEMBLES', color: 'yellow' },
                { rel: 'UPREGULATES', color: 'orange' },
              ].map(item => (
                <span key={item.rel} className={`px-2 py-1 ${getRelationshipColor(item.rel)} rounded text-xs font-mono text-center`}>
                  {item.rel}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI GRAPH GENERATOR TAB (Existing Functionality) */}
      {activeMainTab === 'explore' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-medium text-white">Example Cases</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Pre-loaded drug repurposing case studies.
              </p>

              <div className="space-y-2">
                {Object.entries(EXAMPLE_GRAPHS).map(([id, example]) => (
                  <ExampleCard
                    key={id}
                    id={id}
                    title={example.title}
                    description={example.description}
                    icon={iconMap[id] || Zap}
                    isSelected={selectedExample === id}
                    onClick={() => handleExampleSelect(id)}
                  />
                ))}
              </div>
            </div>

            {/* Info Panel */}
            <div className="card rounded-2xl p-4">
              <Zap className="w-4 h-4 text-cyan-400 mb-2" />
              <h4 className="text-sm font-medium text-white mb-1">Neurosymbolic Method</h4>
              <p className="text-xs text-slate-500">
                GNN embeddings + symbolic logic for discovering drug-disease relationships.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Custom Search */}
            <div className="card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={customSearch}
                    onChange={(e) => setCustomSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
                    placeholder="Enter any drug, disease, or gene to explore..."
                    className="w-full glass-input rounded-xl py-2.5 pl-4 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                </div>
                <button
                  onClick={handleCustomSearch}
                  disabled={isLoading || !customSearch.trim()}
                  className="glass-btn glass-btn-primary px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate
                </button>
              </div>
              {searchError && (
                <p className="text-red-400 text-xs mt-2">{searchError}</p>
              )}
            </div>

            {/* Current Example Header */}
            <div className="card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium text-white">{currentTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{currentDescription}</p>
              </div>
              {isCustomMode && (
                <span className="text-[10px] px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
                  Simulated
                </span>
              )}
            </div>

            {/* Graph Visualization */}
            <div className="h-[450px] relative">
              {isLoading ? (
                <div className="h-full w-full card rounded-2xl flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
                  <p className="text-slate-400 text-sm">{isCustomMode ? 'Generating...' : 'Loading...'}</p>
                </div>
              ) : currentGraph ? (
                <NetworkGraph data={currentGraph} />
              ) : (
                <div className="h-full w-full card rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-slate-500 text-sm">Enter a search term to generate a graph</p>
                </div>
              )}
            </div>

            {/* Stats Row */}
            {currentGraph && (
              <div className="grid grid-cols-4 gap-3">
                <div className="card rounded-2xl p-3 text-center">
                  <div className="text-xl font-semibold text-white">{currentGraph.nodes.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Nodes</div>
                </div>
                <div className="card rounded-2xl p-3 text-center">
                  <div className="text-xl font-semibold text-white">{currentGraph.links.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Edges</div>
                </div>
                <div className="card rounded-2xl p-3 text-center">
                  <div className="text-xl font-semibold text-cyan-400">
                    {currentGraph.nodes.filter(n => n.type === NodeType.DRUG || n.type === 'DRUG').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Drugs</div>
                </div>
                <div className="card rounded-2xl p-3 text-center">
                  <div className="text-xl font-semibold text-violet-400">
                    {currentGraph.nodes.filter(n => n.type === NodeType.DISEASE || n.type === 'DISEASE').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Diseases</div>
                </div>
              </div>
            )}

            {/* Prediction Result */}
            {isCustomMode && customPrediction && (
              <div className="card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-medium text-white">Prediction Result</h3>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-cyan-600 text-white text-sm rounded-lg font-medium">{customPrediction.source}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <span className="px-2 py-1 bg-emerald-600 text-white text-sm rounded font-medium">{customPrediction.target}</span>
                  <span className="ml-auto text-emerald-400 font-mono text-xs">
                    {((customPrediction.neuralScore + customPrediction.symbolicConfidence) / 2 * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{customPrediction.explanation}</p>

                {/* Reasoning Chain */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-500 mb-2">Reasoning Path:</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-blue-600/50 text-blue-200 rounded">{customPrediction.source}</span>
                    {customPrediction.reasoningChain?.map((hop, idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-slate-600 text-xs">→ {hop.logic} →</span>
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded">{hop.step}</span>
                      </React.Fragment>
                    ))}
                    <span className="text-slate-600 text-xs">→</span>
                    <span className="px-2 py-1 bg-emerald-600/50 text-emerald-200 rounded">{customPrediction.target}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Reasoning Explanation for pre-loaded examples */}
            {!isCustomMode && (
              <div className="card rounded-2xl p-4">
                <h3 className="text-sm font-medium text-white mb-3">Reasoning Path</h3>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {selectedExample === 'metformin' && (
                    <>
                      <span className="px-2 py-1 bg-cyan-600 text-white rounded-lg">Metformin</span>
                      <span className="text-slate-500">→ activates →</span>
                      <span className="px-2 py-1 bg-slate-700 text-emerald-400 rounded">AMPK</span>
                      <span className="text-slate-500">→ inhibits →</span>
                      <span className="px-2 py-1 bg-slate-700 text-emerald-400 rounded">mTOR</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-1 bg-red-600 text-white rounded">Aging</span>
                    </>
                  )}
                  {selectedExample === 'sildenafil' && (
                    <>
                      <span className="px-2 py-1 bg-blue-600 text-white rounded">Sildenafil</span>
                      <span className="text-slate-500">→ inhibits →</span>
                      <span className="px-2 py-1 bg-slate-700 text-emerald-400 rounded">PDE5</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-1 bg-slate-700 text-yellow-400 rounded">cGMP</span>
                      <span className="text-slate-500">→ reduces →</span>
                      <span className="px-2 py-1 bg-slate-700 text-emerald-400 rounded">Tau</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-1 bg-red-600 text-white rounded">Alzheimer's</span>
                    </>
                  )}
                  {selectedExample === 'aspirin' && (
                    <>
                      <span className="px-2 py-1 bg-blue-600 text-white rounded">Aspirin</span>
                      <span className="text-slate-500">→ inhibits →</span>
                      <span className="px-2 py-1 bg-slate-700 text-emerald-400 rounded">COX-2</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-1 bg-slate-700 text-yellow-400 rounded">Wnt</span>
                      <span className="text-slate-500">→</span>
                      <span className="px-2 py-1 bg-red-600 text-white rounded">Colorectal Cancer</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-3">
                  The symbolic reasoner validates GNN predictions by tracing biological mechanisms.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeExplorer;
