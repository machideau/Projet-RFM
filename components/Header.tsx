import React from "react";
import { BarChart3, Database, Sparkles } from "lucide-react";

interface HeaderProps {
  onLoadDemo: () => void;
  rawCount: number;
  cleanCount: number;
  customerCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onLoadDemo, rawCount, cleanCount, customerCount }) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold shadow-md shadow-emerald-600/20">
            <BarChart3 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                Segmentation Clients <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">RFM</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {rawCount > 0 && (
            <div className="hidden md:flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-600 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Lignes brutes : <span className="font-mono font-bold text-slate-900">{rawCount.toLocaleString()}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-200" />
              <div>
                Nettoyées : <span className="font-mono font-bold text-emerald-600">{cleanCount.toLocaleString()}</span>
              </div>
              <div className="w-px h-3.5 bg-slate-200" />
              <div>
                Clients : <span className="font-mono font-bold text-sky-600">{customerCount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            onClick={onLoadDemo}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            Jeu de Démo
          </button>
        </div>
      </div>
    </header>
  );
};
