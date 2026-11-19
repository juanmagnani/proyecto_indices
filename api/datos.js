// Lee la planilla de Google Sheets (exportada como CSV) y la devuelve en JSON,
// agrupada por índice y ordenada por fecha.

const SHEET_ID =
  process.env.SHEET_ID || "1K7poeXXrGfGXPru8u2_BDtu8Nm3BgzcjOzYwEGmYuMA";
const SHEET_NAME = process.env.SHEET_NAME || "indices";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// "1.234,56" / "1580," / "0,0625" -> número
function parseNumber(s) {
  if (s == null) return null;
  const t = String(s).trim().replace(/\s/g, "");
  if (!t) return null;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// "1/12/2015" (d/m/aaaa) -> "2015-12-01"
function parseDate(s) {
  const m = String(s || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function buildIndices(csvText) {
  const rows = parseCSV(csvText);
  const header = rows.shift() || [];
  const col = (name, fallback) => {
    const i = header.findIndex((h) =>
      h.toLowerCase().startsWith(name.toLowerCase())
    );
    return i >= 0 ? i : fallback;
  };
  const iFecha = col("Fecha", 1);
  const iNombre = col("Nombre", 2);
  const iAcum = col("Acumulado", 3);
  const iMensual = col("Valor mensual", 4);
  const iUnidad = col("Unidad", 5);

  const map = new Map();
  for (const r of rows) {
    const nombre = (r[iNombre] || "").trim();
    const fecha = parseDate(r[iFecha]);
    if (!nombre || !fecha) continue;
    if (!map.has(nombre)) map.set(nombre, { nombre, unidad: "", datos: [] });
    const idx = map.get(nombre);
    const unidad = (r[iUnidad] || "").trim();
    if (unidad && !idx.unidad) idx.unidad = unidad;
    // [fecha, acumulado / valor hora, valor mensual]
    idx.datos.push([fecha, parseNumber(r[iAcum]), parseNumber(r[iMensual])]);
  }

  const indices = [...map.values()];
  for (const idx of indices) {
    idx.datos.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  }
  return indices;
}

export default async function handler(req, res) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    SHEET_NAME
  )}`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Google Sheets respondió ${r.status}`);
    const text = await r.text();
    const indices = buildIndices(text);
    if (!indices.length) throw new Error("La planilla no tiene datos legibles");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=600, stale-while-revalidate=3600"
    );
    res.status(200).json({ actualizado: new Date().toISOString(), indices });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: String(err.message || err) });
  }
}
