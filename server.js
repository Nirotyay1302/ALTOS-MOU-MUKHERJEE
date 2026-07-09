require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "");
const { initialize, run, get, all } = require("./database");



const app = express();
const port = process.env.PORT || 3000;
const adminUsername = process.env.ADMIN_USERNAME || "NIROTYAY";
const adminPassword = process.env.ADMIN_PASSWORD || "NALTOS";
const adminToken = process.env.ADMIN_TOKEN || "demo-admin-token";

initialize();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
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

// Helper to save base64 image
function saveBase64Image(productId, base64Data) {
  if (!base64Data) return "";
  
  if (!base64Data.startsWith("data:image/")) {
    return base64Data; // Just return it if it's already a URL
  }
  
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image data format");
  }
  
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  
  let ext = '.png';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    ext = '.jpg';
  } else if (mimeType === 'image/gif') {
    ext = '.gif';
  } else if (mimeType === 'image/webp') {
    ext = '.webp';
  }
  
  const filename = `${productId}${ext}`;
  const dir = path.join(__dirname, 'public', 'images', 'products');
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  
  return `/images/products/${filename}`;
}

// Helper to delete product image if it exists locally
async function deleteLocalImage(productId) {
  try {
    const p = await get("SELECT image_url FROM products WHERE id = ?", [productId]);
    if (p && p.image_url && p.image_url.startsWith("/images/products/")) {
      const filePath = path.join(__dirname, 'public', p.image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error("Failed to delete local image for product:", productId, err);
  }
}

app.post("/api/products", requireAdminAuth, async (req, res) => {
  const { id, category, name, unit, price, mrp, bv, pv, description, image_url, image_data } = req.body;
  if (!id || !category || !name || !unit || !price) {
    return res.status(400).json({ error: "Missing required product fields." });
  }
  try {
    let finalImageUrl = image_url || "";
    if (image_data) {
      finalImageUrl = saveBase64Image(id, image_data);
    }
    await run(
      `INSERT OR REPLACE INTO products (id, category, name, unit, price, mrp, bv, pv, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, category, name, unit, mrp || price || 0, mrp || price || 0, bv || 0, pv || 0, description || "", finalImageUrl]
    );
    res.status(201).json({ message: "Product saved." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to save product." });
  }
});

app.put("/api/products/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { category, name, unit, price, mrp, bv, pv, description, image_url, image_data } = req.body;
  try {
    let finalImageUrl = image_url || "";
    if (image_data) {
      await deleteLocalImage(id);
      finalImageUrl = saveBase64Image(id, image_data);
    } else if (!finalImageUrl) {
      await deleteLocalImage(id);
    }
    await run(
      `UPDATE products SET category = ?, name = ?, unit = ?, price = ?, mrp = ?, bv = ?, pv = ?, description = ?, image_url = ? WHERE id = ?`,
      [category, name, unit, mrp || price || 0, mrp || price || 0, bv || 0, pv || 0, description || "", finalImageUrl, id]
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
    await deleteLocalImage(id);
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

app.get("/api/orders/:id/receipt", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await get("SELECT * FROM orders WHERE id = ?", [id]);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    const items = await all("SELECT * FROM order_items WHERE orderId = ?", [id]);

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${order.id}.pdf`);
    doc.pipe(res);

    // Draw header
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#2B6CB0").text("ALTOS DISTRIBUTOR", 50, 50);
    doc.font("Helvetica").fontSize(10).fillColor("#718096").text("Official Altos Product Distributor", 50, 75);
    doc.font("Helvetica").fontSize(10).fillColor("#4A5568").text("Email: support@altos.com\nWhatsApp: +91 9830959157", 400, 50, { align: "right" });

    // Divider
    doc.moveTo(50, 105).lineTo(562, 105).strokeColor("#CBD5E0").lineWidth(1).stroke();

    // Order receipt info
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#2D3748").text("ORDER RECEIPT", 50, 120);

    // Left Metadata Column
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#4A5568").text("Order ID: ", 50, 140);
    doc.font("Helvetica").text(order.id, 105, 140);
    doc.font("Helvetica-Bold").text("Date: ", 50, 155);
    doc.font("Helvetica").text(new Date(order.createdAt).toLocaleString(), 105, 155);

    // Right Metadata Column
    let paymentStr = order.paymentMethod === 'upi' ? `UPI (Txn ID: ${order.transactionId || 'N/A'})` : 'Cash on Delivery (COD)';
    doc.font("Helvetica-Bold").text("Status: ", 300, 140);
    doc.font("Helvetica").text(order.status.toUpperCase(), 355, 140);
    doc.font("Helvetica-Bold").text("Payment: ", 300, 155);
    doc.font("Helvetica").text(paymentStr, 355, 155);

    // Billing & Customer Details
    doc.moveTo(50, 180).lineTo(562, 180).strokeColor("#E2E8F0").lineWidth(1).stroke();

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#2D3748").text("BILL TO (CUSTOMER DETAILS)", 50, 195);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#4A5568").text("Name: ", 50, 215);
    doc.font("Helvetica").text(order.customerName, 100, 215);
    doc.font("Helvetica-Bold").text("Phone: ", 50, 230);
    doc.font("Helvetica").text(order.customerPhone, 100, 230);
    doc.font("Helvetica-Bold").text("Email: ", 50, 245);
    doc.font("Helvetica").text(order.customerEmail, 100, 245);
    doc.font("Helvetica-Bold").text("Address: ", 50, 260);
    doc.font("Helvetica").text(order.customerAddress, 100, 260, { width: 462 });

    // Table of items
    let currentY = doc.y + 20;
    doc.moveTo(50, currentY).lineTo(562, currentY).strokeColor("#CBD5E0").lineWidth(1).stroke();
    currentY += 8;

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#2D3748");
    doc.text("Item Name", 50, currentY, { width: 220 });
    doc.text("Unit", 280, currentY, { width: 60, align: "center" });
    doc.text("Price", 350, currentY, { width: 60, align: "right" });
    doc.text("Qty", 420, currentY, { width: 40, align: "center" });
    doc.text("Total", 470, currentY, { width: 92, align: "right" });

    currentY += 15;
    doc.moveTo(50, currentY).lineTo(562, currentY).strokeColor("#E2E8F0").lineWidth(1).stroke();
    currentY += 8;

    doc.font("Helvetica").fontSize(10).fillColor("#4A5568");
    let itemsSubtotal = 0;
    items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      itemsSubtotal += itemTotal;

      doc.text(item.name, 50, currentY, { width: 220 });
      const nameHeight = doc.heightOfString(item.name, { width: 220 });
      const rowHeight = Math.max(nameHeight, 15);

      doc.text(item.unit || "", 280, currentY, { width: 60, align: "center" });
      doc.text(`Rs. ${item.price.toFixed(2)}`, 350, currentY, { width: 60, align: "right" });
      doc.text(item.quantity.toString(), 420, currentY, { width: 40, align: "center" });
      doc.text(`Rs. ${itemTotal.toFixed(2)}`, 470, currentY, { width: 92, align: "right" });

      currentY += rowHeight + 8;

      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Divider
    doc.moveTo(50, currentY).lineTo(562, currentY).strokeColor("#CBD5E0").lineWidth(1).stroke();
    currentY += 10;

    // Totals
    doc.font("Helvetica");
    doc.text("Items Subtotal:", 350, currentY, { width: 110, align: "right" });
    doc.text(`Rs. ${itemsSubtotal.toFixed(2)}`, 470, currentY, { width: 92, align: "right" });
    currentY += 15;

    if (order.paymentMethod === 'cod') {
      doc.text("COD Convenience Fee:", 350, currentY, { width: 110, align: "right" });
      doc.text("Rs. 30.00", 470, currentY, { width: 92, align: "right" });
      currentY += 15;
    }

    doc.font("Helvetica-Bold");
    doc.text("Grand Total:", 350, currentY, { width: 110, align: "right" });
    doc.text(`Rs. ${order.total.toFixed(2)}`, 470, currentY, { width: 92, align: "right" });
    currentY += 30;

    if (currentY > 730) {
      doc.addPage();
      currentY = 50;
    }

    // Signature/Footer
    doc.moveTo(50, currentY).lineTo(562, currentY).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    currentY += 15;

    doc.font("Helvetica").fontSize(9).fillColor("#718096");
    doc.text("Thank you for buying from Altos distributor storefront!", 50, currentY, { align: "center" });
    doc.text("This is a computer-generated invoice and requires no signature.", 50, currentY + 12, { align: "center" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to generate receipt PDF." });
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category = excluded.category,
        name = excluded.name,
        unit = excluded.unit,
        price = excluded.price,
        mrp = excluded.mrp,
        bv = excluded.bv,
        pv = excluded.pv`;
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
        await run(stmtSql, [
          p.id,
          p.category,
          p.name,
          p.unit,
          p.price || 0,
          p.mrp || 0,
          p.bv || 0,
          p.pv || 0,
          'Imported via admin endpoint',
          imageUrl
        ]);
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
