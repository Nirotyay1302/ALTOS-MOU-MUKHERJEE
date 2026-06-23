const dbModule = require('../database');
dbModule.initialize();

async function main() {
  const products = await dbModule.all('SELECT category, id, name, unit, price, mrp FROM products ORDER BY category, name');
  const grouped = {};
  products.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push({ id: p.id, name: p.name, unit: p.unit, mrp: p.mrp });
  });
  console.log(JSON.stringify(grouped, null, 2));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
