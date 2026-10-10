import React from "react";
import { RfmCustomer, SegmentSummary } from "@/lib/rfmEngine";
import { Download, FileSpreadsheet, FileDown, Table2 } from "lucide-react";
import Papa from "papaparse";

interface ExportTabProps {
  rfmClustered: RfmCustomer[];
  summary: SegmentSummary[];
  currency: string;
}

export const ExportTab: React.FC<ExportTabProps> = ({ rfmClustered, summary, currency }) => {
  const downloadCsv = (data: any[], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    const templateRows = [
      { InvoiceNo: "536365", StockCode: "85123A", Description: "WHITE HANGING HEART T-LIGHT HOLDER", Quantity: 6, InvoiceDate: "2010-12-01 08:26:00", UnitPrice: 2.55, CustomerID: 17850, Country: "United Kingdom" },
      { InvoiceNo: "536365", StockCode: "71053", Description: "WHITE METAL LANTERN", Quantity: 6, InvoiceDate: "2010-12-01 08:26:00", UnitPrice: 3.39, CustomerID: 17850, Country: "United Kingdom" },
      { InvoiceNo: "536366", StockCode: "22752", Description: "SET 7 BABUSHKA NESTING BOXES", Quantity: 2, InvoiceDate: "2010-12-01 08:28:00", UnitPrice: 7.65, CustomerID: 13047, Country: "United Kingdom" },
      { InvoiceNo: "C536379", StockCode: "85123A", Description: "WHITE HANGING HEART T-LIGHT HOLDER", Quantity: -1, InvoiceDate: "2010-12-01 09:41:00", UnitPrice: 2.55, CustomerID: 17850, Country: "United Kingdom" },
    ];
    const csv = Papa.unparse(templateRows);
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modele_donnees_rfm.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const exportClientsData = rfmClustered.map((r) => ({
    ID_Client: r.CustomerID,
    Recence_Jours: r.Recency,
    Frequence: r.Frequency,
    Montant_Total: `${currency}${r.Monetary.toFixed(2)}`,
    Panier_Moyen: `${currency}${r.AverageBasket.toFixed(2)}`,
    Anciennete_Jours: r.CustomerTenureDays,
    Pays_Principal: r.CountryMode,
    Cluster_Numero: r.Cluster,
    Segment_Metier: r.segment_name,
  }));

  const exportSummaryData = summary.map((s) => ({
    Segment: s.Segment,
    Effectif_Clients: s.Effectif,
    Pourcentage_Clients: s.Pct_clients.toFixed(1) + "%",
    Pourcentage_CA: s.Pct_CA.toFixed(1) + "%",
    Recence_Moyenne_Jours: s.Recence_moy.toFixed(1),
    Frequence_Moyenne: s.Frequence_moy.toFixed(1),
    Montant_Moyen: s.Montant_moy.toFixed(2),
    Panier_Moyen: s.Panier_moy.toFixed(2),
    Top_Pays: s.TopPays,
  }));

  const exportRecommendationsData = summary.map((s) => ({
    Segment: s.Segment,
    Effectif_Clients: s.Effectif,
    Pourcentage_CA: s.Pct_CA.toFixed(1) + "%",
    Recommandation_Marketing: s.Recommandation,
  }));

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          Télécharger les Livrables CSV (en Français)
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Exportez les fichiers de résultats prêts pour le reporting et l'intégration CRM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Carte 1 */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-emerald-500 transition-all shadow-xs">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">rfm_clients_segments.csv</h4>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Fichier individuel avec l'identifiant client, les métriques RFM et le segment final assigné.
            </p>
          </div>
          <button
            onClick={() => downloadCsv(exportClientsData, "rfm_clients_segments.csv")}
            className="mt-6 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            Télécharger (.csv)
          </button>
        </div>

        {/* Carte 2 */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-sky-500 transition-all shadow-xs">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">tableau_synthese_segments.csv</h4>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tableau récapitulatif agrégé par segment (effectifs, % clients, % CA, moyennes RFM).
            </p>
          </div>
          <button
            onClick={() => downloadCsv(exportSummaryData, "tableau_synthese_segments.csv")}
            className="mt-6 flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20"
          >
            <Download className="w-4 h-4" />
            Télécharger (.csv)
          </button>
        </div>

        {/* Carte 3 */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-amber-500 transition-all shadow-xs">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">recommandations_segments.csv</h4>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Plan d'action marketing détaillé et recommandations d'activation par segment.
            </p>
          </div>
          <button
            onClick={() => downloadCsv(exportRecommendationsData, "recommandations_segments.csv")}
            className="mt-6 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20"
          >
            <Download className="w-4 h-4" />
            Télécharger (.csv)
          </button>
        </div>
      </div>

      {/* Modèle de données attendu */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Table2 className="w-4 h-4 text-sky-600" />
              Modèle de Données Attendu
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Structure de fichier requise pour l'import (CSV ou XLSX). La détection des colonnes est automatique et insensible à la casse.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="shrink-0 flex items-center gap-2 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5" />
            Télécharger le modèle (.csv)
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-extrabold text-slate-700">Colonne</th>
                <th className="text-left px-4 py-3 font-extrabold text-slate-700">Type</th>
                <th className="text-left px-4 py-3 font-extrabold text-slate-700">Description</th>
                <th className="text-left px-4 py-3 font-extrabold text-slate-700">Exemple</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { col: "InvoiceNo", type: "Texte", desc: "Numéro de facture. Préfixe 'C' = retour/annulation.", ex: "536365 / C536379" },
                { col: "StockCode", type: "Texte", desc: "Code produit (référence article).", ex: "85123A" },
                { col: "Description", type: "Texte", desc: "Libellé du produit.", ex: "WHITE METAL LANTERN" },
                { col: "Quantity", type: "Entier", desc: "Quantité commandée. Négatif = retour.", ex: "6 / -1" },
                { col: "InvoiceDate", type: "Date/Texte", desc: "Date et heure de la transaction.", ex: "2010-12-01 08:26:00" },
                { col: "UnitPrice", type: "Décimal", desc: "Prix unitaire en devise locale.", ex: "2.55" },
                { col: "CustomerID", type: "Numérique", desc: "Identifiant unique du client. Vide = anonyme (exclu).", ex: "17850" },
                { col: "Country", type: "Texte", desc: "Pays d'origine de la commande.", ex: "United Kingdom" },
              ].map((row, i) => (
                <tr key={row.col} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-4 py-3">
                    <code className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[11px] border border-sky-100">
                      {row.col}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-medium">{row.type}</td>
                  <td className="px-4 py-3 text-slate-700">{row.desc}</td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-slate-500 text-[11px]">{row.ex}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-400 font-medium mt-3">
          💡 Les noms de colonnes alternatifs sont acceptés : <code className="font-mono">invoice_no</code>, <code className="font-mono">customer_id</code>, <code className="font-mono">unit_price</code>, etc.
        </p>
      </div>
    </div>
  );
};
