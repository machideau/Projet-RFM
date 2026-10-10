"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import { Header } from "@/components/Header";
import { SidebarControls } from "@/components/SidebarControls";
import { DataTab } from "@/components/Tabs/DataTab";
import { CleaningTab } from "@/components/Tabs/CleaningTab";
import { RfmTab } from "@/components/Tabs/RfmTab";
import { KChoiceTab } from "@/components/Tabs/KChoiceTab";
import { SegmentsTab } from "@/components/Tabs/SegmentsTab";
import { RecommendationsTab } from "@/components/Tabs/RecommendationsTab";
import { ExportTab } from "@/components/Tabs/ExportTab";
import { generateSampleDataset } from "@/lib/sampleData";
import {
  cleanTransactions,
  computeRfm,
  prepareFeatures,
  evaluateKRange,
  runKMeans,
  assignSegmentNames,
  RawTransaction,
  RfmCustomer,
} from "@/lib/rfmEngine";
import { Database, Filter, Target, Activity, Tag, Lightbulb, Download, BookOpen, Loader2 } from "lucide-react";
import { CURRENCIES, DEFAULT_CURRENCY, Currency } from "@/lib/currencies";
import { HelpTab } from "@/components/Tabs/HelpTab";

export default function Home() {
  const [raw, setRaw] = useState<RawTransaction[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [capPercentile, setCapPercentile] = useState<number>(0.99);
  const [kRange, setKRange] = useState<[number, number]>([2, 8]);
  const [finalK, setFinalK] = useState<number>(5);
  const [nStabilitySeeds, setNStabilitySeeds] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  const [isPending, startTransition] = useTransition();

  // Charger le jeu démo et les paramètres par défaut
  useEffect(() => {
    // Restaurer depuis localStorage
    if (typeof window !== "undefined") {
      const savedCurrencyCode = localStorage.getItem("rfm_currency");
      if (savedCurrencyCode) {
        const found = CURRENCIES.find((c) => c.code === savedCurrencyCode);
        if (found) setCurrency(found);
      }
      
      const savedCap = localStorage.getItem("rfm_capPercentile");
      if (savedCap) setCapPercentile(parseFloat(savedCap));
      
      const savedFinalK = localStorage.getItem("rfm_finalK");
      if (savedFinalK) setFinalK(parseInt(savedFinalK));
    }

    const demo = generateSampleDataset();
    setRaw(demo);
    setFileName("Jeu Démo (Ventes Simulées)");
  }, []);

  // Sauvegarder les paramètres dans localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rfm_currency", currency.code);
      localStorage.setItem("rfm_capPercentile", capPercentile.toString());
      localStorage.setItem("rfm_finalK", finalK.toString());
    }
  }, [currency, capPercentile, finalK]);

  const handleDataLoaded = (data: RawTransaction[], name: string) => {
    startTransition(() => {
      setRaw(data);
      setFileName(name);
    });
  };

  const handleLoadDemo = () => {
    const demo = generateSampleDataset();
    setRaw(demo);
    setFileName("Jeu Démo (UCI Online Retail II Simulée)");
  };

  const handleReset = () => {
    setCapPercentile(0.99);
    setKRange([2, 8]);
    setFinalK(5);
    setNStabilitySeeds(5);
  };

  // 1. Nettoyage
  const { clean, audit } = useMemo(() => {
    if (raw.length === 0) return { clean: [], audit: null };
    return cleanTransactions(raw);
  }, [raw]);

  // 2. Variables RFM
  const { rfm, analysisDate } = useMemo(() => {
    if (clean.length === 0) return { rfm: [], analysisDate: null };
    return computeRfm(clean);
  }, [clean]);

  // 3. Transformation & Features
  const { processed, scaledX } = useMemo(() => {
    if (rfm.length === 0) return { processed: [], scaledX: [] };
    const { processed } = prepareFeatures(rfm, capPercentile);
    const scaledX: [number, number, number][] = processed.map((p) => p.scaled);
    return { processed, scaledX };
  }, [rfm, capPercentile]);

  // 4. Évaluation k Range
  const kEval = useMemo(() => {
    if (scaledX.length === 0) return [];
    return evaluateKRange(scaledX, kRange[0], kRange[1], nStabilitySeeds);
  }, [scaledX, kRange, nStabilitySeeds]);

  // 5. Clustering Final & Nommage Segments
  const { rfmClustered, summary } = useMemo(() => {
    if (scaledX.length === 0 || rfm.length === 0) return { rfmClustered: [] as RfmCustomer[], summary: [] };
    const mainRun = runKMeans(scaledX, finalK, 42, 100);
    const rfmWithCluster = rfm.map((r, i) => ({ ...r, Cluster: mainRun.labels[i] }));
    const { namedRfm, summary } = assignSegmentNames(rfmWithCluster, finalK);
    return { rfmClustered: namedRfm, summary };
  }, [scaledX, rfm, finalK]);

  const tabs = [
    { label: "Données", icon: Database },
    { label: "Nettoyage", icon: Filter },
    { label: "Variables RFM", icon: Target },
    { label: "Choix de k", icon: Activity },
    { label: "Segments", icon: Tag },
    { label: "Recommandations", icon: Lightbulb },
    { label: "Export", icon: Download },
    { label: "Guide & Aide", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans bg-ambient-spotlight">
      <Header
        onLoadDemo={handleLoadDemo}
        rawCount={raw.length}
        cleanCount={clean.length}
        customerCount={rfm.length}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar Controls */}
        <SidebarControls
          onDataLoaded={handleDataLoaded}
          capPercentile={capPercentile}
          setCapPercentile={setCapPercentile}
          kMin={kRange[0]}
          kMax={kRange[1]}
          setKRange={setKRange}
          finalK={finalK}
          setFinalK={setFinalK}
          nStabilitySeeds={nStabilitySeeds}
          setNStabilitySeeds={setNStabilitySeeds}
          onReset={handleReset}
          fileName={fileName}
          currency={currency}
          setCurrency={setCurrency}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 flex overflow-x-auto gap-1.5 pb-1">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab View */}
          <div className="pt-2">
            {activeTab === 0 && <DataTab raw={raw} currency={currency.symbol} />}
            {activeTab === 1 && <CleaningTab audit={audit} clean={clean} currency={currency.symbol} />}
            {activeTab === 2 && <RfmTab rfm={rfm} processed={processed} analysisDate={analysisDate} currency={currency.symbol} />}
            {activeTab === 3 && <KChoiceTab kEval={kEval} finalK={finalK} />}
            {activeTab === 4 && <SegmentsTab rfmClustered={rfmClustered} summary={summary} finalK={finalK} currency={currency.symbol} />}
            {activeTab === 5 && (
              <RecommendationsTab
                summary={summary}
                currency={currency.symbol}
                audit={audit}
                kEval={kEval}
                finalK={finalK}
              />
            )}
            {activeTab === 6 && <ExportTab rfmClustered={rfmClustered} summary={summary} currency={currency.symbol} />}
            {activeTab === 7 && <HelpTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
