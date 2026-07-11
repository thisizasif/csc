// script.js - Complete JavaScript for CSC Document Information System

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

// ===== LOAD DATA FROM JSON FILE =====
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
        
        // Update total services stat
        document.getElementById('totalServices').innerHTML = 
            `<i class="fas fa-database"></i> ${services.length} Services`;
        document.getElementById('categoryCount').textContent = `${categories.length} categories`;
        
        // Hide preloader
        setTimeout(() => {
            document.getElementById('preloader').classList.add('fade-out');
            document.getElementById('mainContent').style.display = 'block';
        }, 500);
        
        renderCategories();
        applyFilters();
        toast('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        toast('Failed to load data. Using fallback data.');
        
        services = getFallbackData();
        categories = ["Aadhaar", "PAN", "Certificates", "Passport", "Driving Licence", "Voter ID", "Banking", "Utility Bills", "PM Kisan", "Ayushman Bharat", "J&K Services", "Other Services"];
        
        setTimeout(() => {
            document.getElementById('preloader').classList.add('fade-out');
            document.getElementById('mainContent').style.display = 'block';
        }, 500);
        
        renderCategories();
        applyFilters();
    }
}

function getFallbackData() {
    return [
        {
            id: 1,
            name: "PAN Card New",
            category: "PAN",
            requiredDocuments: ["Aadhaar Card", "Passport Size Photo", "Mobile Number", "Email ID", "Signature"],
            governmentFee: 107,
            serviceCharge: 100,
            processingTime: "7-10 Working Days",
            notes: "Carry original Aadhaar Card."
        },
        {
            id: 2,
            name: "Aadhaar Update",
            category: "Aadhaar",
            requiredDocuments: ["Aadhaar Card", "Proof of Address", "Phone Number"],
            governmentFee: 50,
            serviceCharge: 30,
            processingTime: "3-5 Working Days",
            notes: "Biometric verification may be required."
        },
        {
            id: 3,
            name: "Passport Renewal",
            category: "Passport",
            requiredDocuments: ["Old Passport", "Address Proof", "Photograph", "Application Form"],
            governmentFee: 1500,
            serviceCharge: 200,
            processingTime: "15-20 Working Days",
            notes: "Police verification may apply."
        }
    ];
}

// ===== RENDER CATEGORIES =====
function renderCategories() {
    const container = document.getElementById('categoryContainer');
    container.innerHTML = `
        <div class="category-chip active" data-cat="all" onclick="filterByCategory('all')">
            <i class="fas fa-th"></i> All
        </div>
    `;
    
    categories.forEach(cat => {
        const count = services.filter(s => s.category === cat).length;
        const chip = document.createElement('div');
        chip.className = 'category-chip';
        chip.dataset.cat = cat;
        chip.innerHTML = `<i class="fas fa-tag"></i> ${cat} <span style="font-size:0.7rem;opacity:0.6;">(${count})</span>`;
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
            <div class="service-card" onclick="showDetail(${s.id})">
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

// ===== SHOW DETAIL PANEL =====
function showDetail(id) {
    const s = services.find(ser => ser.id === id);
    if (!s) return;
    
    selectedService = s;
    
    recentlyViewed = recentlyViewed.filter(rid => rid !== id);
    recentlyViewed.unshift(id);
    if (recentlyViewed.length > 10) recentlyViewed.pop();
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    
    const panel = document.getElementById('detailPanel');
    const overlay = document.getElementById('detailOverlay');
    
    document.getElementById('detailCategory').textContent = s.category;
    document.getElementById('detailName').textContent = s.name;
    
    const docList = document.getElementById('detailDocs');
    docList.innerHTML = s.requiredDocuments.map(d => 
        `<li><i class="fas fa-check-circle"></i> ${d}</li>`
    ).join('');
    
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

// ===== UPDATED PRINT DETAIL =====
function printDetail() {
    if (!selectedService) {
        toast('Please select a service first');
        return;
    }
    
    const s = selectedService;
    const win = window.open('', '_blank');
    
    // Generate numbered documents list
    const numberedDocs = s.requiredDocuments.map((doc, index) => 
        `${index + 1}. ${doc}`
    ).join('\n');
    
    win.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${s.name} - Service Details</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Times New Roman', Georgia, serif;
                        padding: 40px;
                        max-width: 900px;
                        margin: 0 auto;
                        background: white;
                        color: #1a1a1a;
                        line-height: 1.6;
                    }
                    .print-header {
                        text-align: center;
                        padding-bottom: 20px;
                        border-bottom: 3px double #1a1a1a;
                        margin-bottom: 25px;
                    }
                    .print-header h1 {
                        font-size: 28px;
                        letter-spacing: 1px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #1a1a1a;
                    }
                    .print-header .subtitle {
                        font-size: 14px;
                        color: #555;
                        margin-top: 5px;
                        letter-spacing: 2px;
                    }
                    .print-header .service-name {
                        font-size: 22px;
                        margin-top: 10px;
                        font-weight: 600;
                        color: #1a1a1a;
                    }
                    .print-header .category {
                        display: inline-block;
                        background: #f0f0f0;
                        padding: 4px 20px;
                        border-radius: 20px;
                        font-size: 13px;
                        margin-top: 8px;
                        color: #555;
                        letter-spacing: 1px;
                    }
                    .print-section {
                        margin-bottom: 25px;
                        padding: 15px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .print-section:last-child {
                        border-bottom: none;
                    }
                    .print-section-title {
                        font-size: 16px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #1a1a1a;
                        margin-bottom: 12px;
                        padding-bottom: 5px;
                        border-bottom: 2px solid #1a1a1a;
                    }
                    .doc-item {
                        padding: 6px 0;
                        font-size: 15px;
                        display: flex;
                        align-items: baseline;
                        gap: 8px;
                    }
                    .doc-item .doc-number {
                        font-weight: 700;
                        color: #1a1a1a;
                        min-width: 30px;
                    }
                    .doc-item .doc-text {
                        color: #1a1a1a;
                    }
                    .fee-hidden {
                        display: none !important;
                    }
                    .fee-print-note {
                        text-align: center;
                        padding: 12px;
                        background: #f8f8f8;
                        border: 1px dashed #999;
                        border-radius: 8px;
                        color: #666;
                        font-style: italic;
                        font-size: 14px;
                    }
                    .processing-time {
                        display: inline-block;
                        background: #f0f0f0;
                        padding: 6px 24px;
                        border-radius: 20px;
                        font-weight: 500;
                        font-size: 15px;
                    }
                    .notes-content {
                        padding: 12px 16px;
                        background: #f9f9f9;
                        border-left: 4px solid #1a1a1a;
                        border-radius: 4px;
                        font-size: 15px;
                    }
                    .print-footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 2px solid #1a1a1a;
                        text-align: center;
                        font-size: 13px;
                    }
                    .print-footer .company-name {
                        font-size: 16px;
                        font-weight: 700;
                        letter-spacing: 1px;
                        color: #1a1a1a;
                    }
                    .print-footer .contact {
                        margin-top: 5px;
                        color: #555;
                    }
                    .print-footer .copyright {
                        margin-top: 8px;
                        color: #777;
                        font-size: 12px;
                    }
                    .print-watermark {
                        position: fixed;
                        bottom: 30px;
                        right: 30px;
                        opacity: 0.1;
                        font-size: 60px;
                        font-weight: bold;
                        color: #1a1a1a;
                        transform: rotate(-15deg);
                        pointer-events: none;
                    }
                    @media print {
                        .print-watermark {
                            display: block;
                        }
                        .fee-hidden {
                            display: none !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
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
                    <div class="print-section-title">
                        <i class="fas fa-file-signature"></i> Required Documents
                    </div>
                    ${s.requiredDocuments.map((doc, index) => `
                        <div class="doc-item">
                            <span class="doc-number">${index + 1}.</span>
                            <span class="doc-text">${doc}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="print-section">
                    <div class="print-section-title">
                        <i class="fas fa-clock"></i> Processing Time
                    </div>
                    <div class="processing-time">${s.processingTime || 'N/A'}</div>
                </div>

                <div class="print-section">
                    <div class="print-section-title">
                        <i class="fas fa-sticky-note"></i> Additional Notes
                    </div>
                    <div class="notes-content">${s.notes || 'No additional notes available.'}</div>
                </div>

                <div class="print-section fee-hidden">
                    <div class="print-section-title">
                        <i class="fas fa-money-bill-wave"></i> Fee Structure
                    </div>
                    <div style="display:flex;gap:40px;flex-wrap:wrap;padding:10px 0;">
                        <div>
                            <div style="font-size:13px;color:#666;">Government Fee</div>
                            <div style="font-size:18px;font-weight:bold;">₹${s.governmentFee}</div>
                        </div>
                        <div>
                            <div style="font-size:13px;color:#666;">Service Charge</div>
                            <div style="font-size:18px;font-weight:bold;">₹${s.serviceCharge}</div>
                        </div>
                        <div>
                            <div style="font-size:13px;color:#666;">Total Payable</div>
                            <div style="font-size:22px;font-weight:bold;color:#16a34a;">₹${s.governmentFee + s.serviceCharge}</div>
                        </div>
                    </div>
                </div>

                <div class="fee-print-note">
                    <i class="fas fa-info-circle"></i> Fee details are confidential and not displayed in this printout. Please contact the MANTOO COMPUTERS for fee information.
                </div>

                <div class="print-footer">
                    <div class="company-name">MANTOO COMPUTERS</div>
                    <div class="contact">
                        <i class="fas fa-phone"></i> 8082042836 &nbsp;|&nbsp; 
                        <i class="fas fa-envelope"></i> cscfeeripora@gmail.com
                    </div>
                    <div class="copyright">
                        &copy; ${new Date().getFullYear()} MANTOO COMPUTERS. All Rights Reserved.
                    </div>
                    <div style="margin-top:8px;font-size:11px;color:#999;">
                        Printed on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
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

// ===== SHARE DETAILS =====
function shareDetails() {
    if (!selectedService) {
        toast('Please select a service first');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: selectedService.name,
            text: `${selectedService.name} - Category: ${selectedService.category}\nDocuments: ${selectedService.requiredDocuments.join(', ')}\nContact: 8082042836`
        }).catch(() => {});
    } else {
        copyDetails();
    }
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

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDetail();
        document.getElementById('suggestionsBox').style.display = 'none';
    }
    
    if (e.key === 'Enter') {
        const suggestions = document.querySelectorAll('.suggestion-item');
        if (suggestions.length > 0) {
            const firstSuggestion = suggestions[0];
            const onclickAttr = firstSuggestion.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/\d+/);
                if (match) {
                    selectSuggestion(parseInt(match[0]));
                }
            }
        }
    }
});

// ===== LOAD DARK MODE PREFERENCE =====
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    const button = document.getElementById('darkModeBtn');
    button.querySelector('i').className = 'fas fa-sun';
    button.querySelector('span').textContent = 'Light';
}

// ===== UPDATED PRINT DETAIL - HIDES NOTES SECTION IF EMPTY =====
function printDetail() {
    if (!selectedService) {
        toast('Please select a service first');
        return;
    }
    
    const s = selectedService;
    const win = window.open('', '_blank');
    
    // Check if notes exist and are not empty
    const hasNotes = s.notes && s.notes.trim() !== '' && s.notes !== 'No additional notes available.' && s.notes !== 'No additional notes.';
    
    win.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${s.name} - Service Details</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Times New Roman', Georgia, serif;
                        padding: 40px;
                        max-width: 900px;
                        margin: 0 auto;
                        background: white;
                        color: #1a1a1a;
                        line-height: 1.6;
                    }
                    .print-header {
                        text-align: center;
                        padding-bottom: 20px;
                        border-bottom: 3px double #1a1a1a;
                        margin-bottom: 25px;
                    }
                    .print-header h1 {
                        font-size: 28px;
                        letter-spacing: 1px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #1a1a1a;
                    }
                    .print-header .subtitle {
                        font-size: 14px;
                        color: #555;
                        margin-top: 5px;
                        letter-spacing: 2px;
                    }
                    .print-header .service-name {
                        font-size: 22px;
                        margin-top: 10px;
                        font-weight: 600;
                        color: #1a1a1a;
                    }
                    .print-header .category {
                        display: inline-block;
                        background: #f0f0f0;
                        padding: 4px 20px;
                        border-radius: 20px;
                        font-size: 13px;
                        margin-top: 8px;
                        color: #555;
                        letter-spacing: 1px;
                    }
                    .print-section {
                        margin-bottom: 25px;
                        padding: 15px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .print-section:last-child {
                        border-bottom: none;
                    }
                    .print-section-title {
                        font-size: 16px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #1a1a1a;
                        margin-bottom: 12px;
                        padding-bottom: 5px;
                        border-bottom: 2px solid #1a1a1a;
                    }
                    .doc-item {
                        padding: 6px 0;
                        font-size: 15px;
                        display: flex;
                        align-items: baseline;
                        gap: 8px;
                    }
                    .doc-item .doc-number {
                        font-weight: 700;
                        color: #1a1a1a;
                        min-width: 30px;
                    }
                    .doc-item .doc-text {
                        color: #1a1a1a;
                    }
                    .fee-hidden {
                        display: none !important;
                    }
                    .fee-print-note {
                        text-align: center;
                        padding: 12px;
                        background: #f8f8f8;
                        border: 1px dashed #999;
                        border-radius: 8px;
                        color: #666;
                        font-style: italic;
                        font-size: 14px;
                    }
                    .processing-time {
                        display: inline-block;
                        background: #f0f0f0;
                        padding: 6px 24px;
                        border-radius: 20px;
                        font-weight: 500;
                        font-size: 15px;
                    }
                    .notes-content {
                        padding: 12px 16px;
                        background: #f9f9f9;
                        border-left: 4px solid #1a1a1a;
                        border-radius: 4px;
                        font-size: 15px;
                    }
                    .print-footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 2px solid #1a1a1a;
                        text-align: center;
                        font-size: 13px;
                    }
                    .print-footer .company-name {
                        font-size: 16px;
                        font-weight: 700;
                        letter-spacing: 1px;
                        color: #1a1a1a;
                    }
                    .print-footer .contact {
                        margin-top: 5px;
                        color: #555;
                    }
                    .print-footer .copyright {
                        margin-top: 8px;
                        color: #777;
                        font-size: 12px;
                    }
                    .print-watermark {
                        position: fixed;
                        bottom: 30px;
                        right: 30px;
                        opacity: 0.1;
                        font-size: 60px;
                        font-weight: bold;
                        color: #1a1a1a;
                        transform: rotate(-15deg);
                        pointer-events: none;
                    }
                    .hidden-print {
                        display: none !important;
                    }
                    @media print {
                        .print-watermark {
                            display: block;
                        }
                        .fee-hidden {
                            display: none !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .hidden-print {
                            display: none !important;
                        }
                    }
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
                    <div class="print-section-title">
                        <i class="fas fa-file-signature"></i> Required Documents
                    </div>
                    ${s.requiredDocuments.map((doc, index) => `
                        <div class="doc-item">
                            <span class="doc-number">${index + 1}.</span>
                            <span class="doc-text">${doc}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="print-section">
                    <div class="print-section-title">
                        <i class="fas fa-clock"></i> Processing Time
                    </div>
                    <div class="processing-time">${s.processingTime || 'N/A'}</div>
                </div>

                <!-- Notes Section - Only shown if notes exist -->
                <div class="print-section ${!hasNotes ? 'hidden-print' : ''}">
                    <div class="print-section-title">
                        <i class="fas fa-sticky-note"></i> Additional Notes
                    </div>
                    <div class="notes-content">${hasNotes ? s.notes : ''}</div>
                </div>

                <div class="print-section fee-hidden">
                    <div class="print-section-title">
                        <i class="fas fa-money-bill-wave"></i> Fee Structure
                    </div>
                    <div style="display:flex;gap:40px;flex-wrap:wrap;padding:10px 0;">
                        <div>
                            <div style="font-size:13px;color:#666;">Government Fee</div>
                            <div style="font-size:18px;font-weight:bold;">₹${s.governmentFee}</div>
                        </div>
                        <div>
                            <div style="font-size:13px;color:#666;">Service Charge</div>
                            <div style="font-size:18px;font-weight:bold;">₹${s.serviceCharge}</div>
                        </div>
                        <div>
                            <div style="font-size:13px;color:#666;">Total Payable</div>
                            <div style="font-size:22px;font-weight:bold;color:#16a34a;">₹${s.governmentFee + s.serviceCharge}</div>
                        </div>
                    </div>
                </div>

                <div class="fee-print-note">
                    <i class="fas fa-info-circle"></i> Fee details are confidential and not displayed in this printout. Please contact the MANTOO COMPUTERS for fee information.
                </div>

                <div class="print-footer">
                    <div class="company-name">MANTOO COMPUTERS</div>
                    <div class="contact">
                        <i class="fas fa-phone"></i> 8082042836 &nbsp;|&nbsp; 
                        <i class="fas fa-envelope"></i> cscfeeripora@gmail.com
                    </div>
                    <div class="copyright">
                        &copy; ${new Date().getFullYear()} MANTOO COMPUTERS. All Rights Reserved.
                    </div>
                    <div style="margin-top:8px;font-size:11px;color:#999;">
                        Printed on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </body>
        </html>
    `);
    win.document.close();
    setTimeout(() => {
        win.print();
    }, 500);
}

// ===== INITIALIZE APPLICATION =====
loadData();
console.log('CSC Document Information System v2.0 initialized');