import React from 'react';
import { Clock, Pill, Search, Trash2, ArrowRight } from 'lucide-react';

export interface HistoryItem {
  id: string;
  query: string;
  type: 'drug' | 'disease';
  timestamp: Date;
  result?: string;
}

interface SearchHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onSelect, onClear, onDelete }) => {
  if (history.length === 0) {
    return (
      <div className="card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-medium text-white">Search History</h3>
        </div>
        <div className="text-center py-6">
          <Search className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No searches yet</p>
          <p className="text-[10px] text-slate-600 mt-1">Your search history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium text-white">Search History</h3>
        </div>
        <button
          onClick={onClear}
          className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            className="history-item group"
            onClick={() => onSelect(item)}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              item.type === 'drug' 
                ? 'bg-cyan-500/10' 
                : 'bg-violet-500/10'
            }`}>
              <Pill className={`w-4 h-4 ${
                item.type === 'drug' ? 'text-cyan-400' : 'text-violet-400'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{item.query}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${
                  item.type === 'drug' ? 'text-cyan-400' : 'text-violet-400'
                }`}>
                  {item.type}
                </span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-600">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            </div>

            {item.result && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <ArrowRight className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{item.result}</span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all"
            >
              <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default SearchHistory;
