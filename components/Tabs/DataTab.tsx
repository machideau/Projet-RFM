import React, { useState, useMemo } from "react";
import { RawTransaction } from "@/lib/rfmEngine";
import { Database, Calendar, Layers, Hash, Sparkles, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

import { ChartContainer } from "@/components/ChartContainer";

interface DataTabProps {
  raw: RawTransaction[];
  currency: string;
}

export const DataTab: React.FC<DataTabProps> = ({ raw, currency }) => {
  if (!raw || raw.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 glass-card rounded-2xl">
        Aucune donnée chargée. Veuillez importer un fichier ou charger le jeu de données démo.
      </div>
    );
  }

  const [previewSize, setPreviewSize] = useState<number>(50);
  const sample = previewSize === -1 ? raw : raw.slice(0, previewSize);
  const sheets = new Set(raw.map((r) => r.SourceSheet || "Standard"));

  // Compute timeline data
  const timelineData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of raw) {
      const d = new Date(r.InvoiceDate);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, transactions: count }));
  }, [raw]);

  const minDate = new Date(Math.min(...raw.map((r) => new Date(r.InvoiceDate).getTime()))).toISOString().split("T")[0];
  const maxDate = new Date(Math.max(...raw.map((r) => new Date(r.InvoiceDate).getTime()))).toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2.5 text-slate-600 mb-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Hash className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Lignes Brutes</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{raw.length.toLocaleString()}</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-sky-500">
          <div className="flex items-center gap-2.5 text-slate-600 mb-2">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Database className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Colonnes</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">8</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2.5 text-slate-600 mb-2">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Sources / Feuilles</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{sheets.size}</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2.5 text-slate-600 mb-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Période d'Analyse</span>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2 font-mono flex items-center gap-1.5">
            <span className="text-amber-700">{minDate}</span>
            <span className="text-slate-400">→</span>
            <span className="text-amber-700">{maxDate}</span>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      {timelineData.length > 0 && (
        <ChartContainer
          title="Évolution Temporelle des Transactions"
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          subtitle="Nombre de commandes enregistrées par mois"
          heightClass="h-72"
        >
          {(isFullscreen) => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={isFullscreen ? 12 : 10} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="transactions" fill="#059669" radius={[4, 4, 0, 0]} name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      )}

      {/* Raw Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Aperçu des données 
              <span className="ml-2 text-xs font-normal text-slate-500">
                (Affichage : {previewSize === -1 ? "Toutes" : previewSize} lignes)
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={previewSize}
              onChange={(e) => setPreviewSize(Number(e.target.value))}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value={50}>50 lignes</option>
              <option value={100}>100 lignes</option>
              <option value={500}>500 lignes</option>
              <option value={-1}>Tout afficher</option>
            </select>
            <span className="text-xs text-slate-600 font-semibold bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
              Harmonisé UCI Online Retail II
            </span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] sticky top-0">
              <tr>
                <th className="p-3.5">InvoiceNo</th>
                <th className="p-3.5">StockCode</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Quantity</th>
                <th className="p-3.5">InvoiceDate</th>
                <th className="p-3.5 text-right">UnitPrice ({currency})</th>
                <th className="p-3.5">CustomerID</th>
                <th className="p-3.5">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-mono text-[11px]">
              {sample.map((row, idx) => (
                <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="p-3.5 font-bold text-emerald-700">{row.InvoiceNo}</td>
                  <td className="p-3.5 text-slate-500">{row.StockCode}</td>
                  <td className="p-3.5 text-slate-900 font-sans truncate max-w-[220px] font-medium">{row.Description}</td>
                  <td className={`p-3.5 text-right font-bold ${row.Quantity < 0 ? "text-rose-600" : "text-slate-900"}`}>
                    {row.Quantity}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {new Date(row.InvoiceDate).toISOString().split("T")[0]}
                  </td>
                  <td className="p-3.5 text-right text-slate-800">{currency}{row.UnitPrice.toFixed(2)}</td>
                  <td className="p-3.5 text-sky-700 font-bold">{row.CustomerID || "-"}</td>
                  <td className="p-3.5 text-slate-700 font-sans">{row.Country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
