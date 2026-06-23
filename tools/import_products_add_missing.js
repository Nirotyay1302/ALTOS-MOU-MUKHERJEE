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

async function main() {
  const file = path.join(__dirname, '..', 'public', 'product-list.html');
  const html = fs.readFileSync(file, 'utf8');
  const uniqCodes = new Set([...html.matchAll(/\b\d{5}\b/g)].map(m=>m[0]));

  dbModule.initialize();
  const rows = await dbModule.all('SELECT id FROM products');
  const existing = new Set(rows.map(r=>r.id));
  const missing = [...uniqCodes].filter(c=>!existing.has(c));
  console.log('Missing codes to find:', missing.length);
  if (missing.length === 0) return process.exit(0);

  // Map all tr rows by code
  const trRe = /<tr[\s\S]*?<\/tr>/gi;
  const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const codeMap = new Map();
  let trMatch;
  while ((trMatch = trRe.exec(html)) !== null) {
    const tr = trMatch[0];
    const tds = [];
    let tdMatch;
    while ((tdMatch = tdRe.exec(tr)) !== null) {
      tds.push(stripTags(tdMatch[1]));
    }
    if (tds.length >= 8) {
      const code = tds[1];
      if (/^\d{5}$/.test(code)) {
        const name = tds[2];
        const unit = tds[3] || '';
        const mrp = parseFloat((tds[4]||'').replace(/[^0-9.\-]/g,'')) || 0;
        const price = parseFloat((tds[5]||'').replace(/[^0-9.\-]/g,'')) || 0;
        const bv = parseFloat((tds[6]||'').replace(/[^0-9.\-]/g,'')) || 0;
        const pv = parseFloat((tds[7]||'').replace(/[^0-9.\-]/g,'')) || 0;
        codeMap.set(code, { id: code, name, unit, mrp, price, bv, pv });
      }
    }
  }

  const insertSql = `INSERT OR REPLACE INTO products (id, category, name, unit, price, mrp, bv, pv, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  let inserted = 0;
  for (const code of missing) {
    const p = codeMap.get(code);
    if (!p) {
      console.warn('Row for code not found in any <tr>:', code);
      continue;
    }
    // Try to find nearest preceding category header for this code
    const idx = html.indexOf(code);
    let category = 'Uncategorized';
    if (idx !== -1) {
      const before = html.slice(0, idx);
      const lastHeaderIdx = before.lastIndexOf('class="card-title"');
      if (lastHeaderIdx !== -1) {
        const headerSub = before.slice(lastHeaderIdx - 50);
        const m = headerSub.match(/<h3[^>]*class\s*=\s*"card-title"[^>]*>([^<]+)<\/h3>/i);
        if (m) category = decodeHtmlEntities(m[1].replace(/\s*\(\d+\)$/, '')).trim();
      }
    }
    try {
      await dbModule.run(insertSql, [p.id, category, p.name, p.unit, p.price||p.mrp||0, p.mrp||p.price||0, p.bv||0, p.pv||0, 'Imported (pass 2)']);
      console.log('Inserted missing', p.id, p.name, 'category', category);
      inserted++;
    } catch (err) {
      console.error('Error inserting', p.id, err.message||err);
    }
  }
  console.log('Inserted missing count:', inserted);
}

if (require.main === module) main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
