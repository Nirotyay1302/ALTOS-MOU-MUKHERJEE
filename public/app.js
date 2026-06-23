const fallbackGradients = {
    'Agri Care': 'linear-gradient(135deg, #11998e, #38ef7d)',
    'Capsule': 'linear-gradient(135deg, #f857a6, #ff5858)',
    'Clothing': 'linear-gradient(135deg, #11998e, #38ef7d)',
    'Color Cosmetic': 'linear-gradient(135deg, #ff9966, #ff5e62)',
    'Deo & Perfume': 'linear-gradient(135deg, #4ea1d3, #485461)',
    'Face Care': 'linear-gradient(135deg, #ff758c, #ff7eb3)',
    'Facial Kit & Bleach': 'linear-gradient(135deg, #fc00ff, #00dbde)',
    'Hair Care': 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
    'Hand & Body Care': 'linear-gradient(135deg, #11998e, #38ef7d)',
    'Herbal Oil & Ointment': 'linear-gradient(135deg, #e1eec3, #f05053)',
    'Home Care': 'linear-gradient(135deg, #2b5876, #4e4376)',
    'Juice Concentrate': 'linear-gradient(135deg, #ffe259, #ffa751)',
    'Lips': 'linear-gradient(135deg, #ff0844, #ffb199)',
    'Liquid Extract': 'linear-gradient(135deg, #2193b0, #6dd5ed)',
    'Marketing Tool': 'linear-gradient(135deg, #2c3e50, #000000)',
    'Mens Grooming': 'linear-gradient(135deg, #00c6ff, #0072ff)',
    'Moisturizer': 'linear-gradient(135deg, #fe8c00, #f83600)'
};

const storageKeys = {
    cart: "altosCart",
    buyNow: "altosBuyNow",
    adminToken: "altosAdminToken"
};

let products = [];
let adminOrders = [];

function getCart() {
    return JSON.parse(localStorage.getItem(storageKeys.cart) || "[]");
}

function saveCart(cart) {
    localStorage.setItem(storageKeys.cart, JSON.stringify(cart));
}

function setBuyNow(productId, qty = 1) {
    localStorage.setItem(storageKeys.buyNow, JSON.stringify({ id: productId, qty: Number(qty) || 1 }));
}

function clearBuyNow() {
    localStorage.removeItem(storageKeys.buyNow);
}

function getBuyNowProduct() {
    const raw = localStorage.getItem(storageKeys.buyNow);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return { id: raw, qty: 1 };
    }
}

function updateCartBadge() {
    const badgeElements = document.querySelectorAll("#cart-badge");
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    badgeElements.forEach(el => {
        el.textContent = total;
    });
}

async function loadProducts() {
    try {
        const response = await fetch("/api/products");
        products = await response.json();
    } catch (error) {
        console.error("Unable to load products", error);
        products = [];
    }
}

function renderProducts() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    const categorySelect = document.getElementById("category-select");
    const searchInput = document.getElementById("search-input");
    const selectedCategory = categorySelect?.value || "all";
    const searchTerm = searchInput?.value.trim().toLowerCase() || "";

    const filtered = products.filter(product => {
        const categoryMatch = selectedCategory === "all" || product.category === selectedCategory;
        const searchMatch = product.name.toLowerCase().includes(searchTerm) || product.id.toLowerCase().includes(searchTerm);
        return categoryMatch && searchMatch;
    });

    grid.innerHTML = filtered.map(product => {
        const gradient = fallbackGradients[product.category] || 'linear-gradient(135deg, #667eea, #764ba2)';

        return `<article class="product-card">
            <div class="product-card-body">
                <span class="product-category-tag">${product.category}</span>
                <h3>${product.name}</h3>
                <div class="product-meta">Code: ${product.id} • Unit: ${product.unit}</div>
                <p class="product-description">${product.description || "No description available."}</p>
                
                <div class="price-row">
                    <div class="price-wrapper">
                        <span class="price-sell">MRP: ₹${product.mrp.toFixed(2)}</span>
                    </div>
                </div>
                <div class="action-row">
                    <div class="qty-wrapper">
                        <label for="qty-${product.id}">Qty</label>
                        <input id="qty-${product.id}" class="product-qty-input" type="number" min="1" value="1" />
                    </div>
                    <div class="button-wrapper">
                        <button class="button button-secondary" onclick="addToCart('${product.id}', parseInt(document.getElementById('qty-${product.id}').value || '1', 10))">Add</button>
                        <button class="button button-primary" onclick="buyNow('${product.id}', parseInt(document.getElementById('qty-${product.id}').value || '1', 10))">Buy Now</button>
                    </div>
                </div>
            </div>
        </article>`;
    }).join("");

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="product-card no-results"><p>No products found. Try a different keyword or category.</p></div>`;
    }
}

function initializeFilters() {
    const select = document.getElementById("category-select");
    if (!select) return;

    const uniqueCategories = [...new Set(products.map(item => item.category))].sort();
    const categories = ["all", ...uniqueCategories];
    select.innerHTML = categories.map(cat => {
        const label = cat === "all" ? "All Categories" : cat;
        return `<option value="${cat}">${label}</option>`;
    }).join("");

    select.addEventListener("change", renderProducts);
    const search = document.getElementById("search-input");
    search?.addEventListener("input", renderProducts);
}

function addToCart(productId, quantity = 1) {
    const qty = Number(quantity) || 1;
    const product = products.find(item => item.id === productId);
    if (!product) return;

    const cart = getCart();
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ ...product, quantity: qty });
    }
    saveCart(cart);
    updateCartBadge();
    alert(`${product.name} (x${qty}) added to cart.`);
}

function buyNow(productId, quantity = 1) {
    setBuyNow(productId, quantity);
    window.location.href = "checkout.html";
}

function renderCartPage() {
    const container = document.getElementById("cart-items");
    const summaryCount = document.getElementById("summary-count");
    const summaryTotal = document.getElementById("summary-total");
    const button = document.getElementById("checkout-button");
    if (!container || !summaryCount || !summaryTotal || !button) return;

    const cart = getCart();
    if (cart.length === 0) {
        container.innerHTML = `<div class="product-card"><p>Your cart is empty. Browse the shop to add products.</p></div>`;
        summaryCount.textContent = "0";
        summaryTotal.textContent = "0.00";
        button.classList.add("button-secondary");
        button.classList.remove("button-primary");
        button.textContent = "Continue shopping";
        button.href = "index.html";
        return;
    }

    container.innerHTML = cart.map(item => {
        const gradient = fallbackGradients[item.category] || 'linear-gradient(135deg, #667eea, #764ba2)';
        return `<div class="cart-item">
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.name}</h3>
                <div class="cart-item-meta">Code: ${item.id} • ${item.unit}</div>
                <div class="cart-item-meta">MRP: ₹${item.mrp.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <div class="qty-selector">
                    <button onclick="changeCartQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeCartQuantity('${item.id}', 1)">+</button>
                </div>
                <strong>₹${(item.mrp * item.quantity).toFixed(2)}</strong>
                <button class="button button-secondary" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        </div>`;
    }).join("");

    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    summaryCount.textContent = totalQuantity;
    summaryTotal.textContent = totalAmount.toFixed(2);
}

function changeCartQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(entry => entry.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity < 1) {
        const index = cart.findIndex(entry => entry.id === productId);
        cart.splice(index, 1);
    }
    saveCart(cart);
    renderCartPage();
    updateCartBadge();
}

function removeFromCart(productId) {
    const cart = getCart().filter(item => item.id !== productId);
    saveCart(cart);
    renderCartPage();
    updateCartBadge();
}

function renderCheckoutPage() {
    const itemsContainer = document.getElementById("checkout-items");
    const totalNode = document.getElementById("checkout-total");
    const form = document.getElementById("checkout-form");
    if (!itemsContainer || !totalNode || !form) return;

    let checkoutItems = [];
    const buyNow = getBuyNowProduct();
    if (buyNow && buyNow.id) {
        const product = products.find(item => item.id === buyNow.id);
        if (product) {
            checkoutItems = [{ ...product, quantity: buyNow.qty || 1 }];
        }
    } else {
        checkoutItems = getCart();
    }

    if (checkoutItems.length === 0) {
        itemsContainer.innerHTML = `<p>Your cart is empty. Add products before checkout.</p>`;
        totalNode.textContent = "0.00";
        form.querySelector("button[type=submit]").disabled = true;
        return;
    }

    itemsContainer.innerHTML = checkoutItems.map(item => {
        const rate = item.mrp;
        const gradient = fallbackGradients[item.category] || 'linear-gradient(135deg, #667eea, #764ba2)';
        return `<div class="checkout-item-card">
            <div class="checkout-item-info">
                <h3>${item.name}</h3>
                <p>Code: ${item.id} • Qty: ${item.quantity}</p>
                <p>Price: ₹${rate.toFixed(2)} each</p>
                <strong>Subtotal: ₹${(rate * item.quantity).toFixed(2)}</strong>
            </div>
        </div>`;
    }).join("");

    const total = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalNode.textContent = total.toFixed(2);

    // Dynamic UI logic for UPI / COD choice
    const radios = form.querySelectorAll("input[name='paymentMethod']");
    const codFeeRow = document.getElementById("cod-fee-row");
    const upiSection = document.getElementById("upi-payment-section");
    const codSection = document.getElementById("cod-payment-section");
    const txInput = document.getElementById("transaction-id");

    function updatePaymentUI(selectedMethod, skipConfirm = false) {
        if (selectedMethod === "cod") {
            let confirmed = true;
            if (!skipConfirm) {
                confirmed = confirm("Are you sure you want to select Cash on Delivery? There is an extra ₹20.00 convenience fee for COD orders.");
            }
            if (confirmed) {
                if (codFeeRow) codFeeRow.style.display = "flex";
                if (codSection) codSection.style.display = "block";
                if (upiSection) upiSection.style.display = "none";
                totalNode.textContent = (total + 20).toFixed(2);
                if (txInput) txInput.removeAttribute("required");
                const codRadio = form.querySelector("input[name='paymentMethod'][value='cod']");
                if (codRadio) codRadio.checked = true;
            } else {
                const upiRadio = form.querySelector("input[name='paymentMethod'][value='upi']");
                if (upiRadio) upiRadio.checked = true;
                updatePaymentUI("upi", true);
            }
        } else {
            if (codFeeRow) codFeeRow.style.display = "none";
            if (codSection) codSection.style.display = "none";
            if (upiSection) upiSection.style.display = "block";
            totalNode.textContent = total.toFixed(2);
            if (txInput) txInput.setAttribute("required", "required");
        }
    }

    radios.forEach(radio => {
        radio.addEventListener("change", e => {
            updatePaymentUI(e.target.value);
        });
    });

    updatePaymentUI("upi", true);

    form.addEventListener("submit", event => {
        event.preventDefault();
        submitCheckout(checkoutItems, total);
    });
}

async function submitCheckout(items, baseTotal) {
    const name = document.getElementById("customer-name").value.trim();
    const email = document.getElementById("customer-email").value.trim();
    const phone = document.getElementById("customer-phone").value.trim();
    const address = document.getElementById("customer-address").value.trim();
    const method = document.querySelector("input[name='paymentMethod']:checked").value;

    if (!name || !email || !phone || !address) {
        alert("Please complete all customer details before placing the order.");
        return;
    }

    let transactionId = null;
    let finalTotal = baseTotal;

    if (method === "upi") {
        const txInput = document.getElementById("transaction-id");
        transactionId = txInput.value.trim();
        if (!/^\d{12}$/.test(transactionId)) {
            document.getElementById("upi-errors").textContent = "Please enter a valid 12-digit UPI Transaction ID / UTR.";
            txInput.focus();
            return;
        } else {
            document.getElementById("upi-errors").textContent = "";
        }
    } else if (method === "cod") {
        finalTotal = baseTotal + 20;
    }

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                customerAddress: address,
                paymentMethod: method,
                items,
                total: finalTotal,
                transactionId: transactionId
            })
        });
        const payload = await response.json();
        if (!response.ok) {
            throw new Error(payload.error || "Order creation failed.");
        }

        finalizeOrder(payload.orderId, method === "upi", phone, items, finalTotal, method, transactionId);
    } catch (error) {
        alert(error.message);
    }
}

function finalizeOrder(orderId, paid = false, customerPhone = '', items = [], total = 0, method = 'upi', transactionId = null) {
    clearBuyNow();
    saveCart([]);
    updateCartBadge();
    
    alert(`Order placed successfully! Order ID: ${orderId}`);
    window.location.href = "index.html";
}

function getAdminToken() {
    return localStorage.getItem(storageKeys.adminToken);
}

function setAdminToken(token) {
    localStorage.setItem(storageKeys.adminToken, token);
}

function clearAdminToken() {
    localStorage.removeItem(storageKeys.adminToken);
}

async function fetchAdminOrders() {
    const token = getAdminToken();
    if (!token) throw new Error("Not authenticated as admin. Please log in.");
    const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to load orders.");
    }
    return await response.json();
}

async function fetchAdminProducts() {
    const response = await fetch("/api/products");
    if (!response.ok) {
        throw new Error("Unable to load products.");
    }
    return await response.json();
}

function renderOrders(listElement, orders) {
    if (!orders.length) {
        listElement.innerHTML = `<div class="product-card"><p>No orders have been placed yet.</p></div>`;
        return;
    }
    listElement.innerHTML = orders.map(order => {
        const itemsHtml = order.items.map(item => {
            const rate = item.mrp ?? item.price;
            return `<li>${item.name} (${item.unit}) × ${item.quantity} — ₹${(rate * item.quantity).toFixed(2)}</li>`;
        }).join("");
        return `<div class="order-card" id="order-card-${order.id}">
            <h3>${order.customerName} — ${order.id}</h3>
            <p><strong>Email:</strong> ${order.customerEmail}</p>
            <p><strong>Phone:</strong> ${order.customerPhone}</p>
            <p><strong>Address:</strong> ${order.customerAddress}</p>
            <p><strong>Payment:</strong> ${order.paymentMethod === 'upi' ? `UPI (Transaction ID: ${order.transactionId || 'N/A'})` : 'Cash on Delivery (COD)'}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
            <ul>${itemsHtml}</ul>
            <div class="order-card-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="button button-primary-light" onclick="sendAdminWhatsApp('${order.id}')">Send WhatsApp</button>
                <button class="button button-danger" onclick="deleteOrder('${order.id}')">Delete</button>
            </div>
        </div>`;
    }).join("");
}

function sendAdminWhatsApp(orderId) {
    const order = adminOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const customerPhone = order.customerPhone;
    const raw = String(customerPhone || '').replace(/\D/g, '');
    let waNumber = raw;
    if (waNumber.length === 10) waNumber = '91' + waNumber;

    const lines = [];
    lines.push('thank you for purchasing from altos your order will be deliver soon');
    lines.push('..... order details');
    lines.push(`Order ID: ${order.id}`);
    lines.push('Items:');
    order.items.forEach(it => {
        const rate = it.mrp ?? it.price ?? 0;
        lines.push(`- ${it.name} (${it.unit}) x${it.quantity} @ ₹${rate.toFixed(2)}`);
    });
    
    if (order.paymentMethod === 'cod') {
        lines.push('Convenience Fee (COD): ₹20.00');
    }
    lines.push(`Total Money: ₹${Number(order.total).toFixed(2)}`);
    lines.push(`Payment Method: ${order.paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery (COD)'}`);
    if (order.paymentMethod === 'upi' && order.transactionId) {
        lines.push(`UPI Transaction ID: ${order.transactionId}`);
    }
    lines.push('Thanking you');
    lines.push('Mou Mukherjee');
    lines.push('(3875042)');
    
    const message = encodeURIComponent(lines.join('\n'));
    const waLink = `https://wa.me/${waNumber}?text=${message}`;
    window.open(waLink, '_blank');
}

// Edit functionality removed: order editing UI and handlers were deleted.

async function deleteOrder(orderId) {
    if (!confirm("Are you sure you want to delete this order?")) return;
    const token = getAdminToken();
    if (!token) { alert('Admin not logged in. Please login to delete orders.'); return; }
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error("Unable to delete order.");
        }
        renderAdminPage();
    } catch (error) {
        alert(error.message);
    }
}

// Order edit submission handler removed along with edit UI.

function renderProductList(listElement, productsData) {
    if (!productsData.length) {
        listElement.innerHTML = `<div class="product-card"><p>No products available.</p></div>`;
        return;
    }
    listElement.innerHTML = productsData.map(product => {
        const gradient = fallbackGradients[product.category] || 'linear-gradient(135deg, #667eea, #764ba2)';

        return `<div class="admin-product-row">
            <div class="admin-product-details">
                <h3>${product.name}</h3>
                <div class="admin-product-meta-grid">
                    <div><strong>Code:</strong> ${product.id}</div>
                    <div><strong>Category:</strong> ${product.category}</div>
                    <div><strong>Unit:</strong> ${product.unit}</div>
                    <div><strong>MRP:</strong> ₹${product.mrp.toFixed(2)}</div>
                </div>
                <p class="admin-product-desc-preview">${product.description || "No description available."}</p>
            </div>
            <div class="admin-product-actions">
                <button class="button button-primary-light" onclick="editProduct('${product.id}')">Edit</button>
                <button class="button button-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>`;
    }).join("");
}

function showAdminTab(tab) {
    document.getElementById("orders-panel").classList.toggle("hidden", tab !== "orders");
    document.getElementById("products-panel").classList.toggle("hidden", tab !== "products");
    document.getElementById("tab-orders").classList.toggle("button-primary", tab === "orders");
    document.getElementById("tab-orders").classList.toggle("button-secondary", tab !== "orders");
    document.getElementById("tab-products").classList.toggle("button-primary", tab === "products");
    document.getElementById("tab-products").classList.toggle("button-secondary", tab !== "products");
}

async function renderProductsManagement() {
    const listElement = document.getElementById("product-list");
    if (!listElement) return;
    try {
        const items = await fetchAdminProducts();
        renderProductList(listElement, items);
    } catch (error) {
        listElement.innerHTML = `<div class="product-card"><p>${error.message}</p></div>`;
    }
}

function openProductForm(product = null) {
    const formArea = document.getElementById("product-form");
    const title = document.getElementById("product-form-title");
    const formElement = document.getElementById("product-edit-form");
    if (!formArea || !title || !formElement) return;

    formArea.classList.remove("hidden");
    title.textContent = product ? "Edit Product" : "Add Product";
    formElement.elements.id.value = product?.id || "";
    formElement.elements.name.value = product?.name || "";
    formElement.elements.category.value = product?.category || "";
    formElement.elements.unit.value = product?.unit || "";
    formElement.elements.mrp.value = product?.mrp || "";
    formElement.elements.description.value = product?.description || "";

    if (product) {
        formElement.elements.id.setAttribute("readonly", "readonly");
    } else {
        formElement.elements.id.removeAttribute("readonly");
    }
}

function closeProductForm() {
    document.getElementById("product-form")?.classList.add("hidden");
}

async function editProduct(productId) {
    try {
        const items = await fetchAdminProducts();
        const product = items.find(item => item.id === productId);
        if (product) {
            openProductForm(product);
        }
    } catch (error) {
        alert("Unable to load product for editing.");
    }
}

async function deleteProduct(productId) {
    if (!confirm("Delete this product permanently?")) return;
    const token = getAdminToken();
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error("Unable to delete product.");
        }
        renderProductsManagement();
    } catch (error) {
        alert(error.message);
    }
}

async function handleProductSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
        id: form.elements.id.value.trim(),
        name: form.elements.name.value.trim(),
        category: form.elements.category.value.trim(),
        unit: form.elements.unit.value.trim(),
        price: parseFloat(form.elements.mrp.value) || 0,
        mrp: parseFloat(form.elements.mrp.value) || 0,
        bv: 0,
        pv: 0,
        image_url: "",
        description: form.elements.description.value.trim()
    };

    if (!data.id || !data.name || !data.category || !data.unit || !data.mrp) {
        alert("Please complete the product form.");
        return;
    }

    const token = getAdminToken();
    const isEdit = form.elements.id.hasAttribute("readonly");
    const url = isEdit ? `/api/products/${data.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    });

    const payload = await response.json();
    if (!response.ok) {
        alert(payload.error || "Failed to save product.");
        return;
    }

    closeProductForm();
    renderProductsManagement();
}

function setAdminUIState(authenticated) {
    const loginCard = document.getElementById("login-card");
    const adminContent = document.getElementById("admin-content");
    if (!loginCard || !adminContent) return;
    loginCard.classList.toggle("hidden", authenticated);
    adminContent.classList.toggle("hidden", !authenticated);
}

function bindLoginForm() {
    const loginForm = document.getElementById("admin-login-form");
    const logoutButton = document.getElementById("logout-button");
    if (!loginForm || !logoutButton) return;

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();
        const username = document.getElementById("admin-username").value.trim();
        const password = document.getElementById("admin-password").value.trim();
        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Login failed.");
            }
            setAdminToken(payload.token);
            renderAdminPage();
        } catch (error) {
            alert(error.message);
        }
    });

    logoutButton.addEventListener("click", () => {
        clearAdminToken();
        setAdminUIState(false);
    });
}

async function renderAdminPage() {
    bindLoginForm();
    const token = getAdminToken();
    setAdminUIState(Boolean(token));
    if (!token) return;

    document.getElementById("tab-orders")?.addEventListener("click", () => showAdminTab("orders"));
    document.getElementById("tab-products")?.addEventListener("click", () => showAdminTab("products"));
    document.getElementById("new-product-button")?.addEventListener("click", () => openProductForm());
    document.getElementById("cancel-product")?.addEventListener("click", closeProductForm);
    document.getElementById("product-edit-form")?.addEventListener("submit", handleProductSubmit);
    
    // Order edit UI removed; no event listeners bound for order editing.

    try {
        adminOrders = await fetchAdminOrders();
        renderOrders(document.getElementById("orders-list"), adminOrders);
    } catch (error) {
        document.getElementById("orders-list").innerHTML = `<div class="product-card"><p>${error.message}</p></div>`;
    }

    renderProductsManagement();
}

window.addEventListener("DOMContentLoaded", async () => {
    updateCartBadge();
    if (document.body.id === "page-home") {
        await loadProducts();
        initializeFilters();
        renderProducts();
    }
    if (document.body.id === "page-cart") {
        renderCartPage();
    }
    if (document.body.id === "page-checkout") {
        await loadProducts();
        renderCheckoutPage();
    }
    if (document.body.id === "page-admin") {
        renderAdminPage();
    }
});
