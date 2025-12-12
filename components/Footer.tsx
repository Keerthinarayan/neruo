import React, { useState } from 'react';
import { ExternalLink, Github, BookOpen, Database, Brain, FileText, HelpCircle, ChevronDown, ChevronUp, Code2, Layers } from 'lucide-react';

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

const Footer: React.FC = () => {
  const [showGlossary, setShowGlossary] = useState(false);

  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-xl mt-12 pb-12 pt-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* Glossary Section - Accordion Style */}
        <div className="mb-16 bg-white/5 rounded-2xl border border-white/10 overflow-hidden transition-all hover:bg-white/10 group">
          <button
            onClick={() => setShowGlossary(!showGlossary)}
            className="w-full px-8 py-6 flex items-center justify-between transition-colors outline-none"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-purple-500/20 text-purple-400 transition-transform duration-300 ${showGlossary ? 'rotate-12' : ''}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-white font-bold text-lg block">Medical Glossary</span>
                <span className="text-xs text-gray-500">Learn key concepts behind our AI predictions</span>
              </div>
            </div>
            {showGlossary ? <ChevronUp className="w-5 h-5 text-purple-400" /> : <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-white" />}
          </button>

          {showGlossary && (
            <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-down">
              {glossaryTerms.map(item => (
                <div key={item.term} className="p-4 bg-black/40 rounded-xl border border-white/5 hover:border-purple-500/20 transition-colors">
                  <div className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-2">{item.term}</div>
                  <div className="text-gray-400 text-xs leading-relaxed">{item.definition}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* About Column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">NeuroGraph</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Advancing drug discovery through neurosymbolic AI. We combine deep learning with logical reasoning to find new treatments for untreated diseases.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Data Sources */}
          <div className="md:col-span-3">
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Data Sources
            </h4>
            <ul className="space-y-4">
              <li>
                <a href="https://het.io/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 text-sm flex items-center gap-2 transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors"></span>
                  Hetionet KG
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 text-sm flex items-center gap-2 transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors"></span>
                  PubChem
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="https://www.drugbank.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 text-sm flex items-center gap-2 transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors"></span>
                  DrugBank
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          {/* Methods & Tools */}
          <div className="md:col-span-3">
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Tech Stack
            </h4>
            <ul className="space-y-4">
              <li>
                <a href="https://pytorch-geometric.readthedocs.io/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 text-sm flex items-center gap-2 transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors"></span>
                  PyTorch Geometric
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="https://github.com/lab-v2/pyreason" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 text-sm flex items-center gap-2 transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors"></span>
                  PyReason Engine
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <span className="text-gray-400 hover:text-purple-400 text-sm flex items-center gap-2 transition-colors cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-400 transition-colors"></span>
                  React & Tailwind
                </span>
              </li>
            </ul>
          </div>

          {/* References */}
          <div className="md:col-span-2">
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-400" />
              References
            </h4>
            <ul className="space-y-4">
              <li>
                <a href="https://elifesciences.org/articles/26726" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 text-sm flex items-center gap-2 transition-colors group">
                  Project Paper
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="https://arxiv.org/abs/2109.06127" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 text-sm flex items-center gap-2 transition-colors group">
                  Related Research
                  <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © 2025 NeuroGraph BioAI. For research purposes only. Not medical advice.
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
