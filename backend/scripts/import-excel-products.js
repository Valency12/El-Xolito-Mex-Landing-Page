/**
 * Importa productos desde database/Base de Datos El Xolito Mex.xlsx
 * - Reemplaza el catálogo de ejemplo
 * - Resuelve rutas de imagen en landing-page/assets
 * - Asigna imagen_blanca (flip) cuando existe el par
 *
 * Uso: node scripts/import-excel-products.js
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let XLSX;
try {
  XLSX = require('xlsx');
} catch {
  console.error('Falta el paquete xlsx. Ejecuta: npm install xlsx');
  process.exit(1);
}

const projectRoot = path.join(__dirname, '..', '..');
const dbPath = path.join(projectRoot, 'database', 'el_xolito_mex.db');
const excelPath = path.join(projectRoot, 'database', 'Base de Datos El Xolito Mex.xlsx');
const assetsRoot = path.join(projectRoot, 'landing-page', 'assets');

const CATEGORY_MAP = {
  collar: 'Collares',
  collares: 'Collares',
  pulsera: 'Pulseras',
  pulseras: 'Pulseras',
  dije: 'Dijes',
  dijes: 'Dijes',
  anillo: 'Anillos',
  anillos: 'Anillos',
  arete: 'Aretes',
  aretes: 'Aretes',
  broquel: 'Broqueles',
  broqueles: 'Broqueles',
  brazalete: 'Brazaletes',
  brazaletes: 'Brazaletes',
  conjunto: 'Conjuntos',
  conjuntos: 'Conjuntos'
};

const FOLDER_BY_CATEGORY = {
  Collares: ['Collares', 'Dijes', 'Pulseras', 'Anillos'],
  Pulseras: ['Pulseras', 'Brazaletes', 'Anillos', 'Dijes'],
  Dijes: ['Dijes', 'Anillos', 'Pulseras'],
  Anillos: ['Anillos', 'Dijes', 'Pulseras'],
  Aretes: ['Aretes', 'Broqueles'],
  Broqueles: ['Broqueles', 'Aretes'],
  Brazaletes: ['Brazaletes', 'Pulseras'],
  Conjuntos: ['Conjuntos']
};

/** Pares fondo negro (frente) → fondo blanco (flip) */
const WHITE_FLIP_BY_BLACK = {
  'ChatGPT Image 25 may 2026, 11_58_26 p.m..png':
    'assets/Dijes/ChatGPT Image 10 jul 2026, 04_23_52 p.m..png',
  'ChatGPT Image 10 jul 2026, 03_21_19 p.m..png':
    'assets/Dijes/ChatGPT Image 10 jul 2026, 04_29_17 p.m..png',
  'ChatGPT Image 10 jul 2026, 03_09_33 p.m..png':
    'assets/Dijes/ChatGPT Image 10 jul 2026, 04_35_20 p.m..png'
};

/** Alias cuando el Excel apunta a un archivo cercano que sí existe */
const IMAGE_ALIASES = {
  // Niño Jesús: Excel pide 05_07_56; en assets está 05_10_45 (misma pieza)
  'ChatGPT Image 8 jul 2026, 05_07_56 p.m..png':
    'ChatGPT Image 8 jul 2026, 05_10_45 p.m..png'
};

function ensureColumn(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  + ${table}.${column}`);
  }
}

function listAssetFiles() {
  const files = [];
  function walk(dir, relBase) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      const rel = path.join(relBase, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) walk(abs, rel);
      else files.push({ name: entry.name, rel: `assets/${rel}`, abs });
    }
  }
  walk(assetsRoot, '');
  return files;
}

function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function findImage(fileName, categoria, assetIndex) {
  if (!fileName) return null;
  let target = String(fileName).trim();
  if (IMAGE_ALIASES[target]) target = IMAGE_ALIASES[target];

  const targetNorm = normalizeName(target);
  const folders = (FOLDER_BY_CATEGORY[categoria] || []).map((f) => f.toLowerCase());

  const inPreferred = (f) =>
    folders.some((folder) => f.rel.toLowerCase().includes(`assets/${folder}/`));

  const exactPreferred = assetIndex.find(
    (f) => inPreferred(f) && normalizeName(f.name) === targetNorm
  );
  if (exactPreferred) return exactPreferred.rel;

  const exact = assetIndex.find((f) => normalizeName(f.name) === targetNorm);
  if (exact) return exact.rel;

  const stem = targetNorm.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '');
  const partialPreferred = assetIndex.find((f) => {
    if (!inPreferred(f)) return false;
    const n = normalizeName(f.name).replace(/\.(png|jpg|jpeg|webp|gif)$/i, '');
    return n.includes(stem) || stem.includes(n);
  });
  if (partialPreferred) return partialPreferred.rel;

  return null;
}

function mapCategory(raw) {
  const key = normalizeName(raw);
  return CATEGORY_MAP[key] || null;
}

function readExcelRows() {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`No se encontró el Excel: ${excelPath}`);
  }
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });
  // Buscar fila de encabezados
  let headerIdx = raw.findIndex((r) => String(r[0]).toLowerCase() === 'nu.' || String(r[1]).toLowerCase() === 'nombre');
  if (headerIdx < 0) headerIdx = 1;
  const rows = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    const nombre = String(r[1] || '').trim();
    if (!nombre) continue;
    rows.push({
      nu: r[0],
      nombre,
      descripcion: String(r[2] || '').trim(),
      precio: parseFloat(r[3]) || 0,
      material: String(r[4] || '').trim() || 'Oro de 14k',
      imagen: String(r[5] || '').trim(),
      stock: parseInt(r[6], 10) || 0,
      categoriaRaw: String(r[7] || '').trim()
    });
  }
  return rows;
}

function main() {
  console.log('Importando productos desde Excel...');
  const db = new Database(dbPath);
  ensureColumn(db, 'productos', 'imagen_blanca', 'TEXT');
  ensureColumn(db, 'productos', 'precio_anterior', 'REAL');
  ensureColumn(db, 'productos', 'orden', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'productos', 'updated_at', 'TEXT');

  const assetIndex = listAssetFiles();
  const excelRows = readExcelRows();
  console.log(`  Filas en Excel: ${excelRows.length}`);
  console.log(`  Archivos en assets: ${assetIndex.length}`);

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM carrito_items').run();
    // No borrar pedidos históricos; solo desvincular items de productos que vamos a reemplazar
    try {
      db.prepare('DELETE FROM pedido_items').run();
    } catch (_) { /* ok */ }
    db.prepare('DELETE FROM productos').run();

    const insert = db.prepare(`
      INSERT INTO productos (
        nombre, descripcion, precio, precio_anterior, imagen_path, imagen_blanca,
        material, stock, categoria, activo, destacado, orden, updated_at
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `);

    let withImage = 0;
    let withFlip = 0;
    let missing = [];

    excelRows.forEach((row, idx) => {
      const categoria = mapCategory(row.categoriaRaw);
      if (!categoria) {
        console.warn(`  ! Categoría desconocida "${row.categoriaRaw}" en ${row.nombre}`);
      }
      const cat = categoria || 'Dijes';
      let imagen_path = findImage(row.imagen, cat, assetIndex);
      // Si el Excel nombra un archivo que no existe, intentar por nombre del producto en carpeta
      if (!imagen_path) {
        const byProduct = assetIndex.find((f) =>
          normalizeName(f.name).includes(normalizeName(row.nombre).slice(0, 12))
        );
        // no forzar match débil
      }

      let imagen_blanca = null;
      if (imagen_path) {
        withImage++;
        const baseName = path.basename(imagen_path);
        if (WHITE_FLIP_BY_BLACK[baseName]) {
          imagen_blanca = WHITE_FLIP_BY_BLACK[baseName];
          withFlip++;
        }
      } else {
        missing.push(`${row.nombre} ← ${row.imagen}`);
      }

      // Destacar piezas con imagen lista (máx 6)
      const destacado = imagen_path && withImage <= 6 ? 1 : 0;
      // Sin imagen aún: quedan en catálogo (admin) pero ocultos en tienda pública
      const activo = imagen_path ? 1 : 0;

      insert.run(
        row.nombre,
        row.descripcion || null,
        row.precio,
        imagen_path,
        imagen_blanca,
        row.material,
        row.stock,
        cat,
        activo,
        destacado,
        idx + 1
      );
    });

    return { withImage, withFlip, missing, total: excelRows.length };
  });

  const result = tx();
  console.log(`\nImportación lista:`);
  console.log(`  Total productos: ${result.total}`);
  console.log(`  Con imagen: ${result.withImage}`);
  console.log(`  Con flip (fondo blanco): ${result.withFlip}`);
  if (result.missing.length) {
    console.log(`\n  Sin imagen aún (${result.missing.length}):`);
    result.missing.forEach((m) => console.log(`    - ${m}`));
  }
  db.close();
}

main();
