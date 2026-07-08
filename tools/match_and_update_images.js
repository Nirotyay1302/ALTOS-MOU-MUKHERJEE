const fs = require('fs');
const path = require('path');
const db = require('../database');

const productsDir = path.join(__dirname, '..', 'public', 'images', 'products');

async function main() {
    db.initialize();
    
    // 1. Delete the renamed files that were copied from long names
    const filesToDelete = ['12148.jpg', '12153.jpg', '12163.jpg', '12164.jpg', '12165.jpg'];
    for (const f of filesToDelete) {
        const filePath = path.join(productsDir, f);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${f}`);
        }
    }
    
    // 2. Read remaining files
    const files = fs.readdirSync(productsDir);
    const products = await db.all('SELECT id, name FROM products');
    
    console.log(`Scanning files and matching against ${products.length} products...`);
    
    let updatedCount = 0;
    
    for (const file of files) {
        const filePath = path.join(productsDir, file);
        const ext = path.extname(file).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') continue;
        
        // Match ONLY exact 5-digit ID (e.g. 11002.jpg)
        const exactMatch = file.match(/^(\d{5})\.(jpg|jpeg|png)$/i);
        if (exactMatch) {
            const pId = exactMatch[1];
            const matchedProduct = products.find(p => p.id === pId);
            if (matchedProduct) {
                const relativeUrl = `/images/products/${file}`;
                await db.run('UPDATE products SET image_url = ? WHERE id = ?', [relativeUrl, pId]);
                console.log(`Updated EXACT match: ${file} -> Product: ${matchedProduct.name} (${pId})`);
                updatedCount++;
            }
        }
    }
    
    console.log(`\nSuccessfully updated ${updatedCount} products with exact 5-digit images.`);
}

main().then(() => {
    console.log("Image matching complete!");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
