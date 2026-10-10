import React from "react";
import { Info, Target, TrendingUp, AlertTriangle, Users, BookOpen, Sigma, Cpu } from "lucide-react";
import { Latex } from "@/components/Latex";

export const HelpTab: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Introduction Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-sky-500">
        <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-sky-600" />
          Guide & Méthodologie Mathématique RFM
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Cette plateforme segmente votre base de données clients en combinant l'analyse comportementale RFM (Récence, Fréquence, Montant) et les méthodes d'apprentissage non supervisé (K-Means).
        </p>
      </div>

      {/* RFM Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">R</span>
              Récence (Recency)
            </h3>
            <p className="text-xs text-slate-600 mb-3">Nombre de jours écoulés depuis le dernier achat par rapport à la date de référence.</p>
          </div>
          <Latex formula="\text{Recency} = T_{\text{ref}} - \max(t_i)" block />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">F</span>
              Fréquence (Frequency)
            </h3>
            <p className="text-xs text-slate-600 mb-3">Nombre distinct de factures ou de commandes passées par le client.</p>
          </div>
          <Latex formula="\text{Frequency} = \left| \{ \text{InvoiceNo}_i \} \right|" block />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">M</span>
              Montant (Monetary)
            </h3>
            <p className="text-xs text-slate-600 mb-3">Chiffre d'affaires cumulé total généré par l'ensemble des achats du client.</p>
          </div>
          <Latex formula="\text{Monetary} = \sum_{j} (Q_j \times P_j)" block />
        </div>
      </div>

      {/* Math Formulations & Preprocessing */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <Sigma className="w-5 h-5 text-indigo-600" />
          Pipeline de Prétraitement & Formules Mathématiques
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Winsorisation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              1. Winsorisation (Plafonnement des Outliers)
            </h4>
            <p className="text-slate-600 mb-2">
              Écrête les valeurs extrêmes au quantile <Latex formula="q \in [0.90, 1.00]" /> afin d'éviter la distorsion des centroïdes :
            </p>
            <Latex formula="\tilde{x}_i = \min(x_i, Q_q)" block />
          </div>

          {/* Log1p Transform */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              2. Transformation Logarithmique
            </h4>
            <p className="text-slate-600 mb-2">
              Compresse les queues de distribution asymétriques à forte variance :
            </p>
            <Latex formula="x_{\text{log}} = \ln(1 + \tilde{x}_i)" block />
          </div>

          {/* Standardisation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              3. Centrage-Réduction (StandardScaler)
            </h4>
            <p className="text-slate-600 mb-2">
              Harmonise les échelles de chaque variable <Latex formula="(R, F, M)" /> avec moyenne nulle et variance unitaire :
            </p>
            <Latex formula="z_i = \frac{x_{\text{log}} - \mu}{\sigma}" block />
          </div>

          {/* K-Means Inertia */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              4. Optimisation K-Means (Inertie WCSS)
            </h4>
            <p className="text-slate-600 mb-2">
              Minimisation de la somme des carrés intra-cluster :
            </p>
            <Latex formula="J(k) = \sum_{j=1}^{k} \sum_{z_i \in C_j} \| z_i - \mu_j \|^2" block />
          </div>
        </div>

        {/* Evaluation Metrics */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            5. Critères de Choix du Nombre de Clusters (<Latex formula="k" />)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-slate-700 mb-1">Score de Silhouette :</p>
              <Latex formula="s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}, \quad s(i) \in [-1, 1]" block />
              <p className="text-slate-500 text-[11px] mt-1">
                Où <Latex formula="a(i)" /> est la distance intra-cluster moyenne et <Latex formula="b(i)" /> la distance au cluster voisin le plus proche.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-1">Stabilité (Indice de Rand Ajusté ARI) :</p>
              <Latex formula="\text{ARI} = \frac{\text{Index} - \mathbb{E}[\text{Index}]}{\max(\text{Index}) - \mathbb{E}[\text{Index}]}" block />
              <p className="text-slate-500 text-[11px] mt-1">
                Mesure la concordance des partitions obtenues sur plusieurs graines d'initialisation aléatoires.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segment Interpretations */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="bg-slate-100/50 p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Interprétation Métier des Segments
          </h3>
        </div>
        <div className="p-0">
          <ul className="divide-y divide-slate-100">
            <li className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                <strong className="text-sm text-slate-900">Champions / VIP</strong>
              </div>
              <p className="text-xs text-slate-600 pl-6">Vos meilleurs clients. Récence très faible (<Latex formula="R \downarrow" />), fréquence (<Latex formula="F \uparrow" />) et montant (<Latex formula="M \uparrow" />) très élevés. <em>Action : Récompenses exclusives, statut VIP, early access.</em></p>
            </li>
            <li className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#3498DB]"></span>
                <strong className="text-sm text-slate-900">Actifs réguliers / rentables</strong>
              </div>
              <p className="text-xs text-slate-600 pl-6">Achètent fréquemment avec un bon panier. <em>Action : Cross-selling, programmes de fidélité par paliers.</em></p>
            </li>
            <li className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#F1C40F]"></span>
                <strong className="text-sm text-slate-900">Nouveaux occasionnels</strong>
              </div>
              <p className="text-xs text-slate-600 pl-6">Clients récents (<Latex formula="R \downarrow" />) mais avec un nombre d'achats réduit (<Latex formula="F \approx 1" />). <em>Action : Séquence d'onboarding, coupon sur le 2ème achat.</em></p>
            </li>
            <li className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#E67E22]"></span>
                <strong className="text-sm text-slate-900">À risque (At Risk)</strong>
              </div>
              <p className="text-xs text-slate-600 pl-6">Anciens clients réguliers dont l'inactivité augmente (<Latex formula="R \uparrow" />). <em>Action : Campagne de reconquête ciblée et offres spéciales réengagement.</em></p>
            </li>
            <li className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-3 h-3 rounded-full bg-[#95A5A6]"></span>
                <strong className="text-sm text-slate-900">Endormis faible valeur</strong>
              </div>
              <p className="text-xs text-slate-600 pl-6">Inactifs de longue date avec une valeur globale très faible. <em>Action : Éviter les dépenses marketing superflues.</em></p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
