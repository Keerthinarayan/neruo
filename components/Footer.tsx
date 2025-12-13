import React, { useState } from 'react';
import { ExternalLink, Github, BookOpen, Database, Brain, FileText, HelpCircle, ChevronDown, ChevronUp, Code2, Layers, Zap, Scan, Share2 } from 'lucide-react';

const glossaryTerms = [
  { term: 'Drug Repurposing', definition: 'Finding new medical uses for existing, approved drugs. Also called drug repositioning.' },
  { term: 'Knowledge Graph', definition: 'A network of interconnected facts where nodes represent entities (drugs, diseases, genes) and edges represent relationships between them.' },
  { term: 'GNN (Graph Neural Network)', definition: 'An AI model that learns patterns from graph-structured data by analyzing how nodes connect to each other.' },
  { term: 'Neurosymbolic AI', definition: 'AI that combines neural networks (pattern recognition) with symbolic reasoning (logical rules) for more explainable predictions.' },
  { term: 'Confidence Score', definition: 'A percentage indicating how likely a prediction is correct, based on the strength of evidence found.' },
  { term: 'Reasoning Path', definition: 'The chain of biological connections (drug → gene → disease) that explains why a prediction was made.' },
  { term: 'Gene', definition: 'A segment of DNA that contains instructions for making proteins. Drugs often work by affecting specific genes.' },
  { term: 'Pathway', definition: 'A series of molecular interactions in cells that lead to a specific outcome, like cell growth or immune response.' },
];

import { ViewState } from './Navbar';

interface FooterProps {
  setCurrentView: (view: ViewState) => void;
}

const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  const [showGlossary, setShowGlossary] = useState(false);

  return (
    <footer className="relative z-10 bg-black/80 backdrop-blur-xl mt-12 pb-12 pt-16 border-t border-white/5">
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6">

        {/* Glossary Section - Accordion Style */}
        <div className="mb-16 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-2xl border border-white/10 overflow-hidden transition-all hover:bg-white/[0.05] group shadow-lg shadow-black/20">
          <button
            onClick={() => setShowGlossary(!showGlossary)}
            className="w-full px-8 py-6 flex items-center justify-between transition-colors outline-none"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 transition-transform duration-300 ${showGlossary ? 'rotate-12 scale-110' : ''}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-white font-bold text-lg block tracking-wide">Medical Glossary</span>
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Learn key concepts behind our AI predictions</span>
              </div>
            </div>
            {showGlossary ? <ChevronUp className="w-5 h-5 text-purple-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-white" />}
          </button>

          {showGlossary && (
            <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-down">
              {glossaryTerms.map(item => (
                <div key={item.term} className="p-4 bg-black/40 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1">
                  <div className="text-purple-300 font-bold text-xs uppercase tracking-wider mb-2">{item.term}</div>
                  <div className="text-gray-400 text-xs leading-relaxed">{item.definition}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* About Column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">NeuroGraph</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 border-l-2 border-white/10 pl-4">
              Advancing drug discovery through neurosymbolic AI. We combine deep learning with logical reasoning to find new treatments for untreated diseases.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://github.com/Keerthinarayan/neruo" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 transition-all border border-white/5">
                <Github className="w-5 h-5" />
              </a>
              {/* Added Twitter/X placeholder icon for better filling */}
              <a href="#" className="p-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 transition-all border border-white/5">
                <Share2 className="w-5 h-5" />
              </a>
              <a href="#" className="p-2.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 transition-all border border-white/5">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Data Sources */}
          <div className="md:col-span-3">
            <h4 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Database className="w-4 h-4 text-cyan-400" />
              Data Sources
            </h4>
            <div className="space-y-3">
              <a href="https://het.io/" target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-cyan-900/10 border border-cyan-500/10 hover:bg-cyan-900/20 hover:border-cyan-500/30 transition-all group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-cyan-200 font-medium text-sm">Hetionet KG</span>
                  <ExternalLink className="w-3 h-3 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-cyan-500/70">Massive biomedical knowledge graph</p>
              </a>
              <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-blue-900/10 border border-blue-500/10 hover:bg-blue-900/20 hover:border-blue-500/30 transition-all group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-200 font-medium text-sm">PubChem</span>
                  <ExternalLink className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-blue-500/70">Chemical molecule database</p>
              </a>
              <a href="https://www.drugbank.com/" target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-teal-900/10 border border-teal-500/10 hover:bg-teal-900/20 hover:border-teal-500/30 transition-all group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-teal-200 font-medium text-sm">DrugBank</span>
                  <ExternalLink className="w-3 h-3 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-teal-500/70">Comprehensive drug data</p>
              </a>
            </div>
          </div>

          {/* Tech Stack - already good, just matching header style */}
          <div className="md:col-span-3">
            <h4 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Layers className="w-4 h-4 text-purple-400" />
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              <a href="https://neo4j.com/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center gap-1.5 hover:scale-105 transform">
                <Database className="w-3 h-3" />
                Neo4j
              </a>
              <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium hover:bg-teal-500/20 hover:border-teal-500/40 transition-all flex items-center gap-1.5 hover:scale-105 transform">
                <Zap className="w-3 h-3" />
                FastAPI
              </a>
              <a href="https://pytorch-geometric.readthedocs.io/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/20 hover:border-orange-500/40 transition-all flex items-center gap-1.5 hover:scale-105 transform">
                <Brain className="w-3 h-3" />
                PyG
              </a>
              <a href="https://github.com/lab-v2/pyreason" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium hover:bg-blue-500/20 hover:border-blue-500/40 transition-all flex items-center gap-1.5 hover:scale-105 transform">
                <Code2 className="w-3 h-3" />
                PyReason
              </a>
              <a href="https://github.com/mlmed/torchxrayvision" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-medium hover:bg-pink-500/20 hover:border-pink-500/40 transition-all flex items-center gap-1.5 hover:scale-105 transform">
                <Scan className="w-3 h-3" />
                TorchXRayVision
              </a>
              <a href="https://networkx.org/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center gap-1.5 hover:scale-105 transform">
                <Share2 className="w-3 h-3" />
                NetworkX
              </a>
              <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-center gap-1.5 cursor-default hover:scale-105 transform">
                <FileText className="w-3 h-3" />
                React
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium hover:bg-sky-500/20 hover:border-sky-500/40 transition-all flex items-center gap-1.5 cursor-default hover:scale-105 transform">
                <Layers className="w-3 h-3" />
                Tailwind
              </span>
            </div>
          </div>

          {/* Quick Links (Replaces References) */}
          <div className="md:col-span-2">
            <h4 className="text-white font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
              <ExternalLink className="w-4 h-4 text-green-400" />
              Quick Links
            </h4>
            <div className="flex flex-col gap-3">
              <button onClick={() => setCurrentView(ViewState.DASHBOARD)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-all hover:translate-x-1 group text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-green-400 transition-colors"></span>
                Dashboard
              </button>
              <button onClick={() => setCurrentView(ViewState.DRUG_ANALYSIS)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-all hover:translate-x-1 group text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-green-400 transition-colors"></span>
                Predictor
              </button>
              <button onClick={() => setCurrentView(ViewState.DISEASE_ANALYSIS)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-all hover:translate-x-1 group text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-green-400 transition-colors"></span>
                Diseases
              </button>
              <button onClick={() => setCurrentView(ViewState.KNOWLEDGE_GRAPH)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-all hover:translate-x-1 group text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-green-400 transition-colors"></span>
                Graph
              </button>
              <button onClick={() => setCurrentView(ViewState.AMIE_IMAGING)} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-all hover:translate-x-1 group text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-green-400 transition-colors"></span>
                AMIE
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © 2025 NeuroGraph BioAI. For research purposes only.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              System Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
