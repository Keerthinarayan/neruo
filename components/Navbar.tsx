import React, { useState, useEffect } from 'react';
import { Brain, LayoutDashboard, Zap, Activity, Network, Menu, X, Sparkles } from 'lucide-react';

// View states - must match App.tsx
export enum ViewState {
  DASHBOARD,
  DRUG_ANALYSIS,
  DISEASE_ANALYSIS,
  KNOWLEDGE_GRAPH
}

interface NavbarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Dashboard", view: ViewState.DASHBOARD, icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "Predictor", view: ViewState.DRUG_ANALYSIS, icon: <Zap className="w-4 h-4" /> },
    { name: "Diseases", view: ViewState.DISEASE_ANALYSIS, icon: <Activity className="w-4 h-4" /> },
    { name: "Graph", view: ViewState.KNOWLEDGE_GRAPH, icon: <Network className="w-4 h-4" /> },
  ];

  return (
    <>
      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${isScrolled ? "w-[90%] max-w-4xl" : "w-[95%] max-w-6xl"
          }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 md:px-6 md:py-4 flex items-center justify-between transition-all duration-500 border border-white/10 ${isScrolled
            ? "bg-black/60 backdrop-blur-xl shadow-2xl shadow-purple-900/10"
            : "bg-black/40 backdrop-blur-lg"
            }`}
        >
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setCurrentView(ViewState.DASHBOARD); }}
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="absolute inset-0 h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block text-white">
              Neuro<span className="text-purple-500">.</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setCurrentView(item.view)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors group ${currentView === item.view ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
              >
                {item.name}
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 ${currentView === item.view ? "w-3/4" : "w-0 group-hover:w-3/4"
                  }`} />
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView(ViewState.DRUG_ANALYSIS)}
              className="hidden sm:flex bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl px-6 py-2 shadow-lg shadow-purple-900/25 hover:shadow-xl hover:shadow-purple-900/30 transition-all duration-300 hover:-translate-y-0.5 text-sm"
            >
              Start Analysis
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden bg-black/80 backdrop-blur-xl border border-white/10 mt-2 rounded-2xl overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="p-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setCurrentView(item.view);
                  setIsMobileMenuOpen(false);
                }}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-3 ${currentView === item.view
                  ? "bg-purple-600/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
            <button
              onClick={() => {
                setCurrentView(ViewState.DRUG_ANALYSIS);
                setIsMobileMenuOpen(false);
              }}
              className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl py-3"
            >
              Start Analysis
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
