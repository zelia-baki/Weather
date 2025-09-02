// receipt-styles.js

export const receiptStyles = `
/* ================================
   Page dynamique format ticket
================================ */
@page {
  size: auto;        /* Hauteur auto, largeur définie par .receipt */
  margin: 0;         /* on gère le centrage nous-mêmes */
}

html, body {
  margin: 10px;
  padding: 0;
  width: 100%;
  height: auto;
  font-family: monospace, "Courier New", sans-serif; /* look caisse */
  background: #FAFAF9;
  color: #000;

  /* ✅ Centrage horizontal */
  display: flex;
  justify-content: center;
}

/* ================================
   Receipt
================================ */
.receipt {
  width: 80mm;            /* largeur fixe type imprimante */
  min-height: auto;       /* hauteur suit le contenu */
  margin: 0 auto;
  padding: 10px;
  border: 1px solid #000; /* optionnel : cadre noir */
  text-align: center;
}

.receipt .logo {
  width: 60px;
  height: auto;
  margin: 0 auto 8px;
  display: block;
}

.receipt .title {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 6px;
  color: #0d9488; /* teal */
  text-transform: uppercase;
}

.receipt .desc {
  font-size: 0.75rem;
  margin-bottom: 12px;
  line-height: 1.2;
}

/* QR code centré */
.receipt .qr-wrap {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.receipt .qr img {
  width: 150px;
  height: 150px;
  border: 6px solid #0d9488;
  border-radius: 16px;
  background: #fff;
  padding: 4px;
}

/* ================================
   Rows
================================ */
.receipt .rows {
  margin-top: 10px;
  text-align: left;
  font-size: 0.8rem;
}

.receipt .row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dashed #000;
}

.receipt .row:last-child {
  border-bottom: 2px solid #000;
}

.receipt .label {
  font-weight: bold;
}

.receipt .value {
  font-weight: normal;
  text-align: right;
}

/* Footer style ticket */
.receipt::after {
  content: "------------------------------";
  display: block;
  text-align: center;
  margin-top: 10px;
  font-size: 0.8rem;
}
`;
