const dbModule = require('../database');
dbModule.initialize();

async function main() {
  const result = await dbModule.run('UPDATE products SET image_url = ""');
  console.log(`Successfully cleared image_url for all products. Changes: ${result.changes}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
