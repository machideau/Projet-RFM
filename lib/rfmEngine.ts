/**
 * Moteur de calcul RFM et Clustering K-Means en TypeScript (100% en Français)
 */

export interface RawTransaction {
  InvoiceNo: string;
  StockCode: string;
  Description: string;
  Quantity: number;
  InvoiceDate: string | Date;
  UnitPrice: number;
  CustomerID: string;
  Country: string;
  SourceSheet?: string;
  LineAmount?: number;
}

export interface AuditReport {
  rawRows: number;
  rawCustomers: number;
  cancelledInvoices: number;
  negativeQuantities: number;
  missingCustomers: number;
  nonPositivePrice: number;
  nonPositiveQuantity: number;
  exactDuplicates: number;
  cleanRows: number;
  cleanCustomers: number;
  totalPositiveRevenue: number;
}

export interface RfmCustomer {
  CustomerID: string;
  Recency: number;
  Frequency: number;
  Monetary: number;
  FirstPurchase: string;
  LastPurchase: string;
  CustomerTenureDays: number;
  AverageBasket: number;
  CountryMode: string;
  Cluster?: number;
  segment_name?: string;
}

export interface ProcessedFeature {
  CustomerID: string;
  log_Recency: number;
  log_Frequency: number;
  log_Monetary: number;
  scaled: [number, number, number];
}

export interface KEvalResult {
  k: number;
  inertia: number;
  silhouette: number;
  stability_ari: number;
  smallest_segment_pct: number;
}

export interface SegmentActionPlan {
  objective: string;
  channels: string[];
  suggestedOffer: string;
  cadence: string;
  riskWarning?: string;
}

export interface SegmentSummary {
  Segment: string;
  ClusterId: number;
  Effectif: number;
  Pct_clients: number;
  Pct_CA: number;
  Recence_moy: number;
  Frequence_moy: number;
  Montant_moy: number;
  Panier_moy: number;
  TopPays: string;
  Recommandation: string;
  ActionPlan: SegmentActionPlan;
  Color: string;
}

export const SEGMENT_COLORS: Record<string, string> = {
  "Champions (VIP)": "#10B981",
  "Clients Fidèles": "#0284C7",
  "Actifs Rentables": "#3B82F6",
  "Nouveaux Prometteurs": "#06B6D4",
  "Nouveaux Occasionnels": "#EAB308",
  "Clients À Risque": "#F97316",
  "Clients En Déclin": "#EC4899",
  "Endormis Faible Valeur": "#64748B",
};

const REQUIRED_CANDIDATES: Record<string, string[]> = {
  InvoiceNo: ["InvoiceNo", "Invoice", "invoice", "Invoice No", "N_Facture", "Facture"],
  StockCode: ["StockCode", "Stock Code", "stockcode", "Code_Article", "CodeProduit"],
  Description: ["Description", "description", "Libelle", "Produit"],
  Quantity: ["Quantity", "quantity", "Qty", "Quantite", "Quantité"],
  InvoiceDate: ["InvoiceDate", "Invoice Date", "invoicedate", "Date", "Date_Facture"],
  UnitPrice: ["UnitPrice", "Price", "unitprice", "Unit Price", "Prix_Unitaire", "Prix"],
  CustomerID: ["CustomerID", "Customer ID", "customerid", "Customer_ID", "ID_Client", "CodeClient"],
  Country: ["Country", "country", "Pays"],
};

export function normalizeRawData(rows: any[], sourceName: string): RawTransaction[] {
  if (!rows || rows.length === 0) return [];
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  const mapKey: Record<string, string> = {};
  for (const [target, candidates] of Object.entries(REQUIRED_CANDIDATES)) {
    const found = candidates.find((c) => keys.includes(c));
    if (found) {
      mapKey[found] = target;
    }
  }

  return rows.map((r) => {
    const normalized: any = { SourceSheet: sourceName };
    for (const k of keys) {
      const targetKey = mapKey[k] || k;
      normalized[targetKey] = r[k];
    }
    return {
      InvoiceNo: String(normalized.InvoiceNo ?? "").trim(),
      StockCode: String(normalized.StockCode ?? "").trim(),
      Description: String(normalized.Description ?? "").trim(),
      Quantity: Number(normalized.Quantity ?? 0),
      InvoiceDate: normalized.InvoiceDate ? new Date(normalized.InvoiceDate) : new Date(),
      UnitPrice: Number(normalized.UnitPrice ?? 0),
      CustomerID: normalized.CustomerID !== undefined && normalized.CustomerID !== null && normalized.CustomerID !== ""
        ? String(Math.floor(Number(normalized.CustomerID)))
        : "",
      Country: String(normalized.Country ?? "").trim(),
      SourceSheet: sourceName,
    };
  });
}

export function cleanTransactions(raw: RawTransaction[]): { clean: RawTransaction[]; audit: AuditReport } {
  let cancelledInvoices = 0;
  let negativeQuantities = 0;
  let missingCustomers = 0;
  let nonPositivePrice = 0;
  let nonPositiveQuantity = 0;
  let exactDuplicates = 0;

  const rawCustomersSet = new Set<string>();
  const seenHashes = new Set<string>();

  const clean: RawTransaction[] = [];

  for (const t of raw) {
    if (t.CustomerID) rawCustomersSet.add(t.CustomerID);

    const isCancelled = t.InvoiceNo.toUpperCase().startsWith("C");
    if (isCancelled) cancelledInvoices++;

    if (t.Quantity < 0) negativeQuantities++;
    if (!t.CustomerID || t.CustomerID === "NaN" || t.CustomerID === "0") missingCustomers++;
    if (t.UnitPrice <= 0) nonPositivePrice++;
    if (t.Quantity <= 0) nonPositiveQuantity++;

    const hash = `${t.InvoiceNo}|${t.StockCode}|${t.Quantity}|${t.InvoiceDate}|${t.UnitPrice}|${t.CustomerID}`;
    if (seenHashes.has(hash)) {
      exactDuplicates++;
      continue;
    }
    seenHashes.add(hash);

    if (
      !isCancelled &&
      t.CustomerID &&
      t.CustomerID !== "NaN" &&
      t.CustomerID !== "0" &&
      t.Quantity > 0 &&
      t.UnitPrice > 0 &&
      !isNaN(new Date(t.InvoiceDate).getTime())
    ) {
      const lineAmt = t.Quantity * t.UnitPrice;
      clean.push({ ...t, LineAmount: lineAmt });
    }
  }

  const cleanCustomersSet = new Set(clean.map((c) => c.CustomerID));
  const totalPositiveRevenue = clean.reduce((sum, c) => sum + (c.LineAmount || 0), 0);

  const audit: AuditReport = {
    rawRows: raw.length,
    rawCustomers: rawCustomersSet.size,
    cancelledInvoices,
    negativeQuantities,
    missingCustomers,
    nonPositivePrice,
    nonPositiveQuantity,
    exactDuplicates,
    cleanRows: clean.length,
    cleanCustomers: cleanCustomersSet.size,
    totalPositiveRevenue,
  };

  return { clean, audit };
}

export function computeRfm(clean: RawTransaction[]): { rfm: RfmCustomer[]; analysisDate: Date } {
  let maxTime = 0;
  for (const c of clean) {
    const time = new Date(c.InvoiceDate).getTime();
    if (time > maxTime) maxTime = time;
  }
  const analysisDate = new Date(maxTime + 24 * 60 * 60 * 1000);

  const clientMap = new Map<
    string,
    {
      invoices: Set<string>;
      totalMonetary: number;
      minDate: number;
      maxDate: number;
      countries: Map<string, number>;
    }
  >();

  for (const c of clean) {
    const cid = c.CustomerID;
    const time = new Date(c.InvoiceDate).getTime();
    let entry = clientMap.get(cid);
    if (!entry) {
      entry = {
        invoices: new Set(),
        totalMonetary: 0,
        minDate: time,
        maxDate: time,
        countries: new Map(),
      };
      clientMap.set(cid, entry);
    }
    entry.invoices.add(c.InvoiceNo);
    entry.totalMonetary += c.LineAmount || 0;
    if (time < entry.minDate) entry.minDate = time;
    if (time > entry.maxDate) entry.maxDate = time;
    entry.countries.set(c.Country, (entry.countries.get(c.Country) || 0) + 1);
  }

  const rfm: RfmCustomer[] = [];
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const [cid, data] of clientMap.entries()) {
    const recencyDays = Math.floor((analysisDate.getTime() - data.maxDate) / oneDayMs);
    const tenureDays = Math.floor((analysisDate.getTime() - data.minDate) / oneDayMs);
    const frequency = data.invoices.size;
    const monetary = data.totalMonetary;

    let countryMode = "";
    let maxC = 0;
    for (const [country, count] of data.countries.entries()) {
      if (count > maxC) {
        maxC = count;
        countryMode = country;
      }
    }

    rfm.push({
      CustomerID: cid,
      Recency: recencyDays,
      Frequency: frequency,
      Monetary: monetary,
      FirstPurchase: new Date(data.minDate).toISOString().split("T")[0],
      LastPurchase: new Date(data.maxDate).toISOString().split("T")[0],
      CustomerTenureDays: tenureDays,
      AverageBasket: frequency > 0 ? monetary / frequency : 0,
      CountryMode: countryMode,
    });
  }

  return { rfm, analysisDate };
}

function getQuantile(arr: number[], q: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function prepareFeatures(
  rfm: RfmCustomer[],
  capPercentile: number
): { processed: ProcessedFeature[]; means: [number, number, number]; stds: [number, number, number] } {
  const recencies = rfm.map((r) => r.Recency);
  const frequencies = rfm.map((r) => r.Frequency);
  const monetaries = rfm.map((r) => r.Monetary);

  const capR = getQuantile(recencies, capPercentile);
  const capF = getQuantile(frequencies, capPercentile);
  const capM = getQuantile(monetaries, capPercentile);

  const logsR: number[] = [];
  const logsF: number[] = [];
  const logsM: number[] = [];

  for (const r of rfm) {
    const cappedR = Math.min(r.Recency, capR);
    const cappedF = Math.min(r.Frequency, capF);
    const cappedM = Math.min(r.Monetary, capM);

    logsR.push(Math.log1p(Math.max(0, cappedR)));
    logsF.push(Math.log1p(Math.max(0, cappedF)));
    logsM.push(Math.log1p(Math.max(0, cappedM)));
  }

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], m: number) =>
    Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length) || 1;

  const mR = mean(logsR);
  const sR = std(logsR, mR);
  const mF = mean(logsF);
  const sF = std(logsF, mF);
  const mM = mean(logsM);
  const sM = std(logsM, mM);

  const processed: ProcessedFeature[] = rfm.map((r, i) => ({
    CustomerID: r.CustomerID,
    log_Recency: logsR[i],
    log_Frequency: logsF[i],
    log_Monetary: logsM[i],
    scaled: [(logsR[i] - mR) / sR, (logsF[i] - mF) / sF, (logsM[i] - mM) / sM],
  }));

  return { processed, means: [mR, mF, mM], stds: [sR, sF, sM] };
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function runKMeans(
  X: [number, number, number][],
  k: number,
  seed: number = 42,
  maxIter: number = 100
): { labels: number[]; centroids: [number, number, number][]; inertia: number } {
  const n = X.length;
  const rng = seededRandom(seed);

  const centroids: [number, number, number][] = [];
  const initialIdx = Math.floor(rng() * n);
  centroids.push([...X[initialIdx]]);

  while (centroids.length < k) {
    const dists = X.map((point) => {
      let minDist = Infinity;
      for (const c of centroids) {
        const d = (point[0] - c[0]) ** 2 + (point[1] - c[1]) ** 2 + (point[2] - c[2]) ** 2;
        if (d < minDist) minDist = d;
      }
      return minDist;
    });

    const sumDist = dists.reduce((a, b) => a + b, 0);
    const target = rng() * sumDist;
    let acc = 0;
    let chosen = 0;
    for (let i = 0; i < n; i++) {
      acc += dists[i];
      if (acc >= target) {
        chosen = i;
        break;
      }
    }
    centroids.push([...X[chosen]]);
  }

  let labels = new Array<number>(n).fill(0);
  let changed = true;
  let iter = 0;

  while (changed && iter < maxIter) {
    changed = false;
    iter++;

    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        const d =
          (X[i][0] - centroids[c][0]) ** 2 +
          (X[i][1] - centroids[c][1]) ** 2 +
          (X[i][2] - centroids[c][2]) ** 2;
        if (d < minDist) {
          minDist = d;
          bestCluster = c;
        }
      }
      if (labels[i] !== bestCluster) {
        labels[i] = bestCluster;
        changed = true;
      }
    }

    const counts = new Array<number>(k).fill(0);
    const sums: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0]);

    for (let i = 0; i < n; i++) {
      const c = labels[i];
      counts[c]++;
      sums[c][0] += X[i][0];
      sums[c][1] += X[i][1];
      sums[c][2] += X[i][2];
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = [sums[c][0] / counts[c], sums[c][1] / counts[c], sums[c][2] / counts[c]];
      }
    }
  }

  let inertia = 0;
  for (let i = 0; i < n; i++) {
    const c = centroids[labels[i]];
    inertia += (X[i][0] - c[0]) ** 2 + (X[i][1] - c[1]) ** 2 + (X[i][2] - c[2]) ** 2;
  }

  return { labels, centroids, inertia };
}

export function computeSilhouette(X: [number, number, number][], labels: number[], k: number): number {
  const n = X.length;
  if (n > 2000) {
    const sampledIdx: number[] = [];
    const step = Math.floor(n / 1000);
    for (let i = 0; i < n; i += step) sampledIdx.push(i);

    let totalS = 0;
    for (const i of sampledIdx) {
      totalS += pointSilhouette(i, X, labels, k);
    }
    return totalS / sampledIdx.length;
  }

  let totalS = 0;
  for (let i = 0; i < n; i++) {
    totalS += pointSilhouette(i, X, labels, k);
  }
  return totalS / n;
}

function pointSilhouette(i: number, X: [number, number, number][], labels: number[], k: number): number {
  const ownCluster = labels[i];
  let aSum = 0;
  let aCount = 0;

  const bSums = new Array<number>(k).fill(0);
  const bCounts = new Array<number>(k).fill(0);

  for (let j = 0; j < X.length; j++) {
    if (i === j) continue;
    const dist = Math.sqrt(
      (X[i][0] - X[j][0]) ** 2 + (X[i][1] - X[j][0]) ** 2 + (X[i][2] - X[j][2]) ** 2
    );
    const c = labels[j];
    if (c === ownCluster) {
      aSum += dist;
      aCount++;
    } else {
      bSums[c] += dist;
      bCounts[c]++;
    }
  }

  const a = aCount > 0 ? aSum / aCount : 0;
  let b = Infinity;
  for (let c = 0; c < k; c++) {
    if (c === ownCluster || bCounts[c] === 0) continue;
    const avg = bSums[c] / bCounts[c];
    if (avg < b) b = avg;
  }

  if (b === Infinity) return 0;
  const maxAB = Math.max(a, b);
  return maxAB === 0 ? 0 : (b - a) / maxAB;
}

export function computeAdjustedRandIndex(labelsA: number[], labelsB: number[]): number {
  const n = labelsA.length;
  if (n === 0) return 1.0;

  const contingency: Map<string, number> = new Map();
  const aCounts: Map<number, number> = new Map();
  const bCounts: Map<number, number> = new Map();

  for (let i = 0; i < n; i++) {
    const a = labelsA[i];
    const b = labelsB[i];
    const key = `${a},${b}`;

    contingency.set(key, (contingency.get(key) || 0) + 1);
    aCounts.set(a, (aCounts.get(a) || 0) + 1);
    bCounts.set(b, (bCounts.get(b) || 0) + 1);
  }

  const nChoose2 = (n * (n - 1)) / 2;

  let sumNij2 = 0;
  for (const count of contingency.values()) {
    sumNij2 += (count * (count - 1)) / 2;
  }

  let sumAi2 = 0;
  for (const count of aCounts.values()) {
    sumAi2 += (count * (count - 1)) / 2;
  }

  let sumBj2 = 0;
  for (const count of bCounts.values()) {
    sumBj2 += (count * (count - 1)) / 2;
  }

  const expectedIndex = (sumAi2 * sumBj2) / nChoose2;
  const maxIndex = (sumAi2 + sumBj2) / 2;
  const denominator = maxIndex - expectedIndex;

  if (denominator === 0) return 1.0;
  return (sumNij2 - expectedIndex) / denominator;
}

export function evaluateKRange(
  X: [number, number, number][],
  kMin: number,
  kMax: number,
  nStabilitySeeds: number = 5
): KEvalResult[] {
  const results: KEvalResult[] = [];

  for (let k = kMin; k <= kMax; k++) {
    const mainRun = runKMeans(X, k, 42);
    const silhouette = computeSilhouette(X, mainRun.labels, k);

    const ariScores: number[] = [];
    const seedRuns: number[][] = [];
    for (let s = 0; s < nStabilitySeeds; s++) {
      const run = runKMeans(X, k, 100 + s * 17);
      seedRuns.push(run.labels);
    }

    for (let i = 0; i < seedRuns.length; i++) {
      for (let j = i + 1; j < seedRuns.length; j++) {
        ariScores.push(computeAdjustedRandIndex(seedRuns[i], seedRuns[j]));
      }
    }

    const avgAri = ariScores.reduce((a, b) => a + b, 0) / (ariScores.length || 1);

    const counts = new Map<number, number>();
    for (const l of mainRun.labels) counts.set(l, (counts.get(l) || 0) + 1);
    const minSize = Math.min(...Array.from(counts.values()));
    const smallestPct = (minSize / X.length) * 100;

    results.push({
      k,
      inertia: mainRun.inertia,
      silhouette,
      stability_ari: avgAri,
      smallest_segment_pct: smallestPct,
    });
  }

  return results;
}

// Données de plan d'action métier par segment — source unique de vérité
const SEGMENT_ACTION_PLANS: Record<string, {
  recommandation: string;
  plan: SegmentActionPlan;
}> = {
  "Champions (VIP)": {
    recommandation: "Vos meilleurs clients : récents, fréquents, forte valeur. Priorité absolue de rétention.",
    plan: {
      objective: "Fidéliser et transformer en ambassadeurs actifs de la marque",
      channels: ["E-mail personnalisé", "SMS Premium", "Programme de fidélité VIP"],
      suggestedOffer: "Accès anticipé aux nouveautés, invitations exclusives, cadeaux relationnels",
      cadence: "Communication mensuelle qualitative — ne pas saturer",
      riskWarning: "Trop de sollicitations commerciales peut altérer la relation avec ces clients précieux",
    },
  },
  "Clients Fidèles": {
    recommandation: "Clients réguliers et rentables, légèrement moins récents que les Champions.",
    plan: {
      objective: "Augmenter la valeur du panier et consolider la fidélité long terme",
      channels: ["E-mail", "Notifications push", "Programme de points"],
      suggestedOffer: "Paliers de réduction sur volume, bundling produits complémentaires",
      cadence: "Bimensuelle avec offres progressives",
    },
  },
  "Actifs Rentables": {
    recommandation: "Bons clients avec un niveau de dépenses solide, à transformer en clients fidèles.",
    plan: {
      objective: "Développer la fréquence d'achat et augmenter le panier moyen",
      channels: ["E-mail", "Retargeting digital", "Recommandations produits"],
      suggestedOffer: "Offres groupées (bundles), livraison gratuite à partir d'un seuil",
      cadence: "Hebdomadaire ou bi-hebdomadaire selon la saisonnalité",
    },
  },
  "Nouveaux Prometteurs": {
    recommandation: "Clients récents avec un premier achat de valeur élevée — potentiel fort.",
    plan: {
      objective: "Ancrer le comportement d'achat et déclencher un deuxième achat rapide",
      channels: ["Séquence e-mail d'onboarding", "SMS de bienvenue", "Notification app"],
      suggestedOffer: "Code promo de bienvenue valable 15 jours, guide des best-sellers",
      cadence: "J+1, J+7, J+15 après le premier achat",
    },
  },
  "Nouveaux Occasionnels": {
    recommandation: "Clients récents mais avec un seul achat ou une faible valeur initiale.",
    plan: {
      objective: "Stimuler un second achat avant que l'intérêt ne retombe",
      channels: ["E-mail automatisé", "Retargeting social"],
      suggestedOffer: "Bon de réduction de 10–15% sur la prochaine commande",
      cadence: "Séquence automatique J+3, J+10 après l'achat",
      riskWarning: "Ne pas surinvestir en marketing avant de confirmer le potentiel du client",
    },
  },
  "Clients À Risque": {
    recommandation: "Anciens bons clients devenus inactifs. Fenêtre de reconquête encore ouverte.",
    plan: {
      objective: "Réactiver avant le churn définitif",
      channels: ["E-mail de réactivation", "SMS promotionnel", "Retargeting display"],
      suggestedOffer: "Offre promotionnelle agressive et limitée dans le temps (ex: -20% valable 7 jours)",
      cadence: "Campagne courte et intensive sur 2–3 semaines, puis décision de stop/continue",
      riskWarning: "Après 2 campagnes sans réponse, réduire la pression pour ne pas atteindre le score de spam",
    },
  },
  "Clients En Déclin": {
    recommandation: "Clients en perte de vitesse : fréquence et montants en baisse progressive.",
    plan: {
      objective: "Stopper le déclin et relancer l'engagement produit",
      channels: ["E-mail de réengagement", "Enquête satisfaction", "Offre spéciale retour"],
      suggestedOffer: "Sondage avec coupon de récompense, mise en avant de nouvelles collections",
      cadence: "1 à 2 touches sur 30 jours, puis réévaluation",
    },
  },
  "Endormis Faible Valeur": {
    recommandation: "Clients perdus avec une valeur historique faible. ROI marketing quasi-nul.",
    plan: {
      objective: "Minimiser les coûts — relance automatisée uniquement",
      channels: ["E-mail automatique à coût nul"],
      suggestedOffer: "Offre générique de réactivation, sans discount important",
      cadence: "Une seule tentative trimestrielle, puis désabonnement des listes actives",
      riskWarning: "Investir davantage sur ce segment est contre-productif. Prioriser les autres groupes.",
    },
  },
};

/**
 * Calcule un score RFM normalisé composite [0, 1] pour chaque cluster.
 * Score = (R_norm_inv * 0.35 + F_norm * 0.35 + M_norm * 0.30)
 * R est inversé : une faible récence (achat récent) = score élevé.
 */
function computeNormalizedRfmScores(
  profiles: { cluster: number; recencyMean: number; frequencyMean: number; monetaryMean: number }[]
): Map<number, number> {
  const scores = new Map<number, number>();
  if (profiles.length === 0) return scores;

  const minR = Math.min(...profiles.map((p) => p.recencyMean));
  const maxR = Math.max(...profiles.map((p) => p.recencyMean));
  const minF = Math.min(...profiles.map((p) => p.frequencyMean));
  const maxF = Math.max(...profiles.map((p) => p.frequencyMean));
  const minM = Math.min(...profiles.map((p) => p.monetaryMean));
  const maxM = Math.max(...profiles.map((p) => p.monetaryMean));

  const rangeR = maxR - minR || 1;
  const rangeF = maxF - minF || 1;
  const rangeM = maxM - minM || 1;

  for (const p of profiles) {
    // Récence inversée : achat récent = score élevé
    const rNorm = 1 - (p.recencyMean - minR) / rangeR;
    const fNorm = (p.frequencyMean - minF) / rangeF;
    const mNorm = (p.monetaryMean - minM) / rangeM;
    scores.set(p.cluster, rNorm * 0.35 + fNorm * 0.35 + mNorm * 0.30);
  }

  return scores;
}

/**
 * Attribue dynamiquement un label métier à chaque cluster selon son score RFM normalisé,
 * adapté au nombre de clusters k (2–10+).
 */
function mapScoreToSegmentName(
  score: number,
  rank: number,
  totalClusters: number,
  recencyMean: number,
  frequencyMean: number,
  monetaryMean: number,
  globalRecencyMean: number
): string {
  // Découpage en percentiles selon k
  const topThreshold = 0.75;
  const upperMidThreshold = 0.55;
  const midThreshold = 0.40;
  const lowerMidThreshold = 0.25;
  const lowThreshold = 0.10;

  // Champion : top score et récence très faible
  if (score >= topThreshold && recencyMean <= globalRecencyMean * 0.5) return "Champions (VIP)";

  // Fidèle : score élevé mais pas le top
  if (score >= topThreshold) return "Clients Fidèles";

  // Actif rentable : bon score, montant solide
  if (score >= upperMidThreshold && monetaryMean > 0) return "Actifs Rentables";

  // Nouveau prometteur : achat très récent, fréquence faible
  if (recencyMean <= globalRecencyMean * 0.4 && frequencyMean <= 2) return "Nouveaux Prometteurs";

  // Nouveau occasionnel : score moyen, peu fréquent
  if (score >= midThreshold && frequencyMean <= 3) return "Nouveaux Occasionnels";

  // En déclin : moyen-bas score, pas le pire
  if (score >= lowerMidThreshold && recencyMean > globalRecencyMean) return "Clients En Déclin";

  // À risque : récence très élevée, ancienne valeur non nulle
  if (recencyMean > globalRecencyMean * 1.5 && monetaryMean > 0) return "Clients À Risque";

  // Bas score : endormis
  if (score < lowThreshold) return "Endormis Faible Valeur";

  // Fallback selon rank relatif
  if (rank === 0) return "Clients Fidèles";
  if (rank === totalClusters - 1) return "Endormis Faible Valeur";
  if (recencyMean > globalRecencyMean) return "Clients À Risque";
  return "Nouveaux Occasionnels";
}

export function assignSegmentNames(
  rfmClustered: RfmCustomer[],
  k: number
): { namedRfm: RfmCustomer[]; summary: SegmentSummary[] } {
  // --- Étape 1 : Agrégation des stats par cluster ---
  const clusterStats = new Map<
    number,
    {
      count: number;
      recencySum: number;
      frequencySum: number;
      monetarySum: number;
      basketSum: number;
    }
  >();

  for (let c = 0; c < k; c++) {
    clusterStats.set(c, { count: 0, recencySum: 0, frequencySum: 0, monetarySum: 0, basketSum: 0 });
  }

  for (const r of rfmClustered) {
    const c = r.Cluster ?? 0;
    const stat = clusterStats.get(c);
    if (!stat) continue;
    stat.count++;
    stat.recencySum += r.Recency;
    stat.frequencySum += r.Frequency;
    stat.monetarySum += r.Monetary;
    stat.basketSum += r.AverageBasket;
  }

  const profiles = Array.from(clusterStats.entries())
    .filter(([, s]) => s.count > 0)
    .map(([cluster, s]) => ({
      cluster,
      count: s.count,
      recencyMean: s.recencySum / s.count,
      frequencyMean: s.frequencySum / s.count,
      monetaryMean: s.monetarySum / s.count,
      basketMean: s.basketSum / s.count,
      monetaryTotal: s.monetarySum,
    }));

  // --- Étape 2 : Score RFM normalisé ---
  const rfmScores = computeNormalizedRfmScores(profiles);
  const globalRecencyMean = profiles.reduce((s, p) => s + p.recencyMean, 0) / (profiles.length || 1);

  // Tri des clusters du meilleur au pire score pour connaître le rang
  const sortedByScore = [...profiles].sort(
    (a, b) => (rfmScores.get(b.cluster) ?? 0) - (rfmScores.get(a.cluster) ?? 0)
  );

  // --- Étape 3 : Attribution des noms ---
  const nameMap = new Map<number, string>();
  const usedNames = new Set<string>();

  for (let rank = 0; rank < sortedByScore.length; rank++) {
    const p = sortedByScore[rank];
    const score = rfmScores.get(p.cluster) ?? 0;

    let name = mapScoreToSegmentName(
      score,
      rank,
      sortedByScore.length,
      p.recencyMean,
      p.frequencyMean,
      p.monetaryMean,
      globalRecencyMean
    );

    // Résolution des conflits de noms : fallback par rang si déjà pris
    if (usedNames.has(name)) {
      const fallbacks = [
        "Champions (VIP)", "Clients Fidèles", "Actifs Rentables",
        "Nouveaux Prometteurs", "Nouveaux Occasionnels",
        "Clients En Déclin", "Clients À Risque", "Endormis Faible Valeur",
      ];
      // Choisir le premier fallback non encore utilisé qui correspond à la position relative
      const available = fallbacks.filter((n) => !usedNames.has(n));
      // Sélectionner selon la position (les meilleurs scores prennent les labels du haut)
      const ratioPosition = rank / (sortedByScore.length - 1 || 1);
      const fallbackIdx = Math.round(ratioPosition * (available.length - 1));
      name = available[fallbackIdx] ?? available[0] ?? `Cluster ${p.cluster}`;
    }

    nameMap.set(p.cluster, name);
    usedNames.add(name);
  }

  // --- Étape 4 : Enrichissement du tableau clients ---
  const namedRfm = rfmClustered.map((r) => ({
    ...r,
    segment_name: nameMap.get(r.Cluster ?? 0) ?? `Cluster ${r.Cluster}`,
  }));

  // --- Étape 5 : Construction du résumé ---
  const totalRevenue = profiles.reduce((sum, p) => sum + p.monetaryTotal, 0);
  const totalClients = rfmClustered.length;

  // Compter la répartition par pays dans chaque cluster
  const clusterCountries = new Map<number, Map<string, number>>();
  for (const r of namedRfm) {
    const c = r.Cluster ?? 0;
    if (!clusterCountries.has(c)) clusterCountries.set(c, new Map<string, number>());
    const countryMap = clusterCountries.get(c)!;
    const country = r.CountryMode || "Non spécifié";
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  }

  const summary: SegmentSummary[] = profiles.map((p) => {
    const segName = nameMap.get(p.cluster) ?? `Cluster ${p.cluster}`;
    const planData = SEGMENT_ACTION_PLANS[segName] ?? {
      recommandation: "Action marketing à définir selon le profil du segment.",
      plan: {
        objective: "À définir",
        channels: ["E-mail"],
        suggestedOffer: "Offre personnalisée",
        cadence: "Mensuelle",
      },
    };

    const cMap = clusterCountries.get(p.cluster);
    let topPaysStr = "Non spécifié";
    if (cMap && cMap.size > 0) {
      const sortedCountries = Array.from(cMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cName, count]) => `${cName} (${Math.round((count / p.count) * 100)}%)`);
      topPaysStr = sortedCountries.join(", ");
    }

    return {
      Segment: segName,
      ClusterId: p.cluster,
      Effectif: p.count,
      Pct_clients: totalClients > 0 ? (p.count / totalClients) * 100 : 0,
      Pct_CA: totalRevenue > 0 ? (p.monetaryTotal / totalRevenue) * 100 : 0,
      Recence_moy: p.recencyMean,
      Frequence_moy: p.frequencyMean,
      Montant_moy: p.monetaryMean,
      Panier_moy: p.basketMean,
      TopPays: topPaysStr,
      Recommandation: planData.recommandation,
      ActionPlan: planData.plan,
      Color: SEGMENT_COLORS[segName] ?? "#888888",
    };
  });

  // Trier par % CA décroissant
  summary.sort((a, b) => b.Pct_CA - a.Pct_CA);

  return { namedRfm, summary };
}


