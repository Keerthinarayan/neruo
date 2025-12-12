import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Database, GitBranch, Target, ArrowUpRight, Brain, Pill, Zap, Sparkles, Activity, X, Info } from 'lucide-react';

const performanceData = [
  { name: 'Accuracy', GNN: 0.85, Neurosymbolic: 0.92 },
  { name: 'Recall', GNN: 0.78, Neurosymbolic: 0.88 },
  { name: 'F1 Score', GNN: 0.81, Neurosymbolic: 0.90 },
  { name: 'Interpret.', GNN: 0.30, Neurosymbolic: 0.95 },
];

const trendData = [
  { month: 'Jan', predictions: 120, validated: 85 },
  { month: 'Feb', predictions: 145, validated: 102 },
  { month: 'Mar', predictions: 190, validated: 145 },
  { month: 'Apr', predictions: 220, validated: 178 },
  { month: 'May', predictions: 280, validated: 220 },
  { month: 'Jun', predictions: 350, validated: 295 },
];

const entityData = [
  { name: 'Drugs', value: 1500, color: '#06b6d4' },
  { name: 'Diseases', value: 2800, color: '#f43f5e' },
  { name: 'Genes', value: 21000, color: '#10b981' },
  { name: 'Pathways', value: 2500, color: '#8b5cf6' },
];

const candidates = [
  { drug: 'Metformin', original: 'Diabetes Type 2', predicted: 'Longevity / Aging', confidence: 0.98, mechanism: 'AMPK → mTOR pathway', status: 'Clinical Trial', statusColor: 'emerald' },
  { drug: 'Sildenafil', original: 'Hypertension', predicted: "Alzheimer's Disease", confidence: 0.89, mechanism: 'PDE5 → Tau protein', status: 'In Validation', statusColor: 'cyan' },
  { drug: 'Thalidomide', original: 'Sedative (Banned)', predicted: 'Multiple Myeloma', confidence: 0.95, mechanism: 'TNF-α inhibition', status: 'Approved', statusColor: 'green' },
  { drug: 'Aspirin', original: 'Pain / Inflammation', predicted: 'Colorectal Cancer', confidence: 0.87, mechanism: 'COX-2 → Wnt pathway', status: 'Predicted', statusColor: 'purple' },
];

const StatCard: React.FC<{ title: string; value: string; change?: string; icon: React.ElementType; accent?: string }> = ({ 
  title, value, change, icon: Icon, accent = 'cyan'
}) => (
  <div className="card card-hover rounded-xl p-4 relative overflow-hidden">
    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-${accent}-400 to-${accent}-600`}></div>
    <div className="flex items-center justify-between mb-3">
      <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{title}</span>
      <div className={`p-1.5 rounded-lg bg-${accent}-500/10`}>
        <Icon className={`w-4 h-4 text-${accent}-400`} />
      </div>
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
    {change && (
      <div className="flex items-center gap-1 mt-2">
        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
        <span className="text-emerald-400 text-xs font-medium">{change}</span>
      </div>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const tooltipStyle = { 
    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: '12px',
    fontSize: '12px',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  };

  const handleBarClick = (data: any) => {
    setSelectedMetric(data);
  };

  const handlePieClick = (data: any) => {
    setSelectedEntity(data);
  };

  // Modal for metric details
  const MetricModal = () => {
    if (!selectedMetric) return null;
    return (
      <>
        <div className="chart-detail-overlay" onClick={() => setSelectedMetric(null)} />
        <div className="chart-detail-popup">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{selectedMetric.name} Analysis</h3>
            <button onClick={() => setSelectedMetric(null)} className="p-2 hover:bg-white/5 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Standard GNN</p>
                <p className="text-2xl font-bold text-slate-400">{(selectedMetric.GNN * 100).toFixed(0)}%</p>
              </div>
              <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <p className="text-xs text-cyan-400 mb-1">NeuroGraph</p>
                <p className="text-2xl font-bold text-cyan-400">{(selectedMetric.Neurosymbolic * 100).toFixed(0)}%</p>
              </div>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-xs text-emerald-400 mb-1">Improvement</p>
              <p className="text-xl font-bold text-emerald-400">
                +{((selectedMetric.Neurosymbolic - selectedMetric.GNN) * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                NeuroGraph outperforms standard GNN by combining neural embeddings with symbolic reasoning
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Modal for entity details
  const EntityModal = () => {
    if (!selectedEntity) return null;
    const entityDetails: Record<string, { description: string; examples: string[] }> = {
      'Drugs': { 
        description: 'Pharmaceutical compounds with known mechanisms of action',
        examples: ['Metformin', 'Aspirin', 'Sildenafil', 'Rapamycin']
      },
      'Diseases': { 
        description: 'Medical conditions and pathological states',
        examples: ["Alzheimer's", 'Cancer', 'Diabetes', 'Hypertension']
      },
      'Genes': { 
        description: 'Genetic elements encoding proteins and regulatory functions',
        examples: ['BRCA1', 'TP53', 'APOE', 'EGFR']
      },
      'Pathways': { 
        description: 'Biological signaling and metabolic pathways',
        examples: ['mTOR', 'Wnt/β-catenin', 'NF-κB', 'MAPK']
      }
    };
    const details = entityDetails[selectedEntity.name] || { description: '', examples: [] };

    return (
      <>
        <div className="chart-detail-overlay" onClick={() => setSelectedEntity(null)} />
        <div className="chart-detail-popup">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedEntity.color }}></div>
              <h3 className="text-lg font-semibold text-white">{selectedEntity.name}</h3>
            </div>
            <button onClick={() => setSelectedEntity(null)} className="p-2 hover:bg-white/5 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${selectedEntity.color}15`, borderColor: `${selectedEntity.color}30`, borderWidth: 1 }}>
              <p className="text-3xl font-bold text-white mb-1">{selectedEntity.value.toLocaleString()}</p>
              <p className="text-xs text-slate-400">entities in knowledge graph</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">{details.description}</p>
              <div className="flex flex-wrap gap-2">
                {details.examples.map((ex, i) => (
                  <span key={i} className="px-2 py-1 text-[10px] bg-white/5 text-slate-400 rounded-lg">{ex}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Hero Section */}
      <div className="hero-gradient rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-float">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Neurosymbolic Drug Repurposing
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-xl">
                Combining Graph Neural Networks with symbolic reasoning for explainable drug discovery
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
                  <Database className="w-3 h-3" /> Hetionet KG
                </span>
                <span className="text-xs px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> GNN Embeddings
                </span>
                <span className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Explainable
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-3xl font-bold gradient-text">92%</p>
              <p className="text-xs text-slate-500">Validation Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Nodes" value="48,291" change="+12%" icon={Database} accent="cyan" />
        <StatCard title="Relationships" value="1.2M" change="+5%" icon={GitBranch} accent="purple" />
        <StatCard title="Predictions" value="843" icon={Target} accent="rose" />
        <StatCard title="Validated" value="776" change="92%" icon={TrendingUp} accent="emerald" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance Chart */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Model Performance</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full">Live</span>
              <div className="tooltip-container">
                <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                <div className="tooltip">Click bars to see details</div>
              </div>
            </div>
          </div>
          <div className="h-56 cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} barCategoryGap="20%" onClick={(data) => data && data.activePayload && handleBarClick(data.activePayload[0].payload)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="GNN" fill="#475569" radius={[4, 4, 0, 0]} name="Standard GNN" className="cursor-pointer hover:opacity-80" />
                <Bar dataKey="Neurosymbolic" fill="#06b6d4" radius={[4, 4, 0, 0]} name="NeuroGraph" className="cursor-pointer hover:opacity-80" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-slate-600"></div>
              <span className="text-[10px] text-slate-500">Standard GNN</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-cyan-500"></div>
              <span className="text-[10px] text-slate-500">NeuroGraph</span>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Prediction Trends</h3>
            <span className="text-[10px] text-slate-500">Last 6 months</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="predictions" stroke="#06b6d4" fill="url(#predGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="validated" stroke="#10b981" fill="url(#valGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-cyan-500"></div>
              <span className="text-[10px] text-slate-500">Predictions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
              <span className="text-[10px] text-slate-500">Validated</span>
            </div>
          </div>
        </div>

        {/* Entity Distribution */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Entity Distribution</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">27.8K total</span>
              <div className="tooltip-container">
                <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                <div className="tooltip">Click segments for details</div>
              </div>
            </div>
          </div>
          <div className="h-56 cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={entityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={(data) => handlePieClick(data)}
                  className="cursor-pointer"
                >
                  {entityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {entityData.map((item, i) => (
              <button 
                key={i} 
                className="flex items-center gap-1.5 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors"
                onClick={() => handlePieClick(item)}
              >
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] text-slate-500">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="card rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-medium text-white">Top Repurposing Candidates</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Ranked by confidence score from neurosymbolic inference</p>
          </div>
          <button className="text-[10px] px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="pb-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Drug</th>
                <th className="pb-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Original</th>
                <th className="pb-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Predicted</th>
                <th className="pb-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Confidence</th>
                <th className="pb-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Mechanism</th>
                <th className="pb-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {candidates.map((c, i) => (
                <tr key={i} className="text-slate-300 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <Pill className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-medium text-cyan-400">{c.drug}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-400">{c.original}</td>
                  <td className="py-3.5 text-emerald-400">{c.predicted}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-slate-700/50 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-violet-600" 
                          style={{ width: `${c.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{c.confidence.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-xs text-slate-500 hidden md:table-cell">{c.mechanism}</td>
                  <td className="py-3.5">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      c.statusColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                      c.statusColor === 'cyan' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' :
                      c.statusColor === 'green' ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                      'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card card-hover rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-cyan-500/20">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <h4 className="text-sm font-medium text-white">Hetionet KG</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">47K nodes, 2.25M edges spanning drugs, diseases, genes, and pathways from 29 databases.</p>
        </div>
        <div className="card card-hover rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <h4 className="text-sm font-medium text-white">Graph Neural Networks</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">Message-passing networks for learning node embeddings and predicting missing links.</p>
        </div>
        <div className="card card-hover rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-purple-500/20">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <h4 className="text-sm font-medium text-white">Symbolic Reasoning</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">PyReason & PoLo engines for explainable rule-based inference and mechanistic explanations.</p>
        </div>
      </div>

      {/* Interactive Modals */}
      <MetricModal />
      <EntityModal />
    </div>
  );
};

export default Dashboard;
