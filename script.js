// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCGG5Ur3YpVxbtkjooMxE6r7RPuAmZoFRI",
    authDomain: "anonim-not.firebaseapp.com",
    projectId: "anonim-not",
    storageBucket: "anonim-not.firebasestorage.app",
    messagingSenderId: "1020793266706",
    appId: "1:1020793266706:web:bdaba147c8367a50dfaecb"
};

// EmailJS Configuration
const EMAILJS_SERVICE_ID = "service_ownrnmj";
const EMAILJS_TEMPLATE_ID = "template_yj8xnwj";
const EMAILJS_PUBLIC_KEY = "YrJGLKrAZ7qPXrXOT";

// Initialize variables to prevent reference errors
let auth = null;
let db = null;
let currentUser = null;
let currentItems = [];
let currentListId = null;
let currentListType = 'shopping';
let currentFilter = 'all';
let userSubscription = 'free';
let isFirebaseReady = false;
let isEmailJSReady = false;

// Initialize Firebase
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            auth = firebase.auth();
            isFirebaseReady = true;
            console.log('Firebase initialized successfully');

            // Initialize auth listener after Firebase is ready
            initializeAuth();
        } else if (firebase.apps.length > 0) {
            // Firebase already initialized
            db = firebase.firestore();
            auth = firebase.auth();
            isFirebaseReady = true;
            console.log('Firebase already initialized');
            initializeAuth();
        } else {
            console.error('Firebase not loaded, retrying...');
            setTimeout(initializeFirebase, 1000);
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        setTimeout(initializeFirebase, 2000);
    }
}

// Initialize EmailJS
function initializeEmailJS() {
    try {
        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            isEmailJSReady = true;
            console.log('EmailJS initialized successfully');
        } else {
            console.error('EmailJS not loaded, retrying...');
            setTimeout(initializeEmailJS, 1000);
        }
    } catch (error) {
        console.error('EmailJS initialization error:', error);
        setTimeout(initializeEmailJS, 2000);
    }
}

// Scroll to section function
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Navigate to section (go to home page first if needed)
function navigateToSection(sectionId) {
    // Check if we're on home page
    const homeSection = document.getElementById('home-section');
    if (homeSection.style.display === 'none') {
        // Go to home page first
        showSection('home');
        // Wait a bit then scroll
        setTimeout(() => {
            scrollToSection(sectionId);
        }, 100);
    } else {
        // Already on home page, just scroll
        scrollToSection(sectionId);
    }
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton();
}

function updateThemeButton() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const themeIcon = document.getElementById('theme-icon');

    if (!themeIcon) return;

    if (currentTheme === 'dark') {
        // Moon icon for dark theme
        themeIcon.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M11.38 2.019a7.5 7.5 0 1 0 10.6 10.6C21.662 17.854 17.316 22 12.001 22 6.477 22 2 17.523 2 12c0-5.315 4.146-9.661 9.38-9.981z'/%3E%3C/svg%3E";
    } else {
        // Sun icon for light theme
        themeIcon.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z'/%3E%3C/svg%3E";
    }
}

// Page management
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';

        // Load section-specific content
        if (sectionName === 'my-lists') {
            loadUserLists();
        } else if (sectionName === 'account') {
            updateAccountInfo();
        } else if (sectionName === 'contact') {
            prefillContactForm();
        }
    }
}

// Authentication functions
function initializeAuth() {
    if (!auth) {
        console.error('Firebase auth not initialized');
        setTimeout(initializeAuth, 1000);
        return;
    }

    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateAuthUI();

        if (user && user.emailVerified) {
            loadUserSubscription();
        }
    });
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');

    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';

        const email = currentUser.email;
        const shortEmail = email.length > 15 ? email.substring(0, 12) + '...' : email;
        document.getElementById('userEmailShort').textContent = shortEmail;

        // İletişim formlarını otomatik doldur
        prefillContactForm();
        prefillContactFormHome();
    } else {
        authButtons.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const userMenu = document.querySelector('.user-menu');

    if (!dropdown || !userMenu) {
        console.error('User dropdown elements not found');
        return;
    }

    // Close all other dropdowns first
    document.querySelectorAll('.user-dropdown').forEach(dd => {
        if (dd !== dropdown) {
            dd.classList.remove('show');
        }
    });

    dropdown.classList.toggle('show');

    // Prevent event bubbling
    event.stopPropagation();
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = e.target.closest('.user-menu');
    const dropdown = document.getElementById('userDropdown');

    if (!userMenu && dropdown) {
        dropdown.classList.remove('show');
    }
});

// Prevent dropdown from closing when clicking inside it
document.addEventListener('click', (e) => {
    if (e.target.closest('.user-dropdown')) {
        e.stopPropagation();
    }
});

function showAuthTab(tab) {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const loginTab = document.querySelector('.auth-tab');
    const registerTab = document.querySelectorAll('.auth-tab')[1];

    if (tab === 'login') {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }
}

// Auth event listeners
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);

        if (!currentUser.emailVerified) {
            showEmailVerification();
        } else {
            showSection('home');
            showNotification('Hoş geldiniz! 🎉', 'success');
        }
    } catch (error) {
        showNotification('Giriş hatası: ' + error.message, 'error');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;

    if (password !== confirmPassword) {
        showNotification('Şifreler eşleşmiyor!', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Şifre en az 6 karakter olmalıdır!', 'error');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        await sendEmailVerification();
        showEmailVerification();
    } catch (error) {
        showNotification('Kayıt hatası: ' + error.message, 'error');
    }
});

async function sendEmailVerification() {
    try {
        await currentUser.sendEmailVerification();
        showNotification('Doğrulama e-postası gönderildi!', 'success');
    } catch (error) {
        showNotification('E-posta gönderilemedi: ' + error.message, 'error');
    }
}

function showEmailVerification() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('email-verification').style.display = 'block';
}

function checkEmailVerification() {
    auth.currentUser.reload().then(() => {
        if (auth.currentUser.emailVerified) {
            showSection('home');
            showNotification('E-posta doğrulandı! 🎉', 'success');
        } else {
            showNotification('E-posta henüz doğrulanmadı. Lütfen e-postanızı kontrol edin.', 'warning');
        }
    });
}

function logout() {
    auth.signOut().then(() => {
        showSection('home');
        showNotification('Başarıyla çıkış yapıldı!', 'success');
        currentItems = [];
        currentListId = null;
    });
}

// Authentication check for protected actions
function checkAuthAndRedirect(targetSection) {
    if (!isFirebaseReady || !auth) {
        showNotification('Sistem yükleniyor, lütfen bekleyin...', 'warning');
        setTimeout(() => checkAuthAndRedirect(targetSection), 1000);
        return;
    }

    if (!currentUser) {
        showSection('auth');
        showNotification('Bu özelliği kullanmak için giriş yapmalısınız!', 'warning');
        return;
    }

    if (!currentUser.emailVerified) {
        showEmailVerification();
        showNotification('Devam etmek için e-posta adresinizi doğrulamalısınız!', 'warning');
        return;
    }

    if (targetSection === 'create-list') {
        showSection('list-type');
    } else {
        showSection(targetSection);
    }
}

// List type selection
function selectListType(type) {
    // Clear previous list data for new list creation
    currentItems = [];
    currentListId = null;
    currentListType = type;

    // Clear form inputs
    setTimeout(() => {
        if (document.getElementById('listName')) {
            document.getElementById('listName').value = '';
        }
        if (document.getElementById('listImage')) {
            document.getElementById('listImage').value = '';
        }
        if (document.getElementById('imagePreview')) {
            document.getElementById('imagePreview').innerHTML = '';
        }
        if (document.getElementById('qrSection')) {
            document.getElementById('qrSection').style.display = 'none';
        }
    }, 100);

    setupCreateListSection(type);
    showSection('create-list');
}

function setupCreateListSection(type) {
    const title = document.getElementById('createListTitle');
    const inputSection = document.getElementById('itemInputSection');

    switch (type) {
        case 'shopping':
            title.textContent = '🛒 Alışveriş Listesi Oluştur';
            inputSection.innerHTML = `
                <div class="item-input-row">
                    <input type="text" id="itemName" placeholder="Ürün adı" class="form-input">
                    <input type="text" id="itemQuantity" placeholder="Miktar" class="form-input">
                    <label for="itemImage" class="image-label-small">📷 
                        <input type="file" id="itemImage" accept="image/*" style="display:none;">
                    </label>
                    <button onclick="addItem()" class="add-btn">➕</button>
                </div>
            `;
            break;

        case 'todo':
            title.textContent = '✅ Yapılacaklar Listesi Oluştur';
            inputSection.innerHTML = `
                <div class="item-input-row">
                    <input type="text" id="itemName" placeholder="Görev" class="form-input">
                    <select id="itemPriority" class="form-input">
                        <option value="low">Düşük</option>
                        <option value="medium" selected>Orta</option>
                        <option value="high">Yüksek</option>
                    </select>
                    <label for="itemImage" class="image-label-small">📷 
                        <input type="file" id="itemImage" accept="image/*" style="display:none;">
                    </label>
                    <button onclick="addItem()" class="add-btn">➕</button>
                </div>
            `;
            break;

        case 'lab':
            title.textContent = '🧪 Laboratuvar Listesi Oluştur';
            inputSection.innerHTML = `
                <div class="item-input-row-lab">
                    <input type="text" id="itemName" placeholder="Malzeme adı" class="form-input">
                    <input type="number" id="itemQuantity" placeholder="Miktar" class="form-input">
                    <input type="number" id="itemValue" placeholder="Değer (₺)" step="0.01" class="form-input">
                    <label for="itemImage" class="image-label-small">📷 
                        <input type="file" id="itemImage" accept="image/*" style="display:none;">
                    </label>
                    <button onclick="addItem()" class="add-btn">➕</button>
                </div>
            `;
            break;
    }

    updateItemsList();
}

// List management functions
async function addItem() {
    const itemName = document.getElementById('itemName').value.trim();

    if (!itemName) {
        showNotification('Lütfen ürün/görev adı girin!', 'warning');
        return;
    }

    const item = {
        id: Date.now(),
        name: itemName,
        completed: false,
        type: currentListType,
        image: null
    };

    // Add type-specific properties
    if (currentListType === 'shopping') {
        item.quantity = document.getElementById('itemQuantity').value.trim() || '1';
    } else if (currentListType === 'todo') {
        item.priority = document.getElementById('itemPriority').value;
    } else if (currentListType === 'lab') {
        item.quantity = parseFloat(document.getElementById('itemQuantity').value) || 0;
        item.value = parseFloat(document.getElementById('itemValue').value) || 0;
    }

    // Handle item image
    const itemImageInput = document.getElementById('itemImage');
    if (itemImageInput && itemImageInput.files[0]) {
        try {
            item.image = await convertImageToBase64(itemImageInput.files[0]);
        } catch (error) {
            console.error('Resim yükleme hatası:', error);
        }
    }

    currentItems.push(item);
    clearInputs();
    updateItemsList();
}

function clearInputs() {
    document.getElementById('itemName').value = '';
    if (document.getElementById('itemQuantity')) {
        document.getElementById('itemQuantity').value = '';
    }
    if (document.getElementById('itemValue')) {
        document.getElementById('itemValue').value = '';
    }
    if (document.getElementById('itemImage')) {
        document.getElementById('itemImage').value = '';
    }
}

function removeItem(itemId) {
    currentItems = currentItems.filter(item => item.id !== itemId);
    updateItemsList();
}

function toggleItemCompletion(itemId) {
    const item = currentItems.find(item => item.id === itemId);
    if (item) {
        item.completed = !item.completed;
        updateItemsList();
    }
}

function updateItemsList() {
    const itemsList = document.getElementById('itemsList');
    if (!itemsList) return;

    itemsList.innerHTML = '';

    let totalValue = 0;

    currentItems.forEach(item => {
        const li = document.createElement('li');
        li.className = item.completed ? 'completed' : '';

        let content = '';
        let actions = `<button class="delete-btn" onclick="removeItem(${item.id})">🗑️</button>`;

        if (currentListType === 'shopping') {
            content = `
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                <div class="item-content">
                    <span>${item.name}</span>
                    <span>${item.quantity}</span>
                </div>
            `;
        } else if (currentListType === 'todo') {
            const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
            const checkboxTick = item.completed ? '☑️' : '☐';
            content = `
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                <div class="item-content">
                    <span>${checkboxTick} ${item.name}</span>
                    <span>${priorityEmoji} ${item.priority}</span>
                </div>
            `;
            actions = `
                <button class="complete-btn" onclick="toggleItemCompletion(${item.id})">
                    ${item.completed ? '↩️' : '✅'}
                </button>
                ${actions}
            `;
        } else if (currentListType === 'lab') {
            const itemTotal = item.quantity * item.value;
            totalValue += itemTotal;
            content = `
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                <div class="item-content-lab">
                    <span>${item.name}</span>
                    <span>${item.quantity}</span>
                    <span>₺${itemTotal.toFixed(2)}</span>
                </div>
            `;
        }

        li.innerHTML = content + `<div class="item-actions">${actions}</div>`;
        itemsList.appendChild(li);
    });

    // Show total for lab lists
    if (currentListType === 'lab' && currentItems.length > 0) {
        const totalLi = document.createElement('li');
        totalLi.style.background = 'var(--primary-color)';
        totalLi.style.color = 'white';
        totalLi.style.fontWeight = 'bold';
        totalLi.innerHTML = `
            <div class="item-content-lab">
                <span>TOPLAM</span>
                <span>-</span>
                <span>₺${totalValue.toFixed(2)}</span>
            </div>
        `;
        itemsList.appendChild(totalLi);
    }
}

async function saveList() {
    if (!currentUser) {
        showNotification('Giriş yapmalısınız!', 'error');
        return;
    }

    const listName = document.getElementById('listName').value.trim();

    if (!listName) {
        showNotification('Lütfen liste adı girin!', 'error');
        return;
    }

    if (currentItems.length === 0) {
        showNotification('Lütfen en az bir öğe ekleyin!', 'error');
        return;
    }

    try {
        // Check subscription limits
        if (userSubscription === 'free' && !currentListId) {
            const userLists = await getUserListCount();
            // Only check limit for new lists (not editing existing ones)
            if (userLists >= 1) {
                showNotification('Ücretsiz üyelikle sadece 1 liste oluşturabilirsiniz. Premium\'a geçin!', 'warning');
                showSection('subscription');
                return;
            }
        }

        let savedListId = currentListId;

        const listData = {
            name: listName,
            items: currentItems,
            type: currentListType,
            createdAt: currentListId ? null : firebase.firestore.Timestamp.now(),
            updatedAt: firebase.firestore.Timestamp.now(),
            userId: currentUser.uid,
            image: document.getElementById('listImage').files[0] ? await convertImageToBase64(document.getElementById('listImage').files[0]) : null
        };

        if (currentListId) {
            // Update existing list - preserve createdAt
            const existingDoc = await db.collection('lists').doc(currentListId).get();
            if (existingDoc.exists) {
                listData.createdAt = existingDoc.data().createdAt;
            }
            await db.collection('lists').doc(currentListId).update(listData);
        } else {
            // Create new list with proper ID
            listData.createdAt = firebase.firestore.Timestamp.now();
            const docRef = await db.collection('lists').add(listData);
            savedListId = docRef.id;
            currentListId = savedListId;

            // Update the document with its own ID for easier reference
            await db.collection('lists').doc(savedListId).update({
                documentId: savedListId
            });
        }

        // Generate QR Code
        generateQRCode(savedListId);
        showNotification('Liste başarıyla kaydedildi! 🎉', 'success');

    } catch (error) {
        console.error('Kayıt hatası:', error);
        showNotification('Liste kaydedilirken hata oluştu: ' + error.message, 'error');
    }
}

async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function getUserListCount() {
    try {
        if (!currentUser) return 0;

        // Basitleştirilmiş manuel sayım
        let userListCount = 0;

        try {
            const allSnapshot = await db.collection('lists').get();
            allSnapshot.forEach(doc => {
                const data = doc.data();
                if (data && data.userId === currentUser.uid) {
                    userListCount++;
                }
            });
        } catch (error) {
            console.log('Liste sayımı başarısız:', error);
            return 0;
        }

        return userListCount;
    } catch (error) {
        console.error('Liste sayısı hesaplanamadı:', error);
        return 0;
    }
}

function generateQRCode(listId) {
    const qrSection = document.getElementById('qrSection');
    const qrcode = document.getElementById('qrcode');

    if (!qrSection || !qrcode) {
        console.error('QR elements not found');
        showNotification('QR kod elemanları bulunamadı!', 'error');
        return;
    }

    // Clear previous QR code
    qrcode.innerHTML = '';

    // Generate QR code with list URL
    const listUrl = `${window.location.origin}${window.location.pathname}?list=${listId}`;

    // Force show the section first
    qrSection.style.display = 'block';

    showNotification('QR kod oluşturuluyor...', 'info');

    // Use QRious library which should be more reliable
    if (typeof QRious !== 'undefined') {
        console.log('QRious library found, generating QR code...');
        generateQRCodeWithQRious(qrcode, listUrl);
        return;
    }

    // Fallback: try to load QRious dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
    script.onload = () => {
        console.log('QRious loaded dynamically');
        generateQRCodeWithQRious(qrcode, listUrl);
    };
    script.onerror = () => {
        console.log('Failed to load QRious, using fallback link');
        createFallbackLink(qrcode, listUrl);
    };
    document.head.appendChild(script);
}

function createFallbackLink(qrcode, listUrl) {
    qrcode.innerHTML = `
        <div style="padding: 20px; background: var(--hover-color); border: 2px dashed var(--primary-color); border-radius: 10px; text-align: center;">
            <h4 style="color: var(--primary-color); margin-bottom: 15px;">📱 Liste Paylaşım Linki</h4>
            <p style="margin-bottom: 15px; color: var(--text-color);">QR kod oluşturulamadı, direkt linki kullanabilirsiniz:</p>
            <div style="background: var(--surface-color); padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid var(--border-color);">
                <a href="${listUrl}" target="_blank" style="word-break: break-all; color: var(--primary-color); font-weight: bold;">${listUrl}</a>
            </div>
            <button onclick="copyToClipboard('${listUrl}')" style="background: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">📋 Linki Kopyala</button>
        </div>
    `;
    showNotification('QR kod oluşturulamadı, paylaşım linki hazır! 🔗', 'warning');
}

function generateQRCodeWithQRious(qrcode, listUrl) {
    try {
        console.log('Generating QR code for URL:', listUrl);

        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 100%;';
        qrcode.innerHTML = '';
        qrcode.appendChild(canvas);

        // Generate QR code using QRious
        const qr = new QRious({
            element: canvas,
            value: listUrl,
            size: 256,
            foreground: '#007bff',
            background: '#ffffff',
            level: 'M'
        });

        // Success - add additional elements
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'margin-top: 15px; text-align: center;';
        infoDiv.innerHTML = `
            <p style="margin: 10px 0; color: var(--text-color); font-size: 14px;">
                📱 QR kodu taratarak listeyi görüntüleyebilirsiniz
            </p>
            <button onclick="copyToClipboard('${listUrl}')" 
                    style="background: var(--primary-color); color: white; border: none; 
                           padding: 10px 20px; border-radius: 8px; cursor: pointer; 
                           font-size: 14px; margin: 5px;">
                📋 Linki Kopyala
            </button>
            <button onclick="downloadQRCode('${listUrl}')" 
                    style="background: var(--success-color, #28a745); color: white; border: none; 
                           padding: 10px 20px; border-radius: 8px; cursor: pointer; 
                           font-size: 14px; margin: 5px;">
                💾 QR İndir
            </button>
        `;
        qrcode.appendChild(infoDiv);

        showNotification('QR kod başarıyla oluşturuldu! 📱', 'success');
        console.log('QR code generated successfully');

    } catch (error) {
        console.error('QR kod oluşturma hatası:', error);
        createFallbackLink(qrcode, listUrl);
    }
}

// Add QR code download function
function downloadQRCode(listUrl) {
    try {
        const canvas = document.querySelector('#qrcode canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'qr-kod.png';
            link.href = canvas.toDataURL();
            link.click();
            showNotification('QR kod indirildi! 💾', 'success');
        } else {
            showNotification('QR kod bulunamadı!', 'error');
        }
    } catch (error) {
        console.error('QR kod indirme hatası:', error);
        showNotification('QR kod indirilemedi!', 'error');
    }
}

// Add copy to clipboard function
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link panoya kopyalandı! 📋', 'success');
        }).catch(err => {
            console.error('Kopyalama hatası:', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Link panoya kopyalandı! 📋', 'success');
        } else {
            showNotification('Kopyalama başarısız!', 'error');
        }
    } catch (err) {
        console.error('Fallback kopyalama hatası:', err);
        showNotification('Kopyalama desteklenmiyor!', 'error');
    }

    document.body.removeChild(textArea);
}

function clearList() {
    if (confirm('Listeyi temizlemek istediğinizden emin misiniz?')) {
        currentItems = [];
        document.getElementById('listName').value = '';
        clearInputs();
        updateItemsList();
        document.getElementById('qrSection').style.display = 'none';
        currentListId = null;

        // Clear image
        document.getElementById('listImage').value = '';
        document.getElementById('imagePreview').innerHTML = '';
    }
}

async function loadUserLists() {
    const listsContainer = document.getElementById('listsContainer');

    if (!currentUser) {
        listsContainer.innerHTML = '<p>Lütfen giriş yapın.</p>';
        return;
    }

    listsContainer.innerHTML = '<div class="loading">Listeler yükleniyor...</div>';

    try {
        let userLists = [];

        // Firebase hazır değilse bekle
        if (!isFirebaseReady || !db) {
            setTimeout(loadUserLists, 1000);
            return;
        }

        // Tüm listeleri al ve istemci tarafında filtrele
        const snapshot = await db.collection('lists').get();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data && data.userId === currentUser.uid) {
                userLists.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        // Güncelleme tarihine göre sırala
        userLists.sort((a, b) => {
            const aTime = a.updatedAt ? a.updatedAt.seconds : 0;
            const bTime = b.updatedAt ? b.updatedAt.seconds : 0;
            return bTime - aTime;
        });

        displayLists(userLists);

    } catch (error) {
        console.error('Liste yükleme hatası:', error);
        listsContainer.innerHTML = '<p>Listeler yüklenirken hata oluştu. Lütfen sayfayı yenileyin.</p>';
    }
}

function filterLists(type) {
    currentFilter = type;

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    loadUserLists();
}

function displayLists(lists) {
    const listsContainer = document.getElementById('listsContainer');

    // Filter lists
    const filteredLists = currentFilter === 'all' ? lists : lists.filter(list => list.type === currentFilter);

    if (filteredLists.length === 0) {
        listsContainer.innerHTML = '<p>Bu kategoride liste bulunamadı.</p>';
        return;
    }

    listsContainer.innerHTML = '';

    filteredLists.forEach(list => {
        const listCard = document.createElement('div');
        listCard.className = 'list-card';

        const typeEmoji = list.type === 'shopping' ? '🛒' : list.type === 'todo' ? '✅' : '🧪';
        const typeText = list.type === 'shopping' ? 'Alışveriş' : list.type === 'todo' ? 'Yapılacaklar' : 'Laboratuvar';

        listCard.innerHTML = `
            ${list.image ? `<img src="${list.image}" alt="${list.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">` : ''}
            <h3>${typeEmoji} ${list.name}</h3>
            <div class="list-meta">
                <span>${typeText}</span>
                <span>${list.items.length} öğe</span>
            </div>
            <p><small>Güncelleme: ${new Date(list.updatedAt.seconds * 1000).toLocaleDateString('tr-TR')}</small></p>
            <div class="list-actions">
                <button onclick="event.stopPropagation(); viewList('${list.id}')" class="view-btn" title="Görüntüle">👁️</button>
                <button onclick="event.stopPropagation(); editList('${list.id}')" class="edit-btn" title="Düzenle">✏️</button>
                <button onclick="event.stopPropagation(); deleteList('${list.id}')" class="delete-btn" title="Sil">🗑️</button>
            </div>
        `;

        listCard.onclick = () => viewList(list);
        listsContainer.appendChild(listCard);
    });
}

function viewList(list) {
    document.getElementById('viewListTitle').textContent = `${list.type === 'shopping' ? '🛒' : list.type === 'todo' ? '✅' : '🧪'} ${list.name}`;

    const content = document.getElementById('viewListContent');
    let itemsHtml = '';
    let totalValue = 0;

    if (list.image) {
        itemsHtml += `<img src="${list.image}" alt="${list.name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 2rem;">`;
    }

    itemsHtml += '<ul class="items-list">';

    list.items.forEach(item => {
        const completedClass = item.completed ? 'completed' : '';

        if (list.type === 'shopping') {
            itemsHtml += `<li class="${completedClass}">
                <div class="item-content">
                    <span>${item.name}</span>
                    <span>${item.quantity}</span>
                </div>
            </li>`;
        } else if (list.type === 'todo') {
            const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
            const checkboxTick = item.completed ? '☑️' : '☐';
            itemsHtml += `<li class="${completedClass}">
                <div class="item-content">
                    <span>${checkboxTick} ${item.name}</span>
                    <span>${priorityEmoji} ${item.priority}</span>
                </div>
            </li>`;
        } else if (list.type === 'lab') {
            const itemTotal = item.quantity * item.value;
            totalValue += itemTotal;
            itemsHtml += `<li class="${completedClass}">
                <div class="item-content-lab">
                    <span>${item.name}</span>
                    <span>${item.quantity}</span>
                    <span>₺${itemTotal.toFixed(2)}</span>
                </div>
            </li>`;
        }
    });

    if (list.type === 'lab') {
        itemsHtml += `<li style="background: var(--primary-color); color: white; font-weight: bold;">
            <div class="item-content-lab">
                <span>TOPLAM</span>
                <span>-</span>
                <span>₺${totalValue.toFixed(2)}</span>
            </div>
        </li>`;
    }

    itemsHtml += '</ul>';

    content.innerHTML = `
        ${itemsHtml}
        <div class="form-actions">
            <button onclick="editList('${list.id}')" class="save-btn">✏️ Düzenle</button>
            <button onclick="deleteList('${list.id}')" class="clear-btn">🗑️ Sil</button>
            <button onclick="generateQRCode('${list.id}')" class="add-btn">📱 QR Kod</button>
        </div>
        <div id="qrSection" class="qr-section" style="display:none;">
            <h3>QR Kod</h3>
            <div id="qrcode"></div>
            <p>Bu QR kodu taratarak listeyi görüntüleyebilirsiniz</p>
        </div>
    `;

    showSection('view-list');
}

async function deleteList(listId) {
    // Enhanced confirmation dialog
    const confirmed = confirm(`Bu listeyi kalıcı olarak silmek istediğinizden emin misiniz?

⚠️ Bu işlem geri alınamaz!
📋 Liste ve tüm içeriği tamamen silinecek.

Silmek için "Tamam"a, iptal etmek için "İptal"e basın.`);

    if (!confirmed) {
        return;
    }

    try {
        // Show loading with progress
        showNotification('Liste siliniyor... ⏳', 'info');

        // Check if user is authenticated
        if (!currentUser) {
            showNotification('Bu işlem için giriş yapmalısınız!', 'error');
            showSection('auth');
            return;
        }

        // Verify Firebase is ready
        if (!isFirebaseReady || !db) {
            showNotification('Veritabanı bağlantısı hazır değil, lütfen bekleyin...', 'warning');
            setTimeout(() => deleteList(listId), 2000);
            return;
        }

        // First verify the list exists and belongs to user
        const listDoc = await db.collection('lists').doc(listId).get();

        if (!listDoc.exists) {
            showNotification('Liste bulunamadı veya zaten silinmiş!', 'warning');
            showSection('my-lists');
            loadUserLists();
            return;
        }

        const listData = listDoc.data();
        if (listData.userId !== currentUser.uid) {
            showNotification('Bu listeyi silme yetkiniz yok!', 'error');
            return;
        }

        // Delete the document
        await db.collection('lists').doc(listId).delete();

        // Clear current list if it's the one being deleted
        if (currentListId === listId) {
            currentListId = null;
            currentItems = [];

            // Clear form
            const listNameInput = document.getElementById('listName');
            const listImageInput = document.getElementById('listImage');
            const imagePreview = document.getElementById('imagePreview');
            const itemsList = document.getElementById('itemsList');
            const qrSection = document.getElementById('qrSection');

            if (listNameInput) listNameInput.value = '';
            if (listImageInput) listImageInput.value = '';
            if (imagePreview) imagePreview.innerHTML = '';
            if (itemsList) itemsList.innerHTML = '';
            if (qrSection) qrSection.style.display = 'none';

            clearInputs();
        }

        showNotification(`Liste "${listData.name}" başarıyla silindi! 🗑️`, 'success');

        // Update UI immediately then reload for consistency
        showSection('my-lists');
        setTimeout(() => {
            loadUserLists();
        }, 500);

    } catch (error) {
        console.error('Liste silme hatası:', error);

        let errorMessage = 'Liste silinirken bilinmeyen bir hata oluştu.';

        switch (error.code) {
            case 'permission-denied':
                errorMessage = 'Bu listeyi silme yetkiniz yok! 🚫';
                break;
            case 'not-found':
                errorMessage = 'Liste bulunamadı, zaten silinmiş olabilir.';
                showSection('my-lists');
                loadUserLists();
                break;
            case 'unavailable':
                errorMessage = 'Veritabanı şu anda erişilemez durumda. Lütfen daha sonra tekrar deneyin.';
                break;
            case 'cancelled':
                errorMessage = 'İşlem iptal edildi.';
                break;
            case 'deadline-exceeded':
                errorMessage = 'İşlem zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.';
                break;
            default:
                errorMessage = `Hata: ${error.message}`;
                break;
        }

        showNotification(errorMessage, 'error');
    }
}

async function editList(listId) {
    try {
        showNotification('Liste yükleniyor...', 'info');

        const doc = await db.collection('lists').doc(listId).get();

        if (doc.exists) {
            const list = { id: doc.id, ...doc.data() };

            // Clear previous data
            currentItems = [...list.items]; // Create a copy
            currentListId = list.id;
            currentListType = list.type;

            // Fill form fields
            document.getElementById('listName').value = list.name;

            // Clear image preview and file input
            document.getElementById('listImage').value = '';
            const imagePreview = document.getElementById('imagePreview');
            if (list.image) {
                imagePreview.innerHTML = `<img src="${list.image}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 10px;">`;
            } else {
                imagePreview.innerHTML = '';
            }

            // Setup the section for this list type
            setupCreateListSection(list.type);

            // Update the title to show it's editing
            document.getElementById('createListTitle').textContent = `✏️ ${list.type === 'shopping' ? 'Alışveriş' : list.type === 'todo' ? 'Yapılacaklar' : 'Laboratuvar'} Listesi Düzenle`;

            showSection('create-list');
            showNotification('Liste düzenleme modunda açıldı! ✏️', 'success');
        } else {
            showNotification('Liste bulunamadı!', 'error');
        }
    } catch (error) {
        console.error('Liste yükleme hatası:', error);
        showNotification('Liste yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Subscription management
async function loadUserSubscription() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            const userData = doc.data();
            userSubscription = userData.subscription || 'free';
        }
    } catch (error) {
        console.error('Üyelik bilgisi yüklenemedi:', error);
    }
}

function selectPlan(planType) {
    if (planType === 'monthly') {
        showNotification('Aylık Premium plan için ödeme sayfasına yönlendiriliyorsunuz...', 'info');
        // Implement payment integration here
    } else if (planType === 'yearly') {
        showNotification('Yıllık Premium plan için ödeme sayfasına yönlendiriliyorsunuz...', 'info');
        // Implement payment integration here
    }
}

// Account management
function updateAccountInfo() {
    if (!currentUser) {
        showNotification('Giriş yapmalısınız!', 'warning');
        showSection('auth');
        return;
    }

    try {
        const profileEmailElement = document.getElementById('profileEmail');
        const listCountElement = document.getElementById('listCount');
        const membershipTypeElement = document.getElementById('membershipType');

        if (profileEmailElement) {
            profileEmailElement.textContent = currentUser.email || 'Bilinmiyor';
        }

        if (membershipTypeElement) {
            membershipTypeElement.textContent = userSubscription === 'free' ? 'Ücretsiz' : 'Premium';
        }

        if (listCountElement) {
            getUserListCount().then(count => {
                listCountElement.textContent = count.toString();
            }).catch(error => {
                console.error('Liste sayısı alınamadı:', error);
                listCountElement.textContent = '0';
            });
        }
    } catch (error) {
        console.error('Hesap bilgileri güncellenirken hata:', error);
        showNotification('Hesap bilgileri yüklenirken hata oluştu!', 'error');
    }
}

function changePassword() {
    const newPassword = prompt('Yeni şifrenizi girin (min. 6 karakter):');
    if (newPassword && newPassword.length >= 6) {
        currentUser.updatePassword(newPassword).then(() => {
            showNotification('Şifre başarıyla değiştirildi!', 'success');
        }).catch((error) => {
            showNotification('Şifre değiştirilemedi: ' + error.message, 'error');
        });
    } else if (newPassword) {
        showNotification('Şifre en az 6 karakter olmalıdır!', 'error');
    }
}

// Contact form
function prefillContactForm() {
    if (currentUser) {
        const emailField = document.getElementById('contactEmail');
        const nameField = document.getElementById('contactName');
        
        if (emailField) emailField.value = currentUser.email;
        if (nameField) nameField.value = currentUser.displayName || '';
    }
}

// Ana sayfa iletişim formu için otomatik doldurma
function prefillContactFormHome() {
    if (currentUser) {
        const form = document.getElementById('contactFormHome');
        if (form) {
            const emailField = form.querySelector('input[type="email"]');
            const nameField = form.querySelector('input[type="text"]');
            
            if (emailField) emailField.value = currentUser.email;
            if (nameField) nameField.value = currentUser.displayName || '';
        }
    }
}

document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    try {
        if (!isEmailJSReady || typeof emailjs === 'undefined') {
            throw new Error('EmailJS not ready');
        }

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            from_name: name,
            from_email: email,
            subject: subject,
            message: message
        });

        showNotification('Mesajınız gönderildi! 📧', 'success');
        document.getElementById('contactForm').reset();

        if (currentUser) {
            prefillContactForm();
        }
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        showNotification('Mesaj gönderilemedi. E-posta: ebunyamin0@gmail.com adresine yazabilirsiniz.', 'warning');
    }
});

// Image upload preview
document.getElementById('listImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 10px;">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
});

// Notification system
function showNotification(message, type = 'info') {
    // Mevcut bildirimleri temizle
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: inherit; cursor: pointer;">✕</button>
    `;

    // Stil ekle
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        word-wrap: break-word;
        animation: slideIn 0.3s ease-out;
    `;

    // Tip'e göre renk
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);

    // 5 saniye sonra otomatik kaldır
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// CSS animasyonları ekle
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initializeEmailJS();
    initializeContactForms();
    loadUserProfile();
    hideClosedAds(); // Kapatılan reklamları gizle

    // Recover current section from localStorage
    const savedSection = localStorage.getItem('currentSection');
    if (savedSection && savedSection !== 'home') {
        showSection(savedSection);
    }
});

// Initialize contact forms
function initializeContactForms() {
    // Ana sayfa iletişim formu
    const contactFormHome = document.getElementById('contactFormHome');
    if (contactFormHome) {
        contactFormHome.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = e.target.querySelector('input[type="text"]').value;
            const email = e.target.querySelector('input[type="email"]').value;
            const subject = e.target.querySelector('select').value;
            const message = e.target.querySelector('textarea').value;

            try {
                if (!isEmailJSReady || typeof emailjs === 'undefined') {
                    throw new Error('EmailJS not ready');
                }

                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                    from_name: name,
                    from_email: email,
                    subject: subject,
                    message: message
                });

                showNotification('Mesajınız gönderildi! 📧', 'success');
                contactFormHome.reset();

                // Otomatik doldur
                if (currentUser) {
                    prefillContactFormHome();
                }
            } catch (error) {
                console.error('E-posta gönderme hatası:', error);
                showNotification('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.', 'error');
            }
        });
    }

    // İletişim sayfası formu
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const subject = document.getElementById('contactSubject').value;
            const message = document.getElementById('contactMessage').value;

            try {
                if (!isEmailJSReady || typeof emailjs === 'undefined') {
                    throw new Error('EmailJS not ready');
                }

                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                    from_name: name,
                    from_email: email,
                    subject: subject,
                    message: message
                });

                showNotification('Mesajınız gönderildi! 📧', 'success');
                document.getElementById('contactForm').reset();

                if (currentUser) {
                    prefillContactForm();
                }
            } catch (error) {
                console.error('E-posta gönderme hatası:', error);
                showNotification('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.', 'error');
            }
        });
    }
}

// Load user profile
function loadUserProfile() {
    if (currentUser) {
        prefillContactForm();
    }
}

// Reklam kapatma fonksiyonu
function closeAd(adId) {
    const adElement = document.getElementById(adId);
    if (adElement) {
        adElement.style.display = 'none';
        
        // LocalStorage'da kapatılan reklamları sakla
        const closedAds = JSON.parse(localStorage.getItem('closedAds') || '[]');
        if (!closedAds.includes(adId)) {
            closedAds.push(adId);
            localStorage.setItem('closedAds', JSON.stringify(closedAds));
        }
        
        showNotification('Reklam gizlendi! 👍', 'success');
    }
}

// Sayfa yüklendiğinde kapatılan reklamları gizle
function hideClosedAds() {
    const closedAds = JSON.parse(localStorage.getItem('closedAds') || '[]');
    closedAds.forEach(adId => {
        const adElement = document.getElementById(adId);
        if (adElement) {
            adElement.style.display = 'none';
        }
    });
}

// Event listeners
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.id === 'itemName') {
        addItem();
    }
});

// Check for shared list on page load
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedListId = urlParams.get('list');

    if (sharedListId) {
        loadSharedList(sharedListId);
    }
});

async function loadSharedList(listId) {
    try {
        showNotification('Paylaşılan liste yükleniyor...', 'info');

        // Firebase hazır olana kadar bekle
        if (!isFirebaseReady || !db) {
            setTimeout(() => loadSharedList(listId), 1000);
            return;
        }

        const doc = await db.collection('lists').doc(listId).get();

        if (doc.exists) {
            const list = { id: doc.id, ...doc.data() };

            // Paylaşılan liste görünümüne git
            document.getElementById('viewListTitle').textContent = `${list.type === 'shopping' ? '🛒' : list.type === 'todo' ? '✅' : '🧪'} ${list.name}`;

            const content = document.getElementById('viewListContent');
            let itemsHtml = '';
            let totalValue = 0;

            if (list.image) {
                itemsHtml += `<img src="${list.image}" alt="${list.name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 2rem;">`;
            }

            itemsHtml += '<ul class="items-list">';

            list.items.forEach(item => {
                const completedClass = item.completed ? 'completed' : '';

                if (list.type === 'shopping') {
                    itemsHtml += `<li class="${completedClass}">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                        <div class="item-content">
                            <span>${item.name}</span>
                            <span>${item.quantity}</span>
                        </div>
                    </li>`;
                } else if (list.type === 'todo') {
                    const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
                    const checkboxTick = item.completed ? '☑️' : '☐';
                    itemsHtml += `<li class="${completedClass}">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                        <div class="item-content">
                            <span>${checkboxTick} ${item.name}</span>
                            <span>${priorityEmoji} ${item.priority}</span>
                        </div>
                    </li>`;
                } else if (list.type === 'lab') {
                    const itemTotal = item.quantity * item.value;
                    totalValue += itemTotal;
                    itemsHtml += `<li class="${completedClass}">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                        <div class="item-content-lab">
                            <span>${item.name}</span>
                            <span>${item.quantity}</span>
                            <span>₺${itemTotal.toFixed(2)}</span>
                        </div>
                    </li>`;
                }
            });

            if (list.type === 'lab') {
                itemsHtml += `<li style="background: var(--primary-color); color: white; font-weight: bold;">
                    <div class="item-content-lab">
                        <span>TOPLAM</span>
                        <span>-</span>
                        <span>₺${totalValue.toFixed(2)}</span>
                    </div>
                </li>`;
            }

            itemsHtml += '</ul>';

            content.innerHTML = `
                <div style="margin-bottom: 2rem; padding: 1rem; background: var(--accent-color); border-radius: 10px; text-align: center;">
                    <h3>📱 Paylaşılan Liste</h3>
                    <p>Bu liste sizinle paylaşıldı. Kendi listelerinizi oluşturmak için <a href="#" onclick="showSection('auth')" style="color: var(--primary-color); font-weight: bold;">giriş yapın</a>.</p>
                </div>
                ${itemsHtml}
                <div class="form-actions">
                    <button onclick="showSection('home')" class="save-btn">🏠 Ana Sayfa</button>
                    <button onclick="showSection('auth')" class="add-btn">🔐 Giriş Yap</button>
                </div>
            `;

            showSection('view-list');
            showNotification('Paylaşılan liste başarıyla yüklendi! 📋', 'success');

        } else {
            showNotification('Paylaşılan liste bulunamadı!', 'error');
            showSection('home');
        }
    } catch (error) {
        console.error('Paylaşılan liste yükleme hatası:', error);
        showNotification('Liste yüklenirken hata oluştu!', 'error');
        showSection('home');
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for all scripts to load
    setTimeout(() => {
        initializeTheme();
        initializeFirebase();
        initializeEmailJS();
        showSection('home');
        updateItemsList();

        // Add CSS for notifications
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }, 500);
});