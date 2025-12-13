import React, { useState, useEffect } from 'react';
import { api, Disease, Prediction } from './services/api';
import { GraphView } from './components/GraphView';
import { FullNetworkGraph } from './components/FullNetworkGraph';
import Navbar, { ViewState } from './components/Navbar';
import GridBackground from './components/GridBackground';
import Footer from './components/Footer';
import KnowledgeExplorer from './components/KnowledgeExplorer';
import AMIEAnalysis from './components/AMIEAnalysis';
import { Network, Brain, Search, Activity, Database, GitBranch, Zap, ArrowRight, Lightbulb, Clock, Target, CheckCircle2, Beaker, Info, BookOpen, AlertTriangle, Check, X, ArrowUp, Share2, HelpCircle, Scan } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);

  // Data State
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Predictor State
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drug Detail View State
  const [viewingDrug, setViewingDrug] = useState<{ id: string; name: string } | null>(null);

  // Search State for Disease Analysis
  const [searchTerm, setSearchTerm] = useState('');

  // Scroll to Top Logic
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [diseaseList, statsData] = await Promise.all([
        api.getDiseases(),
        api.getStats()
      ]);
      setDiseases(diseaseList);
      setStats(statsData);
      if (diseaseList.length > 0) setSelectedDisease(diseaseList[0].id);
    } catch (e: any) {
      console.error(e);
      setError("Failed to load initial data. Ensure backend is running.");
    }
  };

  const handlePredict = async () => {
    if (!selectedDisease) return;
    setLoading(true);
    setError(null);
    setPredictions([]);
    try {
      const preds = await api.predict(selectedDisease);
      setPredictions(preds);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-gray-100 font-sans selection:bg-purple-900/50">

      {/* Navigation */}
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Grid Background for Non-Dashboard Views */}
      {currentView !== ViewState.DASHBOARD && <GridBackground />}

      {/* Main Content Area */}
      <div className="pt-28 px-6 flex-grow">

        {/* DASHBOARD VIEW */}
        {currentView === ViewState.DASHBOARD && (
          <>
            {/* FULL SCREEN Video Background */}
            <div className="fixed top-0 left-0 w-screen h-screen z-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#050505] z-10 pointer-events-none"></div>
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-105 pointer-events-none opacity-80 mix-blend-screen"
              >
                <source src="/hero-background.mp4" type="video/mp4" />
              </video>
            </div>

            <div className="max-w-6xl mx-auto animate-fade-in relative z-10">
              <div className="text-center py-24 px-4">

                <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 mb-2 pb-4 tracking-tighter drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                  Neurosymbolic Graph AI
                </h1>
                <div className="text-4xl font-black my-4 tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                  for
                </div>
                <div className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 mb-8 pb-4 drop-shadow-2xl tracking-tight">
                  Drug Repurposing
                </div>
                <p className="text-gray-200 text-lg max-w-2xl mx-auto mb-8 font-medium drop-shadow-md text-shadow">
                  Discover new uses for existing drugs using cutting-edge AI that explains its reasoning in plain language.
                </p>
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentView(ViewState.DRUG_ANALYSIS)}
                    className="px-8 py-4 bg-white/90 backdrop-blur text-black font-bold rounded-xl hover:bg-white transition-all transform hover:scale-105 shadow-xl shadow-purple-900/20 flex items-center gap-2"
                  >
                    Start Analysis <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats Grid - Glassmorphism */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16 px-4">
                <StatCard label="Total Nodes" value={stats?.nodes?.total.toLocaleString() || "..."} icon={<Database className="text-purple-400" />} tooltip="Entities in our knowledge graph" />
                <StatCard label="Relationships" value={stats?.relationships?.toLocaleString() || "..."} icon={<GitBranch className="text-blue-400" />} tooltip="Connections between entities" />
                <StatCard label="Compounds" value={stats?.nodes?.compounds.toLocaleString() || "..."} icon={<Beaker className="text-yellow-400" />} tooltip="Drugs and chemical compounds" />
                <StatCard label="Diseases" value={stats?.nodes?.diseases.toLocaleString() || "..."} icon={<Activity className="text-red-400" />} tooltip="Medical conditions" />
              </div>

              {/* Educational Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 px-4">
                {/* How Our AI Works */}
                <div className="bg-gray-900/[0.45] hover:bg-gray-900/[0.65] rounded-3xl border border-white/10 p-8 backdrop-blur-md hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Brain className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">How Our AI Works</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">1</div>
                      <div>
                        <h4 className="text-white font-semibold mb-1">Knowledge Graph</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">Mapping millions of biological connections into a structured network.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">2</div>
                      <div>
                        <h4 className="text-white font-semibold mb-1">Neural Analysis</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">GNN identifies hidden patterns and potential drug-disease links.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">3</div>
                      <div>
                        <h4 className="text-white font-semibold mb-1">Explainable Logic</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">Providing clear reasoning paths for every prediction.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* The NeuroGraph Advantage (USP Section) */}
                <div className="bg-gradient-to-br from-purple-900/[0.25] to-blue-900/[0.25] hover:from-purple-900/[0.45] hover:to-blue-900/[0.45] rounded-3xl border border-purple-500/20 p-8 backdrop-blur-md hover:border-purple-500/40 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">The NeuroGraph Advantage</h3>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-black/30 rounded-lg mt-1 border border-white/5">
                        <Brain className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">Hybrid Logic Core</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Combining the predictive power of deep learning with the rigorous validity of symbolic reasoning.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-black/30 rounded-lg mt-1 border border-white/5">
                        <Network className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">Custom GNN Model</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          A specialized graph neural network architecture engineered to capture complex, multi-hop biological relationships.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-black/30 rounded-lg mt-1 border border-white/5">
                        <Clock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">Accelerated Discovery</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Reduce drug discovery timelines from years to months with precise repurposing candidates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* DRUG ANALYSIS VIEW (Predictor) */}
        {currentView === ViewState.DRUG_ANALYSIS && (
          <>
            {viewingDrug ? (
              <div className="max-w-7xl mx-auto animate-fade-in">
                <DrugDetailView
                  drugId={viewingDrug.id}
                  drugName={viewingDrug.name}
                  onBack={() => setViewingDrug(null)}
                />
              </div>
            ) : (
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                {/* Left Sidebar - Configuration */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Info Banner */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/20 relative overflow-hidden group mb-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Scan className="w-24 h-24 text-blue-400" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-blue-400 mb-1">AI Model</h3>
                      <p className="text-sm text-gray-300">Custom GNN model with AUC of 0.8959</p>
                    </div>
                  </div>

                  <div className="bg-gray-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-xl">
                    <h2 className="text-lg font-semibold mb-6 flex items-center text-white">
                      <Search className="w-5 h-5 mr-3 text-purple-400" />
                      Analysis Config
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider ml-1">Target Disease</label>
                        <div className="relative group">
                          <select
                            className="w-full bg-black/40 border border-white/10 text-gray-200 rounded-xl p-4 appearance-none focus:ring-2 focus:ring-purple-500 outline-none transition-all group-hover:border-white/20"
                            value={selectedDisease}
                            onChange={(e) => setSelectedDisease(e.target.value)}
                          >
                            {diseases.length === 0 && <option>Loading diseases...</option>}
                            {diseases.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      <button
                        onClick={handlePredict}
                        disabled={loading || !selectedDisease}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/25 hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {loading ? <Activity className="animate-spin mr-2 w-5 h-5" /> : "Run Prediction Model"}
                      </button>
                    </div>
                  </div>

                  {/* Score Guide */}
                  <div className="bg-gray-900/40 rounded-3xl p-6 border border-white/5">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      Confidence Scores
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-12 text-right font-mono font-bold text-emerald-400">90%+</div>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
                        </div>
                        <span className="text-gray-400 w-16">Strong</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-12 text-right font-mono font-bold text-blue-400">70%+</div>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                        </div>
                        <span className="text-gray-400 w-16">Good</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-12 text-right font-mono font-bold text-yellow-400">50%+</div>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full w-1/2 bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
                        </div>
                        <span className="text-gray-400 w-16">Moderate</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-gray-500 leading-relaxed text-center">
                      Scores indicate pattern similarity in the knowledge graph, not clinical efficacy.
                    </div>
                  </div>
                </div>

                {/* Right Content - Results */}
                <div className="lg:col-span-8">
                  {!loading && predictions.length === 0 && (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 rounded-3xl border-2 border-dashed border-white/5 text-center p-8">
                      <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Beaker className="w-10 h-10 text-gray-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-400 mb-2">Ready to Analyze</h3>
                      <p className="text-gray-500 max-w-md">
                        Select a disease from the configuration panel to start the neurosymbolic prediction engine.
                      </p>
                    </div>
                  )}

                  {predictions.length > 0 && (
                    <div className="space-y-4 animate-fade-in-up">
                      <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          Prediction Results
                        </h3>
                        <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          {predictions.length} Candidates Found
                        </span>
                      </div>

                      {predictions.map((pred, i) => (
                        <div key={pred.drug_id} className="bg-gray-900/60 rounded-2xl border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all group">
                          {/* Card Header */}
                          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                #{i + 1}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{pred.drug_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500 font-mono bg-black/30 px-2 py-0.5 rounded">{pred.drug_id}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-6 pl-14 sm:pl-0">
                              <button
                                onClick={() => setViewingDrug({ id: pred.drug_id, name: pred.drug_name })}
                                className="px-4 py-2 text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-lg transition-all flex items-center gap-2"
                              >
                                <Network className="w-3 h-3" />
                                View Graph
                              </button>

                              <div className="text-right">
                                {(() => {
                                  const cappedScore = Math.min(pred.score * 100, 95);
                                  const tier = cappedScore >= 80 ? { color: 'text-emerald-400' } :
                                    cappedScore >= 60 ? { color: 'text-blue-400' } :
                                      { color: 'text-yellow-400' };
                                  return (
                                    <div>
                                      <div className={`text-2xl font-bold ${tier.color}`}>{cappedScore.toFixed(0)}%</div>
                                      <div className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Confidence</div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Explanations */}
                          <div className="p-6 bg-black/20">
                            {pred.explanations.length > 0 ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                  <GitBranch className="w-4 h-4 text-purple-500" />
                                  <span className="font-medium text-gray-300">Reasoning Paths</span>
                                  <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">{pred.explanations.length}</span>
                                </div>
                                <div className="space-y-3">
                                  {pred.explanations.map((expl, idx) => (
                                    <div key={idx} className="pl-4 border-l-2 border-purple-500/30">
                                      <GraphView explanation={expl} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-sm text-gray-500 italic p-2">
                                <Info className="w-4 h-4" />
                                No direct reasoning paths found. Score based on latent feature similarity.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* DISEASE ANALYSIS VIEW */}
        {currentView === ViewState.DISEASE_ANALYSIS && (
          <div className="max-w-7xl mx-auto animate-fade-in h-[calc(100vh-140px)] flex gap-8">
            {/* Sidebar List */}
            <div className="w-1/3 flex flex-col gap-4">
              <div className="bg-gray-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-lg flex-shrink-0">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Disease Registry
                </h2>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search query..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600 group-hover:border-white/20"
                    onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                  />
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
              </div>

              <div className="bg-gray-900/40 rounded-3xl border border-white/5 backdrop-blur-md flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 p-3 space-y-1 custom-scrollbar">
                  {diseases.filter(d => d.name.toLowerCase().includes(searchTerm)).map(d => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDisease(d.id)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${selectedDisease === d.id
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                        : 'hover:bg-white/5 text-gray-400 hover:text-white'
                        }`}
                    >
                      <div className="font-medium truncate pr-4">{d.name}</div>
                      {selectedDisease === d.id && <ArrowRight className="w-4 h-4 animate-slide-right" />}
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-black/20 border-t border-white/5 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  {diseases.length} Diseases Indexed
                </div>
              </div>
            </div>

            {/* Detail View Container */}
            <div className="w-2/3 flex flex-col h-full overflow-hidden bg-gray-900/20 rounded-3xl border border-white/5 backdrop-blur-sm relative">
              {selectedDisease ? (
                <div className="h-full overflow-y-auto custom-scrollbar p-1">
                  {/* Pass just string content to wrapper or ensure component handles it. 
                       Here wrapping in div to ensure styling isolation */}
                  <DiseaseDetailView diseaseId={selectedDisease} />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-50">
                  <Activity className="w-24 h-24 text-gray-700 mb-6" />
                  <h3 className="text-2xl font-bold text-gray-500 mb-2">Select a Disease</h3>
                  <p className="text-gray-600 max-w-sm">Choose a disease from the registry on the left to explore its biological profile and potential treatments.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* KNOWLEDGE GRAPH VIEW - Now an Interactive Explorer */}
        {currentView === ViewState.KNOWLEDGE_GRAPH && (
          <KnowledgeExplorer diseases={diseases} stats={stats} />
        )}

        {/* AMIE - Advanced Medical Imaging Environment */}
        {currentView === ViewState.AMIE_IMAGING && (
          <AMIEAnalysis />
        )}
      </div>

      {/* Footer */}
      <Footer setCurrentView={setCurrentView} />

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-4 bg-purple-600/80 backdrop-blur-xl border border-white/20 text-white rounded-full shadow-2xl shadow-purple-900/40 transition-all duration-500 z-50 group hover:bg-purple-500 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
      </button>

    </div >
  );
}

// Icon Helper
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const StatCard = ({ label, value, icon, tooltip }: any) => (
  <div className="bg-gray-900/[0.45] hover:bg-gray-900/[0.65] backdrop-blur border border-white/5 p-6 rounded-2xl group relative hover:border-white/10 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <div className="text-gray-400 text-xs uppercase tracking-widest font-bold">{label}</div>
        {tooltip && (
          <div className="relative">
            <Info className="w-3.5 h-3.5 text-gray-600 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-xs text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-white/10 shadow-xl">
              {tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        )}
      </div>
      <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">{icon}</div>
    </div>
    <div className="text-4xl font-black text-white tracking-tight">{value}</div>
  </div>
);

// Functional Disease Detail View (preserving tabs)
const DiseaseDetailView = ({ diseaseId }: { diseaseId: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'treatments' | 'related' | 'genes' | 'network'>('treatments');
  const [networkData, setNetworkData] = useState<any>(null);
  const [networkLoading, setNetworkLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/diseases/${diseaseId}`)
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') setData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [diseaseId]);

  // Load network data when network tab is selected
  useEffect(() => {
    if (activeTab === 'network' && !networkData && !networkLoading) {
      setNetworkLoading(true);
      api.getFullNetwork('disease', diseaseId, 50)
        .then(data => {
          setNetworkData(data);
          setNetworkLoading(false);
        })
        .catch(() => setNetworkLoading(false));
    }
  }, [activeTab, diseaseId, networkData, networkLoading]);

  if (loading) return <div className="h-full flex items-center justify-center p-12 text-purple-400"><Activity className="animate-spin w-8 h-8" /></div>;
  if (!data) return null;

  const { profile, indications, similar_diseases = [], shared_genes = [] } = data;

  return (
    <div className="space-y-8 p-6 animate-fade-in pb-12">
      {/* Disease Profile Header */}
      <div className="bg-gray-900/40 p-1 rounded-3xl border border-white/5">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[22px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/4"></div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider">
                  Target Condition
                </span>
                <span className="text-gray-500 font-mono text-xs">{diseaseId}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">{profile.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">{profile.gene_count}</div>
              <div className="text-xs text-gray-400 uppercase font-medium">Associated Genes</div>
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">{profile.treatment_count}</div>
              <div className="text-xs text-gray-400 uppercase font-medium">Known Treatments</div>
            </div>
            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">{profile.anatomy.length}</div>
              <div className="text-xs text-gray-400 uppercase font-medium">Affected Sites</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-xl py-2 -mx-2 px-2">
        <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 mx-auto max-w-4xl">
          <button
            onClick={() => setActiveTab('treatments')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'treatments'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Treatments</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'network'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Network</span>
          </button>
          <button
            onClick={() => setActiveTab('related')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'related'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">Related</span>
          </button>
          <button
            onClick={() => setActiveTab('genes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'genes'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Genes</span>
          </button>
        </div>
      </div>

      {/* Full Network Tab */}
      {activeTab === 'network' && (
        <div className="bg-gray-900/40 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              Knowledge Graph Visualization
            </h3>
            <span className="text-xs text-gray-600">Interact to explore connections</span>
          </div>
          <div className="flex-1 relative">
            {networkLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-10 h-10 text-purple-400 animate-spin" />
              </div>
            ) : networkData ? (
              <FullNetworkGraph
                nodes={networkData.nodes}
                edges={networkData.edges}
                centerNode={networkData.center}
                title={`${profile.name} Network`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                Failed to load network data
              </div>
            )}
          </div>
        </div>
      )}

      {/* Potential Treatments Tab */}
      {activeTab === 'treatments' && (
        <div className="space-y-6">
          <div className="bg-purple-900/10 border border-purple-500/10 rounded-2xl p-6 flex gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl h-fit">
              <Lightbulb className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-bold mb-1">AI-Predicted Treatments</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                These drugs are not currently approved for {profile.name} but share strong biological patterns in our knowledge graph.
                Our Neurosymbolic AI identifies these opportunities by analyzing gene overlap and mechanism of action.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {indications.length === 0 ? (
              <div className="text-center py-20 bg-gray-900/20 rounded-3xl border border-white/5 border-dashed">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-20 text-gray-500" />
                <h4 className="text-gray-400 font-bold mb-2">No Candidates Found</h4>
                <p className="text-gray-600 text-sm">No strong drug repurposing candidates were identified for this disease.</p>
              </div>
            ) : (
              indications.map((pred: any, i: number) => (
                <div key={pred.drug_id} className="bg-gray-900/40 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all p-5 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-white group-hover:bg-purple-600 group-hover:border-purple-500 transition-all">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">{pred.drug_name}</div>
                        <div className="text-xs text-gray-500 font-mono">{pred.drug_id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black ${pred.score >= 0.7 ? 'text-green-400' : pred.score >= 0.5 ? 'text-yellow-400' : 'text-orange-400'}`}>
                        {(pred.score * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">Confidence</div>
                    </div>
                  </div>

                  {pred.explanations.length > 0 && (
                    <div className="pl-14">
                      <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                        <GitBranch className="w-3 h-3" />
                        Logical Reasoning Paths
                      </div>
                      {/* Placeholder for visual simplification - usually we show 1-2 items or just count */}
                      <div className="flex gap-2 text-xs text-purple-400 bg-purple-500/5 p-2 rounded-lg border border-purple-500/10">
                        {pred.explanations.length} biological pathways connect this drug to {profile.name}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Related Diseases Tab */}
      {activeTab === 'related' && (
        <div className="grid gap-4">
          {similar_diseases.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No similar diseases found.</p>
            </div>
          ) : (
            similar_diseases.map((disease: any, i: number) => (
              <div key={disease.id} className="p-5 bg-gray-900/40 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{disease.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{disease.id}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-3 py-1 bg-cyan-950 text-cyan-400 text-xs font-bold rounded-lg border border-cyan-500/20">
                    {disease.shared_genes} Shared Genes
                  </span>
                  <span className="text-xs text-gray-600">{disease.treatment_count} Treatments</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Shared Genes Tab */}
      {activeTab === 'genes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shared_genes.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No shared gene data available.</p>
            </div>
          ) : (
            shared_genes.map((gene: any, i: number) => (
              <div key={gene.gene_id || i} className="p-5 bg-gray-900/40 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs">
                      Gene
                    </div>
                    <div className="font-bold text-white text-lg">{gene.gene_name}</div>
                  </div>
                  <div className="text-xs font-mono text-gray-600">{gene.gene_id}</div>
                </div>
                {gene.related_diseases && gene.related_diseases.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Linked Conditions</div>
                    <div className="flex flex-wrap gap-2">
                      {gene.related_diseases.slice(0, 3).map((disease: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded border border-green-500/10">
                          {disease}
                        </span>
                      ))}
                      {gene.related_diseases.length > 3 && (
                        <span className="text-xs text-gray-600 self-center">+{gene.related_diseases.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Drug Detail View Component with Full Network
const DrugDetailView = ({ drugId, drugName, onBack }: { drugId: string; drugName: string; onBack: () => void }) => {
  const [networkData, setNetworkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drugInfo, setDrugInfo] = useState<any>(null);

  useEffect(() => {
    setLoading(true);

    // Load drug network
    api.getFullNetwork('drug', drugId, 50)
      .then(data => {
        setNetworkData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Try to load additional drug info
    fetch(`http://localhost:8000/drugs/${encodeURIComponent(drugId)}`)
      .then(res => res.json())
      .then(d => {
        if (d.status === 'success') setDrugInfo(d.data);
      })
      .catch(() => { });
  }, [drugId]);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="bg-gray-900/40 p-1 rounded-3xl border border-white/5">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[22px] relative overflow-hidden">
          <button
            onClick={onBack}
            className="absolute top-8 right-8 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2 z-20"
          >
            <ArrowUp className="w-4 h-4 -rotate-90" /> Back
          </button>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                Drug Candidate
              </span>
              <span className="text-gray-500 font-mono text-xs">{drugId}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">{drugName}</h2>

            {drugInfo?.profile && (
              <div className="flex gap-8">
                <div>
                  <div className="text-2xl font-bold text-white">{drugInfo.profile.targets?.length || 0}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Targets</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{drugInfo.profile.treats?.length || 0}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Indications</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{drugInfo.similar_drugs?.length || 0}</div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Similar</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Network Visualization */}
      <div className="bg-gray-900/40 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden h-[600px] flex flex-col">
        <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-400" />
              Drug Interaction Network
            </h3>
          </div>
          <div className="flex gap-4 text-[10px] font-medium text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Drug</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Disease</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Gene</span>
          </div>
        </div>
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
          ) : networkData ? (
            <FullNetworkGraph
              nodes={networkData.nodes}
              edges={networkData.edges}
              centerNode={networkData.center}
              title={`${drugName} Network`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Failed to load network data
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/10 rounded-2xl flex gap-4">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <p className="text-sm text-gray-400">
          <strong className="text-blue-300">Exploration Tip:</strong> This interactive graph shows the complete "neighborhood" of {drugName} in our biomedical knowledge graph.
          You can see which genes it targets, what other diseases it treats (repurposing opportunities), and structurally similar compounds.
        </p>
      </div>
    </div>
  );
};

export default App;
