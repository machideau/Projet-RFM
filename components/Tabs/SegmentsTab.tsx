import React, { useState } from "react";
import { RfmCustomer, SegmentSummary } from "@/lib/rfmEngine";
import { Users, PieChart, ScatterChart as ScatterIcon, Search } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import { ChartContainer } from "@/components/ChartContainer";

interface SegmentsTabProps {
  rfmClustered: RfmCustomer[];
  summary: SegmentSummary[];
  finalK: number;
  currency: string;
}

export const SegmentsTab: React.FC<SegmentsTabProps> = ({ rfmClustered, summary, finalK, currency }) => {
  const [selectedSegment, setSelectedSegment] = useState<string>(summary[0]?.Segment || "");
  const [searchTerm, setSearchTerm] = useState<string>("");

  if (!summary || summary.length === 0) return null;

  const activeSegment = selectedSegment || summary[0]?.Segment;

  const filteredCustomers = rfmClustered
    .filter((r) => r.segment_name === activeSegment)
    .filter((r) =>
      searchTerm === ""
        ? true
        : r.CustomerID.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.CountryMode.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const scatterData = rfmClustered.slice(0, 400).map((r) => ({
    x: r.Recency,
    y: Math.max(1, r.Monetary),
    z: r.Frequency,
    segment: r.segment_name || "Cluster",
    cid: r.CustomerID,
  }));

  return (
    <div className="space-y-6">
      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summary.map((seg) => (
          <div
            key={seg.Segment}
            onClick={() => setSelectedSegment(seg.Segment)}
            style={{ borderColor: seg.Segment === activeSegment ? seg.Color : "#e2e8f0" }}
            className={`cursor-pointer glass-card p-4 rounded-2xl transition-all hover:scale-[1.02] relative overflow-hidden ${
              seg.Segment === activeSegment ? "ring-2 ring-emerald-500/40 bg-emerald-50/20 shadow-md" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: seg.Color }} />
              <span className="text-xs font-bold text-slate-900 truncate">{seg.Segment}</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{seg.Effectif} <span className="text-xs text-slate-500 font-normal">clients</span></div>
            <div className="text-xs font-extrabold mt-1" style={{ color: seg.Color }}>
              {seg.Pct_CA.toFixed(1)}% du Chiffre d'Affaires
            </div>
          </div>
        ))}
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart: Revenue % */}
        <ChartContainer
          title="Contribution au Chiffre d'Affaires (%)"
          icon={<PieChart className="w-4 h-4 text-emerald-600" />}
          subtitle="Part de chaque segment dans le chiffre d'affaires total généré"
          heightClass="h-80"
        >
          {(isFullscreen) => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={summary} margin={{ left: isFullscreen ? 40 : 20, right: 20 }}>
                <XAxis type="number" stroke="#64748b" fontSize={isFullscreen ? 12 : 11} unit="%" />
                <YAxis dataKey="Segment" type="category" stroke="#64748b" fontSize={isFullscreen ? 13 : 11} width={isFullscreen ? 180 : 130} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                <Bar dataKey="Pct_CA" radius={[0, 6, 6, 0]}>
                  {summary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Scatter Plot: Récence vs Montant */}
        <ChartContainer
          title="Cartographie RFM (Récence vs Montant)"
          icon={<ScatterIcon className="w-4 h-4 text-sky-600" />}
          subtitle="Positionnement individuel des clients selon récence et valeur"
          heightClass="h-80"
        >
          {(isFullscreen) => (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <XAxis type="number" dataKey="x" name="Récence" unit="j" stroke="#64748b" fontSize={isFullscreen ? 12 : 11} />
                <YAxis type="number" dataKey="y" name="Montant" unit={currency} stroke="#64748b" fontSize={isFullscreen ? 12 : 11} scale="log" domain={["auto", "auto"]} />
                <ZAxis type="number" dataKey="z" range={isFullscreen ? [40, 400] : [30, 250]} name="Fréquence" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                <Scatter data={scatterData} fill="#0284c7" opacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Segment Drilldown Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-4.5 h-4.5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Exploration par Client :</h3>
            <select
              value={activeSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="bg-white text-emerald-800 font-extrabold text-xs border border-slate-300 rounded-xl px-3.5 py-1.5 focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              {summary.map((s) => (
                <option key={s.Segment} value={s.Segment}>
                  {s.Segment} ({s.Effectif} clients)
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Chercher ID Client / Pays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans shadow-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[450px]">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] sticky top-0 backdrop-blur-md">
              <tr>
                <th className="p-3.5">ID Client</th>
                <th className="p-3.5 text-right">Récence (Jours)</th>
                <th className="p-3.5 text-right">Fréquence</th>
                <th className="p-3.5 text-right">Montant Total ({currency})</th>
                <th className="p-3.5 text-right">Panier Moyen ({currency})</th>
                <th className="p-3.5 text-right">Ancienneté (Jours)</th>
                <th className="p-3.5">Pays Principal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-mono text-[11px]">
              {filteredCustomers
                .sort((a, b) => b.Monetary - a.Monetary)
                .slice(0, 40)
                .map((row) => (
                  <tr key={row.CustomerID} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-3.5 font-bold text-sky-700">{row.CustomerID}</td>
                    <td className="p-3.5 text-right font-bold text-sky-800">{row.Recency} j</td>
                    <td className="p-3.5 text-right font-bold text-amber-800">{row.Frequency}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-700">{currency}{row.Monetary.toFixed(2)}</td>
                    <td className="p-3.5 text-right text-slate-800">{currency}{row.AverageBasket.toFixed(2)}</td>
                    <td className="p-3.5 text-right text-slate-500">{row.CustomerTenureDays} j</td>
                    <td className="p-3.5 text-slate-700 font-sans font-medium">{row.CountryMode}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
