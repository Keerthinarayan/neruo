import React, { useState, useEffect } from 'react';
import { analyzeRepurposing, generateKnowledgeSubgraph } from '../services/groqService';
import { exportToPDF, exportToJSON } from '../services/exportService';
import { PredictionResult, GraphData } from '../types';
import NetworkGraph from './NetworkGraph';
import SearchHistory, { HistoryItem } from './SearchHistory';
import ComparisonView from './ComparisonView';
import { SkeletonCard } from './Skeleton';
import { Search, GitCommit, ArrowRight, Activity, FileText, AlertCircle, Zap, Download, ArrowLeftRight, ChevronDown } from 'lucide-react';

const PredictionAnalysis: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'drug' | 'disease'>('drug');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('neurograph-history');
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('neurograph-history', JSON.stringify(history));
    }
  }, [history]);

  const addToHistory = (query: string, type: 'drug' | 'disease', resultTarget?: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      query,
      type,
      timestamp: new Date(),
      result: resultTarget
    };
    setHistory(prev => [newItem, ...prev.slice(0, 19)]); // Keep last 20
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setSearchTerm(item.query);
    setSearchType(item.type);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('neurograph-history');
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleExport = (format: 'pdf' | 'json') => {
    if (!result) return;
    if (format === 'pdf') {
      exportToPDF(result, searchTerm, searchType);
    } else {
      exportToJSON(result, searchTerm, searchType);
    }
    setShowExportMenu(false);
  };

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setResult(null);
    setGraphData(null);
    setError(null);

    try {
      const [prediction, graph] = await Promise.all([
        analyzeRepurposing(searchTerm, searchType),
        generateKnowledgeSubgraph(searchTerm)
      ]);

      setResult(prediction);
      setGraphData(graph);
      addToHistory(searchTerm, searchType, prediction.target);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickExamples = ['Metformin', 'Sildenafil', 'Aspirin', 'Rapamycin'];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Prediction Analysis
        </h1>
        <button
          onClick={() => setShowComparison(true)}
          className="glass-btn py-2 px-4 rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 transition-all"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Compare Drugs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Panel */}
      <div className="lg:col-span-1 space-y-4">
        <div className="card rounded-2xl p-4">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Prediction Engine
          </h2>
          <form onSubmit={handleAnalysis} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-2">Entity Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSearchType('drug')}
                  className={`glass-btn py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                    searchType === 'drug' 
                      ? 'glass-btn-primary text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Drug
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('disease')}
                  className={`glass-btn py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                    searchType === 'disease' 
                      ? 'bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-white shadow-lg shadow-violet-500/20' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Disease
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-2">
                {searchType === 'drug' ? 'Drug Name' : 'Disease Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchType === 'drug' ? 'e.g., Metformin' : 'e.g., Alzheimer\'s'}
                  className="w-full glass-input rounded-xl py-2.5 pl-3 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-600 mb-1.5">Quick examples:</label>
              <div className="flex flex-wrap gap-1.5">
                {quickExamples.map(example => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setSearchTerm(example);
                      setSearchType('drug');
                    }}
                    className="px-2 py-1 text-[10px] bg-white/[0.05] border border-white/10 text-slate-400 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                loading 
                  ? 'glass-btn opacity-50 cursor-not-allowed text-slate-400' 
                  : 'glass-btn glass-btn-primary text-white'
              }`}
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
            <p className="text-[10px] text-slate-500 font-medium mb-2">Pipeline:</p>
            <ol className="text-[10px] text-slate-500 space-y-1">
              <li>1. GNN encodes knowledge graph</li>
              <li>2. Link prediction identifies candidates</li>
              <li>3. Symbolic rules validate predictions</li>
              <li>4. Generates explanations</li>
            </ol>
          </div>
        </div>

        {result && (
           <div className="card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Confidence Scores</h3>
                
                {/* Export Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="export-btn"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {showExportMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 bg-slate-900/95 border border-white/10 rounded-xl p-2 min-w-[140px] z-50 backdrop-blur-xl shadow-xl">
                        <button
                          onClick={() => handleExport('pdf')}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Export as PDF
                        </button>
                        <button
                          onClick={() => handleExport('json')}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Export as JSON
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Neural (GNN)</span>
                    <span className="text-cyan-400 font-mono">{(result.neuralScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-1.5 rounded-full" 
                      style={{ width: `${result.neuralScore * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Symbolic (Logic)</span>
                    <span className="text-emerald-400 font-mono">{(result.symbolicConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full" 
                      style={{ width: `${result.symbolicConfidence * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Novelty</span>
                    <span className="text-violet-400 font-mono">{(result.noveltyScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-violet-400 h-1.5 rounded-full" 
                      style={{ width: `${result.noveltyScore * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Combined</span>
                    <span className="text-lg font-semibold text-white">
                      {(((result.neuralScore + result.symbolicConfidence) / 2) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
           </div>
        )}

        {/* Search History */}
        <SearchHistory
          history={history}
          onSelect={handleHistorySelect}
          onClear={handleClearHistory}
          onDelete={handleDeleteHistoryItem}
        />
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Graph View */}
        <div className="flex-1 card rounded-2xl p-1 overflow-hidden min-h-[350px]">
           {loading ? (
             <div className="h-full w-full flex flex-col items-center justify-center text-slate-500">
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-cyan-500/30 rounded-full"></div>
                  <div className="absolute inset-0 w-16 h-16 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-slate-400 mt-4">Traversing knowledge graph...</p>
                <p className="text-[10px] text-slate-600 mt-1">Analyzing molecular pathways</p>
             </div>
           ) : graphData ? (
             <NetworkGraph data={graphData} />
           ) : (
             <div className="h-full w-full flex flex-col items-center justify-center">
                <GitCommit className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">Enter an entity to visualize</p>
                <p className="text-slate-600 text-[10px] mt-1">Knowledge graph will appear here</p>
             </div>
           )}
        </div>

        {/* Explanation Section */}
        {result && (
          <div className="card rounded-2xl p-4">
             <div className="flex items-start gap-3 mb-4">
                <FileText className="w-4 h-4 text-cyan-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-white">Prediction: {result.target}</h3>
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-lg">High Confidence</span>
                  </div>
                  <p className="text-xs text-slate-400">{result.explanation}</p>
                </div>
             </div>

             <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
               <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-3">
                 Reasoning Chain
               </h4>
               <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-cyan-600 text-white rounded-lg font-medium">
                    {result.source}
                  </span>
                  
                  {result.reasoningChain.map((hop, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center gap-1 text-slate-500">
                         <span className="text-[10px]">{hop.logic}</span>
                         <ArrowRight className="w-3 h-3" />
                      </div>
                      <span className="px-2 py-1 bg-white/10 text-slate-300 rounded-lg">
                        {hop.step}
                      </span>
                    </React.Fragment>
                  ))}

                  <div className="flex items-center gap-1 text-slate-500">
                      <ArrowRight className="w-3 h-3" />
                  </div>
                  
                  <span className="px-2 py-1 bg-emerald-600 text-white rounded-lg font-medium">
                    {result.target}
                  </span>
               </div>

               <div className="mt-3 pt-3 border-t border-white/10">
                 <p className="text-[10px] text-slate-500 mb-1">Symbolic rule:</p>
                 <code className="text-[10px] text-emerald-400 bg-black/30 px-2 py-1 rounded-lg block font-mono">
                   IF Drug(X) → inhibits → Gene(Y) ∧ Gene(Y) → associated → Disease(Z) THEN treats(X, Z)
                 </code>
               </div>
             </div>
          </div>
        )}
      </div>
      </div>

      {/* Comparison Modal */}
      <ComparisonView 
        isOpen={showComparison} 
        onClose={() => setShowComparison(false)} 
      />
    </div>
  );
};

export default PredictionAnalysis;
