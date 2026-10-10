import React, { useRef, useState } from "react";
import { Upload, Settings2, Sliders, FileSpreadsheet, RefreshCw, Layers, FileDown, Coins } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { normalizeRawData, RawTransaction } from "@/lib/rfmEngine";
import { CURRENCIES, Currency } from "@/lib/currencies";

interface SidebarControlsProps {
  onDataLoaded: (data: RawTransaction[], fileName: string) => void;
  capPercentile: number;
  setCapPercentile: (val: number) => void;
  kMin: number;
  kMax: number;
  setKRange: (range: [number, number]) => void;
  finalK: number;
  setFinalK: (k: number) => void;
  nStabilitySeeds: number;
  setNStabilitySeeds: (seeds: number) => void;
  onReset: () => void;
  fileName: string;
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  onDataLoaded,
  capPercentile,
  setCapPercentile,
  kMin,
  kMax,
  setKRange,
  finalK,
  setFinalK,
  nStabilitySeeds,
  setNStabilitySeeds,
  onReset,
  fileName,
  currency,
  setCurrency,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currencySearch, setCurrencySearch] = useState("");

  const detectCurrencyFromData = (rows: any[], filename: string): Currency | null => {
    if (!rows || rows.length === 0) return null;
    
    // 1. Check all header keys of the first row
    const keys = Object.keys(rows[0] || {});
    const allHeaderString = keys.join(" ").toLowerCase();

    if (allHeaderString.includes("fcfa") || allHeaderString.includes("xaf")) {
      return CURRENCIES.find((c) => c.code === "XAF") || null;
    }
    if (allHeaderString.includes("cfa") || allHeaderString.includes("xof")) {
      return CURRENCIES.find((c) => c.code === "XOF") || null;
    }
    if (allHeaderString.includes("£") || allHeaderString.includes("gbp")) {
      return CURRENCIES.find((c) => c.code === "GBP") || null;
    }
    if (allHeaderString.includes("€") || allHeaderString.includes("eur")) {
      return CURRENCIES.find((c) => c.code === "EUR") || null;
    }
    if (allHeaderString.includes("ca$") || allHeaderString.includes("cad")) {
      return CURRENCIES.find((c) => c.code === "CAD") || null;
    }
    if (allHeaderString.includes("a$") || allHeaderString.includes("aud")) {
      return CURRENCIES.find((c) => c.code === "AUD") || null;
    }
    if (allHeaderString.includes("$") || allHeaderString.includes("usd")) {
      return CURRENCIES.find((c) => c.code === "USD") || null;
    }
    if (allHeaderString.includes("chf")) {
      return CURRENCIES.find((c) => c.code === "CHF") || null;
    }
    if (allHeaderString.includes("mad") || allHeaderString.includes(" dh")) {
      return CURRENCIES.find((c) => c.code === "MAD") || null;
    }
    if (allHeaderString.includes("tnd") || allHeaderString.includes(" dt")) {
      return CURRENCIES.find((c) => c.code === "TND") || null;
    }
    if (allHeaderString.includes("dzd") || allHeaderString.includes(" da")) {
      return CURRENCIES.find((c) => c.code === "DZD") || null;
    }
    if (allHeaderString.includes("₦") || allHeaderString.includes("ngn")) {
      return CURRENCIES.find((c) => c.code === "NGN") || null;
    }

    // 2. Check sample cell values
    const sampleRows = rows.slice(0, 50);
    for (const r of sampleRows) {
      for (const val of Object.values(r)) {
        if (typeof val === "string") {
          const v = val.toLowerCase();
          if (v.includes("fcfa")) return CURRENCIES.find((c) => c.code === "XAF") || null;
          if (v.includes("cfa")) return CURRENCIES.find((c) => c.code === "XOF") || null;
          if (v.includes("£")) return CURRENCIES.find((c) => c.code === "GBP") || null;
          if (v.includes("€")) return CURRENCIES.find((c) => c.code === "EUR") || null;
          if (v.includes("$")) return CURRENCIES.find((c) => c.code === "USD") || null;
        }
      }
    }

    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name;
    const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const buffer = evt.target?.result;
        if (!buffer) return;
        const workbook = XLSX.read(buffer, { type: "binary" });
        let allRows: any[] = [];
        let rawJsonRows: any[] = [];
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          rawJsonRows = rawJsonRows.concat(json);
          const normalized = normalizeRawData(json, sheetName);
          allRows = allRows.concat(normalized);
        });
        
        if (allRows.length === 0) {
          alert("Erreur : Aucune donnée valide trouvée. Vérifiez que votre fichier respecte le format attendu (voir le modèle).");
          return;
        }
        if (allRows.length > 50000) {
          alert("Attention : Votre fichier contient plus de 50 000 lignes. Les calculs peuvent être lents sur certains navigateurs.");
        }

        const detected = detectCurrencyFromData(rawJsonRows, name);
        if (detected) {
          setCurrency(detected);
        }

        onDataLoaded(allRows, name);
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const normalized = normalizeRawData(results.data, name);
          if (normalized.length === 0) {
            alert("Erreur : Aucune donnée valide trouvée. Vérifiez que votre fichier respecte le format attendu (voir le modèle).");
            return;
          }
          if (normalized.length > 50000) {
            alert("Attention : Votre fichier contient plus de 50 000 lignes. Les calculs peuvent être lents sur certains navigateurs.");
          }

          const detected = detectCurrencyFromData(results.data as any[], name);
          if (detected) {
            setCurrency(detected);
          }

          onDataLoaded(normalized, name);
        },
      });
    }
  };

  const downloadTemplate = () => {
    const templateRows = [
      {
        InvoiceNo: "536365",
        StockCode: "85123A",
        Description: "WHITE HANGING HEART T-LIGHT HOLDER",
        Quantity: 6,
        InvoiceDate: "2010-12-01 08:26:00",
        UnitPrice: 2.55,
        CustomerID: 17850,
        Country: "United Kingdom",
      },
      {
        InvoiceNo: "536365",
        StockCode: "71053",
        Description: "WHITE METAL LANTERN",
        Quantity: 6,
        InvoiceDate: "2010-12-01 08:26:00",
        UnitPrice: 3.39,
        CustomerID: 17850,
        Country: "United Kingdom",
      },
      {
        InvoiceNo: "536366",
        StockCode: "22752",
        Description: "SET 7 BABUSHKA NESTING BOXES",
        Quantity: 2,
        InvoiceDate: "2010-12-01 08:28:00",
        UnitPrice: 7.65,
        CustomerID: 13047,
        Country: "United Kingdom",
      },
      {
        InvoiceNo: "C536379",
        StockCode: "85123A",
        Description: "WHITE HANGING HEART T-LIGHT HOLDER",
        Quantity: -1,
        InvoiceDate: "2010-12-01 09:41:00",
        UnitPrice: 2.55,
        CustomerID: 17850,
        Country: "United Kingdom",
      },
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

  return (
    <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5 flex flex-col gap-6 shadow-xs">
      {/* Importer Fichier */}
      <div>
        <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          Source des Données
        </h2>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 p-4 rounded-2xl text-center cursor-pointer transition-all group shadow-xs"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
            {fileName ? fileName : "Déposer un fichier .csv ou .xlsx"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Format attendu : UCI Online Retail II</p>
        </div>

        {/* Bouton télécharger le modèle */}
        <button
          onClick={downloadTemplate}
          className="mt-2.5 w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 rounded-xl text-[11px] font-bold transition-all border border-slate-200 hover:border-sky-300 group"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
          Télécharger le modèle de données (.csv)
        </button>
      </div>

      <hr className="border-slate-200" />

      {/* Sélecteur de Monnaie */}
      <div>
        <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          Monnaie d'Affichage
        </h2>
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          {/* Badge monnaie actuelle */}
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-700 font-semibold">Symbole sélectionné</span>
            <span className="font-mono font-extrabold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-lg text-sm">
              {currency.symbol}
            </span>
          </div>
          {/* Barre de recherche */}
          <input
            type="text"
            placeholder="Rechercher une monnaie..."
            value={currencySearch}
            onChange={(e) => setCurrencySearch(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
          />
          {/* Liste déroulante */}
          <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {CURRENCIES.filter((c) =>
              c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
              c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
              c.symbol.toLowerCase().includes(currencySearch.toLowerCase())
            ).map((c) => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c); setCurrencySearch(""); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between gap-2 ${
                  currency.code === c.code
                    ? "bg-amber-50 text-amber-800 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{c.name}</span>
                <span className="font-mono font-bold text-amber-700 shrink-0">{c.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Paramètres de Prétraitement */}
      <div>
        <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-sky-600" />
          Hyperparamètres K-Means
        </h2>

        {/* Percentile Plafonnement */}
        <div className="space-y-2 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex justify-between text-xs">
            <span className="text-slate-700 font-semibold">Winsorisation</span>
            <span className="font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
              {(capPercentile * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.90"
            max="1.00"
            step="0.01"
            value={capPercentile}
            onChange={(e) => setCapPercentile(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <p className="text-[10px] text-slate-500 font-medium">Plafonne les valeurs extrêmes avant transformation log</p>
        </div>

        {/* Plage k */}
        <div className="space-y-2 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex justify-between text-xs">
            <span className="text-slate-700 font-semibold">Plage d'évaluation k</span>
            <span className="font-mono text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded text-[11px] border border-sky-200">
              {kMin} à {kMax}
            </span>
          </div>
          <div className="flex gap-2 items-center pt-1">
            <input
              type="range"
              min="2"
              max="6"
              value={kMin}
              onChange={(e) => setKRange([parseInt(e.target.value), Math.max(parseInt(e.target.value) + 1, kMax)])}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <input
              type="range"
              min="3"
              max="10"
              value={kMax}
              onChange={(e) => setKRange([Math.min(kMin, parseInt(e.target.value) - 1), parseInt(e.target.value)])}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
          </div>
        </div>

        {/* Final k */}
        <div className="space-y-2 bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex justify-between text-xs">
            <span className="text-slate-800 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Nombre de clusters (k final)
            </span>
            <span className="font-mono text-emerald-700 font-extrabold text-sm bg-white px-2.5 py-0.5 rounded-xl border border-emerald-300 shadow-xs">
              k = {finalK}
            </span>
          </div>
          <input
            type="range"
            min={kMin}
            max={kMax}
            value={finalK}
            onChange={(e) => setFinalK(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Stabilité */}
      <div>
        <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
          Stabilité (Graines ARI)
        </h2>
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex justify-between text-xs">
            <span className="text-slate-700 font-semibold">Graines d'initialisation</span>
            <span className="font-mono text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
              {nStabilitySeeds} graines
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="12"
            value={nStabilitySeeds}
            onChange={(e) => setNStabilitySeeds(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      <div className="mt-auto pt-2">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Réinitialiser
        </button>
      </div>
    </aside>
  );
};
