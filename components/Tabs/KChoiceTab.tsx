import React from "react";
import { KEvalResult } from "@/lib/rfmEngine";
import { Activity, LineChart, ShieldCheck, CheckCircle } from "lucide-react";
import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

import { ChartContainer } from "@/components/ChartContainer";

interface KChoiceTabProps {
  kEval: KEvalResult[];
  finalK: number;
}

export const KChoiceTab: React.FC<KChoiceTabProps> = ({ kEval, finalK }) => {
  if (!kEval || kEval.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Informative Banner */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Évaluation Multi-critères du Nombre de Segments (k)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            K-Means appliqué aux variables <code>log1p + standardisées</code> (Inertie, Silhouette, ARI Stabilité).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-emerald-700 font-extrabold text-xs shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          k retenu = {finalK}
        </div>
      </div>

      {/* 3 Metric Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Méthode du Coude (Inertie) */}
        <ChartContainer
          title="Méthode du Coude (Inertie)"
          icon={<LineChart className="w-4 h-4 text-sky-600" />}
          subtitle="Somme des carrés intra-cluster"
          heightClass="h-72"
        >
          {(isFullscreen) => (
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={kEval}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="k" stroke="#64748b" fontSize={isFullscreen ? 12 : 11} label={{ value: "k", position: "insideBottom", offset: -5, fill: "#64748b" }} />
                <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 11} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="inertia" stroke="#0284c7" strokeWidth={isFullscreen ? 3.5 : 2.5} dot={{ r: isFullscreen ? 6 : 4, fill: "#0284c7" }} />
              </ReLineChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Score de Silhouette */}
        <ChartContainer
          title="Score de Silhouette"
          icon={<Activity className="w-4 h-4 text-amber-600" />}
          subtitle="Compacité et séparation des clusters"
          heightClass="h-72"
        >
          {(isFullscreen) => (
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={kEval}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="k" stroke="#64748b" fontSize={isFullscreen ? 12 : 11} label={{ value: "k", position: "insideBottom", offset: -5, fill: "#64748b" }} />
                <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 11} domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="silhouette" stroke="#d97706" strokeWidth={isFullscreen ? 3.5 : 2.5} dot={{ r: isFullscreen ? 6 : 4, fill: "#d97706" }} />
              </ReLineChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Stabilité Moyen (ARI) */}
        <ChartContainer
          title="Stabilité Inter-Initialisations (ARI)"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          subtitle="Indice de Rand ajusté entre graines"
          heightClass="h-72"
        >
          {(isFullscreen) => (
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={kEval}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="k" stroke="#64748b" fontSize={isFullscreen ? 12 : 11} label={{ value: "k", position: "insideBottom", offset: -5, fill: "#64748b" }} />
                <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 11} domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                <Line type="monotone" dataKey="stability_ari" stroke="#059669" strokeWidth={isFullscreen ? 3.5 : 2.5} dot={{ r: isFullscreen ? 6 : 4, fill: "#059669" }} />
              </ReLineChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Summary Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Tableau Récapitulatif des k Évalués</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">k (Clusters)</th>
                <th className="p-3.5 text-right">Inertie</th>
                <th className="p-3.5 text-right">Silhouette</th>
                <th className="p-3.5 text-right">Stabilité ARI</th>
                <th className="p-3.5 text-right">Taille Plus Petit Segment (%)</th>
                <th className="p-3.5 text-center">Sélection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-mono text-[11px]">
              {kEval.map((row) => {
                const isSelected = row.k === finalK;
                return (
                  <tr
                    key={row.k}
                    className={`transition-colors ${
                      isSelected ? "bg-emerald-50/80 font-bold" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="p-3.5 text-slate-900 font-bold">k = {row.k}</td>
                    <td className="p-3.5 text-right text-sky-700">{row.inertia.toFixed(1)}</td>
                    <td className="p-3.5 text-right text-amber-700">{row.silhouette.toFixed(3)}</td>
                    <td className="p-3.5 text-right text-emerald-700">{row.stability_ari.toFixed(3)}</td>
                    <td className="p-3.5 text-right text-indigo-700">{row.smallest_segment_pct.toFixed(1)}%</td>
                    <td className="p-3.5 text-center">
                      {isSelected ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] uppercase font-sans font-extrabold border border-emerald-300 shadow-xs">
                          Retenu
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
