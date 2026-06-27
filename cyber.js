// cyber.js - Cybercafé Manager JavaScript
// Complete Version with Income/Expense/Debt Management

// ============================================
// GLOBAL STATE
// ============================================
let isAdmin = false;
let sales = [];
let expenses = [];
let debts = [];
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
    if (savedSales) sales = JSON.parse(savedSales);
    
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) expenses = JSON.parse(savedExpenses);
    
    const savedDebts = localStorage.getItem('debts');
    if (savedDebts) debts = JSON.parse(savedDebts);
    
    const savedPresets = localStorage.getItem('presets');
    if (savedPresets) presets = JSON.parse(savedPresets);
}

function saveToStorage() {
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('debts', JSON.stringify(debts));
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
    
    if (screenName === 'dashboard') updateDashboard();
    else if (screenName === 'addSale') updatePresetItems();
    else if (screenName === 'addExpense') displayRecentExpenses();
    else if (screenName === 'debts') displayDebts();
    else if (screenName === 'history') filterHistory();
    else if (screenName === 'settings') displayPresets();
}

// ============================================
// WIFI TIMER INTEGRATION
// ============================================
function calculateWifiPrice(minutes) {
    const rates = JSON.parse(localStorage.getItem('wifiPricingRates') || '[]');
    if (rates.length === 0) return Math.ceil(minutes / 15) * 500;
    
    rates.sort((a, b) => a.minutes - b.minutes);
    let bestRate = rates[0];
    for (let rate of rates) {
        if (minutes >= rate.minutes) bestRate = rate;
    }
    
    const pricePerMinute = bestRate.price / bestRate.minutes;
    return Math.round(minutes * pricePerMinute);
}

function addWifiSession(clientName, durationMinutes) {
    console.log('=== addWifiSession called ===');
    
    const sessionKey = `${clientName}-${durationMinutes}`;
    const lastAdded = localStorage.getItem('lastWifiSessionAdded');
    const now = Date.now();
    
    if (lastAdded) {
        const [lastKey, lastTime] = lastAdded.split('|');
        if (lastKey === sessionKey && (now - parseInt(lastTime)) < 5000) {
            console.log('Duplicate blocked');
            return;
        }
    }
    
    localStorage.setItem('lastWifiSessionAdded', `${sessionKey}|${now}`);
    
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
    
    sales.unshift(sale);
    saveToStorage();
    updateDashboard();
    showNotification(`WiFi session added: ${clientName} - ${formatPrice(price)}`, 'success');
}

window.addWifiSession = addWifiSession;

window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'wifiSessionComplete') {
        addWifiSession(event.data.clientName, event.data.durationMinutes);
    }
});

setInterval(function() {
    const pendingSession = localStorage.getItem('pendingWifiSession');
    if (pendingSession) {
        try {
            const session = JSON.parse(pendingSession);
            const age = Date.now() - session.timestamp;
            if (age < 5000) {
                addWifiSession(session.clientName, session.durationMinutes);
                localStorage.removeItem('pendingWifiSession');
            }
        } catch (e) {}
    }
}, 1000);

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
            if (isNaN(unitPrice) || !isFinite(unitPrice)) unitPrice = 0;
        } catch (e) { unitPrice = 0; }
    }
    
    document.getElementById('totalPriceDisplay').textContent = formatPrice(Math.round(unitPrice * quantity));
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
// EXPENSE MANAGEMENT
// ============================================
function updateExpenseDisplay() {
    const amountInput = document.getElementById('expenseAmount').value.trim();
    let amount = 0;
    
    if (amountInput) {
        try {
            amount = eval(amountInput);
            if (isNaN(amount) || !isFinite(amount)) amount = 0;
        } catch (e) { amount = 0; }
    }
    
    document.getElementById('expenseDisplay').textContent = formatPrice(Math.round(amount));
}

function addExpense(event) {
    event.preventDefault();
    
    const type = document.getElementById('expenseType').value;
    const name = document.getElementById('expenseName').value;
    const amountInput = document.getElementById('expenseAmount').value;
    
    let amount;
    try {
        amount = eval(amountInput);
        if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
            showNotification('Please enter a valid amount', 'error');
            return;
        }
    } catch (e) {
        showNotification('Invalid amount format', 'error');
        return;
    }
    
    const expense = {
        id: Date.now(),
        type: type,
        name: name,
        price: Math.round(amount),
        date: new Date().toISOString()
    };
    
    expenses.unshift(expense);
    saveToStorage();
    showNotification('Expense added successfully', 'success');
    event.target.reset();
    document.getElementById('expenseDisplay').textContent = '0 MGA';
    updateDashboard();
    displayRecentExpenses();
}

function deleteExpense(id) {
    if (confirm('Delete this expense?')) {
        expenses = expenses.filter(e => e.id !== id);
        saveToStorage();
        updateDashboard();
        displayRecentExpenses();
        filterHistory();
        showNotification('Expense deleted', 'success');
    }
}

function displayRecentExpenses() {
    const container = document.getElementById('recentExpenses');
    if (!container) return;
    
    const recent = expenses.slice(0, 10);
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-state">No expenses recorded yet</div>';
        return;
    }
    
    const labels = {
        salary: '💼 Salary',
        supplies: '📦 Supplies',
        bills: '🔌 Bills',
        rent: '🏠 Rent',
        maintenance: '🔧 Maintenance',
        other_expense: '📝 Other'
    };
    
    container.innerHTML = recent.map(exp => `
        <div class="expense-item">
            <div class="expense-info">
                <span class="expense-category">${labels[exp.type] || exp.type}</span>
                <div class="expense-name">${exp.name}</div>
                <div class="expense-time">${formatDateTime(exp.date)}</div>
            </div>
            ${isAdmin ? `<div class="expense-amount">-${formatPrice(exp.price)}</div>` : ''}
            ${isAdmin ? `<button class="sale-delete" onclick="deleteExpense(${exp.id})">Delete</button>` : ''}
        </div>
    `).join('');
}

// ============================================
// DEBT MANAGEMENT
// ============================================
function addDebt(event) {
    event.preventDefault();
    
    const person = document.getElementById('debtPerson').value;
    const amount = parseFloat(document.getElementById('debtAmount').value);
    const reason = document.getElementById('debtReason').value || 'No reason specified';
    
    if (!person || !amount || amount <= 0) {
        showNotification('Please enter valid person and amount', 'error');
        return;
    }
    
    const debt = {
        id: Date.now(),
        person: person,
        amount: Math.round(amount),
        reason: reason,
        date: new Date().toISOString(),
        paid: false,
        paidDate: null
    };
    
    debts.unshift(debt);
    saveToStorage();
    showNotification(`Debt added: ${person} owes ${formatPrice(amount)}`, 'success');
    event.target.reset();
    updateDashboard();
    displayDebts();
}

function markDebtPaid(id) {
    const debt = debts.find(d => d.id === id);
    if (debt && confirm(`Mark ${debt.person}'s debt of ${formatPrice(debt.amount)} as PAID?`)) {
        debt.paid = true;
        debt.paidDate = new Date().toISOString();
        
        const sale = {
            id: Date.now(),
            type: 'other',
            name: `Debt paid by ${debt.person}`,
            price: debt.amount,
            quantity: 1,
            unitPrice: debt.amount,
            date: new Date().toISOString()
        };
        sales.unshift(sale);
        
        saveToStorage();
        updateDashboard();
        displayDebts();
        showNotification(`${debt.person}'s debt marked as paid!`, 'success');
    }
}

function deleteDebt(id) {
    if (confirm('Delete this debt record?')) {
        debts = debts.filter(d => d.id !== id);
        saveToStorage();
        updateDashboard();
        displayDebts();
        showNotification('Debt deleted', 'success');
    }
}

function displayDebts() {
    const activeContainer = document.getElementById('activeDebts');
    const paidContainer = document.getElementById('paidDebts');
    const totalElement = document.getElementById('totalDebtAmount');
    
    if (!activeContainer || !paidContainer) return;
    
    const active = debts.filter(d => !d.paid);
    const paid = debts.filter(d => d.paid);
    
    if (active.length === 0) {
        activeContainer.innerHTML = '<div class="empty-state">No active debts 🎉</div>';
    } else {
        activeContainer.innerHTML = active.map(d => `
            <div class="debt-item">
                <div class="debt-info">
                    <div class="debt-person">${d.person}</div>
                    <div class="debt-details">${d.reason} • ${formatDateTime(d.date)}</div>
                </div>
                ${isAdmin ? `<div class="debt-amount">${formatPrice(d.amount)}</div>` : ''}
                <div class="debt-actions">
                    <button class="btn-paid" onclick="markDebtPaid(${d.id})">✅ Paid</button>
                    ${isAdmin ? `<button class="sale-delete" onclick="deleteDebt(${d.id})">Delete</button>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    if (paid.length === 0) {
        paidContainer.innerHTML = '<div class="empty-state">No paid debts yet</div>';
    } else {
        paidContainer.innerHTML = paid.slice(0, 10).map(d => `
            <div class="debt-item paid">
                <div class="debt-info">
                    <div class="debt-person">${d.person}</div>
                    <div class="debt-details">Paid: ${formatDateTime(d.paidDate)}</div>
                </div>
                ${isAdmin ? `<div class="debt-amount">${formatPrice(d.amount)}</div>` : ''}
            </div>
        `).join('');
    }
    
    if (totalElement) {
        if (isAdmin) {
            totalElement.textContent = formatPrice(calculateTotalDebts());
        } else {
            totalElement.parentElement.style.display = 'none';
        }
    }
}

function calculateTotalDebts() {
    return debts.filter(d => !d.paid).reduce((sum, d) => sum + d.amount, 0);
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    const todaySalesList = getTodaySales();
    const todayExpensesList = getTodayExpenses();
    const monthSalesList = getMonthSales();
    const monthExpensesList = getMonthExpenses();
    
    const todayIncome = calculateTotal(todaySalesList);
    const todayExpense = calculateTotal(todayExpensesList);
    const todayProfit = todayIncome - todayExpense;
    
    const monthIncome = calculateTotal(monthSalesList);
    const monthExpense = calculateTotal(monthExpensesList);
    const monthProfit = monthIncome - monthExpense;
    
    if (isAdmin) {
        const el = (id) => document.getElementById(id);
        
        if (el('todayRevenue')) el('todayRevenue').textContent = formatPrice(todayIncome);
        if (el('todayExpenses')) el('todayExpenses').textContent = formatPrice(todayExpense);
        if (el('todayProfit')) {
            el('todayProfit').textContent = formatPrice(todayProfit);
            el('todayProfit').style.color = todayProfit >= 0 ? '#10b981' : '#ef4444';
        }
        if (el('totalDebts')) el('totalDebts').textContent = formatPrice(calculateTotalDebts());
        
        if (el('monthIncome')) el('monthIncome').textContent = formatPrice(monthIncome);
        if (el('monthExpenses')) el('monthExpenses').textContent = formatPrice(monthExpense);
        if (el('monthProfit')) el('monthProfit').textContent = formatPrice(monthProfit);
    }
    
    displayTodaySales(todaySalesList);
}

function displayTodaySales(todaySales) {
    const container = document.getElementById('todaySalesList');
    if (!container) return;
    
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
    
    if (customDateRange) {
        if (period === 'custom') {
            customDateRange.style.display = 'block';
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('dateFrom').value = today;
            document.getElementById('dateTo').value = today;
        } else {
            customDateRange.style.display = 'none';
        }
    }
    
    filterHistory();
}

function filterHistory() {
    const period = document.getElementById('filterPeriod').value;
    const category = document.getElementById('filterCategory').value;
    const filterTypeEl = document.getElementById('filterType');
    const transactionType = filterTypeEl ? filterTypeEl.value : 'all';
    
    let filteredSales = sales;
    let filteredExpenses = expenses;
    
    // Period filter
    if (period === 'today') {
        filteredSales = getTodaySales();
        filteredExpenses = getTodayExpenses();
    } else if (period === 'yesterday') {
        filteredSales = getYesterdaySales();
        filteredExpenses = getYesterdayExpenses();
    } else if (period === 'week') {
        filteredSales = getWeekSales();
        filteredExpenses = getWeekExpenses();
    } else if (period === 'month') {
        filteredSales = getMonthSales();
        filteredExpenses = getMonthExpenses();
    } else if (period === 'custom') {
        filteredSales = getCustomRangeSales();
        filteredExpenses = getCustomRangeExpenses();
    }
    
    // Category filter
    if (category !== 'all') {
        filteredSales = filteredSales.filter(s => s.type === category);
        filteredExpenses = filteredExpenses.filter(e => e.type === category);
    }
    
    // Combine based on transaction type filter
    let combined = [];
    let displayIncome = 0;
    let displayExpense = 0;
    
    if (transactionType === 'all' || transactionType === 'income') {
        combined = combined.concat(filteredSales.map(s => ({...s, transType: 'income'})));
        displayIncome = calculateTotal(filteredSales);
    }
    if (transactionType === 'all' || transactionType === 'expense') {
        combined = combined.concat(filteredExpenses.map(e => ({...e, transType: 'expense'})));
        displayExpense = calculateTotal(filteredExpenses);
    }
    
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    displayHistory(combined);
    
    // Update totals based on what's being displayed
    if (isAdmin) {
        const el = (id) => document.getElementById(id);
        
        if (transactionType === 'income') {
            // Show only income total
            if (el('filteredIncome')) el('filteredIncome').textContent = formatPrice(displayIncome);
            if (el('filteredExpenses')) el('filteredExpenses').textContent = formatPrice(0);
            if (el('filteredTotal')) el('filteredTotal').textContent = formatPrice(displayIncome);
        } else if (transactionType === 'expense') {
            // Show only expense total
            if (el('filteredIncome')) el('filteredIncome').textContent = formatPrice(0);
            if (el('filteredExpenses')) el('filteredExpenses').textContent = formatPrice(displayExpense);
            if (el('filteredTotal')) el('filteredTotal').textContent = formatPrice(-displayExpense);
        } else {
            // Show all totals
            if (el('filteredIncome')) el('filteredIncome').textContent = formatPrice(displayIncome);
            if (el('filteredExpenses')) el('filteredExpenses').textContent = formatPrice(displayExpense);
            if (el('filteredTotal')) el('filteredTotal').textContent = formatPrice(displayIncome - displayExpense);
        }
    }
}

function displayHistory(list) {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state">No transactions found</div>';
        return;
    }
    
    // Category colors
    const categoryColors = {
        wifi: { bg: '#dbeafe', text: '#1e40af' },
        cards: { bg: '#fef3c7', text: '#92400e' },
        media: { bg: '#fce7f3', text: '#9f1239' },
        other: { bg: '#e5e7eb', text: '#374151' },
        salary: { bg: '#fee2e2', text: '#991b1b' },
        supplies: { bg: '#ffedd5', text: '#9a3412' },
        bills: { bg: '#fef9c3', text: '#854d0e' },
        rent: { bg: '#e0e7ff', text: '#3730a3' },
        maintenance: { bg: '#f3e8ff', text: '#6b21a8' },
        other_expense: { bg: '#f1f5f9', text: '#475569' }
    };
    
    container.innerHTML = list.map(item => {
        const isExpense = item.transType === 'expense';
        const borderColor = isExpense ? '#ef4444' : '#10b981';
        const textColor = isExpense ? '#ef4444' : '#10b981';
        const icon = isExpense ? '💸' : '💰';
        const sign = isExpense ? '-' : '+';
        
        const catColor = categoryColors[item.type] || { bg: '#e5e7eb', text: '#374151' };
        
        return `
            <div class="sale-item" style="border-left: 4px solid ${borderColor};">
                <div class="sale-info">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                        <span style="font-size: 16px;">${icon}</span>
                        <span class="sale-type" style="background: ${catColor.bg}; color: ${catColor.text};">${item.type.toUpperCase()}</span>
                    </div>
                    <div class="sale-name">${item.name}</div>
                    <div class="sale-time">${formatDateTime(item.date)}</div>
                </div>
                ${isAdmin ? `<div class="sale-price" style="color: ${textColor};">${sign}${formatPrice(item.price)}</div>` : ''}
                ${isAdmin ? `<button class="sale-delete" onclick="deleteTransaction(${item.id}, '${isExpense ? 'expense' : 'sale'}')">Delete</button>` : ''}
            </div>
        `;
    }).join('');
}

// New unified delete function for history
function deleteTransaction(id, type) {
    if (type === 'expense') {
        deleteExpense(id);
    } else {
        deleteSale(id);
    }
}

// ============================================
// DATE FILTERS
// ============================================
function getTodaySales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales.filter(s => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });
}

function getTodayExpenses() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expenses.filter(e => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });
}

function getYesterdaySales() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return sales.filter(s => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === yesterday.getTime();
    });
}

function getYesterdayExpenses() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return expenses.filter(e => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === yesterday.getTime();
    });
}

function getWeekSales() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return sales.filter(s => new Date(s.date) >= weekAgo);
}

function getWeekExpenses() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return expenses.filter(e => new Date(e.date) >= weekAgo);
}

function getMonthSales() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return sales.filter(s => new Date(s.date) >= monthStart);
}

function getMonthExpenses() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return expenses.filter(e => new Date(e.date) >= monthStart);
}

function getCustomRangeSales() {
    const from = document.getElementById('dateFrom')?.value;
    const to = document.getElementById('dateTo')?.value;
    if (!from || !to) return sales;
    
    const dateFrom = new Date(from);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(to);
    dateTo.setHours(23, 59, 59, 999);
    
    return sales.filter(s => {
        const d = new Date(s.date);
        return d >= dateFrom && d <= dateTo;
    });
}

function getCustomRangeExpenses() {
    const from = document.getElementById('dateFrom')?.value;
    const to = document.getElementById('dateTo')?.value;
    if (!from || !to) return expenses;
    
    const dateFrom = new Date(from);
    dateFrom.setHours(0, 0, 0, 0);
    const dateTo = new Date(to);
    dateTo.setHours(23, 59, 59, 999);
    
    return expenses.filter(e => {
        const d = new Date(e.date);
        return d >= dateFrom && d <= dateTo;
    });
}

function calculateTotal(list) {
    return list.reduce((sum, item) => sum + item.price, 0);
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
        if (!container) return;
        
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
    if (!container) return;
    
    const rates = JSON.parse(localStorage.getItem('wifiPricingRates') || '[]');
    
    if (rates.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 14px;">No pricing rates set</p>';
    } else {
        rates.sort((a, b) => a.minutes - b.minutes);
        container.innerHTML = rates.map((rate, index) => `
            <div class="preset-item">
                <span>${rate.minutes} min = ${formatPrice(rate.price)} (${Math.round(rate.price/rate.minutes)} MGA/min)</span>
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
// EXPORT FUNCTIONS
// ============================================
function exportToJSON() {
    const data = JSON.stringify({ sales, expenses, debts, presets }, null, 2);
    downloadFile(data, 'cybercafe-data.json', 'application/json');
    showNotification('Data exported to JSON', 'success');
}

function exportToCSV() {
    let csv = 'TYPE,ID,Category,Name,Amount,Date,Time\n';
    
    sales.forEach(s => {
        const d = new Date(s.date);
        csv += `INCOME,${s.id},${s.type},"${s.name}",${s.price},${d.toLocaleDateString()},${d.toLocaleTimeString()}\n`;
    });
    
    expenses.forEach(e => {
        const d = new Date(e.date);
        csv += `EXPENSE,${e.id},${e.type},"${e.name}",-${e.price},${d.toLocaleDateString()},${d.toLocaleTimeString()}\n`;
    });
    
    debts.forEach(debt => {
        const d = new Date(debt.date);
        const status = debt.paid ? 'PAID' : 'UNPAID';
        csv += `DEBT-${status},${debt.id},debt,"${debt.person}: ${debt.reason}",${debt.amount},${d.toLocaleDateString()},${d.toLocaleTimeString()}\n`;
    });
    
    downloadFile(csv, 'cybercafe-data.csv', 'text/csv');
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
    if (confirm('This will delete ALL data. Are you sure?')) {
        if (confirm('Really delete everything? This cannot be undone!')) {
            sales = [];
            expenses = [];
            debts = [];
            saveToStorage();
            updateDashboard();
            filterHistory();
            displayDebts();
            displayRecentExpenses();
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

console.log('Cybercafé Manager loaded successfully!'); 