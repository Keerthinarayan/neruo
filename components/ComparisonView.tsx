import React, { useState } from 'react';
import { X, ArrowLeftRight, Pill, Target, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { analyzeRepurposing } from '../services/groqService';
import { PredictionResult } from '../types';

interface ComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const drugSuggestions = [
  'Metformin', 'Sildenafil', 'Aspirin', 'Rapamycin', 'Thalidomide', 
  'Ibuprofen', 'Atorvastatin', 'Minoxidil', 'Lithium', 'Ketamine'
];

const ComparisonView: React.FC<ComparisonViewProps> = ({ isOpen, onClose }) => {
  const [drug1, setDrug1] = useState('');
  const [drug2, setDrug2] = useState('');
  const [result1, setResult1] = useState<PredictionResult | null>(null);
  const [result2, setResult2] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!drug1.trim() || !drug2.trim()) return;
    
    setLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        analyzeRepurposing(drug1, 'drug'),
        analyzeRepurposing(drug2, 'drug')
      ]);
      setResult1(res1);
      setResult2(res2);
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWinner = (val1: number, val2: number) => {
    if (val1 > val2) return 'left';
    if (val2 > val1) return 'right';
    return 'tie';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="chart-detail-overlay" onClick={onClose} />
      <div className="chart-detail-popup" style={{ minWidth: '700px', maxWidth: '900px' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Drug Comparison</h2>
              <p className="text-xs text-slate-500">Compare repurposing potential side-by-side</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Drug Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs text-slate-500 mb-2">Drug 1</label>
            <input
              type="text"
              value={drug1}
              onChange={(e) => setDrug1(e.target.value)}
              placeholder="e.g., Metformin"
              className="w-full glass-input rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {drugSuggestions.slice(0, 5).map(drug => (
                <button
                  key={drug}
                  onClick={() => setDrug1(drug)}
                  className="px-2 py-1 text-[10px] bg-white/5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/10 transition-all"
                >
                  {drug}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-2">Drug 2</label>
            <input
              type="text"
              value={drug2}
              onChange={(e) => setDrug2(e.target.value)}
              placeholder="e.g., Sildenafil"
              className="w-full glass-input rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {drugSuggestions.slice(5, 10).map(drug => (
                <button
                  key={drug}
                  onClick={() => setDrug2(drug)}
                  className="px-2 py-1 text-[10px] bg-white/5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/10 transition-all"
                >
                  {drug}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !drug1.trim() || !drug2.trim()}
          className="w-full glass-btn glass-btn-primary py-3 rounded-xl text-sm font-medium mb-6 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-4 h-4" />
              Compare Drugs
            </>
          )}
        </button>

        {/* Results */}
        {result1 && result2 && (
          <div className="comparison-container">
            {/* Drug 1 Results */}
            <div className="comparison-card">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">{drug1}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="comparison-metric">
                  <span className="text-xs text-slate-500">Predicted Target</span>
                  <span className="text-xs text-emerald-400 font-medium">{result1.target}</span>
                </div>
                
                <div className="comparison-metric">
                  <span className="text-xs text-slate-500">Neural Score</span>
                  <span className={`text-xs font-mono ${getWinner(result1.neuralScore, result2.neuralScore) === 'left' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {(result1.neuralScore * 100).toFixed(0)}%
                    {getWinner(result1.neuralScore, result2.neuralScore) === 'left' && <CheckCircle className="w-3 h-3 inline ml-1" />}
                  </span>
                </div>
                
                <div className="comparison-metric">
                  <span className="text-xs text-slate-500">Symbolic Score</span>
                  <span className={`text-xs font-mono ${getWinner(result1.symbolicConfidence, result2.symbolicConfidence) === 'left' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {(result1.symbolicConfidence * 100).toFixed(0)}%
                    {getWinner(result1.symbolicConfidence, result2.symbolicConfidence) === 'left' && <CheckCircle className="w-3 h-3 inline ml-1" />}
                  </span>
                </div>
                
                <div className="comparison-metric">
                  <span className="text-xs text-slate-500">Novelty</span>
                  <span className={`text-xs font-mono ${getWinner(result1.noveltyScore, result2.noveltyScore) === 'left' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {(result1.noveltyScore * 100).toFixed(0)}%
                    {getWinner(result1.noveltyScore, result2.noveltyScore) === 'left' && <CheckCircle className="w-3 h-3 inline ml-1" />}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-500 block mb-1">Combined</span>
                  <span className="text-lg font-bold text-white">
                    {(((result1.neuralScore + result1.symbolicConfidence) / 2) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="comparison-divider" />

            {/* Drug 2 Results */}
            <div className="comparison-card">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">{drug2}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="comparison-metric">
                  <span className="text-xs text-slate-500">Predicted Target</span>
                  <span className="text-xs text-emerald-400 font-medium">{result2.target}</span>
                </div>
                
                <div className="comparison-metric">
                  <span className="text-xs text-slate-500">Neural Score</span>
                  <span className={`text-xs font-mono ${getWinner(result1.neuralScore, result2.neuralScore) === 'right' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {(result2.neuralScore * 100).toFixed(0)}%
                    {getWinner(result1.neuralScore, result2.neuralScore) === 'right' && <CheckCircle className="w-3 h-3 inline ml-1" />}
                  </span>
                </div>
                
                <div className="comparison-metric">
                  <span className="text-xs text-slate-500">Symbolic Score</span>
                  <span className={`text-xs font-mono ${getWinner(result1.symbolicConfidence, result2.symbolicConfidence) === 'right' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {(result2.symbolicConfidence * 100).toFixed(0)}%
                    {getWinner(result1.symbolicConfidence, result2.symbolicConfidence) === 'right' && <CheckCircle className="w-3 h-3 inline ml-1" />}
                  </span>
                </div>
                
                <div className="comparison-metric">
                  <span className="text-xs text-slate-500">Novelty</span>
                  <span className={`text-xs font-mono ${getWinner(result1.noveltyScore, result2.noveltyScore) === 'right' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {(result2.noveltyScore * 100).toFixed(0)}%
                    {getWinner(result1.noveltyScore, result2.noveltyScore) === 'right' && <CheckCircle className="w-3 h-3 inline ml-1" />}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-500 block mb-1">Combined</span>
                  <span className="text-lg font-bold text-white">
                    {(((result2.neuralScore + result2.symbolicConfidence) / 2) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ComparisonView;
