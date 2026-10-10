import { RawTransaction } from "./rfmEngine";
import Papa from "papaparse";

/**
 * Générateur de jeu de données de démonstration (UCI Online Retail II simulé en français)
 */
export function generateSampleDataset(): RawTransaction[] {
  const transactions: RawTransaction[] = [];

  const countries = ["Sénégal", "Côte d'Ivoire", "Cameroun", "Mali", "Burkina Faso", "Bénin", "Togo"];
  const products = [
    { code: "85123A", desc: "Support Bougie Cœur Métal blanc", price: 2550 },
    { code: "71053", desc: "Lanterne Métal Blanche Vintage", price: 3390 },
    { code: "84406B", desc: "Patère Cœurs Métal Crème", price: 2750 },
    { code: "84029G", desc: "Bouillotte Motif Drapeau", price: 3750 },
    { code: "22752", desc: "Lot 7 Poupées Gigognes Babushka", price: 7650 },
    { code: "21730", desc: "Photophore Étoile Verre Dépoli", price: 4250 },
    { code: "22633", desc: "Chauffe-mains Format Poche", price: 1850 },
    { code: "22632", desc: "Chauffe-mains Rouge à Pois", price: 1850 },
    { code: "84879", desc: "Figurines Oiseaux Décoratifs", price: 1690 },
    { code: "22745", desc: "Maison de Poupée Miniature", price: 2100 },
  ];

  const startDate = new Date(2025, 0, 1).getTime();
  const endDate = new Date(2025, 11, 31).getTime();

  for (let c = 10001; c <= 10220; c++) {
    const customerId = String(c);
    const country = countries[c % countries.length];

    let orderCount = 2;
    if (c % 10 === 0) orderCount = 25; // Champions / VIP
    else if (c % 4 === 0) orderCount = 8; // Actifs
    else if (c % 3 === 0) orderCount = 4; // Occasionnels

    for (let o = 0; o < orderCount; o++) {
      const invoiceNo = `536${Math.floor(1000 + (c * 17 + o) % 8999)}`;
      let time = startDate + Math.random() * (endDate - startDate);

      if (c % 5 === 0) {
        time = startDate + Math.random() * (endDate - startDate) * 0.3;
      }

      const invoiceDate = new Date(time);
      const itemsInInvoice = 1 + Math.floor(Math.random() * 4);

      for (let i = 0; i < itemsInInvoice; i++) {
        const prod = products[(c + o + i) % products.length];
        const qty = 1 + Math.floor(Math.random() * (orderCount > 15 ? 50 : 12));

        transactions.push({
          InvoiceNo: invoiceNo,
          StockCode: prod.code,
          Description: prod.desc,
          Quantity: qty,
          InvoiceDate: invoiceDate,
          UnitPrice: prod.price,
          CustomerID: customerId,
          Country: country,
          SourceSheet: "Ventes_2025",
        });
      }
    }
  }

  // Facture d'annulation test
  transactions.push({
    InvoiceNo: "C536390",
    StockCode: "22633",
    Description: "Chauffe-mains Format Poche",
    Quantity: -3,
    InvoiceDate: new Date(2025, 5, 15),
    UnitPrice: 1850,
    CustomerID: "10005",
    Country: "Sénégal",
    SourceSheet: "Ventes_2025",
  });

  // Facture sans ID client test
  transactions.push({
    InvoiceNo: "536391",
    StockCode: "85123A",
    Description: "Support Bougie Cœur Métal blanc",
    Quantity: 10,
    InvoiceDate: new Date(2025, 6, 20),
    UnitPrice: 2550,
    CustomerID: "",
    Country: "Côte d'Ivoire",
    SourceSheet: "Ventes_2025",
  });

  return transactions;
}

/**
 * Télécharge un fichier modèle CSV au format attendu par le système
 */
export function downloadSampleTemplateCsv() {
  const templateRows = [
    {
      InvoiceNo: "536365",
      StockCode: "85123A",
      Description: "Support Bougie Cœur Métal blanc",
      Quantity: 6,
      InvoiceDate: "2025-01-15 08:26",
      UnitPrice: 2550,
      CustomerID: "17850",
      Country: "Sénégal",
    },
    {
      InvoiceNo: "536365",
      StockCode: "71053",
      Description: "Lanterne Métal Blanche Vintage",
      Quantity: 6,
      InvoiceDate: "2025-01-15 08:26",
      UnitPrice: 3390,
      CustomerID: "17850",
      Country: "Sénégal",
    },
    {
      InvoiceNo: "536366",
      StockCode: "22633",
      Description: "Chauffe-mains Format Poche",
      Quantity: 12,
      InvoiceDate: "2025-01-16 10:15",
      UnitPrice: 1850,
      CustomerID: "13047",
      Country: "Côte d'Ivoire",
    },
    {
      InvoiceNo: "C536367",
      StockCode: "84029G",
      Description: "Bouillotte Motif Drapeau (Annulation)",
      Quantity: -2,
      InvoiceDate: "2025-01-18 14:30",
      UnitPrice: 3750,
      CustomerID: "13047",
      Country: "Côte d'Ivoire",
    },
  ];

  const csv = Papa.unparse(templateRows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "modele_donnees_transactions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
