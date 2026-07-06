require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");
const { initialize, run, get, all } = require("./database");

// PayU Initialization
const payuKey = process.env.PAYU_KEY || "";
const payuSalt = process.env.PAYU_SALT || "";
const payuEnv = process.env.PAYU_ENV || "test";

const app = express();
const port = process.env.PORT || 3000;
const adminUsername = process.env.ADMIN_USERNAME || "NIROTYAY";
const adminPassword = process.env.ADMIN_PASSWORD || "NALTOS";
const adminToken = process.env.ADMIN_TOKEN || "demo-admin-token";

initialize();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7).trim();
  if (token !== adminToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

app.get("/api/products", async (req, res) => {
  try {
    const items = await all("SELECT * FROM products ORDER BY category, name");
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to load products." });
  }
});

app.post("/api/products", requireAdminAuth, async (req, res) => {
  const { id, category, name, unit, price, mrp, bv, pv, description, image_url } = req.body;
  if (!id || !category || !name || !unit || !price) {
    return res.status(400).json({ error: "Missing required product fields." });
  }
  try {
    await run(
      `INSERT OR REPLACE INTO products (id, category, name, unit, price, mrp, bv, pv, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, category, name, unit, mrp || price || 0, mrp || price || 0, bv || 0, pv || 0, description || "", image_url || ""]
    );
    res.status(201).json({ message: "Product saved." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to save product." });
  }
});

app.put("/api/products/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { category, name, unit, price, mrp, bv, pv, description, image_url } = req.body;
  try {
    await run(
      `UPDATE products SET category = ?, name = ?, unit = ?, price = ?, mrp = ?, bv = ?, pv = ?, description = ?, image_url = ? WHERE id = ?`,
      [category, name, unit, mrp || price || 0, mrp || price || 0, bv || 0, pv || 0, description || "", image_url || "", id]
    );
    res.json({ message: "Product updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to update product." });
  }
});

app.delete("/api/products/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Product removed." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to delete product." });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === adminUsername && password === adminPassword) {
    res.json({ token: adminToken });
  } else {
    res.status(401).json({ error: "Invalid credentials." });
  }
});

app.get("/api/orders", requireAdminAuth, async (req, res) => {
  try {
    const orders = await all("SELECT * FROM orders ORDER BY createdAt DESC");
    const ordersWithItems = await Promise.all(
      orders.map(async order => {
        const items = await all("SELECT * FROM order_items WHERE orderId = ?", [order.id]);
        return {
          ...order,
          items
        };
      })
    );
    res.json(ordersWithItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to load orders." });
  }
});

app.post("/api/orders", async (req, res) => {
  const { customerName, customerEmail, customerPhone, customerAddress, paymentMethod, items, total, transactionId } = req.body;
  if (!customerName || !customerEmail || !customerPhone || !customerAddress || !items?.length) {
    return res.status(400).json({ error: "Missing order information." });
  }

  const orderId = `ORD-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const status = "pending";

  try {
    await run(
      `INSERT INTO orders (id, createdAt, customerName, customerEmail, customerPhone, customerAddress, paymentMethod, total, status, transactionId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, createdAt, customerName, customerEmail, customerPhone, customerAddress, paymentMethod, total, status, transactionId || null]
    );

    await Promise.all(
      items.map(item => run(
        `INSERT INTO order_items (orderId, productId, name, unit, price, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, item.name, item.unit, item.price, item.quantity]
      ))
    );

    if (process.env.STRIPE_SECRET_KEY && paymentMethod === "card") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "inr",
        metadata: { orderId }
      });
      return res.json({ orderId, clientSecret: paymentIntent.client_secret, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
    }

    if (paymentMethod === "payu") {
      if (payuKey && payuSalt) {
        const crypto = require("crypto");
        const amountStr = Number(total).toFixed(2);
        const productinfo = `Order ${orderId}`;
        const firstname = customerName.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "") || "Customer";
        const email = customerEmail;

        const host = req.get('host');
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const origin = `${protocol}://${host}`;
        const surl = `${origin}/api/payments/payu-callback`;
        const furl = `${origin}/api/payments/payu-callback`;

        const hashString = `${payuKey}|${orderId}|${amountStr}|${productinfo}|${firstname}|${email}|||||||||||${payuSalt}`;
        const hash = crypto.createHash("sha512").update(hashString).digest("hex");

        const action = (payuEnv === 'prod' || payuEnv === 'production' || payuEnv === 'secure')
          ? 'https://secure.payu.in/_payment'
          : 'https://test.payu.in/_payment';

        return res.json({
          orderId,
          payuForm: {
            key: payuKey,
            txnid: orderId,
            amount: amountStr,
            productinfo,
            firstname,
            email,
            phone: customerPhone,
            surl,
            furl,
            hash,
            service_provider: "payu_paisa",
            action
          }
        });
      } else {
        return res.json({
          orderId,
          mockPayment: true,
          amount: total
        });
      }
    }

    res.json({ orderId, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to create order." });
  }
});

app.put("/api/orders/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { customerName, customerEmail, customerPhone, customerAddress, paymentMethod, total, status, transactionId } = req.body;
  if (!customerName || !customerEmail || !customerPhone || !customerAddress || !status || total === undefined) {
    return res.status(400).json({ error: "Missing required order edit fields." });
  }
  try {
    await run(
      `UPDATE orders 
       SET customerName = ?, customerEmail = ?, customerPhone = ?, customerAddress = ?, paymentMethod = ?, total = ?, status = ?, transactionId = ?
       WHERE id = ?`,
      [customerName, customerEmail, customerPhone, customerAddress, paymentMethod, total, status, transactionId || null, id]
    );
    res.json({ message: "Order updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to update order." });
  }
});

app.delete("/api/orders/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM order_items WHERE orderId = ?", [id]);
    await run("DELETE FROM orders WHERE id = ?", [id]);
    res.json({ message: "Order removed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to delete order." });
  }
});

app.post("/api/payments/confirm", async (req, res) => {
  const { orderId, paymentIntentId } = req.body;
  if (!orderId || !paymentIntentId) {
    return res.status(400).json({ error: "Missing payment confirmation data." });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === "succeeded") {
      await run("UPDATE orders SET status = ? WHERE id = ?", ["paid", orderId]);
      return res.json({ success: true });
    }
    res.status(400).json({ error: "Payment not completed." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to confirm payment." });
  }
});

app.post("/api/payments/verify-payu", async (req, res) => {
  const { orderId, txnid, status, mock } = req.body;

  if (!payuKey || !payuSalt || mock) {
    try {
      await run("UPDATE orders SET status = ?, transactionId = ? WHERE id = ?", ["paid", "MOCK_PAYU_PAYMENT", orderId || txnid]);
      return res.json({ success: true, mock: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unable to confirm mock payment." });
    }
  }

  res.status(400).json({ error: "Real PayU payments must be processed via secure callback." });
});

app.post("/api/payments/payu-callback", async (req, res) => {
  const { key, txnid, amount, productinfo, firstname, email, status, hash, mihpayid, additional_charges } = req.body;

  if (!payuKey || !payuSalt) {
    return res.redirect(`/index.html?payment_failed=true&orderId=${txnid || "unknown"}`);
  }

  try {
    const crypto = require("crypto");
    const udf5 = req.body.udf5 || "";
    const udf4 = req.body.udf4 || "";
    const udf3 = req.body.udf3 || "";
    const udf2 = req.body.udf2 || "";
    const udf1 = req.body.udf1 || "";

    let verifyString = "";
    if (additional_charges) {
      verifyString = `${additional_charges}|${payuSalt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    } else {
      verifyString = `${payuSalt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    }

    const generatedHash = crypto.createHash("sha512").update(verifyString).digest("hex");

    if (generatedHash === hash) {
      if (status === "success") {
        await run("UPDATE orders SET status = ?, transactionId = ? WHERE id = ?", ["paid", mihpayid || txnid, txnid]);
        res.redirect(`/index.html?payment_success=true&orderId=${txnid}`);
      } else {
        await run("UPDATE orders SET status = ?, transactionId = ? WHERE id = ?", ["failed", mihpayid || txnid, txnid]);
        res.redirect(`/index.html?payment_failed=true&orderId=${txnid}`);
      }
    } else {
      console.error("PayU signature validation failed. Expected:", generatedHash, "Received:", hash);
      res.status(400).send("Invalid payment signature verification failed.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to verify payment signature.");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Admin import endpoint: re-parse product-list.html and import products
app.post('/api/admin/import-products', requireAdminAuth, async (req, res) => {
  const fs = require('fs');
  const file = path.join(__dirname, 'public', 'product-list.html');
  try {
    const html = fs.readFileSync(file, 'utf8');
    // parse card sections: <h3 class="card-title">Category (N)</h3> ... <tbody>...</tbody>
    const products = [];
    const cardRe = /<h3[^>]*class="card-title">([^<]+)<\/h3>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/gmi;
    let cm;
    const strip = s => (s||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
    while ((cm = cardRe.exec(html)) !== null) {
      const rawCat = cm[1] || '';
      const category = strip(rawCat.replace(/\s*\(\d+\)$/, ''));
      const tbody = cm[2] || '';
      const rowRe = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi;
      let rm;
      while ((rm = rowRe.exec(tbody)) !== null) {
        const rowHtml = rm[1];
        const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const cells = [];
        let tdm;
        while ((tdm = tdRe.exec(rowHtml)) !== null) {
          cells.push(strip(tdm[1]));
        }
        if (cells.length >= 8) {
          const code = cells[1];
          if (!/^[0-9]{5}$/.test(code)) continue;
          const name = cells[2];
          const unit = cells[3] || '';
          const mrp = parseFloat((cells[4]||'').replace(/[^0-9.\-]/g,'')) || 0;
          const price = parseFloat((cells[5]||'').replace(/[^0-9.\-]/g,'')) || 0;
          const bv = parseFloat((cells[6]||'').replace(/[^0-9.\-]/g,'')) || 0;
          const pv = parseFloat((cells[7]||'').replace(/[^0-9.\-]/g,'')) || 0;
          products.push({ id: code, category, name, unit, price: price||mrp, mrp, bv, pv });
        }
      }
    }

    const stmtSql = `INSERT INTO products (id, category, name, unit, price, mrp, bv, pv, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category = excluded.category,
        name = excluded.name,
        unit = excluded.unit,
        price = excluded.price,
        mrp = excluded.mrp`;
    let inserted = 0;
    const imgPools = {
      'Agri Care': ['img_p1_2.png'],
      'Capsule': [
        'img_p1_20.png', 'img_p1_22.png', 'img_p1_24.png', 'img_p1_26.png', 'img_p1_28.png',
        'img_p1_30.png', 'img_p1_32.png', 'img_p1_34.png', 'img_p1_36.png', 'img_p1_38.png',
        'img_p1_40.png', 'img_p1_42.png', 'img_p1_44.png', 'img_p1_46.png', 'img_p1_48.png',
        'img_p1_50.png', 'img_p1_52.png', 'img_p1_54.png', 'img_p1_56.png', 'img_p1_58.png',
        'img_p1_60.png', 'img_p1_62.png', 'img_p1_64.png'
      ],
      'Clothing': ['img_p1_7.jpg'],
      'Color Cosmetic': ['img_p1_103.jpg'],
      'Deo & Perfume': ['img_p6_2.png', 'img_p6_6.png', 'img_p6_10.png', 'img_p6_14.png', 'img_p6_18.png'],
      'Face Care': [
        'img_p1_12.png', 'img_p1_46.png', 'img_p1_54.png', 'img_p1_58.png', 'img_p1_60.png'
      ],
      'Facial Kit & Bleach': ['img_p1_14.png', 'img_p1_62.png', 'img_p1_64.png'],
      'Hair Care': [
        'img_p6_22.png', 'img_p6_26.png', 'img_p6_30.png', 'img_p6_34.png', 'img_p6_38.png',
        'img_p6_42.png', 'img_p6_44.png', 'img_p6_48.png', 'img_p6_54.png', 'img_p6_58.png',
        'img_p6_60.png', 'img_p6_62.png', 'img_p6_68.png', 'img_p6_72.png'
      ],
      'Hand & Body Care': ['img_p6_76.png', 'img_p6_86.png', 'img_p6_90.png', 'img_p6_94.png'],
      'Herbal Oil & Ointment': ['img_p6_100.png', 'img_p6_106.png', 'img_p6_113.png', 'img_p6_117.png', 'img_p6_122.png', 'img_p6_124.png', 'img_p6_128.png', 'img_p6_132.png', 'img_p6_138.png'],
      'Home Care': ['img_p6_26.png', 'img_p6_54.png', 'img_p6_58.png', 'img_p6_62.png'],
      'Juice Concentrate': ['img_p6_30.png', 'img_p6_68.png', 'img_p6_72.png', 'img_p6_86.png'],
      'Lips': ['img_p6_54.png', 'img_p6_90.png', 'img_p6_94.png', 'img_p6_100.png', 'img_p6_106.png'],
      'Liquid Extract': ['img_p6_58.png', 'img_p6_113.png', 'img_p6_117.png', 'img_p6_122.png'],
      'Marketing Tool': ['img_p6_72.png', 'img_p6_124.png', 'img_p6_132.png'],
      'Mens Grooming': ['img_p8_3.png'],
      'Moisturizer': ['img_p8_4.png']
    };
    for (const p of products) {
      try {
        const imageUrl = "";
        await run(stmtSql, [p.id, p.category, p.name, p.unit, p.mrp || p.price || 0, p.mrp || p.price || 0, 'Imported via admin endpoint', imageUrl]);
        inserted++;
      } catch (err) {
        console.error('Import product error', p.id, err && err.message ? err.message : err);
      }
    }

    res.json({ imported: inserted, totalParsed: products.length });
  } catch (err) {
    console.error('Import failed', err);
    res.status(500).json({ error: 'Import failed', detail: err.message });
  }
});

app.listen(port, () => {
  console.log(`Altos distributor server running on http://localhost:${port}`);
});
