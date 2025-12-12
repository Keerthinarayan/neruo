import React, { useState } from 'react';
import { GraphData, NodeType, PredictionResult } from '../types';
import NetworkGraph from './NetworkGraph';
import { generateKnowledgeSubgraph, analyzeRepurposing } from '../services/groqService';
import { Search, BookOpen, Beaker, Heart, Brain, ChevronRight, Loader2, Zap, ArrowRight } from 'lucide-react';

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
    className={`w-full text-left p-3 rounded-xl border transition-all ${
      isSelected 
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

const KnowledgeExplorer: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>('metformin');
  const [isLoading, setIsLoading] = useState(false);
  const [customSearch, setCustomSearch] = useState('');
  const [customGraph, setCustomGraph] = useState<GraphData | null>(null);
  const [customPrediction, setCustomPrediction] = useState<PredictionResult | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-7xl mx-auto animate-fade-in">
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
  );
};

export default KnowledgeExplorer;
