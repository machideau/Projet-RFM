# 📊 Plateforme de Segmentation Client RFM & Clustering K-Means

Une application web moderne, interactive et complète pour l'analyse comportementale client et la segmentation RFM (**Récence, Fréquence, Montant**) basée sur l’algorithme d’apprentissage non supervisé **K-Means**.

![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38BDF8?style=flat-square&logo=tailwindcss)
![Devise](https://img.shields.io/badge/Devise-FCFA%20%28XOF%29-emerald?style=flat-square)

---

## 🌟 Fonctionnalités Principales

### 1. 🧹 Nettoyage & Préparation des Données
- **Audit automatique** : Détection et filtrage des factures annulées (`C...`), des quantités négatives/nulles, des prix unitaire non positifs et des lignes sans identifiant client.
- **Rapports d'analyse** : Statistiques complètes avant/après nettoyage (nombre de lignes, clients uniques, volume de chiffre d'affaires).

### 2. 📐 Moteur de Calcul RFM & Feature Engineering
- **Métriques calculées** :
  - **Récence ($R$)** : Nombre de jours écoulés depuis le dernier achat.
  - **Fréquence ($F$)** : Nombre de transactions/factures uniques.
  - **Montant ($M$)** : Somme totale des dépenses.
  - **Panier Moyen** : Dépense moyenne par commande.
- **Normalisation mathématique** :
  - Winsorisation (Capping au percentile configurable, ex: 99ème percentile) pour traiter les valeurs aberrantes.
  - Transformation logarithmique $\ln(1 + x)$ pour réduire l'asymétrie.
  - Standardisation Z-score ($\mu = 0, \sigma = 1$) pour équilibrer l'influence des variables dans la distance euclidienne.

### 3. 🎯 Clustering K-Means & Recherche du $k$ Optimal
- **Évaluation multi-critères** :
  - Courbe du coude (Inertie intra-classe)
  - Score Silhouette moyen ($S_i \in [-1, 1]$)
  - Indice de Rand Ajusté (ARI) pour mesurer la stabilité inter-initialisations
  - Taille du plus petit segment (%)
- **Classification et nommage automatique** :
  - Attribution dynamique des labels métier (*Champions VIP, Clients Fidèles, Actifs Rentables, Nouveaux Prometteurs, Clients À Risque, Endormis Faible Valeur*) basée sur un score composite normalisé.

### 4. 💡 Plans d'Action Marketing & Ethique
- **Recommandations stratégiques** : Objectifs, canaux de communication préconisés (*E-mail, SMS Premium, Push*), offres suggérées et cadences d'interaction.
- **Garde-fous éthiques dynamiques** : Évaluation automatique des biais géographiques et contrôle de la pression marketing sur les clients vulnérables.

### 5. 🌍 Support Multi-devises (Devise par défaut : FCFA)
- Gestion et conversion d'affichage en **FCFA (XOF/XAF)** par défaut, avec possibilité d'ajuster la devise (*EUR €, USD $, GBP £, etc.*) et auto-détection contextuelle.

### 6. 📥 Exportation & Visualisations
- Visualisations interactives et plein écran avec Recharts (cartes 2D/3D, histogrammes, barres empilées, scatters).
- Exportation facile des données enrichies avec leur segment au format CSV.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 15](https://nextjs.org/) (App Router)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Style** : [Tailwind CSS](https://tailwindcss.com/) (Design Glassmorphism & Responsive)
- **Visualisations** : [Recharts](https://recharts.org/)
- **Rendu Mathématique** : [KaTeX](https://katex.org/) (Formules scientifiques et équations RFM en LaTeX)
- **Icônes** : [Lucide React](https://lucide.dev/)

---

## 🚀 Installation & Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) (v18+ recommandé)
- npm, yarn ou pnpm

### Directives d'installation

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd Projet-RFM

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📖 Structure du Projet

```text
Projet-RFM/
├── app/
│   ├── layout.tsx         # Layout principal (avec KaTeX CSS)
│   ├── page.tsx           # Page unique gérant les états globaux & onglets
│   └── globals.css        # Styles CSS globaux & utilitaires glassmorphism
├── components/
│   ├── Header.tsx         # Barre de navigation & indicateurs
│   ├── SidebarControls.tsx # Panneau de configuration (kMin, kMax, Cap, Devise)
│   ├── ChartContainer.tsx # Container réutilisable avec mode Plein Écran
│   ├── Latex.tsx          # Composant de rendu d'équations LaTeX
│   └── Tabs/              # Onglets principaux de l'application
│       ├── DataTab.tsx
│       ├── CleaningTab.tsx
│       ├── RfmTab.tsx
│       ├── KChoiceTab.tsx
│       ├── SegmentsTab.tsx
│       ├── RecommendationsTab.tsx
│       ├── ExportTab.tsx
│       └── HelpTab.tsx
├── lib/
│   ├── rfmEngine.ts       # Moteur algorithmique RFM & K-Means
│   ├── currencies.ts      # Gestionnaires de devises (FCFA par défaut)
│   └── sampleData.ts      # Générateur de jeu de données de démo
└── README.md
```

---

## 📄 Licence

Projet développé à des fins d'analyse décisionnelle et marketing. Libre de réutilisation et d'adaptation.
