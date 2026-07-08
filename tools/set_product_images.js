const fs = require('fs');
const path = require('path');
const db = require('../database');

const srcDir = "C:\\Users\\User\\.gemini\\antigravity\\brain\\d052c199-3ed6-46fb-8442-d2070400310e";
const destDir = path.join(__dirname, '..', 'public', 'images', 'products');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log("Created directory:", destDir);
}

const copyAndDbUpdate = async () => {
    db.initialize();

    const tasks = [
        {
            src: path.join(srcDir, 'media__1783491464635.jpg'),
            dest: path.join(destDir, '25018.jpg'),
            id: '25018',
            url: '/images/products/25018.jpg',
            name: 'Tulsi Power'
        },
        {
            src: path.join(srcDir, 'media__1783491475345.jpg'),
            dest: path.join(destDir, '25025.jpg'),
            id: '25025',
            url: '/images/products/25025.jpg',
            name: 'Tulsi Power & Haldi Kesar Drops Combo'
        }
    ];

    for (const task of tasks) {
        if (fs.existsSync(task.src)) {
            fs.copyFileSync(task.src, task.dest);
            console.log(`Copied image to ${task.dest}`);
            
            // Update database
            await db.run('UPDATE products SET image_url = ? WHERE id = ?', [task.url, task.id]);
            console.log(`Updated database for ${task.name} (ID: ${task.id}) with image_url: ${task.url}`);
        } else {
            console.error(`Source file not found: ${task.src}`);
        }
    }
};

copyAndDbUpdate().then(() => {
    console.log("Setup complete!");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
