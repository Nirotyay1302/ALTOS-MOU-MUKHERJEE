const dbModule = require('../database');
dbModule.initialize();
async function main() {
  const products = await dbModule.all('SELECT id, category, name, price, mrp, bv, pv, image_url FROM products ORDER BY category, name');
  console.log(`Total products in DB: ${products.length}`);
  console.log(JSON.stringify(products.slice(0, 10), null, 2));
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
