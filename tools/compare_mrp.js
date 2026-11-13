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

async function main() {
  dbModule.initialize();
  const file = path.join(__dirname, '..', 'public', 'product-list.html');
  const html = fs.readFileSync(file, 'utf8');
  const parsed = parseProducts(html);
  console.log('Parsed count from product-list.html:', parsed.length);

  const dbRows = await dbModule.all('SELECT * FROM products');
  const dbMap = new Map(dbRows.map(p => [p.id, p]));

  const diffs = [];
  const missing = [];
  for (const p of parsed) {
    const existing = dbMap.get(p.id);
    if (!existing) {
      missing.push(p);
    } else if (Number(existing.mrp) !== Number(p.mrp)) {
      diffs.push({
        id: p.id,
        name: p.name,
        dbMrp: existing.mrp,
        htmlMrp: p.mrp,
        dbPrice: existing.price,
        htmlPrice: p.price
      });
    }
  }

  console.log(`Missing in DB: ${missing.length}`);
  console.log(`MRP differences: ${diffs.length}`);
  console.log('Differences:');
  console.table(diffs);

  const neem = await dbModule.get('SELECT * FROM products WHERE name LIKE ?', ['%Neem Capsule%']);
  console.log('Neem Capsule in DB:', neem);
  const parsedNeem = parsed.find(p => p.name.includes('Neem Capsule'));
  console.log('Neem Capsule in parsed:', parsedNeem);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
