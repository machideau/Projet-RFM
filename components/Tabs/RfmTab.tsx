import React from "react";
import { ProcessedFeature, RfmCustomer } from "@/lib/rfmEngine";
import { Target, TrendingUp, BarChart2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer } from "@/components/ChartContainer";

interface RfmTabProps {
  rfm: RfmCustomer[];
  processed: ProcessedFeature[];
  analysisDate: Date | null;
  currency: string;
}

export const RfmTab: React.FC<RfmTabProps> = ({ rfm, processed, analysisDate, currency }) => {
  if (!rfm || rfm.length === 0) return null;

  // Histogram Bin Generators
  const recencyHist = buildHistData(rfm.map((r) => r.Recency), 25, "Jours");
  const freqHist = buildHistData(rfm.map((r) => r.Frequency), 20, "Factures");
  const monetaryHist = buildHistData(rfm.map((r) => r.Monetary), 25, currency);

  const logRecHist = buildHistData(processed.map((p) => p.log_Recency), 25, "log(R)");
  const logFreqHist = buildHistData(processed.map((p) => p.log_Frequency), 20, "log(F)");
  const logMonHist = buildHistData(processed.map((p) => p.log_Monetary), 25, "log(M)");

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            Agrégation RFM Client
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Calculé sur {rfm.length.toLocaleString()} clients uniques
          </p>
        </div>
        {analysisDate && (
          <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 border border-slate-200 font-medium">
            Date de référence : <span className="font-bold text-emerald-700">{analysisDate.toISOString().split("T")[0]}</span>
          </div>
        )}
      </div>

      {/* Raw Distributions */}
      <ChartContainer
        title="Distributions Brutes (Récence, Fréquence, Montant)"
        icon={<BarChart2 className="w-4 h-4 text-sky-600" />}
        subtitle="Distribution de chaque variable avant prétraitement"
        heightClass="h-80"
      >
        {(isFullscreen) => (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <div className="h-full flex flex-col min-h-0">
              <span className="text-xs text-slate-700 font-bold mb-2 text-center">Récence (Jours)</span>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recencyHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bin" stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                    <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="h-full flex flex-col min-h-0">
              <span className="text-xs text-slate-700 font-bold mb-2 text-center">Fréquence (Commandes)</span>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={freqHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bin" stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                    <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="h-full flex flex-col min-h-0">
              <span className="text-xs text-slate-700 font-bold mb-2 text-center">Montant ({currency})</span>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monetaryHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bin" stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                    <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </ChartContainer>

      {/* Processed Log1p Distributions */}
      <ChartContainer
        title="Après Transformation (Winsorisation + log1p)"
        icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
        subtitle="Normalisation et réduction de l'asymétrie pour le clustering"
        heightClass="h-80"
      >
        {(isFullscreen) => (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <div className="h-full flex flex-col min-h-0">
              <span className="text-xs text-slate-700 font-bold mb-2 text-center">log_Recency</span>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logRecHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bin" stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                    <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="h-full flex flex-col min-h-0">
              <span className="text-xs text-slate-700 font-bold mb-2 text-center">log_Frequency</span>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logFreqHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bin" stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                    <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="h-full flex flex-col min-h-0">
              <span className="text-xs text-slate-700 font-bold mb-2 text-center">log_Monetary</span>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logMonHist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bin" stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <YAxis stroke="#64748b" fontSize={isFullscreen ? 12 : 10} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a", borderRadius: "12px" }} />
                    <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </ChartContainer>

      {/* RFM Table Preview */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Tableau RFM par Client (Extrait)</h3>
        </div>
        <div className="overflow-x-auto max-h-[450px]">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] sticky top-0">
              <tr>
                <th className="p-3.5">CustomerID</th>
                <th className="p-3.5 text-right">Récence (Jours)</th>
                <th className="p-3.5 text-right">Fréquence</th>
                <th className="p-3.5 text-right">Montant ({currency})</th>
                <th className="p-3.5 text-right">Panier Moyen ({currency})</th>
                <th className="p-3.5 text-right">Ancienneté (Jours)</th>
                <th className="p-3.5">Pays Principal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 font-mono text-[11px]">
              {rfm.slice(0, 20).map((row) => (
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

function buildHistData(values: number[], numBins: number, unit: string) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / numBins || 1;

  const bins = Array.from({ length: numBins }, (_, i) => {
    const low = min + i * step;
    const high = low + step;
    return {
      low,
      high,
      bin: `${low.toFixed(0)}`,
      count: 0,
    };
  });

  for (const v of values) {
    let idx = Math.floor((v - min) / step);
    if (idx >= numBins) idx = numBins - 1;
    if (idx < 0) idx = 0;
    bins[idx].count++;
  }

  return bins;
}
