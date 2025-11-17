// wifi.js - WiFi Timer with Auto Sales Integration
console.log('=== WiFi Timer Script Loading ===');

let cardCounter = 0;
const cards = {};
let alertSound = null;
let alertInterval = null;

function initCards() {
    console.log('Initializing 10 WiFi cards...');
    
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    for (let i = 1; i <= 10; i++) {
        addNewCard();
    }
    
    console.log('Cards initialized:', Object.keys(cards).length);
}

function addNewCard() {
    cardCounter++;
    const cardId = `c${cardCounter}`;
    
    cards[cardId] = {
        id: cardId,
        timeRemaining: 0,
        isActive: false,
        isPaused: false,
        interval: null,
        mode: 'countdown',
        timeElapsed: 0,
        startTime: null,
        initialTime: 0,
        clientName: cardId.toUpperCase()
    };

    const cardEl = createCardElement(cardId);
    document.getElementById('cardsContainer').appendChild(cardEl);
    document.getElementById('cardCount').textContent = Object.keys(cards).length;
}

function createCardElement(cardId) {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = `card-${cardId}`;
    card.innerHTML = `
        <div class="card-header">
            <div class="card-number">${cardId.toUpperCase()}</div>
            <span class="status-badge status-available">Available</span>
        </div>
        <div class="mode-selector">
            <label>
                <input type="radio" name="mode-${cardId}" value="countdown" checked onchange="changeMode('${cardId}', 'countdown')">
                <span>Count Down</span>
            </label>
            <label>
                <input type="radio" name="mode-${cardId}" value="countup" onchange="changeMode('${cardId}', 'countup')">
                <span>Count Up</span>
            </label>
        </div>
        <div class="timer-display" id="timer-${cardId}">00:00:00</div>
        <div class="time-input" id="time-input-${cardId}">
            <input type="number" id="minutes-${cardId}" placeholder="Minutes" min="0" value="30">
            <input type="number" id="seconds-${cardId}" placeholder="Seconds" min="0" max="59" value="0">
        </div>
        <div class="quick-add" id="quick-add-${cardId}">
            <button class="btn-add" onclick="addTime('${cardId}', 5)">+5 min</button>
            <button class="btn-add" onclick="addTime('${cardId}', 10)">+10 min</button>
            <button class="btn-add" onclick="addTime('${cardId}', 15)">+15 min</button>
        </div>
        <div class="controls">
            <button class="btn-start" onclick="startTimer('${cardId}')">Start</button>
            <button class="btn-pause" onclick="pauseTimer('${cardId}')">Pause</button>
            <button class="btn-reset" onclick="resetTimer('${cardId}')">Reset</button>
        </div>
        <div class="controls" style="margin-top: 10px;">
            <button class="btn-add" onclick="stopTimerAndAddSale('${cardId}')" style="background: #10b981; width: 100%;">✓ Stop & Add to Sales</button>
        </div>
    `;
    return card;
}

function changeMode(cardId, mode) {
    const card = cards[cardId];
    card.mode = mode;
    
    const timeInput = document.getElementById(`time-input-${cardId}`);
    const quickAdd = document.getElementById(`quick-add-${cardId}`);
    
    if (mode === 'countup') {
        timeInput.style.display = 'none';
        quickAdd.style.display = 'none';
    } else {
        timeInput.style.display = 'flex';
        quickAdd.style.display = 'flex';
    }
    
    if (card.isActive) {
        resetTimer(cardId);
    }
}

function startTimer(cardId) {
    const card = cards[cardId];
    
    console.log(`[${cardId}] Starting timer, mode: ${card.mode}`);
    
    if (card.mode === 'countdown') {
        if (!card.isActive) {
            const minutes = parseInt(document.getElementById(`minutes-${cardId}`).value) || 0;
            const seconds = parseInt(document.getElementById(`seconds-${cardId}`).value) || 0;
            card.timeRemaining = minutes * 60 + seconds;
            card.initialTime = card.timeRemaining;
            card.startTime = Date.now();
            
            console.log(`[${cardId}] Timer set: ${minutes}m ${seconds}s = ${card.timeRemaining} seconds total`);
        }

        if (card.timeRemaining <= 0) {
            alert('Please set a time first!');
            return;
        }
    } else {
        if (!card.isActive) {
            card.timeElapsed = 0;
            card.startTime = Date.now();
        }
    }

    card.isActive = true;
    card.isPaused = false;
    updateCardStatus(cardId);

    if (card.interval) clearInterval(card.interval);

    card.interval = setInterval(() => {
        if (!card.isPaused) {
            if (card.mode === 'countdown') {
                card.timeRemaining--;
                updateTimerDisplay(cardId);

                if (card.timeRemaining === 0) {
                    console.log(`[${cardId}] ⏰ TIMER REACHED ZERO!`);
                    showExpiredAlert(cardId);
                    
                    setTimeout(() => {
                        console.log(`[${cardId}] Auto-triggering stop and add to sales...`);
                        stopTimerAndAddSale(cardId);
                    }, 2000);
                }
                
                updateCardStatus(cardId);
            } else {
                card.timeElapsed++;
                updateTimerDisplay(cardId);
            }
        }
    }, 1000);
}

function pauseTimer(cardId) {
    const card = cards[cardId];
    if (card.isActive) {
        card.isPaused = !card.isPaused;
        const btn = document.querySelector(`#card-${cardId} .btn-pause`);
        btn.textContent = card.isPaused ? 'Resume' : 'Pause';
        updateCardStatus(cardId);
    }
}

function resetTimer(cardId) {
    const card = cards[cardId];
    console.log(`[${cardId}] Resetting timer`);
    clearInterval(card.interval);
    card.timeRemaining = 0;
    card.timeElapsed = 0;
    card.isActive = false;
    card.isPaused = false;
    card.startTime = null;
    card.initialTime = 0;
    updateTimerDisplay(cardId);
    updateCardStatus(cardId);
    const btn = document.querySelector(`#card-${cardId} .btn-pause`);
    if (btn) btn.textContent = 'Pause';
}

function stopTimerAndAddSale(cardId) {
    const card = cards[cardId];
    
    console.log(`\n========================================`);
    console.log(`[${cardId}] STOP AND ADD TO SALES TRIGGERED`);
    console.log(`========================================`);
    
    if (!card.startTime) {
        console.log(`[${cardId}] ❌ Timer was never started - aborting`);
        return;
    }
    
    let durationMinutes = 0;
    
    if (card.mode === 'countdown') {
        const usedSeconds = card.initialTime - Math.max(0, card.timeRemaining);
        durationMinutes = Math.ceil(usedSeconds / 60);
        console.log(`[${cardId}] Countdown: ${card.initialTime}s - ${card.timeRemaining}s = ${usedSeconds}s (${durationMinutes} min)`);
    } else {
        durationMinutes = Math.ceil(card.timeElapsed / 60);
        console.log(`[${cardId}] Countup: ${card.timeElapsed}s = ${durationMinutes} min`);
    }
    
    if (durationMinutes <= 0) {
        console.log(`[${cardId}] ❌ Duration is 0 - not adding to sales`);
        resetTimer(cardId);
        return;
    }
    
    console.log(`[${cardId}] ✅ Valid duration: ${durationMinutes} minutes`);
    
    // ONLY USE localStorage METHOD - most reliable and won't duplicate
    console.log(`[${cardId}] 💾 Using localStorage method ONLY...`);
    try {
        const wifiSession = {
            clientName: card.clientName,
            durationMinutes: durationMinutes,
            timestamp: Date.now()
        };
        localStorage.setItem('pendingWifiSession', JSON.stringify(wifiSession));
        console.log(`[${cardId}] ✅ Saved to localStorage:`, wifiSession);
        
        // Trigger check by setting flag
        localStorage.setItem('wifiSessionFlag', Date.now().toString());
        console.log(`[${cardId}] ✅ Flag set - main app will process`);
    } catch (error) {
        console.error(`[${cardId}] ❌ localStorage error:`, error);
    }
    
    console.log(`========================================\n`);
    
    // Don't use alert - it stops the ringtone!
    // The ringtone will keep playing until user clicks "OK" on the modal
    console.log(`✅ ${card.clientName} session (${durationMinutes} min) sent to sales`);
    
    resetTimer(cardId);
}

function addTime(cardId, minutes) {
    const card = cards[cardId];
    if (card.mode === 'countdown') {
        card.timeRemaining += minutes * 60;
        if (card.initialTime) {
            card.initialTime += minutes * 60;
        }
        updateTimerDisplay(cardId);
        console.log(`[${cardId}] Added ${minutes} minutes`);
    }
}

function updateTimerDisplay(cardId) {
    const card = cards[cardId];
    let displayTime;
    
    if (card.mode === 'countdown') {
        displayTime = card.timeRemaining;
    } else {
        displayTime = card.timeElapsed;
    }
    
    const isNegative = displayTime < 0;
    const absTime = Math.abs(displayTime);
    
    const hours = Math.floor(absTime / 3600);
    const minutes = Math.floor((absTime % 3600) / 60);
    const seconds = absTime % 60;

    const display = `${isNegative ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const timerEl = document.getElementById(`timer-${cardId}`);
    if (timerEl) {
        timerEl.textContent = display;

        timerEl.className = 'timer-display';
        if (card.mode === 'countdown') {
            if (displayTime < 0) {
                timerEl.classList.add('expired');
            } else if (displayTime <= 300) {
                timerEl.classList.add('warning');
            }
        }
    }
}

function updateCardStatus(cardId) {
    const card = cards[cardId];
    const cardEl = document.getElementById(`card-${cardId}`);
    if (!cardEl) return;
    
    const badge = cardEl.querySelector('.status-badge');

    cardEl.className = 'card';
    
    if (!card.isActive) {
        badge.className = 'status-badge status-available';
        badge.textContent = 'Available';
        
        if (card.mode === 'countdown' && card.timeRemaining <= 0 && card.timeElapsed === 0) {
            cardEl.classList.add('expired');
            badge.className = 'status-badge status-expired';
            badge.textContent = 'Expired';
        }
    } else {
        cardEl.classList.add('active');
        badge.className = 'status-badge status-active';
        
        if (card.isPaused) {
            badge.textContent = 'Paused';
        } else {
            badge.textContent = card.mode === 'countdown' ? 'Active' : 'Tracking';
        }
        
        if (card.mode === 'countdown') {
            if (card.timeRemaining < 0) {
                cardEl.classList.remove('warning');
                cardEl.classList.add('expired');
                badge.className = 'status-badge status-expired';
                badge.textContent = card.isPaused ? 'Paused (Overtime)' : 'Overtime';
            } else if (card.timeRemaining <= 300 && card.timeRemaining > 0) {
                cardEl.classList.add('warning');
            }
        }
    }
}

function showExpiredAlert(cardId) {
    const modal = document.getElementById('alertModal');
    const message = document.getElementById('modalMessage');
    
    if (modal && message) {
        message.textContent = `Card ${cardId.toUpperCase()}'s time is out!`;
        modal.classList.add('show');
    } else {
        console.log('Alert modal not found, using browser alert');
        alert(`⏰ Card ${cardId.toUpperCase()}'s time is out!`);
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('⏰ WiFi Time Expired!', {
            body: `Card ${cardId.toUpperCase()}'s time is out!`,
            icon: '🔔',
            requireInteraction: true,
            tag: cardId
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
    }
    
    playAlertSound();
}

function playAlertSound() {
    stopAlertSound();
    
    alertInterval = setInterval(() => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not supported');
        }
    }, 1000);
}

function stopAlertSound() {
    if (alertInterval) {
        clearInterval(alertInterval);
        alertInterval = null;
    }
}

function closeModal() {
    const modal = document.getElementById('alertModal');
    if (modal) {
        modal.classList.remove('show');
    }
    stopAlertSound();
}

console.log('=== WiFi Timer Script Loaded Successfully ===');
window.onload = initCards;