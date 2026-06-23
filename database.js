const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbPath = path.join(__dirname, "altos.db");

const productsSeed = [
  {
    id: "11002",
    category: "Agri Care",
    name: "Altocare",
    unit: "250 ml",
    price: 530.0,
    mrp: 530,
    bv: 0,
    pv: 0,
    description: "Herbal plant care product for soil and leaves.",
    image_url: ""
  },
  {
    id: "12004",
    category: "Capsule",
    name: "Abhinol Capsule",
    unit: "60 caps",
    price: 348.0,
    mrp: 348,
    bv: 0,
    pv: 0,
    description: "Natural capsule for vitality and energy support.",
    image_url: ""
  },
  {
    id: "13002",
    category: "Clothing",
    name: "Neck Tie Premium Corporate",
    unit: "1 pc",
    price: 499.0,
    mrp: 499,
    bv: 0,
    pv: 0,
    description: "Smart corporate neck tie for professional look.",
    image_url: ""
  },
  {
    id: "14001",
    category: "Color Cosmetic",
    name: "Bb Cream (Light)",
    unit: "30 gm",
    price: 249.0,
    mrp: 249,
    bv: 0,
    pv: 0,
    description: "Lightweight BB cream for smooth and even skin tone.",
    image_url: ""
  },
  {
    id: "15062",
    category: "Deo & Perfume",
    name: "Perfume Bloom",
    unit: "50 ml",
    price: 525.0,
    mrp: 525,
    bv: 0,
    pv: 0,
    description: "Fresh perfume with long-lasting floral notes.",
    image_url: ""
  },
  {
    id: "16121",
    category: "Face Care",
    name: "Apricot Scrub",
    unit: "60 GM",
    price: 110.0,
    mrp: 110,
    bv: 0,
    pv: 0,
    description: "Gentle scrub for clean, glowing skin.",
    image_url: ""
  }
];

const db = new sqlite3.Database(dbPath, error => {
  if (error) {
    console.error("Unable to open database", error);
    process.exit(1);
  }
});

function initialize() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        mrp REAL NOT NULL,
        bv REAL NOT NULL,
        pv REAL NOT NULL,
        description TEXT,
        image_url TEXT
      )
    `);

    // Migration for existing databases
    db.run("ALTER TABLE products ADD COLUMN image_url TEXT", [], err => {
      // Silently ignore if column already exists
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        createdAt TEXT NOT NULL,
        customerName TEXT NOT NULL,
        customerEmail TEXT NOT NULL,
        customerPhone TEXT NOT NULL,
        customerAddress TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL
      )
    `);

    db.run("ALTER TABLE orders ADD COLUMN transactionId TEXT", [], err => {
      // Silently ignore if column already exists
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId TEXT NOT NULL,
        productId TEXT NOT NULL,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY(orderId) REFERENCES orders(id)
      )
    `);

    const seedStatement = db.prepare(`INSERT OR IGNORE INTO products (id, category, name, unit, price, mrp, bv, pv, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    productsSeed.forEach(product => {
      seedStatement.run(
        product.id,
        product.category,
        product.name,
        product.unit,
        product.price,
        product.mrp,
        product.bv,
        product.pv,
        product.description,
        product.image_url || ""
      );
    });

    seedStatement.finalize(err => {
      if (err) {
        console.error("Error seeding products", err);
      }
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  db,
  initialize,
  run,
  get,
  all
};
