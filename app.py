"""
Dashboard interactif de segmentation clients RFM (K-means)
Basé sur le TP "Segmentation clients RFM" - UCI Online Retail II
"""

from __future__ import annotations

import io
import warnings
from dataclasses import dataclass

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score, silhouette_score
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore", category=FutureWarning)

RANDOM_STATE = 42

st.set_page_config(
    page_title="Segmentation clients RFM",
    page_icon="📊",
    layout="wide",
)

# ----------------------------------------------------------------------------
# Utilitaires
# ----------------------------------------------------------------------------

RENAME_MAP = {
    "Invoice": "InvoiceNo",
    "Price": "UnitPrice",
    "Customer ID": "CustomerID",
}

REQUIRED_ANY = {
    "InvoiceNo": ["InvoiceNo", "Invoice"],
    "StockCode": ["StockCode"],
    "Description": ["Description"],
    "Quantity": ["Quantity"],
    "InvoiceDate": ["InvoiceDate"],
    "UnitPrice": ["UnitPrice", "Price"],
    "CustomerID": ["CustomerID", "Customer ID"],
    "Country": ["Country"],
}


def _find_col(df_cols, candidates):
    for c in candidates:
        if c in df_cols:
            return c
    return None


@st.cache_data(show_spinner=False)
def load_raw(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Charge un fichier Excel (multi-feuilles) ou CSV et harmonise les colonnes."""
    buffer = io.BytesIO(file_bytes)
    frames = []

    if filename.lower().endswith((".xlsx", ".xls")):
        excel_file = pd.ExcelFile(buffer)
        for sheet_name in excel_file.sheet_names:
            sheet = pd.read_excel(excel_file, sheet_name=sheet_name)
            sheet["SourceSheet"] = sheet_name
            frames.append(sheet)
    else:
        df = pd.read_csv(buffer)
        df["SourceSheet"] = filename
        frames.append(df)

    raw = pd.concat(frames, ignore_index=True)

    # Harmonisation des noms de colonnes
    rename = {}
    for target, candidates in REQUIRED_ANY.items():
        found = _find_col(raw.columns, candidates)
        if found and found != target:
            rename[found] = target
    raw = raw.rename(columns=rename)

    missing = [c for c in REQUIRED_ANY if c not in raw.columns]
    if missing:
        raise ValueError(
            "Colonnes manquantes dans le fichier : " + ", ".join(missing) +
            ". Colonnes attendues (UCI Online Retail II) : Invoice/InvoiceNo, "
            "StockCode, Description, Quantity, InvoiceDate, Price/UnitPrice, "
            "Customer ID/CustomerID, Country."
        )
    return raw


@st.cache_data(show_spinner=False)
def clean_transactions(raw: pd.DataFrame):
    transactions = raw.copy()
    transactions["InvoiceNo"] = transactions["InvoiceNo"].astype(str)
    transactions["CustomerID"] = pd.to_numeric(transactions["CustomerID"], errors="coerce")
    transactions["Quantity"] = pd.to_numeric(transactions["Quantity"], errors="coerce")
    transactions["UnitPrice"] = pd.to_numeric(transactions["UnitPrice"], errors="coerce")
    transactions["InvoiceDate"] = pd.to_datetime(transactions["InvoiceDate"], errors="coerce")
    transactions["Description"] = transactions["Description"].astype("string").str.strip()
    transactions["Country"] = transactions["Country"].astype("string").str.strip()

    transactions["is_cancelled_invoice"] = transactions["InvoiceNo"].str.upper().str.startswith("C")
    transactions["is_return_line"] = transactions["Quantity"] < 0
    transactions["LineAmount"] = transactions["Quantity"] * transactions["UnitPrice"]

    audit = pd.Series({
        "Lignes brutes": len(transactions),
        "Clients distincts (bruts)": transactions["CustomerID"].nunique(dropna=True),
        "Factures annulées": int(transactions["is_cancelled_invoice"].sum()),
        "Lignes quantité négative": int(transactions["is_return_line"].sum()),
        "CustomerID manquant": int(transactions["CustomerID"].isna().sum()),
        "Prix non positif": int((transactions["UnitPrice"] <= 0).sum()),
        "Quantité non positive": int((transactions["Quantity"] <= 0).sum()),
        "Doublons exacts": int(transactions.duplicated().sum()),
    })

    clean = (
        transactions
        .drop_duplicates()
        .loc[lambda d: d["CustomerID"].notna()]
        .loc[lambda d: d["InvoiceDate"].notna()]
        .loc[lambda d: ~d["is_cancelled_invoice"]]
        .loc[lambda d: d["Quantity"] > 0]
        .loc[lambda d: d["UnitPrice"] > 0]
        .copy()
    )
    clean["CustomerID"] = clean["CustomerID"].astype(int).astype(str)
    clean["LineAmount"] = clean["Quantity"] * clean["UnitPrice"]

    return clean, audit


@st.cache_data(show_spinner=False)
def compute_rfm(clean: pd.DataFrame):
    analysis_date = clean["InvoiceDate"].max() + pd.Timedelta(days=1)

    rfm = (
        clean.groupby("CustomerID")
        .agg(
            Recency=("InvoiceDate", lambda s: (analysis_date - s.max()).days),
            Frequency=("InvoiceNo", "nunique"),
            Monetary=("LineAmount", "sum"),
            FirstPurchase=("InvoiceDate", "min"),
            LastPurchase=("InvoiceDate", "max"),
            CountryMode=("Country", lambda s: s.mode().iat[0] if not s.mode().empty else pd.NA),
        )
        .reset_index()
    )
    rfm["CustomerTenureDays"] = (analysis_date - rfm["FirstPurchase"]).dt.days
    rfm["AverageBasket"] = rfm["Monetary"] / rfm["Frequency"]
    return rfm, analysis_date


@st.cache_data(show_spinner=False)
def prepare_features(rfm: pd.DataFrame, cap_percentile: float):
    rfm_model = rfm[["CustomerID", "Recency", "Frequency", "Monetary"]].copy()
    for col in ["Recency", "Frequency", "Monetary"]:
        upper = rfm_model[col].quantile(cap_percentile)
        rfm_model[f"{col}_Capped"] = rfm_model[col].clip(upper=upper)
    for col in ["Recency", "Frequency", "Monetary"]:
        rfm_model[f"log_{col}"] = np.log1p(rfm_model[f"{col}_Capped"])

    feature_cols = ["log_Recency", "log_Frequency", "log_Monetary"]
    scaler = StandardScaler()
    X = scaler.fit_transform(rfm_model[feature_cols])
    return rfm_model, X, feature_cols


def stability_for_k(X, k, seeds, n_init):
    labels = []
    for seed in seeds:
        model = KMeans(n_clusters=k, random_state=seed, n_init=n_init)
        labels.append(model.fit_predict(X))
    scores = []
    for i in range(len(labels)):
        for j in range(i + 1, len(labels)):
            scores.append(adjusted_rand_score(labels[i], labels[j]))
    return float(np.mean(scores)) if scores else np.nan


@st.cache_data(show_spinner=False)
def evaluate_k_range(X: np.ndarray, k_min: int, k_max: int, n_init_main: int, n_stability_seeds: int):
    k_values = range(k_min, k_max + 1)
    rows = []
    for k in k_values:
        model = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=n_init_main)
        labels = model.fit_predict(X)
        counts = pd.Series(labels).value_counts(normalize=True)
        rows.append({
            "k": k,
            "inertia": model.inertia_,
            "silhouette": silhouette_score(X, labels),
            "stability_ari": stability_for_k(X, k, range(n_stability_seeds), max(5, n_init_main // 2)),
            "smallest_segment_pct": counts.min() * 100,
        })
    return pd.DataFrame(rows)


@st.cache_data(show_spinner=False)
def fit_final_clustering(X: np.ndarray, k: int, n_init: int):
    kmeans = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=n_init)
    labels = kmeans.fit_predict(X)
    return labels


def assign_segment_names(profile: pd.DataFrame) -> pd.DataFrame:
    p = profile.copy()
    p["segment_name"] = None

    champions_cluster = p.sort_values("rfm_score", ascending=False).iloc[0]["Cluster"]
    p.loc[p["Cluster"] == champions_cluster, "segment_name"] = "Champions"

    sleeping_cluster = p.sort_values("rfm_score", ascending=True).iloc[0]["Cluster"]
    p.loc[p["Cluster"] == sleeping_cluster, "segment_name"] = "Endormis faible valeur"

    remaining = p[p["segment_name"].isna()].copy()
    if not remaining.empty:
        risk_cluster = remaining.sort_values(
            ["Recency_mean", "Monetary_mean"], ascending=[False, False]
        ).iloc[0]["Cluster"]
        p.loc[p["Cluster"] == risk_cluster, "segment_name"] = "À risque"

    remaining = p[p["segment_name"].isna()].copy()
    if not remaining.empty:
        active_cluster = remaining.sort_values("Monetary_mean", ascending=False).iloc[0]["Cluster"]
        p.loc[p["Cluster"] == active_cluster, "segment_name"] = "Actifs rentables"

    p.loc[p["segment_name"].isna(), "segment_name"] = "Nouveaux occasionnels"
    return p[["Cluster", "segment_name"]]


def top_values_by_revenue(data, group_col, value_col, n=3):
    revenue = (
        data.groupby([group_col, value_col], dropna=True)["LineAmount"]
        .sum()
        .reset_index()
        .sort_values([group_col, "LineAmount"], ascending=[True, False])
    )
    top = (
        revenue.groupby(group_col)
        .head(n)
        .groupby(group_col)[value_col]
        .apply(lambda s: ", ".join(s.astype(str)))
    )
    return top


RECOMMENDATIONS = {
    "Champions": "Programme VIP, accès anticipé, cadeaux relationnels et demande d'avis/ambassadeurs. Objectif : protéger la valeur et encourager le bouche-à-oreille.",
    "Actifs rentables": "Bundles, seuils de livraison gratuite et recommandations de produits complémentaires. Objectif : consolider une forte valeur déjà récente.",
    "Nouveaux occasionnels": "Coupon de deuxième achat, onboarding court et sélection de best-sellers. Objectif : transformer l'achat récent en habitude.",
    "À risque": "Campagne de réactivation personnalisée avec offre limitée dans le temps. Objectif : récupérer des clients ayant un historique utile mais une récence défavorable.",
    "Endormis faible valeur": "Relance automatisée peu coûteuse, puis réduction de la pression marketing si absence de réponse. Objectif : maîtriser le coût commercial.",
}

SEGMENT_COLORS = {
    "Champions": "#2ECC71",
    "Actifs rentables": "#3498DB",
    "Nouveaux occasionnels": "#F1C40F",
    "À risque": "#E67E22",
    "Endormis faible valeur": "#95A5A6",
}


# ----------------------------------------------------------------------------
# Sidebar
# ----------------------------------------------------------------------------

st.sidebar.title("📊 Segmentation RFM")
st.sidebar.caption("Dashboard interactif — UCI Online Retail II")

uploaded_file = st.sidebar.file_uploader(
    "Fichier de transactions (.xlsx ou .csv)",
    type=["xlsx", "xls", "csv"],
    help="Colonnes attendues : Invoice, StockCode, Description, Quantity, "
         "InvoiceDate, Price, Customer ID, Country (format UCI Online Retail II).",
)

st.sidebar.markdown("---")
st.sidebar.subheader("Paramètres")

cap_percentile = st.sidebar.slider(
    "Percentile de plafonnement (winsorisation)", 0.90, 1.00, 0.99, 0.01,
    help="Les valeurs extrêmes de Récence/Fréquence/Montant sont plafonnées à ce percentile avant transformation log.",
)

k_range = st.sidebar.slider("Plage de k à évaluer", 2, 10, (2, 8))
final_k = st.sidebar.slider("Nombre de segments retenu (k final)", k_range[0], k_range[1], min(5, k_range[1]))

with st.sidebar.expander("Options avancées"):
    n_init_main = st.slider("n_init K-means (clustering principal)", 5, 100, 50, 5)
    n_stability_seeds = st.slider("Graines pour la stabilité (ARI)", 2, 15, 8)
    final_n_init = st.slider("n_init K-means (modèle final)", 10, 200, 100, 10)

st.sidebar.markdown("---")
st.sidebar.caption("Méthode : nettoyage → RFM → log1p + standardisation → K-means → nommage métier des segments.")


# ----------------------------------------------------------------------------
# Corps principal
# ----------------------------------------------------------------------------

st.title("Dashboard de segmentation clients RFM")
st.markdown(
    "Transformation d'un historique de transactions en segments clients "
    "actionnables (fidélisation, réactivation, priorisation marketing)."
)

if uploaded_file is None:
    st.info(
        "👈 Charge un fichier de transactions dans la barre latérale pour démarrer "
        "(jeu de données **UCI Online Retail II**, ou tout fichier avec les mêmes colonnes)."
    )
    st.stop()

try:
    with st.spinner("Chargement du fichier..."):
        raw = load_raw(uploaded_file.getvalue(), uploaded_file.name)
except ValueError as e:
    st.error(str(e))
    st.stop()

with st.spinner("Nettoyage des transactions..."):
    clean, audit = clean_transactions(raw)

with st.spinner("Construction des variables RFM..."):
    rfm, analysis_date = compute_rfm(clean)

with st.spinner("Préparation des features (winsorisation + log1p + standardisation)..."):
    rfm_model, X, feature_cols = prepare_features(rfm, cap_percentile)

tabs = st.tabs([
    "📥 Données",
    "🧹 Nettoyage",
    "🎯 Variables RFM",
    "🔢 Choix de k",
    "🏷️ Segments",
    "💡 Recommandations",
    "⬇️ Export",
])

# ---- Tab 1 : Données -------------------------------------------------------
with tabs[0]:
    st.subheader("Aperçu des données brutes")
    c1, c2, c3 = st.columns(3)
    c1.metric("Lignes brutes", f"{raw.shape[0]:,}".replace(",", " "))
    c2.metric("Colonnes", raw.shape[1])
    c3.metric("Feuilles/sources", raw["SourceSheet"].nunique())

    st.dataframe(raw.head(50), use_container_width=True)

    diagnostic = pd.DataFrame({
        "type": raw.dtypes.astype(str),
        "valeurs_manquantes": raw.isna().sum(),
        "pct_manquant": raw.isna().mean().mul(100).round(2),
        "valeurs_uniques": raw.nunique(dropna=True),
    })
    st.subheader("Diagnostic qualité initial")
    st.dataframe(diagnostic, use_container_width=True)

    period_col1, period_col2 = st.columns(2)
    period_col1.metric("Début période", str(pd.to_datetime(raw["InvoiceDate"], errors="coerce").min()))
    period_col2.metric("Fin période", str(pd.to_datetime(raw["InvoiceDate"], errors="coerce").max()))

# ---- Tab 2 : Nettoyage ------------------------------------------------------
with tabs[1]:
    st.subheader("Audit de nettoyage")
    st.dataframe(audit.to_frame("valeur"), use_container_width=True)

    c1, c2, c3 = st.columns(3)
    c1.metric("Lignes conservées", f"{len(clean):,}".replace(",", " "),
              f"{len(clean) / len(raw):.1%} des lignes brutes")
    c2.metric("Clients conservés", f"{clean['CustomerID'].nunique():,}".replace(",", " "))
    c3.metric("CA positif", f"£{clean['LineAmount'].sum():,.0f}".replace(",", " "))

    st.markdown(
        "**Règles de nettoyage** : suppression des doublons exacts, des lignes sans "
        "`CustomerID`, des factures annulées (préfixe `C`), des quantités et prix non positifs."
    )

    col1, col2 = st.columns(2)
    with col1:
        fig = px.box(clean, x="Quantity", title="Quantités positives", color_discrete_sequence=["#5DADE2"])
        st.plotly_chart(fig, use_container_width=True)
    with col2:
        fig = px.box(clean, x="LineAmount", title="Montants de ligne positifs", color_discrete_sequence=["#58D68D"])
        st.plotly_chart(fig, use_container_width=True)

    st.subheader("Statistiques descriptives")
    st.dataframe(
        clean[["Quantity", "UnitPrice", "LineAmount"]].describe(percentiles=[.01, .05, .5, .95, .99]).T,
        use_container_width=True,
    )

# ---- Tab 3 : RFM -----------------------------------------------------------
with tabs[2]:
    st.subheader("Variables RFM par client")
    st.caption(f"Date de référence : {analysis_date.date()}")
    st.metric("Clients RFM", f"{len(rfm):,}".replace(",", " "))
    st.dataframe(rfm.head(50), use_container_width=True)

    st.subheader("Distributions brutes")
    cols = st.columns(3)
    colors = ["#5499C7", "#F5B041", "#52BE80"]
    for c, col, color in zip(cols, ["Recency", "Frequency", "Monetary"], colors):
        fig = px.histogram(rfm, x=col, nbins=50, color_discrete_sequence=[color], title=f"Distribution brute — {col}")
        c.plotly_chart(fig, use_container_width=True)

    st.subheader("Après transformation (plafonnement + log1p)")
    cols2 = st.columns(3)
    for c, col, color in zip(cols2, feature_cols, colors):
        fig = px.histogram(rfm_model, x=col, nbins=45, color_discrete_sequence=[color], title=f"Après transformation — {col}")
        c.plotly_chart(fig, use_container_width=True)

    st.subheader("Corrélation de Spearman (RFM bruts)")
    corr = rfm[["Recency", "Frequency", "Monetary"]].corr(method="spearman")
    fig = px.imshow(corr, text_auto=".2f", color_continuous_scale="RdBu_r", zmin=-1, zmax=1, title="Corrélation de Spearman")
    st.plotly_chart(fig, use_container_width=True)

    st.dataframe(
        rfm[["Recency", "Frequency", "Monetary", "AverageBasket"]].describe(
            percentiles=[.05, .25, .5, .75, .95, .99]
        ).T,
        use_container_width=True,
    )

# ---- Tab 4 : Choix de k ----------------------------------------------------
with tabs[3]:
    st.subheader("Évaluation du nombre de segments k")
    st.caption(
        "K-means appliqué aux variables `log1p + standardisées`. Inertie (méthode du coude), "
        "silhouette, stabilité (ARI moyen entre initialisations) et taille du plus petit segment."
    )

    with st.spinner("Calcul des métriques pour chaque k (peut prendre un moment)..."):
        k_eval = evaluate_k_range(X, k_range[0], k_range[1], n_init_main, n_stability_seeds)

    st.dataframe(k_eval, use_container_width=True)

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=k_eval["k"], y=k_eval["inertia"], mode="lines+markers", name="Inertie"))
    fig.update_layout(title="Méthode du coude", xaxis_title="k", yaxis_title="Inertie")
    c1, c2, c3 = st.columns(3)
    c1.plotly_chart(fig, use_container_width=True)

    fig2 = go.Figure()
    fig2.add_trace(go.Scatter(x=k_eval["k"], y=k_eval["silhouette"], mode="lines+markers",
                               name="Silhouette", line=dict(color="#D68910")))
    fig2.update_layout(title="Score de silhouette", xaxis_title="k", yaxis_title="Silhouette")
    c2.plotly_chart(fig2, use_container_width=True)

    fig3 = go.Figure()
    fig3.add_trace(go.Scatter(x=k_eval["k"], y=k_eval["stability_ari"], mode="lines+markers",
                               name="Stabilité (ARI)", line=dict(color="#239B56")))
    fig3.update_layout(title="Stabilité moyenne", xaxis_title="k", yaxis_title="ARI moyen")
    c3.plotly_chart(fig3, use_container_width=True)

    st.info(
        f"**k retenu dans la barre latérale : {final_k}**. La silhouette seule ne suffit pas : "
        "un bon k doit aussi produire des segments stables, de tailles exploitables et "
        "actionnables d'un point de vue marketing."
    )

# ---- Clustering final (utilisé dans les onglets 5 et 6) -------------------
with st.spinner(f"Clustering final avec k={final_k}..."):
    labels = fit_final_clustering(X, final_k, final_n_init)

rfm_model_final = rfm_model.copy()
rfm_model_final["Cluster"] = labels
rfm_clustered = rfm.merge(rfm_model_final[["CustomerID", "Cluster"]], on="CustomerID", how="left")
rfm_clustered["Cluster"] = rfm_clustered["Cluster"].astype(int)

cluster_profile = (
    rfm_clustered.groupby("Cluster")
    .agg(
        Effectif=("CustomerID", "nunique"),
        Recency_mean=("Recency", "mean"),
        Frequency_mean=("Frequency", "mean"),
        Monetary_mean=("Monetary", "mean"),
        Monetary_total=("Monetary", "sum"),
        AverageBasket_mean=("AverageBasket", "mean"),
        Tenure_mean=("CustomerTenureDays", "mean"),
    )
    .reset_index()
)
cluster_profile["Pct_clients"] = cluster_profile["Effectif"] / cluster_profile["Effectif"].sum() * 100
cluster_profile["Pct_CA"] = cluster_profile["Monetary_total"] / cluster_profile["Monetary_total"].sum() * 100

profile_ranked = cluster_profile.copy()
profile_ranked["r_score"] = profile_ranked["Recency_mean"].rank(ascending=False)
profile_ranked["f_score"] = profile_ranked["Frequency_mean"].rank(ascending=True)
profile_ranked["m_score"] = profile_ranked["Monetary_mean"].rank(ascending=True)
profile_ranked["rfm_score"] = profile_ranked[["r_score", "f_score", "m_score"]].sum(axis=1)

segment_names = assign_segment_names(profile_ranked)
rfm_clustered = rfm_clustered.merge(segment_names, on="Cluster", how="left")
clean_segmented = clean.merge(rfm_clustered[["CustomerID", "segment_name"]], on="CustomerID", how="left")

top_countries = top_values_by_revenue(clean_segmented, "segment_name", "Country", n=3)
top_products = top_values_by_revenue(clean_segmented, "segment_name", "Description", n=3)

segment_summary = (
    rfm_clustered.groupby("segment_name")
    .agg(
        Effectif=("CustomerID", "nunique"),
        Recence_moy=("Recency", "mean"),
        Frequence_moy=("Frequency", "mean"),
        Montant_moy=("Monetary", "mean"),
        CA_total=("Monetary", "sum"),
        Panier_moy=("AverageBasket", "mean"),
    )
)
segment_summary["Pct_clients"] = segment_summary["Effectif"] / segment_summary["Effectif"].sum() * 100
segment_summary["Pct_CA"] = segment_summary["CA_total"] / segment_summary["CA_total"].sum() * 100
segment_summary["Top pays"] = segment_summary.index.map(top_countries)
segment_summary["Top produits"] = segment_summary.index.map(top_products)
segment_summary = (
    segment_summary.reset_index()
    .rename(columns={"segment_name": "Segment"})
    .sort_values("Pct_CA", ascending=False)
)
ordered_cols = ["Segment", "Effectif", "Pct_clients", "Pct_CA", "Recence_moy", "Frequence_moy", "Montant_moy", "Panier_moy", "Top pays", "Top produits"]

recommendations_table = segment_summary[["Segment", "Effectif", "Pct_CA"]].copy()
recommendations_table["Recommandation marketing"] = recommendations_table["Segment"].map(RECOMMENDATIONS)

# ---- Tab 5 : Segments -------------------------------------------------------
with tabs[4]:
    st.subheader(f"Segments identifiés (k = {final_k})")

    n_segments = segment_summary.shape[0]
    metric_cols = st.columns(n_segments)
    for c, (_, row) in zip(metric_cols, segment_summary.iterrows()):
        c.metric(row["Segment"], f"{int(row['Effectif'])} clients", f"{row['Pct_CA']:.1f}% du CA")

    st.dataframe(segment_summary[ordered_cols], use_container_width=True)

    col1, col2 = st.columns(2)
    with col1:
        fig = px.bar(
            segment_summary, y="Segment", x="Pct_CA", orientation="h",
            color="Segment", color_discrete_map=SEGMENT_COLORS,
            title="Contribution au chiffre d'affaires (%)",
        )
        fig.update_layout(showlegend=False, yaxis_title="", xaxis_title="% du CA")
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        fig = px.scatter(
            rfm_clustered, x="Recency", y="Monetary", color="segment_name",
            size="Frequency", size_max=25, opacity=0.65,
            color_discrete_map=SEGMENT_COLORS,
            log_y=True,
            title="Lecture RFM des segments",
            labels={"Recency": "Récence (jours)", "Monetary": "Montant total (£)", "segment_name": "Segment"},
        )
        st.plotly_chart(fig, use_container_width=True)

    st.subheader("Explorer un segment")
    chosen_segment = st.selectbox("Segment", segment_summary["Segment"].tolist())
    detail = rfm_clustered[rfm_clustered["segment_name"] == chosen_segment]
    st.dataframe(
        detail[["CustomerID", "Recency", "Frequency", "Monetary", "AverageBasket", "CountryMode"]]
        .sort_values("Monetary", ascending=False),
        use_container_width=True,
    )

# ---- Tab 6 : Recommandations -----------------------------------------------
with tabs[5]:
    st.subheader("Recommandations marketing par segment")
    for _, row in recommendations_table.sort_values("Pct_CA", ascending=False).iterrows():
        color = SEGMENT_COLORS.get(row["Segment"], "#888")
        st.markdown(
            f"<div style='border-left:5px solid {color}; padding:10px 15px; margin-bottom:12px; background:rgba(128,128,128,0.06); border-radius:4px;'>"
            f"<b>{row['Segment']}</b> — {int(row['Effectif'])} clients, {row['Pct_CA']:.1f}% du CA<br>"
            f"{row['Recommandation marketing']}</div>",
            unsafe_allow_html=True,
        )

    st.subheader("Discussion critique (repères)")
    st.markdown(
        "- **Annulations/retours** exclus du clustering principal (valeur d'achat positive) — "
        "une variante RFM nette peut être comparée via l'Adjusted Rand Index.\n"
        "- Le couple **log1p + standardisation** évite que le montant (£) domine mécaniquement "
        "la distance euclidienne face à des jours ou des factures.\n"
        "- Fréquence et Montant sont naturellement corrélés (deux leviers métier distincts : "
        "activité et valeur) ; une ACP peut être testée si la redondance est trop forte.\n"
        "- La silhouette seule ne suffit pas : le k retenu doit rester stable et actionnable.\n"
        "- Sans vérité terrain, la qualité se défend par triangulation (métriques internes, "
        "stabilité, profils distincts, contribution au CA, validation métier).\n"
        "- **Garde-fous éthiques** : pas de prix individualisés injustifiables, règles "
        "d'éligibilité documentées, contrôle des biais géographiques/socio-économiques, "
        "pression marketing limitée sur les clients vulnérables, option de retrait claire."
    )

# ---- Tab 7 : Export ----------------------------------------------------------
with tabs[6]:
    st.subheader("Télécharger les livrables")
    st.caption("Les mêmes fichiers que ceux générés par le notebook dans `outputs/`.")

    c1, c2, c3 = st.columns(3)
    c1.download_button(
        "⬇️ rfm_clients_segments.csv",
        rfm_clustered.to_csv(index=False).encode("utf-8"),
        file_name="rfm_clients_segments.csv",
        mime="text/csv",
    )
    c2.download_button(
        "⬇️ tableau_synthese_segments.csv",
        segment_summary[ordered_cols].to_csv(index=False).encode("utf-8"),
        file_name="tableau_synthese_segments.csv",
        mime="text/csv",
    )
    c3.download_button(
        "⬇️ recommandations_segments.csv",
        recommendations_table.to_csv(index=False).encode("utf-8"),
        file_name="recommandations_segments.csv",
        mime="text/csv",
    )
