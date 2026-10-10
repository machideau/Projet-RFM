"use client";

import React, { useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";

interface ChartContainerProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: (isFullscreen: boolean) => React.ReactNode;
  heightClass?: string;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  icon,
  subtitle,
  children,
  heightClass = "h-72",
  className = "",
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div className={`glass-card rounded-2xl p-6 flex flex-col ${heightClass} ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                {title}
              </h4>
              {subtitle && <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={() => setIsFullscreen(true)}
            title="Agrandir en plein écran"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 w-full min-h-0">
          {children(false)}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md p-4 md:p-8 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {icon}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                >
                  <Minimize2 className="w-4 h-4" />
                  Réduire
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full pt-6 min-h-0">
              {children(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
