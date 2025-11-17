// cyber.js - Cybercafé Manager JavaScript
// Version: With Custom Date Range Filter

// ============================================
// GLOBAL STATE
// ============================================
let isAdmin = false;
let sales = [];
let presets = {
    wifi: [],
    cards: [],
    media: [],
    other: []
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
    console.log('Initializing Cybercafé Manager...');
    loadFromStorage();
    initializeDefaultPassword();
    initializeDefaultPresets();
    showScreen('dashboard');
}

function loadFromStorage() {
    const savedSales = localStorage.getItem('sales');
    if (savedSales) {
        sales = JSON.parse(savedSales);
    }
    
    const savedPresets = localStorage.getItem('presets');
    if (savedPresets) {
        presets = JSON.parse(savedPresets);
    }
}

function saveToStorage() {
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('presets', JSON.stringify(presets));
}

function initializeDefaultPassword() {
    if (!localStorage.getItem('adminPassword')) {
        localStorage.setItem('adminPassword', 'cyberC0DE');
    }
}

function initializeDefaultPresets() {
    if (presets.wifi.length === 0) {
        presets.wifi = [
            { name: '30 Minutes', price: 500 },
            { name: '1 Hour', price: 1000 },
            { name: '2 Hours', price: 1800 }
        ];
    }
    if (presets.cards.length === 0) {
        presets.cards = [
            { name: 'Orange 1000', price: 1100 },
            { name: 'Orange 2000', price: 2100 },
            { name: 'Yas 1000', price: 1100 }
        ];
    }
    if (presets.media.length === 0) {
        presets.media = [
            { name: 'Movie Copy', price: 500 },
            { name: 'File Transfer (per GB)', price: 300 }
        ];
    }
    
    if (!localStorage.getItem('wifiPricingRates')) {
        const defaultRates = [
            { minutes: 15, price: 500 },
            { minutes: 30, price: 1000 },
            { minutes: 60, price: 2000 },
            { minutes: 120, price: 3500 }
        ];
        localStorage.setItem('wifiPricingRates', JSON.stringify(defaultRates));
        console.log('Default WiFi rates initialized:', defaultRates);
    }
    
    saveToStorage();
}

// ============================================
// AUTHENTICATION
// ============================================
function handleLoginEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        login();
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleBtn = event.target;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
        
        setTimeout(() => {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }, 1000);
    }
}

function login() {
    const passwordInput = document.getElementById('loginPassword');
    const password = passwordInput.value;
    const savedPassword = localStorage.getItem('adminPassword');
    
    if (password === savedPassword) {
        isAdmin = true;
        document.body.classList.add('admin-mode');
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        passwordInput.value = '';
        updateDashboard();
        showNotification('Welcome, Admin!', 'success');
    } else {
        showNotification('Incorrect password', 'error');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function continueAsGuest() {
    isAdmin = false;
    document.body.classList.remove('admin-mode');
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
    updateDashboard();
    showNotification('Guest mode - Limited access', 'info');
}

function logout() {
    isAdmin = false;
    document.body.classList.remove('admin-mode');
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    const passwordField = document.getElementById('loginPassword');
    passwordField.value = '';
    passwordField.setAttribute('autocomplete', 'off');
}

function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const savedPassword = localStorage.getItem('adminPassword');
    
    if (currentPassword !== savedPassword) {
        showNotification('Current password is incorrect', 'error');
        return;
    }
    
    localStorage.setItem('adminPassword', newPassword);
    showNotification('Password updated successfully', 'success');
    event.target.reset();
}

// ============================================
// NAVIGATION
// ============================================
function showScreen(screenName, clickedElement) {
    const screens = document.querySelectorAll('.content-screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    document.getElementById(screenName).classList.add('active');
    
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => link.classList.remove('active'));
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    if (screenName === 'dashboard') {
        updateDashboard();
    } else if (screenName === 'addSale') {
        updatePresetItems();
    } else if (screenName === 'history') {
        filterHistory();
    } else if (screenName === 'settings') {
        displayPresets();
    }
}

// ============================================
// WIFI TIMER INTEGRATION
// ============================================
function calculateWifiPrice(minutes) {
    const rates = JSON.parse(localStorage.getItem('wifiPricingRates') || '[]');
    
    console.log('Calculating price for', minutes, 'minutes with rates:', rates);
    
    if (rates.length === 0) {
        const price = Math.ceil(minutes / 15) * 500;
        console.log('Using fallback calculation:', price);
        return price;
    }
    
    rates.sort((a, b) => a.minutes - b.minutes);
    
    let bestRate = rates[0];
    for (let rate of rates) {
        if (minutes >= rate.minutes) {
            bestRate = rate;
        }
    }
    
    const pricePerMinute = bestRate.price / bestRate.minutes;
    const calculatedPrice = Math.round(minutes * pricePerMinute);
    
    console.log('Best rate:', bestRate, 'Final price:', calculatedPrice);
    
    return calculatedPrice;
}

function addWifiSession(clientName, durationMinutes) {
    console.log('=== addWifiSession called ===');
    console.log('Client:', clientName, 'Duration:', durationMinutes, 'minutes');
    
    // STRONG duplicate prevention
    const sessionKey = `${clientName}-${durationMinutes}`;
    const lastAdded = localStorage.getItem('lastWifiSessionAdded');
    const now = Date.now();
    
    if (lastAdded) {
        const [lastKey, lastTime] = lastAdded.split('|');
        const timeDiff = now - parseInt(lastTime);
        
        // If exact same session was added in last 5 seconds, skip it
        if (lastKey === sessionKey && timeDiff < 5000) {
            console.log(`⚠️ DUPLICATE BLOCKED! Same session added ${timeDiff}ms ago`);
            return;
        }
    }
    
    // Mark this session as added RIGHT NOW before processing
    localStorage.setItem('lastWifiSessionAdded', `${sessionKey}|${now}`);
    console.log(`✅ Session marked as added: ${sessionKey}`);
    
    const price = calculateWifiPrice(durationMinutes);
    
    const sale = {
        id: Date.now(),
        type: 'wifi',
        name: `${clientName} - ${durationMinutes} min`,
        price: price,
        quantity: 1,
        unitPrice: price,
        date: new Date().toISOString()
    };
    
    console.log('Creating sale:', sale);
    
    sales.unshift(sale);
    saveToStorage();
    updateDashboard();
    
    showNotification(`WiFi session added: ${clientName} - ${formatPrice(price)}`, 'success');
    console.log('=== Sale added successfully ===');
}

window.addWifiSession = addWifiSession;

window.addEventListener('message', function(event) {
    console.log('=== Message received ===');
    console.log('Event data:', event.data);
    console.log('Event origin:', event.origin);
    
    if (event.data && event.data.type === 'wifiSessionComplete') {
        const { clientName, durationMinutes } = event.data;
        console.log('WiFi session complete message:', clientName, durationMinutes);
        addWifiSession(clientName, durationMinutes);
    }
});

// CRITICAL: Listen for localStorage changes (for WiFi timer communication)
window.addEventListener('storage', function(event) {
    console.log('=== Storage event detected ===');
    console.log('Key:', event.key);
    
    if (event.key === 'wifiSessionFlag') {
        console.log('WiFi session flag detected, checking for pending session...');
        
        const pendingSession = localStorage.getItem('pendingWifiSession');
        if (pendingSession) {
            try {
                const session = JSON.parse(pendingSession);
                console.log('Found pending session:', session);
                
                addWifiSession(session.clientName, session.durationMinutes);
                
                // Clear the pending session
                localStorage.removeItem('pendingWifiSession');
                console.log('Pending session cleared');
            } catch (error) {
                console.error('Error processing pending session:', error);
            }
        }
    }
});

// Check for pending sessions on page load
setInterval(function() {
    const pendingSession = localStorage.getItem('pendingWifiSession');
    if (pendingSession) {
        try {
            const session = JSON.parse(pendingSession);
            const age = Date.now() - session.timestamp;
            
            // Only process if less than 5 seconds old
            if (age < 5000) {
                console.log('Processing pending WiFi session:', session);
                addWifiSession(session.clientName, session.durationMinutes);
                localStorage.removeItem('pendingWifiSession');
            }
        } catch (error) {
            console.error('Error in pending session check:', error);
        }
    }
}, 1000);

console.log('WiFi integration loaded. addWifiSession is available:', typeof addWifiSession);

// ============================================
// SALES MANAGEMENT
// ============================================
function updateTotalPrice() {
    const priceInput = document.getElementById('salePrice').value.trim();
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 1;
    
    let unitPrice = 0;
    
    if (priceInput) {
        try {
            unitPrice = eval(priceInput);
            if (isNaN(unitPrice) || !isFinite(unitPrice)) {
                unitPrice = 0;
            }
        } catch (e) {
            unitPrice = 0;
        }
    }
    
    const total = Math.round(unitPrice * quantity);
    document.getElementById('totalPriceDisplay').textContent = formatPrice(total);
}

function addSale(event) {
    event.preventDefault();
    
    const type = document.getElementById('saleType').value;
    const name = document.getElementById('saleName').value;
    const priceInput = document.getElementById('salePrice').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 1;
    
    let unitPrice;
    try {
        unitPrice = eval(priceInput);
        if (isNaN(unitPrice) || !isFinite(unitPrice) || unitPrice <= 0) {
            showNotification('Please enter a valid price', 'error');
            return;
        }
    } catch (e) {
        showNotification('Invalid price format', 'error');
        return;
    }
    
    const totalPrice = Math.round(unitPrice * quantity);
    const saleName = quantity > 1 ? `${name} (x${quantity})` : name;
    
    const sale = {
        id: Date.now(),
        type: type,
        name: saleName,
        price: totalPrice,
        quantity: quantity,
        unitPrice: Math.round(unitPrice),
        date: new Date().toISOString()
    };
    
    sales.unshift(sale);
    saveToStorage();
    
    showNotification('Sale added successfully', 'success');
    event.target.reset();
    document.getElementById('saleQuantity').value = 1;
    document.getElementById('totalPriceDisplay').textContent = '0 MGA';
    updateDashboard();
}

function deleteSale(id) {
    if (confirm('Delete this sale?')) {
        sales = sales.filter(sale => sale.id !== id);
        saveToStorage();
        updateDashboard();
        filterHistory();
        showNotification('Sale deleted', 'success');
    }
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    const today = getTodaySales();
    const week = getWeekSales();
    const month = getMonthSales();
    
    if (isAdmin) {
        document.getElementById('todayRevenue').textContent = formatPrice(calculateTotal(today));
        document.getElementById('weekRevenue').textContent = formatPrice(calculateTotal(week));
        document.getElementById('monthRevenue').textContent = formatPrice(calculateTotal(month));
        document.getElementById('totalSales').textContent = sales.length;
    }
    
    displayTodaySales(today);
}

function displayTodaySales(todaySales) {
    const container = document.getElementById('todaySalesList');
    
    if (todaySales.length === 0) {
        container.innerHTML = '<div class="empty-state">No sales today yet</div>';
        return;
    }
    
    container.innerHTML = todaySales.map(sale => `
        <div class="sale-item">
            <div class="sale-info">
                <span class="sale-type ${sale.type}">${sale.type.toUpperCase()}</span>
                <div class="sale-name">${sale.name}</div>
                <div class="sale-time">${formatTime(sale.date)}</div>
            </div>
            ${isAdmin ? `<div class="sale-price">${formatPrice(sale.price)}</div>` : ''}
            ${isAdmin ? `<button class="sale-delete" onclick="deleteSale(${sale.id})">Delete</button>` : ''}
        </div>
    `).join('');
}

// ============================================
// HISTORY
// ============================================
function handlePeriodChange() {
    const period = document.getElementById('filterPeriod').value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (period === 'custom') {
        customDateRange.style.display = 'block';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateFrom').value = today;
        document.getElementById('dateTo').value = today;
    } else {
        customDateRange.style.display = 'none';
    }
    
    filterHistory();
}

function filterHistory() {
    const period = document.getElementById('filterPeriod').value;
    const category = document.getElementById('filterCategory').value;
    
    let filtered = sales;
    
    if (period === 'today') {
        filtered = getTodaySales();
    } else if (period === 'yesterday') {
        filtered = getYesterdaySales();
    } else if (period === 'week') {
        filtered = getWeekSales();
    } else if (period === 'month') {
        filtered = getMonthSales();
    } else if (period === 'custom') {
        filtered = getCustomRangeSales();
    }
    
    if (category !== 'all') {
        filtered = filtered.filter(sale => sale.type === category);
    }
    
    displayHistory(filtered);
    
    if (isAdmin) {
        document.getElementById('filteredTotal').textContent = formatPrice(calculateTotal(filtered));
    }
}

function displayHistory(salesList) {
    const container = document.getElementById('historyList');
    
    if (salesList.length === 0) {
        container.innerHTML = '<div class="empty-state">No sales found</div>';
        return;
    }
    
    container.innerHTML = salesList.map(sale => `
        <div class="sale-item">
            <div class="sale-info">
                <span class="sale-type ${sale.type}">${sale.type.toUpperCase()}</span>
                <div class="sale-name">${sale.name}</div>
                <div class="sale-time">${formatDateTime(sale.date)}</div>
            </div>
            ${isAdmin ? `<div class="sale-price">${formatPrice(sale.price)}</div>` : ''}
            ${isAdmin ? `<button class="sale-delete" onclick="deleteSale(${sale.id})">Delete</button>` : ''}
        </div>
    `).join('');
}

// ============================================
// PRESET MANAGEMENT
// ============================================
function updatePresetItems() {
    const type = document.getElementById('saleType').value;
    const select = document.getElementById('salePreset');
    
    select.innerHTML = '<option value="">-- Quick Select --</option>';
    
    if (presets[type] && presets[type].length > 0) {
        presets[type].forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${preset.name} - ${formatPrice(preset.price)}`;
            select.appendChild(option);
        });
    }
}

function selectPreset() {
    const type = document.getElementById('saleType').value;
    const index = document.getElementById('salePreset').value;
    
    if (index !== '') {
        const preset = presets[type][index];
        document.getElementById('saleName').value = preset.name;
        document.getElementById('salePrice').value = preset.price;
        document.getElementById('saleQuantity').value = 1;
        updateTotalPrice();
    }
}

function displayPresets() {
    const types = ['wifi', 'cards', 'media', 'other'];
    
    types.forEach(type => {
        const container = document.getElementById(`${type}Presets`);
        const items = presets[type] || [];
        
        if (items.length === 0) {
            container.innerHTML = '<p style="color: #999; font-size: 14px;">No presets yet</p>';
        } else {
            container.innerHTML = items.map((preset, index) => `
                <div class="preset-item">
                    <span>${preset.name} - ${formatPrice(preset.price)}</span>
                    <button onclick="removePreset('${type}', ${index})">Remove</button>
                </div>
            `).join('');
        }
    });
    
    displayWifiRates();
}

function displayWifiRates() {
    const container = document.getElementById('wifiPricingRates');
    const rates = JSON.parse(localStorage.getItem('wifiPricingRates') || '[]');
    
    if (rates.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 14px;">No pricing rates set</p>';
    } else {
        rates.sort((a, b) => a.minutes - b.minutes);
        
        container.innerHTML = rates.map((rate, index) => `
            <div class="preset-item">
                <span>${rate.minutes} minutes = ${formatPrice(rate.price)} <span style="color: #666; font-size: 12px;">(${Math.round(rate.price/rate.minutes)} MGA/min)</span></span>
                <button onclick="removeWifiRate(${index})">Remove</button>
            </div>
        `).join('');
    }
}

function addWifiRate() {
    const minutesInput = document.getElementById('newRateMinutes');
    const priceInput = document.getElementById('newRatePrice');
    
    const minutes = parseInt(minutesInput.value);
    const price = parseFloat(priceInput.value);
    
    if (!minutes || minutes <= 0 || !price || price <= 0) {
        showNotification('Please enter valid minutes and price', 'error');
        return;
    }
    
    const rates = JSON.parse(localStorage.getItem('wifiPricingRates') || '[]');
    rates.push({ minutes, price });
    localStorage.setItem('wifiPricingRates', JSON.stringify(rates));
    
    displayWifiRates();
    minutesInput.value = '';
    priceInput.value = '';
    
    showNotification('WiFi rate added', 'success');
}

function removeWifiRate(index) {
    const rates = JSON.parse(localStorage.getItem('wifiPricingRates') || '[]');
    rates.splice(index, 1);
    localStorage.setItem('wifiPricingRates', JSON.stringify(rates));
    displayWifiRates();
    showNotification('WiFi rate removed', 'success');
}

function addPreset(type) {
    const nameInput = document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Name`);
    const priceInput = document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Price`);
    
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    
    if (!name || !price || price <= 0) {
        showNotification('Please enter valid name and price', 'error');
        return;
    }
    
    presets[type].push({ name, price });
    saveToStorage();
    displayPresets();
    
    nameInput.value = '';
    priceInput.value = '';
    
    showNotification('Preset added', 'success');
}

function removePreset(type, index) {
    presets[type].splice(index, 1);
    saveToStorage();
    displayPresets();
    showNotification('Preset removed', 'success');
}

// ============================================
// DATA CALCULATIONS
// ============================================
function getTodaySales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
    });
}

function getYesterdaySales() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === yesterday.getTime();
    });
}

function getWeekSales() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= weekAgo;
    });
}

function getMonthSales() {
    const today = new Date();
    const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= monthAgo;
    });
}

function getCustomRangeSales() {
    const dateFromInput = document.getElementById('dateFrom').value;
    const dateToInput = document.getElementById('dateTo').value;
    
    if (!dateFromInput || !dateToInput) {
        return sales;
    }
    
    const dateFrom = new Date(dateFromInput);
    dateFrom.setHours(0, 0, 0, 0);
    
    const dateTo = new Date(dateToInput);
    dateTo.setHours(23, 59, 59, 999);
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= dateFrom && saleDate <= dateTo;
    });
}

function calculateTotal(salesList) {
    return salesList.reduce((sum, sale) => sum + sale.price, 0);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
function exportToJSON() {
    const data = JSON.stringify({ sales, presets }, null, 2);
    downloadFile(data, 'cybercafe-data.json', 'application/json');
    showNotification('Data exported to JSON', 'success');
}

function exportToCSV() {
    let csv = 'ID,Type,Name,Price,Quantity,Unit Price,Date,Time\n';
    
    sales.forEach(sale => {
        const date = new Date(sale.date);
        const qty = sale.quantity || 1;
        const unitPrice = sale.unitPrice || sale.price;
        csv += `${sale.id},${sale.type},"${sale.name}",${sale.price},${qty},${unitPrice},${date.toLocaleDateString()},${date.toLocaleTimeString()}\n`;
    });
    
    downloadFile(csv, 'cybercafe-sales.csv', 'text/csv');
    showNotification('Data exported to CSV', 'success');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function clearAllData() {
    if (confirm('This will delete ALL sales data. Are you sure?')) {
        if (confirm('Really delete everything? This cannot be undone!')) {
            sales = [];
            saveToStorage();
            updateDashboard();
            filterHistory();
            showNotification('All data cleared', 'success');
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatPrice(amount) {
    return `${amount.toLocaleString()} MGA`;
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
window.addEventListener('DOMContentLoaded', init);