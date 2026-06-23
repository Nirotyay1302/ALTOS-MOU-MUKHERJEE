const fs = require('fs');
const path = require('path');
const dbModule = require('../database');

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function stripTags(html) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, '')).trim();
}

function parseProducts(html) {
  const products = [];
  const cardRe = /<h3[^>]*class="card-title">([^<]+)<\/h3>[\s\S]*?<table[\s\S]*?>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/gmi;
  let match;
  while ((match = cardRe.exec(html)) !== null) {
    let categoryRaw = match[1] || '';
    const tbody = match[2] || '';
    // remove count in parentheses and decode entities
    const category = decodeHtmlEntities(categoryRaw.replace(/\s*\(\d+\)$/, '')).trim();

    const rowRe = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRe.exec(tbody)) !== null) {
      const rowHtml = rowMatch[1];
      const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let tdMatch;
      while ((tdMatch = tdRe.exec(rowHtml)) !== null) {
        cells.push(stripTags(tdMatch[1]));
      }
      // Expect at least 8 columns: S.No., Code, Name, Unit, MRP, Price, BV, PV
      if (cells.length >= 8) {
        const code = cells[1];
        if (!/^[0-9]{5}$/.test(code)) continue;
        const name = cells[2];
        const unit = cells[3] || '';
        const mrp = parseFloat(cells[4].replace(/[^0-9.\-]/g, '')) || 0;
        const price = parseFloat(cells[5].replace(/[^0-9.\-]/g, '')) || 0;
        const bv = parseFloat(cells[6].replace(/[^0-9.\-]/g, '')) || 0;
        const pv = parseFloat(cells[7].replace(/[^0-9.\-]/g, '')) || 0;

        products.push({ id: code, category, name, unit, mrp, price, bv, pv });
      }
    }
  }
  return products;
}

async function importToDb(products) {
  dbModule.initialize();
  const insertSql = `INSERT OR REPLACE INTO products (id, category, name, unit, price, mrp, bv, pv, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  for (const p of products) {
    try {
      await dbModule.run(insertSql, [p.id, p.category, p.name, p.unit, p.price || p.mrp || 0, p.mrp || p.price || 0, p.bv || 0, p.pv || 0, 'Imported from product-list.html']);
      console.log('Inserted', p.id, p.name);
    } catch (err) {
      console.error('Error inserting', p.id, err.message || err);
    }
  }
}

function main() {
  const file = path.join(__dirname, '..', 'public', 'product-list.html');
  const html = fs.readFileSync(file, 'utf8');
  const products = parseProducts(html);
  console.log('Parsed products count:', products.length);
  importToDb(products).then(() => {
    console.log('Import complete.');
    process.exit(0);
  }).catch(err => {
    console.error('Import failed', err);
    process.exit(1);
  });
}

if (require.main === module) main();
