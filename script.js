// script.js - Complete JavaScript for MANTOO COMPUTERS

// ===== DATA STORAGE =====
let services = [];
let categories = [];
let selectedService = null;
let currentCategory = 'all';
let currentView = 'grid';
let displayedServices = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
let itemsPerPage = 12;
let currentPage = 1;
let allFilteredServices = [];
let checklistState = JSON.parse(localStorage.getItem('checklistState') || '{}');

// ===== LOGIN SYSTEM =====
const VALID_USERNAME = 'asif';
const VALID_PASSWORD = 'ip2091';

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        loadData();
    } else {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
    }
}

function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('loginError');
    
    if (!username || !password) {
        errorEl.textContent = 'Please enter both username and password';
        errorEl.classList.add('show');
        return;
    }
    
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        errorEl.classList.remove('show');
        localStorage.setItem('isLoggedIn', 'true');
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        toast('Login successful! Welcome back.');
        loadData();
    } else {
        errorEl.textContent = 'Invalid username or password. Please try again.';
        errorEl.classList.add('show');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isLoggedIn');
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('username').value = 'asif';
        document.getElementById('password').value = 'ip2091';
        document.getElementById('loginError').classList.remove('show');
        toast('Logged out successfully');
    }
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

// ===== LOAD DATA =====
async function loadData() {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) {
            throw new Error('data.json not found');
        }
        const data = await response.json();
        
        services = data.services || [];
        categories = data.categories || [];
        
        if (categories.length === 0 && services.length > 0) {
            const uniqueCategories = new Set(services.map(s => s.category));
            categories = Array.from(uniqueCategories).sort();
        }
        
        document.getElementById('totalServices').innerHTML = 
            `<i class="fas fa-database"></i> ${services.length} Services`;
        document.getElementById('categoryCount').textContent = `${categories.length} categories`;
        
        setTimeout(() => {
            document.getElementById('preloader').classList.add('fade-out');
        }, 500);
        
        renderCategories();
        renderRecentlyViewed();
        applyFilters();
        toast('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        toast('Failed to load data. Using fallback data.');
        
        services = getFallbackData();
        categories = ["AADHAAR", "CERTIFICATES", "SCHEMES"];
        
        setTimeout(() => {
            document.getElementById('preloader').classList.add('fade-out');
        }, 500);
        
        renderCategories();
        renderRecentlyViewed();
        applyFilters();
    }
}

function getFallbackData() {
    return [
        {
            id: 1,
            name: "AADHAAR Card ENROLLMENT WITH CHOICE OF DOB",
            category: "AADHAAR",
            requiredDocuments: ["FATHER'S AADHAAR CARD", "MOTHER'S AADHAAR CARD", "SCHOOL BONAFIDE CERTIFICATE", "PHYSICAL PRESENCE OF CHILD AND FATHER"],
            governmentFee: 1550,
            serviceCharge: 450,
            processingTime: "1-2 Working Days",
            notes: "CARRY MENTIONED DOCUMENTS IN ORIGINAL AND PHOTOCOPY. FATHER'S AADHAAR CARD IS MANDATORY FOR ENROLLMENT OF CHILD'S AADHAAR CARD."
        },
        {
            id: 2,
            name: "DOMICILE CERTIFICATE",
            category: "CERTIFICATES",
            requiredDocuments: ["AADHAAR CARD", "PHOTOGRAPH OF APPLICANT", "FATHER'S AADHAAR CARD", "RATION CARD E TICKET", "BIRTH CERTIFICATE / SCHOOL DOB / SCHOOL MARKSHEET", "PRC (IF AVAILABLE)"],
            governmentFee: 0,
            serviceCharge: 150,
            processingTime: "1-2 Working Days",
            notes: "PRC IS NOT MANDATORY"
        },
        {
            id: 3,
            name: "MARRIAGE ASSISTANCE SCHEME",
            category: "SCHEMES",
            requiredDocuments: ["UNMARRIED CERTIFICATE", "DEPENDENCY CERTIFICATE", "NIKKAHNAMA", "NOC FROM SOCIAL WELFARE DEPARTMENT", "SATHNAMA", "AADHAAR CARD", "BRIDE DOB PROOF", "GROOM DOB PROOF"],
            governmentFee: 0,
            serviceCharge: 0,
            processingTime: "Na",
            notes: "THIS CAN BE APPLY BEFORE OR AFTER 2 MONTHS OF MARRIAGE."
        }
    ];
}

// ===== RENDER CATEGORIES =====
function renderCategories() {
    const container = document.getElementById('categoryContainer');
    container.innerHTML = `
        <div class="category-chip active" data-cat="all" onclick="filterByCategory('all')">
            <span class="color-dot" style="background:#6b7280;"></span>
            All
        </div>
    `;
    
    const categoryColors = {
        'AADHAAR': '#2563eb',
        'CERTIFICATES': '#16a34a',
        'SCHEMES': '#7c3aed'
    };
    
    categories.forEach(cat => {
        const count = services.filter(s => s.category === cat).length;
        const color = categoryColors[cat] || '#6b7280';
        const chip = document.createElement('div');
        chip.className = 'category-chip';
        chip.dataset.cat = cat;
        chip.innerHTML = `
            <span class="color-dot" style="background:${color};"></span>
            ${cat} 
            <span style="font-size:0.7rem;opacity:0.6;">(${count})</span>
        `;
        chip.onclick = () => filterByCategory(cat);
        container.appendChild(chip);
    });
}

// ===== FILTER BY CATEGORY =====
function filterByCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.category-chip').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.category-chip').forEach(el => {
        if (el.dataset.cat === cat) el.classList.add('active');
    });
    currentPage = 1;
    applyFilters();
    document.querySelector('.results-header').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== APPLY FILTERS =====
function applyFilters() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    let filtered = services;
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(s => s.category === currentCategory);
    }
    
    if (query) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.category.toLowerCase().includes(query) ||
            s.requiredDocuments.some(doc => doc.toLowerCase().includes(query))
        );
    }
    
    filtered.sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 0 : 1;
        const bFav = favorites.includes(b.id) ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
        return a.name.localeCompare(b.name);
    });
    
    allFilteredServices = filtered;
    currentPage = 1;
    renderServices(filtered.slice(0, itemsPerPage));
    updateSuggestions(query);
    
    const total = filtered.length;
    document.getElementById('serviceCounter').innerHTML = 
        `<i class="fas fa-list-ul"></i> Showing ${Math.min(total, itemsPerPage)} of ${total} services`;
    
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (total > itemsPerPage) {
        loadMoreContainer.style.display = 'block';
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

// ===== LOAD MORE =====
function loadMore() {
    currentPage++;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const newServices = allFilteredServices.slice(start, end);
    renderServices([...displayedServices, ...newServices]);
    
    if (end >= allFilteredServices.length) {
        document.getElementById('loadMoreContainer').style.display = 'none';
    }
}

// ===== RENDER SERVICES =====
function renderServices(list) {
    displayedServices = list;
    const grid = document.getElementById('serviceGrid');
    grid.className = `service-grid ${currentView === 'list' ? 'list-view' : ''}`;
    
    if (list.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No services found</p>
                <p style="font-size:0.9rem;margin-top:8px;">Try adjusting your search or category filter</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = list.map(s => {
        const isFavorite = favorites.includes(s.id);
        const docPreview = s.requiredDocuments.slice(0, 3).map(d => 
            `<span class="doc-tag">${d}</span>`
        ).join('');
        const moreDocs = s.requiredDocuments.length > 3 ? 
            `<span class="doc-tag">+${s.requiredDocuments.length - 3} more</span>` : '';
        
        return `
            <div class="service-card" onclick="showDetail(${s.id})" data-tooltip="Click to view ${s.name}">
                <div class="card-top">
                    <h3>${s.name}</h3>
                    <span class="cat-badge">${s.category}</span>
                </div>
                <div class="service-docs-preview">
                    ${docPreview}
                    ${moreDocs}
                </div>
                <div class="fee-preview">
                    <span>₹${s.governmentFee} + ₹${s.serviceCharge}</span>
                    <span class="total">₹${s.governmentFee + s.serviceCharge}</span>
                </div>
                ${isFavorite ? '<i class="fas fa-heart" style="position:absolute;top:12px;right:12px;color:#dc2626;font-size:0.9rem;"></i>' : ''}
            </div>
        `;
    }).join('');
}

// ===== TOGGLE VIEW =====
function toggleView(view) {
    currentView = view;
    document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
    document.getElementById('listViewBtn').classList.toggle('active', view === 'list');
    renderServices(displayedServices);
}

// ===== RECENTLY VIEWED =====
function addRecentlyViewed(serviceId) {
    recentlyViewed = recentlyViewed.filter(id => id !== serviceId);
    recentlyViewed.unshift(serviceId);
    if (recentlyViewed.length > 5) recentlyViewed.pop();
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
}

function renderRecentlyViewed() {
    const container = document.getElementById('recentlyGrid');
    if (!container) return;
    const ids = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const recentServices = ids.map(id => services.find(s => s.id === id)).filter(Boolean);
    if (recentServices.length === 0) {
        container.innerHTML = '<span style="color:var(--gray-400);font-size:0.85rem;">No recently viewed services</span>';
        return;
    }
    container.innerHTML = recentServices.map(s => `
        <div class="recent-chip" onclick="showDetail(${s.id})" data-tooltip="Click to view ${s.name}">
            ${s.name}
        </div>
    `).join('');
}

// ===== SHOW DETAIL PANEL =====
function showDetail(id) {
    const s = services.find(ser => ser.id === id);
    if (!s) return;
    
    selectedService = s;
    addRecentlyViewed(id);
    
    const panel = document.getElementById('detailPanel');
    const overlay = document.getElementById('detailOverlay');
    
    document.getElementById('detailCategory').textContent = s.category;
    document.getElementById('detailName').textContent = s.name;
    
    // Render checklist
    const docList = document.getElementById('detailDocs');
    docList.innerHTML = s.requiredDocuments.map((d, index) => {
        const key = `${s.id}-${index}`;
        const checked = checklistState[key] || false;
        return `
            <li class="checklist-item ${checked ? 'checked' : ''}" onclick="toggleChecklistItem(${s.id}, ${index})">
                <span class="check-box"><i class="fas ${checked ? 'fa-check' : ''}"></i></span>
                <span class="doc-text">${d}</span>
            </li>
        `;
    }).join('');
    
    updateChecklistUI(s.id);
    
    document.getElementById('detailGovFee').textContent = `₹${s.governmentFee}`;
    document.getElementById('detailSvcCharge').textContent = `₹${s.serviceCharge}`;
    document.getElementById('detailTotal').textContent = `₹${s.governmentFee + s.serviceCharge}`;
    
    document.getElementById('detailProcessing').innerHTML = 
        `<i class="far fa-clock"></i> ${s.processingTime || 'N/A'}`;
    
    document.getElementById('detailNotes').innerHTML = 
        `📌 ${s.notes || 'No additional notes available.'}`;
    
    const favBtn = document.getElementById('favoriteBtn');
    const isFavorite = favorites.includes(s.id);
    favBtn.innerHTML = isFavorite ? 
        `<i class="fas fa-heart" style="color:#dc2626;"></i>` : 
        `<i class="far fa-heart"></i>`;
    favBtn.classList.toggle('active', isFavorite);
    
    panel.classList.add('show');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE DETAIL =====
function closeDetail() {
    document.getElementById('detailPanel').classList.remove('show');
    document.getElementById('detailOverlay').classList.remove('show');
    document.body.style.overflow = '';
}

// ===== CHECKLIST =====
function toggleChecklistItem(serviceId, docIndex) {
    const key = `${serviceId}-${docIndex}`;
    checklistState[key] = !checklistState[key];
    localStorage.setItem('checklistState', JSON.stringify(checklistState));
    updateChecklistUI(serviceId);
}

function updateChecklistUI(serviceId) {
    const items = document.querySelectorAll(`#detailDocs .checklist-item`);
    let checked = 0;
    items.forEach((item, index) => {
        const key = `${serviceId}-${index}`;
        const isChecked = checklistState[key] || false;
        const checkBox = item.querySelector('.check-box i');
        if (isChecked) {
            item.classList.add('checked');
            checkBox.className = 'fas fa-check';
            checked++;
        } else {
            item.classList.remove('checked');
            checkBox.className = 'fas';
        }
    });
    const total = items.length;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (progressFill) {
        const percentage = total > 0 ? (checked / total) * 100 : 0;
        progressFill.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${checked}/${total} documents checked`;
    }
}

// ===== TOGGLE FAVORITE =====
function toggleFavorite() {
    if (!selectedService) return;
    const id = selectedService.id;
    const index = favorites.indexOf(id);
    
    if (index > -1) {
        favorites.splice(index, 1);
        toast('Removed from favorites');
    } else {
        favorites.push(id);
        toast('Added to favorites');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    applyFilters();
    
    const favBtn = document.getElementById('favoriteBtn');
    const isFavorite = favorites.includes(id);
    favBtn.innerHTML = isFavorite ? 
        `<i class="fas fa-heart" style="color:#dc2626;"></i>` : 
        `<i class="far fa-heart"></i>`;
    favBtn.classList.toggle('active', isFavorite);
}

// ===== SEARCH FUNCTIONALITY =====
document.getElementById('searchInput').addEventListener('input', function(e) {
    const val = this.value.trim();
    document.getElementById('clearBtn').style.display = val ? 'block' : 'none';
    currentPage = 1;
    applyFilters();
});

// ===== UPDATE SUGGESTIONS =====
function updateSuggestions(query) {
    const box = document.getElementById('suggestionsBox');
    
    if (!query || query.length < 1) {
        box.style.display = 'none';
        return;
    }
    
    const matches = services.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.category.toLowerCase().includes(query) ||
        s.requiredDocuments.some(doc => doc.toLowerCase().includes(query))
    ).slice(0, 8);
    
    if (matches.length === 0) {
        box.style.display = 'none';
        return;
    }
    
    box.style.display = 'block';
    box.innerHTML = matches.map(m => `
        <div class="suggestion-item" onclick="selectSuggestion(${m.id})">
            <i class="fas fa-file-alt"></i>
            ${m.name}
            <span class="suggestion-category">${m.category}</span>
        </div>
    `).join('');
}

// ===== SELECT SUGGESTION =====
function selectSuggestion(id) {
    const s = services.find(ser => ser.id === id);
    if (!s) return;
    
    document.getElementById('searchInput').value = s.name;
    document.getElementById('suggestionsBox').style.display = 'none';
    showDetail(id);
    applyFilters();
}

// ===== CLEAR SEARCH =====
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearBtn').style.display = 'none';
    document.getElementById('suggestionsBox').style.display = 'none';
    currentPage = 1;
    applyFilters();
}

// ===== VOICE SEARCH =====
function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast('Voice search not supported in this browser');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = function(e) {
        const transcript = e.results[0][0].transcript;
        document.getElementById('searchInput').value = transcript;
        currentPage = 1;
        applyFilters();
        toast('Voice: ' + transcript);
    };
    
    recognition.onerror = function(e) {
        toast('Voice recognition error. Please try again.');
    };
    
    recognition.start();
    toast('Listening... Speak now');
}

// ===== QR CODE =====
let qrGenerated = false;

function toggleQR() {
    const section = document.getElementById('qrSection');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        if (!qrGenerated) {
            generateQR();
        }
    } else {
        section.style.display = 'none';
    }
}

function generateQR() {
    if (!selectedService) return;
    const url = window.location.href.split('?')[0] + `?service=${selectedService.id}`;
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: url,
        width: 150,
        height: 150,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    qrGenerated = true;
}

function copyLink() {
    if (!selectedService) return;
    const url = window.location.href.split('?')[0] + `?service=${selectedService.id}`;
    navigator.clipboard.writeText(url)
        .then(() => toast('Link copied to clipboard!'))
        .catch(() => toast('Failed to copy link'));
}

function downloadQR() {
    const qrCanvas = document.querySelector('#qrcode canvas');
    if (!qrCanvas) return toast('Generate QR first');
    const link = document.createElement('a');
    link.download = `${selectedService.name}-QR.png`;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
    toast('QR code downloaded');
}

// ===== SHARE SERVICE =====
function shareService() {
    if (!selectedService) {
        toast('Please select a service first');
        return;
    }
    
    const s = selectedService;
    const shareText = `${s.name} (${s.category})\nDocuments Required: ${s.requiredDocuments.join(', ')}\nProcessing Time: ${s.processingTime || 'N/A'}\nContact: 8082042836\n\nPowered by MANTOO COMPUTERS`;
    
    if (navigator.share) {
        navigator.share({
            title: s.name,
            text: shareText,
            url: window.location.href
        }).catch((err) => {
            if (err.name !== 'AbortError') {
                copyShareText(shareText);
            }
        });
    } else {
        copyShareText(shareText);
    }
}

function copyShareText(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            toast('Service details copied! Share with anyone.');
        })
        .catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                toast('Service details copied! Share with anyone.');
            } catch (e) {
                toast('Failed to share. Please copy manually.');
            }
            document.body.removeChild(textarea);
        });
}

// ===== PRINT DETAIL =====
function printDetail() {
    if (!selectedService) {
        toast('Please select a service first');
        return;
    }
    
    const s = selectedService;
    const win = window.open('', '_blank');
    const hasNotes = s.notes && s.notes.trim() !== '' && s.notes !== 'No additional notes available.' && s.notes !== 'No additional notes.';
    
    win.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${s.name} - Service Details</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Times New Roman', Georgia, serif; padding: 40px; max-width: 900px; margin: 0 auto; background: white; color: #1a1a1a; line-height: 1.6; }
                    .print-header { text-align: center; padding-bottom: 20px; border-bottom: 3px double #1a1a1a; margin-bottom: 25px; }
                    .print-header h1 { font-size: 28px; letter-spacing: 1px; font-weight: bold; text-transform: uppercase; color: #1a1a1a; }
                    .print-header .subtitle { font-size: 14px; color: #555; margin-top: 5px; letter-spacing: 2px; }
                    .print-header .service-name { font-size: 22px; margin-top: 10px; font-weight: 600; color: #1a1a1a; }
                    .print-header .category { display: inline-block; background: #f0f0f0; padding: 4px 20px; border-radius: 20px; font-size: 13px; margin-top: 8px; color: #555; letter-spacing: 1px; }
                    .print-section { margin-bottom: 25px; padding: 15px 0; border-bottom: 1px solid #e0e0e0; }
                    .print-section:last-child { border-bottom: none; }
                    .print-section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1a1a1a; margin-bottom: 12px; padding-bottom: 5px; border-bottom: 2px solid #1a1a1a; }
                    .doc-item { padding: 6px 0; font-size: 15px; display: flex; align-items: baseline; gap: 8px; }
                    .doc-item .doc-number { font-weight: 700; color: #1a1a1a; min-width: 30px; }
                    .fee-hidden { display: none !important; }
                    .fee-print-note { text-align: center; padding: 12px; background: #f8f8f8; border: 1px dashed #999; border-radius: 8px; color: #666; font-style: italic; font-size: 14px; }
                    .processing-time { display: inline-block; background: #f0f0f0; padding: 6px 24px; border-radius: 20px; font-weight: 500; font-size: 15px; }
                    .notes-content { padding: 12px 16px; background: #f9f9f9; border-left: 4px solid #1a1a1a; border-radius: 4px; font-size: 15px; }
                    .print-footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #1a1a1a; text-align: center; font-size: 13px; }
                    .print-footer .company-name { font-size: 16px; font-weight: 700; letter-spacing: 1px; color: #1a1a1a; }
                    .print-footer .contact { margin-top: 5px; color: #555; }
                    .print-footer .copyright { margin-top: 8px; color: #777; font-size: 12px; }
                    .print-watermark { position: fixed; bottom: 30px; right: 30px; opacity: 0.1; font-size: 60px; font-weight: bold; color: #1a1a1a; transform: rotate(-15deg); pointer-events: none; }
                    .hidden-print { display: none !important; }
                    @media print { .print-watermark { display: block; } .fee-hidden { display: none !important; } .hidden-print { display: none !important; } }
                </style>
            </head>
            <body>
                <div class="print-watermark">CSC</div>
                <div class="print-header">
                    <h1>MANTOO COMPUTERS</h1>
                    <div class="subtitle">DOCUMENTS REQUIRED</div>
                    <div class="service-name">${s.name}</div>
                    <span class="category">${s.category}</span>
                </div>
                <div class="print-section">
                    <div class="print-section-title"><i class="fas fa-file-signature"></i> Required Documents</div>
                    ${s.requiredDocuments.map((doc, index) => `
                        <div class="doc-item"><span class="doc-number">${index + 1}.</span><span class="doc-text">${doc}</span></div>
                    `).join('')}
                </div>
                <div class="print-section">
                    <div class="print-section-title"><i class="fas fa-clock"></i> Processing Time</div>
                    <div class="processing-time">${s.processingTime || 'N/A'}</div>
                </div>
                <div class="print-section ${!hasNotes ? 'hidden-print' : ''}">
                    <div class="print-section-title"><i class="fas fa-sticky-note"></i> Additional Notes</div>
                    <div class="notes-content">${hasNotes ? s.notes : ''}</div>
                </div>
                <div class="print-section fee-hidden">
                    <div class="print-section-title"><i class="fas fa-money-bill-wave"></i> Fee Structure</div>
                    <div style="display:flex;gap:40px;flex-wrap:wrap;padding:10px 0;">
                        <div><div style="font-size:13px;color:#666;">Government Fee</div><div style="font-size:18px;font-weight:bold;">₹${s.governmentFee}</div></div>
                        <div><div style="font-size:13px;color:#666;">Service Charge</div><div style="font-size:18px;font-weight:bold;">₹${s.serviceCharge}</div></div>
                        <div><div style="font-size:13px;color:#666;">Total Payable</div><div style="font-size:22px;font-weight:bold;color:#16a34a;">₹${s.governmentFee + s.serviceCharge}</div></div>
                    </div>
                </div>
                <div class="fee-print-note"><i class="fas fa-info-circle"></i> Fee details are confidential and not displayed in this printout. Please contact MANTOO COMPUTERS for fee information.</div>
                <div class="print-footer">
                    <div class="company-name">MANTOO COMPUTERS</div>
                    <div class="contact"><i class="fas fa-phone"></i> 8082042836 &nbsp;|&nbsp; <i class="fas fa-envelope"></i> cscfeeripora@gmail.com</div>
                    <div class="copyright">&copy; ${new Date().getFullYear()} MANTOO COMPUTERS. All Rights Reserved.</div>
                    <div style="margin-top:8px;font-size:11px;color:#999;">Printed on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </body>
        </html>
    `);
    win.document.close();
    setTimeout(() => {
        win.print();
    }, 500);
}

// ===== DOWNLOAD PDF =====
function downloadPDF() {
    if (!selectedService) {
        toast('Please select a service first');
        return;
    }
    toast('PDF download: Use Print > Save as PDF');
    printDetail();
}

// ===== COPY DETAILS =====
function copyDetails() {
    if (!selectedService) {
        toast('Please select a service first');
        return;
    }
    
    const s = selectedService;
    const numberedDocs = s.requiredDocuments.map((doc, index) => 
        `  ${index + 1}. ${doc}`
    ).join('\n');
    
    const text = `
${s.name} (${s.category})
${'═'.repeat(50)}

📋 Required Documents:
${numberedDocs}

⏱️ Processing Time: ${s.processingTime}

📝 Notes: ${s.notes || 'No additional notes.'}

${'═'.repeat(50)}
MANTOO COMPUTERS
Contact: 8082042836
${'═'.repeat(50)}
    `.trim();
    
    navigator.clipboard.writeText(text)
        .then(() => toast('Details copied to clipboard!'))
        .catch(() => toast('Failed to copy. Please try again.'));
}

// ===== DARK MODE =====
function toggleDark() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    const button = document.getElementById('darkModeBtn');
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (isDark) {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark';
    }
    
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    toast(`Dark mode ${isDark ? 'enabled' : 'disabled'}`);
}

// ===== TOAST NOTIFICATION =====
function toast(msg) {
    const t = document.getElementById('toast');
    const msgSpan = document.getElementById('toastMsg');
    
    msgSpan.textContent = msg;
    t.classList.add('show');
    
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
        t.classList.remove('show');
    }, 3000);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Ctrl + L to focus search
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
            toast('Search focused');
        }
    }
    
    // Escape to close
    if (e.key === 'Escape') {
        closeDetail();
        document.getElementById('suggestionsBox').style.display = 'none';
    }
    
    // Enter for login
    if (e.key === 'Enter') {
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer.style.display !== 'none') {
            login();
        }
    }
});

// ===== PWA INSTALL =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBtn').style.display = 'flex';
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                toast('App installed successfully!');
                document.getElementById('installBtn').style.display = 'none';
            } else {
                toast('Installation cancelled');
            }
            deferredPrompt = null;
        });
    }
}

// ===== LOAD DARK MODE PREFERENCE =====
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    const button = document.getElementById('darkModeBtn');
    button.querySelector('i').className = 'fas fa-sun';
    button.querySelector('span').textContent = 'Light';
}

// ===== INITIALIZE APPLICATION =====
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

console.log('MANTOO COMPUTERS - Service Information Portal v3.0');
console.log('Login credentials: asif / ip2091');