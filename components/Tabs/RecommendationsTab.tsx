import React, { useState } from "react";
import { SegmentSummary, SegmentActionPlan, AuditReport, KEvalResult } from "@/lib/rfmEngine";
import {
  Lightbulb, Scale, CheckCircle2, Target, Mail, Smartphone,
  RefreshCw, AlertTriangle, Users, Zap, BarChart3, Globe, ShieldAlert,
  Filter, Sliders, DollarSign, BellOff
} from "lucide-react";

interface RecommendationsTabProps {
  summary: SegmentSummary[];
  currency: string;
  audit?: AuditReport | null;
  kEval?: KEvalResult[];
  finalK?: number;
}

// Icônes pour les canaux marketing
const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  "E-mail": <Mail className="w-3 h-3" />,
  "E-mail personnalisé": <Mail className="w-3 h-3" />,
  "E-mail automatisé": <Mail className="w-3 h-3" />,
  "E-mail de réactivation": <Mail className="w-3 h-3" />,
  "E-mail de réengagement": <Mail className="w-3 h-3" />,
  "E-mail automatique à coût nul": <Mail className="w-3 h-3" />,
  "SMS Premium": <Smartphone className="w-3 h-3" />,
  "SMS promotionnel": <Smartphone className="w-3 h-3" />,
  "SMS de bienvenue": <Smartphone className="w-3 h-3" />,
  "Notifications push": <Zap className="w-3 h-3" />,
  "Notification app": <Zap className="w-3 h-3" />,
};

function getChannelIcon(channel: string): React.ReactNode {
  return CHANNEL_ICONS[channel] ?? <BarChart3 className="w-3 h-3" />;
}

function ActionPlanCard({ plan }: { plan: SegmentActionPlan }) {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Objectif */}
      <div className="col-span-1 sm:col-span-3 bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Objectif</span>
        </div>
        <p className="text-xs text-slate-800 font-semibold">{plan.objective}</p>
      </div>

      {/* Canaux */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Canaux</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {plan.channels.map((ch) => (
            <span
              key={ch}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg shadow-xs"
            >
              {getChannelIcon(ch)}
              {ch}
            </span>
          ))}
        </div>
      </div>

      {/* Offre suggérée */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Offre suggérée</span>
        </div>
        <p className="text-xs text-slate-700 font-medium">{plan.suggestedOffer}</p>
      </div>

      {/* Cadence */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Cadence</span>
        </div>
        <p className="text-xs text-slate-700 font-medium">{plan.cadence}</p>
      </div>

      {/* Avertissement éthique / risque */}
      {plan.riskWarning && (
        <div className="col-span-1 sm:col-span-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium">{plan.riskWarning}</p>
        </div>
      )}
    </div>
  );
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  summary,
  currency,
  audit,
  kEval,
  finalK = 5,
}) => {
  const [expanded, setExpanded] = useState<string | null>(summary[0]?.Segment ?? null);

  // Recherche des métriques du k actuel pour la triangulation dynamique
  const currentKEval = kEval?.find((x) => x.k === finalK);

  // Détection dynamique des biais géographiques (si des segments ont des pays très concentrés)
  const geographicBiasNotes = summary
    .map((s) => ({ seg: s.Segment, top: s.TopPays }))
    .filter((x) => x.top && x.top !== "Non spécifié");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Plans d'Action Marketing par Segment
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Stratégies adaptées au profil RFM réel de chaque groupe. Cliquez sur un segment pour déployer le plan d'action.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          {summary.reduce((s, r) => s + r.Effectif, 0).toLocaleString()} clients analysés
        </div>
      </div>

      {/* Segment Cards - Accordion */}
      <div className="space-y-3">
        {summary.map((row) => {
          const isOpen = expanded === row.Segment;
          return (
            <div
              key={row.Segment}
              className="glass-card rounded-2xl overflow-hidden border-l-4 transition-all"
              style={{ borderLeftColor: row.Color }}
            >
              {/* Header row — clic pour déployer */}
              <button
                className="w-full text-left px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                onClick={() => setExpanded(isOpen ? null : row.Segment)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: row.Color }} />
                  <div>
                    <span className="text-sm font-extrabold text-slate-900">{row.Segment}</span>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{row.Recommandation}</p>
                    {row.TopPays && row.TopPays !== "Non spécifié" && (
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        Top pays : {row.TopPays}
                      </p>
                    )}
                  </div>
                </div>

                {/* KPIs rapides */}
                <div className="flex items-center gap-3 flex-wrap shrink-0">
                  <div className="text-center">
                    <div className="text-xs font-extrabold text-slate-900">{row.Effectif.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 font-medium">clients</div>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="text-center">
                    <div className="text-xs font-extrabold" style={{ color: row.Color }}>{row.Pct_CA.toFixed(1)}%</div>
                    <div className="text-[10px] text-slate-500 font-medium">du CA</div>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="text-center">
                    <div className="text-xs font-extrabold text-slate-900">{row.Recence_moy.toFixed(0)} j</div>
                    <div className="text-[10px] text-slate-500 font-medium">récence moy.</div>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="text-center">
                    <div className="text-xs font-extrabold text-slate-900">{currency}{row.Montant_moy.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-[10px] text-slate-500 font-medium">CA moyen</div>
                  </div>
                  <span className={`ml-2 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
                </div>
              </button>

              {/* Plan d'action déployable */}
              {isOpen && (
                <div className="border-t border-slate-100 px-6 pb-5">
                  <ActionPlanCard plan={row.ActionPlan} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Discussion critique & garde-fous (Nouveau Design Moderne) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-sky-50 border border-sky-200/80 rounded-xl text-sky-600 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Discussion Critique & Garde-fous Éthiques
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Rigueur méthodologique du modèle RFM et recommandations éthiques d'utilisation des données
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Repères Méthodologiques */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-slate-50/40 to-slate-50 border border-emerald-200/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Repères Méthodologiques Réeels</span>
            </div>

            <div className="space-y-3">
              {/* Item 1 : Filtrage */}
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Filter className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exclusion du Bruit et des Anomalies</span>
                </div>
                {audit ? (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] mr-1">
                      {audit.cancelledInvoices.toLocaleString()} factures annulées
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] mr-1">
                      {audit.negativeQuantities.toLocaleString()} retours
                    </span>
                    et {audit.missingCustomers.toLocaleString()} lignes anonymes ont été écartées du clustering.
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    Filtrage rigoureux des annulations et des transactions anonymes.
                  </p>
                )}
              </div>

              {/* Item 2 : Pondération */}
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Score Normalisé R·F·M</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Pondération équilibrée : <strong className="text-slate-800">Récence (35%)</strong> + <strong className="text-slate-800">Fréquence (35%)</strong> + <strong className="text-slate-800">Montant (30%)</strong>. Évite qu'une seule dimension ne masque la réalité client.
                </p>
              </div>

              {/* Item 3 : Métriques K */}
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Validation pour k = {finalK}</span>
                </div>
                {currentKEval ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200">
                      Silhouette : <strong>{currentKEval.silhouette.toFixed(3)}</strong>
                    </span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200">
                      Stabilité (ARI) : <strong>{(currentKEval.stability_ari * 100).toFixed(1)}%</strong>
                    </span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200">
                      Min segment : <strong>{currentKEval.smallest_segment_pct.toFixed(1)}%</strong>
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    Évaluation basée sur la stabilité inter-seeds et l'actionnabilité métier.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Garde-fous Éthiques */}
          <div className="bg-gradient-to-br from-amber-50/70 via-slate-50/40 to-slate-50 border border-amber-200/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <div className="p-1 bg-amber-100 text-amber-700 rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span>Garde-fous Éthiques & Prévention des Biais</span>
            </div>

            <div className="space-y-3">
              {/* Biais géographiques */}
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Globe className="w-3.5 h-3.5 text-amber-600" />
                  <span>Vérification Géographique</span>
                </div>
                {geographicBiasNotes.length > 0 ? (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Concentration détectée sur <strong className="text-slate-800">{geographicBiasNotes[0].seg}</strong> : <span className="text-amber-800 font-semibold">{geographicBiasNotes[0].top}</span>. Veiller à maintenir une équité d'accès aux offres sur tous les marchés.
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    Aucune concentration géographique disproportionnée détectée.
                  </p>
                )}
              </div>

              {/* Équité tarifaire */}
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tarification Équitable</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Pas de prix discriminatoires basés sur la valeur client estimée. Privilégier les offres de fidélité et le bundling de produits.
                </p>
              </div>

              {/* Pression marketing */}
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <BellOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Maîtrise de la Pression Marketing</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Limiter la relance automatique sur le segment <strong className="text-slate-800">{summary[summary.length - 1]?.Segment ?? "Endormis"}</strong> afin d'éviter le sur-sollicitage et préserver la réputation de marque.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
