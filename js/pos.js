// Global state management
let currentUser = null;
let cart = [];
let products = [];
let salesHistory = [];
let currentTheme = 'light';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Check authentication
    const userSession = sessionStorage.getItem('currentUser');
    if (!userSession) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(userSession);
    
    // Update UI based on user role
    updateUserInterface();
    
    // Load initial data
    await loadInitialData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load saved theme
    loadTheme();
    
    // Update current date
    updateCurrentDate();
}

function updateUserInterface() {
    // Update user info in sidebar
    document.getElementById('currentUser').textContent = currentUser.name;
    
    // Show/hide admin-only features
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    });
}

async function loadInitialData() {
    showLoading(true);
    
    try {
        // Load mock data - In production, this would come from Supabase
        await loadProducts();
        await loadSalesHistory();
        
        // Update displays
        updateProductsDisplay();
        updateHistoryDisplay();
        updateStockDisplay();
        updateShiftSummary();
        
    } catch (error) {
        showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadProducts() {
    // Mock product data - In production, this would come from Supabase
    products = [
        { id: 1, name: 'ข้าวผัด', price: 45, category: 'food', stock: 20 },
        { id: 2, name: 'ผัดไทย', price: 50, category: 'food', stock: 15 },
        { id: 3, name: 'ส้มตำ', price: 35, category: 'food', stock: 25 },
        { id: 4, name: 'โค้ก', price: 15, category: 'drink', stock: 50 },
        { id: 5, name: 'น้ำเปล่า', price: 10, category: 'drink', stock: 100 },
        { id: 6, name: 'กาแฟ', price: 25, category: 'drink', stock: 30 },
        { id: 7, name: 'ขนมปัง', price: 20, category: 'snack', stock: 0 },
        { id: 8, name: 'มาม่า', price: 12, category: 'snack', stock: 40 }
    ];
}

async function loadSalesHistory() {
    // Mock sales history - In production, this would come from Supabase
    const today = new Date().toISOString().split('T')[0];
    salesHistory = [
        {
            id: 1,
            items: [{ name: 'ข้าวผัด', quantity: 2, price: 45 }],
            total: 90,
            paymentMethod: 'cash',
            timestamp: new Date().toISOString(),
            employee: currentUser.name
        },
        {
            id: 2,
            items: [{ name: 'โค้ก', quantity: 3, price: 15 }],
            total: 45,
            paymentMethod: 'transfer',
            timestamp: new Date().toISOString(),
            employee: currentUser.name
        }
    ];
}

function setupEventListeners() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Search functionality
    document.getElementById('productSearch').addEventListener('input', filterProducts);
    document.getElementById('searchBtn').addEventListener('click', filterProducts);

    // Category filters
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => filterByCategory(btn.dataset.category));
    });

    // Cart functionality
    document.getElementById('clearCart').addEventListener('click', clearCart);
    document.getElementById('checkoutBtn').addEventListener('click', openCheckoutModal);

    // Modal functionality
    setupModalListeners();

    // Add product form
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', addNewProduct);
    }

    // Close shift
    document.getElementById('closeShiftBtn').addEventListener('click', closeShift);
}

function setupModalListeners() {
    // Close modal buttons
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Modal overlay click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    });

    // Payment method selection
    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', () => selectPaymentMethod(btn.dataset.method));
    });

    // Cash received input
    const cashReceivedInput = document.getElementById('cashReceived');
    if (cashReceivedInput) {
        cashReceivedInput.addEventListener('input', calculateChange);
    }

    // Confirm payment
    document.getElementById('confirmPayment').addEventListener('click', processPayment);

    // Stock update
    document.getElementById('updateStock').addEventListener('click', updateProductStock);
}

function switchView(viewName) {
    showLoading(true);
    
    setTimeout(() => {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update content views
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        // Refresh data for specific views
        switch(viewName) {
            case 'history':
                updateHistoryDisplay();
                break;
            case 'stock':
                updateStockDisplay();
                break;
            case 'shift-summary':
                updateShiftSummary();
                break;
        }

        showLoading(false);
    }, 300);
}

function updateProductsDisplay(filteredProducts = null) {
    const productsGrid = document.getElementById('productsGrid');
    const displayProducts = filteredProducts || products;

    productsGrid.innerHTML = displayProducts.map(product => `
        <div class="product-card ${product.stock === 0 ? 'out-of-stock' : ''}" 
             onclick="${product.stock > 0 ? `addToCart(${product.id})` : ''}">
            <div class="product-name">${product.name}</div>
            <div class="product-price">฿${product.price}</div>
            <div class="product-stock">
                ${product.stock === 0 ? 
                    '<span class="out-of-stock-label">สินค้าหมด</span>' : 
                    `เหลือ ${product.stock} ชิ้น`
                }
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;
    
    let filtered = products;
    
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (activeCategory !== 'all') {
        filtered = filtered.filter(product => product.category === activeCategory);
    }
    
    updateProductsDisplay(filtered);
}

function filterByCategory(category) {
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Filter products
    filterProducts();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
            showToast(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success');
        } else {
            showToast('สินค้าไม่เพียงพอ', 'warning');
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
        showToast(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, 'success');
    }
    
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const totalAmount = document.getElementById('totalAmount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart"><p>ไม่มีสินค้าในตะกร้า</p></div>';
        totalAmount.textContent = '฿0';
        checkoutBtn.disabled = true;
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">฿${item.price} x ${item.quantity}</div>
            </div>
            <div class="item-controls">
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">ลบ</button>
            </div>
        </div>
    `).join('');
    
    totalAmount.textContent = `฿${total}`;
    checkoutBtn.disabled = false;
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (!item || !product) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else if (newQuantity <= product.stock) {
        item.quantity = newQuantity;
        updateCartDisplay();
    } else {
        showToast('สินค้าไม่เพียงพอ', 'warning');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    showToast('ลบสินค้าออกจากตะกร้าแล้ว', 'info');
}

function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('ต้องการล้างตะกร้าสินค้าหรือไม่?')) {
        cart = [];
        updateCartDisplay();
        showToast('ล้างตะกร้าสินค้าแล้ว', 'info');
    }
}

function openCheckoutModal() {
    if (cart.length === 0) return;
    
    const modal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <div>
                <strong>${item.name}</strong><br>
                ฿${item.price} x ${item.quantity}
            </div>
            <div>฿${item.price * item.quantity}</div>
        </div>
    `).join('');
    
    checkoutTotal.textContent = `฿${total}`;
    
    // Reset payment form
    selectPaymentMethod('cash');
    document.getElementById('cashReceived').value = '';
    calculateChange();
    
    modal.classList.add('active');
}

function selectPaymentMethod(method) {
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    
    const cashPayment = document.getElementById('cashPayment');
    cashPayment.style.display = method === 'cash' ? 'block' : 'none';
}

function calculateChange() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
    const change = cashReceived - total;
    
    document.getElementById('changeAmount').textContent = `฿${Math.max(0, change)}`;
}

async function processPayment() {
    const paymentMethod = document.querySelector('.payment-btn.active').dataset.method;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (paymentMethod === 'cash') {
        const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
        if (cashReceived < total) {
            showToast('จำนวนเงินไม่เพียงพอ', 'error');
            return;
        }
    }
    
    showLoading(true);
    
    try {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create sale record
        const sale = {
            id: Date.now(),
            items: [...cart],
            total: total,
            paymentMethod: paymentMethod,
            timestamp: new Date().toISOString(),
            employee: currentUser.name
        };
        
        salesHistory.unshift(sale);
        
        // Update product stock
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                product.stock -= item.quantity;
            }
        });
        
        // Clear cart
        cart = [];
        updateCartDisplay();
        updateProductsDisplay();
        
        closeModal();
        showToast('ชำระเงินสำเร็จ!', 'success');
        
    } catch (error) {
        showToast('เกิดข้อผิดพลาดในการชำระเงิน', 'error');
    } finally {
        showLoading(false);
    }
}

function updateHistoryDisplay() {
    const salesHistoryContainer = document.getElementById('salesHistory');
    const totalSales = document.getElementById('totalSales');
    const totalOrders = document.getElementById('totalOrders');
    
    const todaySales = salesHistory.filter(sale => {
        const saleDate = new Date(sale.timestamp).toDateString();
        const today = new Date().toDateString();
        return saleDate === today;
    });
    
    const totalAmount = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    
    totalSales.textContent = `฿${totalAmount}`;
    totalOrders.textContent = todaySales.length;
    
    salesHistoryContainer.innerHTML = todaySales.map(sale => `
        <div class="sale-item">
            <div class="sale-info">
                <h4>บิลที่ ${sale.id}</h4>
                <p>${new Date(sale.timestamp).toLocaleString('th-TH')} - ${sale.employee}</p>
                <p>ชำระด้วย: ${sale.paymentMethod === 'cash' ? 'เงินสด' : 'เงินโอน'}</p>
            </div>
            <div class="sale-amount">฿${sale.total}</div>
        </div>
    `).join('');
}

function updateStockDisplay() {
    const stockList = document.getElementById('stockList');
    
    stockList.innerHTML = products.map(product => `
        <div class="stock-item">
            <div class="stock-info">
                <h4>${product.name}</h4>
                <p>ราคา: ฿${product.price}</p>
                <p>หมวดหมู่: ${getCategoryName(product.category)}</p>
            </div>
            <div class="stock-quantity">
                <div class="stock-number ${product.stock <= 5 ? (product.stock === 0 ? 'out' : 'low') : ''}">
                    ${product.stock}
                </div>
                <button class="update-stock-btn" onclick="openStockModal(${product.id})">
                    อัพเดท
                </button>
            </div>
        </div>
    `).join('');
}

function getCategoryName(category) {
    const categories = {
        'food': 'อาหาร',
        'drink': 'เครื่องดื่ม',
        'snack': 'ขนม'
    };
    return categories[category] || category;
}

function openStockModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('stockProductName').value = product.name;
    document.getElementById('currentStock').value = product.stock;
    document.getElementById('newStock').value = product.stock;
    
    const modal = document.getElementById('stockModal');
    modal.classList.add('active');
    modal.dataset.productId = productId;
}

async function updateProductStock() {
    const modal = document.getElementById('stockModal');
    const productId = parseInt(modal.dataset.productId);
    const newStock = parseInt(document.getElementById('newStock').value);
    
    if (isNaN(newStock) || newStock < 0) {
        showToast('กรุณากรอกจำนวนสต็อกที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const product = products.find(p => p.id === productId);
        if (product) {
            product.stock = newStock;
            updateStockDisplay();
            updateProductsDisplay();
            closeModal();
            showToast('อัพเดทสต็อกสำเร็จ', 'success');
        }
    } catch (error) {
        showToast('เกิดข้อผิดพลาดในการอัพเดทสต็อก', 'error');
    } finally {
        showLoading(false);
    }
}

async function addNewProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('productName'),
        price: parseFloat(formData.get('productPrice')),
        category: formData.get('productCategory'),
        stock: parseInt(formData.get('productStock'))
    };
    
    if (!productData.name || !productData.price || !productData.category || isNaN(productData.stock)) {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newProduct = {
            id: Date.now(),
            ...productData
        };
        
        products.push(newProduct);
        updateProductsDisplay();
        updateStockDisplay();
        
        e.target.reset();
        showToast('เพิ่มสินค้าใหม่สำเร็จ', 'success');
        
    } catch (error) {
        showToast('เกิดข้อผิดพลาดในการเพิ่มสินค้า', 'error');
    } finally {
        showLoading(false);
    }
}

function updateShiftSummary() {
    const todaySales = salesHistory.filter(sale => {
        const saleDate = new Date(sale.timestamp).toDateString();
        const today = new Date().toDateString();
        return saleDate === today;
    });
    
    const totalAmount = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const cashSales = todaySales.filter(sale => sale.paymentMethod === 'cash')
                                .reduce((sum, sale) => sum + sale.total, 0);
    const transferSales = todaySales.filter(sale => sale.paymentMethod === 'transfer')
                                   .reduce((sum, sale) => sum + sale.total, 0);
    
    document.getElementById('shiftTotalSales').textContent = `฿${totalAmount}`;
    document.getElementById('shiftTotalOrders').textContent = todaySales.length;
    document.getElementById('shiftCashSales').textContent = `฿${cashSales}`;
    document.getElementById('shiftTransferSales').textContent = `฿${transferSales}`;
}

function closeShift() {
    if (confirm('ต้องการปิดกะและออกจากระบบหรือไม่?')) {
        logout();
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = currentTheme;
    localStorage.setItem('theme', currentTheme);
    showToast(`เปลี่ยนเป็นธีม ${currentTheme === 'light' ? 'สว่าง' : 'มืด'} แล้ว`, 'info');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.body.dataset.theme = currentTheme;
    }
}

function updateCurrentDate() {
    const currentDate = document.getElementById('currentDate');
    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function logout() {
    if (confirm('ต้องการออกจากระบบหรือไม่?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // F1 for help (could be implemented later)
    if (e.key === 'F1') {
        e.preventDefault();
        showToast('ใช้ ESC เพื่อปิด Modal, ใช้ Tab เพื่อนำทาง', 'info');
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    showToast('เชื่อมต่ออินเทอร์เน็ตแล้ว', 'success');
});

window.addEventListener('offline', () => {
    showToast('ไม่มีการเชื่อมต่ออินเทอร์เน็ต', 'warning');
});