import React from "react";
import { AuditReport, RawTransaction } from "@/lib/rfmEngine";
import { CheckCircle2, ShieldAlert, DollarSign, Users, Filter, ArrowRight } from "lucide-react";

import { Latex } from "@/components/Latex";

interface CleaningTabProps {
  audit: AuditReport | null;
  clean: RawTransaction[];
  currency: string;
}

export const CleaningTab: React.FC<CleaningTabProps> = ({ audit, clean, currency }) => {
  if (!audit) return null;

  const pctRetained = ((audit.cleanRows / (audit.rawRows || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2.5 text-emerald-700 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Lignes Conservées</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{audit.cleanRows.toLocaleString()}</div>
          <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {pctRetained}% du jeu de données brut
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-sky-500">
          <div className="flex items-center gap-2.5 text-sky-700 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Clients Valides</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{audit.cleanCustomers.toLocaleString()}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Identifiants clients uniques filtrés</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2.5 text-amber-700 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Chiffre d'Affaires Net</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {currency}{audit.totalPositiveRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-amber-700 font-bold mt-1">Cumul des achats validés</div>
        </div>
      </div>

      {/* Detailed Audit Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-600" />
            Audit Détaillé de Filtration
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-600">Total lignes brutes chargées</span>
              <span className="font-mono font-bold text-slate-900">{audit.rawRows.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Factures d'annulation (Prefix 'C')
              </span>
              <span className="font-mono font-bold text-rose-600">{audit.cancelledInvoices.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Lignes avec quantité négative (<Latex formula="Q \le 0" />)
              </span>
              <span className="font-mono font-bold text-amber-600">{audit.negativeQuantities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                CustomerID manquant / non renseigné
              </span>
              <span className="font-mono font-bold text-indigo-600">{audit.missingCustomers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Prix unitaire non strictement positif (<Latex formula="P \le 0" />)
              </span>
              <span className="font-mono font-bold text-sky-600">{audit.nonPositivePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Doublons exacts éliminés
              </span>
              <span className="font-mono font-bold text-slate-600">{audit.exactDuplicates.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Filter className="w-4.5 h-4.5 text-emerald-600" />
              Charte des Règles Métier de Nettoyage
            </h3>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Exclusion des Annulations :</strong> Les transactions avec préfixe 'C' représentent des annulations de commande et sont totalement écartées du volume positif d'achat.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Identification Requise :</strong> Seuls les clients possédant un <code>CustomerID</code> explicite sont conservés pour permettre une modélisation comportementale individuelle.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Montants Strictement Positifs :</strong> Élimination des ajustements manuels d'inventaire ou cadeaux système où <Latex formula="\text{Quantity} \le 0" /> ou <Latex formula="\text{UnitPrice} \le 0" />.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
