import * as api from './api.js';
import * as state from './state.js';
import * as ui from './ui.js';

// PERFORMANCE: Infinite scroll funksiyasi
let infiniteScrollObserver = null;

async function loadMoreProducts() {
    const pagination = state.getProductsPagination();
    
    // Agar yuklanmoqda bo'lsa yoki boshqa mahsulotlar yo'q bo'lsa, to'xtatish
    if (pagination.isLoading || !pagination.hasMore) {
        return;
    }
    
    // Loading holatini belgilash
    state.setProductsLoading(true);
    ui.showProductsLoading();
    
    try {
        const selectedCat = state.getSelectedCategory();
        const productsData = await api.getProducts(selectedCat, 20, pagination.currentOffset);
        
        // PERFORMANCE: Mavjud mahsulotlarga qo'shish (append=true)
        state.setProducts(productsData, true);
        ui.renderProducts(true); // append=true
        
        // Event listenerlarni qayta qo'shish (yangi mahsulotlar uchun)
        attachPageEventListeners('home');
    } catch (error) {
        console.error('Error loading more products:', error);
        // Loading indicator'ni olib tashlash
        const loader = document.getElementById('products-loading');
        if (loader) loader.remove();
    } finally {
        state.setProductsLoading(false);
    }
}

function setupInfiniteScroll() {
    // Eski observer'ni tozalash
    if (infiniteScrollObserver) {
        infiniteScrollObserver.disconnect();
    }
    
    // PERFORMANCE: Intersection Observer sozlash
    infiniteScrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Agar loading indicator ko'rinadigan bo'lsa va yuklanmagan bo'lsa
            if (entry.isIntersecting) {
                const pagination = state.getProductsPagination();
                if (pagination.hasMore && !pagination.isLoading) {
                    loadMoreProducts();
                }
            }
        });
    }, {
        root: null, // viewport
        rootMargin: '200px', // 200px oldindan yuklash
        threshold: 0.1
    });
    
    // Observer'ni qo'shish (keyinroq loading indicator ko'rinadi)
    setTimeout(() => {
        const loadingIndicator = document.getElementById('products-loading');
        if (loadingIndicator) {
            infiniteScrollObserver.observe(loadingIndicator);
        }
    }, 100);
}

const WebApp = window.Telegram.WebApp;
let pendingAction = null;

// Safe area padding ni yangilash
function updateSafeAreaPadding() {
    const safeArea = WebApp.safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
    const contentSafeArea = WebApp.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
    
    // CSS custom properties orqali qiymatlarni uzatish
    document.documentElement.style.setProperty('--safe-area-bottom', `${safeArea.bottom}px`);
    document.documentElement.style.setProperty('--content-safe-area-bottom', `${contentSafeArea.bottom}px`);
    document.documentElement.style.setProperty('--total-safe-area-bottom', `${Math.max(safeArea.bottom, contentSafeArea.bottom)}px`);
    
    console.log('Safe Area:', safeArea, 'Content Safe Area:', contentSafeArea);
}

// Telefon raqamini formatlash (00 000 00 00)
function formatPhoneNumber(value) {
    // Faqat raqamlarni olish
    const digits = value.replace(/\D/g, '').slice(0, 9);
    
    // Format: 00 000 00 00
    let formatted = '';
    if (digits.length > 0) {
        formatted = digits.slice(0, 2);
    }
    if (digits.length > 2) {
        formatted += ' ' + digits.slice(2, 5);
    }
    if (digits.length > 5) {
        formatted += ' ' + digits.slice(5, 7);
    }
    if (digits.length > 7) {
        formatted += ' ' + digits.slice(7, 9);
    }
    
    return formatted;
}

// Telefon input event handler
function handlePhoneInput(event) {
    const input = event.target;
    const cursorPos = input.selectionStart;
    const oldValue = input.value;
    const oldLength = oldValue.length;
    
    // Formatlash
    const newValue = formatPhoneNumber(input.value);
    input.value = newValue;
    
    // Cursor pozitsiyasini saqlash
    const newLength = newValue.length;
    const diff = newLength - oldLength;
    let newCursorPos = cursorPos + diff;
    
    // Cursor pozitsiyasini to'g'rilash
    if (newCursorPos < 0) newCursorPos = 0;
    if (newCursorPos > newLength) newCursorPos = newLength;
    
    input.setSelectionRange(newCursorPos, newCursorPos);
}

// Navbar va layoutni ekranga mahkamlash
function fixLayoutToScreen() {
    const navbar = document.getElementById('navbar');
    const main = document.getElementById('main');
    const loading = document.getElementById('loading');
    
    if (!navbar) return;
    
    const screenHeight = window.innerHeight;
    const navbarHeight = navbar.offsetHeight;
    const topBarHeight = 29; // Qora lenta
    
    // Qurilma navigatsiyasi uchun safe area (Telegram API dan)
    const safeArea = WebApp.safeAreaInset || { bottom: 0 };
    const contentSafeArea = WebApp.contentSafeAreaInset || { bottom: 0 };
    const safeAreaBottom = Math.max(safeArea.bottom, contentSafeArea.bottom);
    
    // Debug - qiymatlarni ko'rish
    console.log('fixLayoutToScreen:', {
        screenHeight,
        navbarHeight,
        safeAreaBottom,
        safeArea: safeArea.bottom,
        contentSafeArea: contentSafeArea.bottom
    });
    
    // Navbar pozitsiyasi - qurilma navbaridan yuqorida (agar bor bo'lsa)
    const navbarTop = screenHeight - navbarHeight - safeAreaBottom;
    navbar.style.bottom = 'auto';
    navbar.style.top = `${navbarTop}px`;
    
    // Content balandligi - qora lenta va navbar orasida
    const contentHeight = navbarTop - topBarHeight;
    if (main) main.style.height = `${contentHeight}px`;
    if (loading) loading.style.height = `${contentHeight}px`;
    
    // Body padding kerak emas
    document.body.style.paddingBottom = '0';
}

// Telefon inputlariga event listener qo'shish
function attachPhoneFormatting() {
    const phoneInputs = document.querySelectorAll('#phone, #regPhone');
    phoneInputs.forEach(input => {
        if (input && !input.dataset.formatted) {
            input.addEventListener('input', handlePhoneInput);
            input.dataset.formatted = 'true';
            // Mavjud qiymatni formatlash
            if (input.value) {
                input.value = formatPhoneNumber(input.value);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!WebApp.initData) {
        ui.showLoading(ui.t('error_telegram'));
        console.error("Telegram.WebApp.initData is not available.");
        return;
    }
    state.setInitData(WebApp.initData);
    WebApp.ready();
    
    // Fullscreen rejimini yoqish
    WebApp.expand();
    if (WebApp.requestFullscreen) {
        WebApp.requestFullscreen();
    }
    
    // Safe area o'zgarishlarini kuzatish
    if (WebApp.onEvent) {
        WebApp.onEvent('safeAreaChanged', updateSafeAreaPadding);
        WebApp.onEvent('contentSafeAreaChanged', updateSafeAreaPadding);
    }
    
    // Dastlabki safe area qiymatlarini qo'llash
    updateSafeAreaPadding();
    
    // Fon rangini qora qilish (qora lenta bilan mos)
    if (WebApp.setBackgroundColor) {
        WebApp.setBackgroundColor('#000000');
    }
    
    // Orientatsiya o'zgarganda layoutni yangilash
    window.addEventListener('orientationchange', () => {
        setTimeout(fixLayoutToScreen, 100);
    });
    
    initializeApp();
});

async function initializeApp() {
    ui.showLoading();
    try {
        // O'ZGARTIRILDI: Foydalanuvchini tekshirish uchun yangi funksiya chaqiriladi
        const validationResult = await api.validateUser();

        if (validationResult.status === 'existing_user') {
            // Foydalanuvchi mavjud, ma'lumotlarini state'ga o'rnatamiz
            state.setUser(validationResult.user);
        } else if (validationResult.status === 'guest') {
            // Foydalanuvchi mehmon, state'ni tozalab, telegram ma'lumotlarini saqlaymiz
            state.setUser(null);
            state.setGuestTelegramUser(validationResult.telegramUser);
            console.log("User is a guest. Telegram data stored for registration form.");
        }

    } catch (error) {
        // Har qanday xatolik yuz bersa, xavfsizlik uchun mehmon rejimiga o'tamiz
        console.error("An error occurred during user validation:", error.message, "Status:", error.status);
        WebApp.showAlert(ui.t('error_server'));
        state.setUser(null);
        // Agar telegramUser ma'lumoti bo'lsa, uni saqlab qo'yamiz
        if (error.data && error.data.telegramUser) {
            state.setGuestTelegramUser(error.data.telegramUser);
        }
    }

    // Autentifikatsiya natijasidan qat'iy nazar, umumiy ma'lumotlarni yuklaymiz
    try {
        await loadInitialData();
        navigateTo('home');
    } catch (err) {
        console.error("Initialization error:", err);
        ui.showLoading(ui.t('error_server'));
        WebApp.showAlert(err.message || ui.t('error_server'));
    } finally {
        ui.hideLoading();
    }
}


async function loadInitialData() {
    try {
        // PERFORMANCE: Pagination bilan mahsulotlarni yuklash (boshlang'ich: limit=20, offset=0)
        const selectedCat = state.getSelectedCategory();
        const [productsData, banners] = await Promise.all([
            api.getProducts(selectedCat, 20, 0), // PERFORMANCE: Kategoriya filtri bilan, pagination bilan
            api.getBanners()
        ]);

        state.setProducts(productsData, false); // PERFORMANCE: Yangi yuklash (append=false)
        state.setBanners(banners);
        
        // Kategoriyalarni alohida yuklash (xato bo'lsa, davom etish)
        try {
            const categories = await api.getCategories();
            state.setCategories(categories);
        } catch (catError) {
            console.warn('Categories not loaded:', catError);
            state.setCategories([]); // Bo'sh array
        }

        if (state.isRegistered()) {
            try {
                const [orders, cartData] = await Promise.all([
                    api.getOrders(),
                    api.getCartItems()
                ]);
                state.setOrders(orders);
                state.setCartItems(cartData.items);
                state.setCartSummary(cartData.summary);
            } catch (orderError) {
                console.error("Could not load user data:", orderError);
            }
        }
    } catch (err) {
        console.error("Data loading error:", err);
        WebApp.showAlert(ui.t('products_not_loaded'));
    }
}

// Telegram BackButton callback
let globalBackButtonCallback = null;

function navigateTo(pageName, addToHistory = true) {
    const protectedPages = ['profile', 'favorites', 'cart'];
    if (protectedPages.includes(pageName) && !state.isRegistered()) {
        pendingAction = () => navigateTo(pageName);
        ui.openRegisterModal();
        attachModalEventListeners();
        return;
    }
    
    // Joriy sahifani tarixga qo'shish (faqat yangi sahifaga o'tganda)
    const currentPage = state.getCurrentPage();
    if (addToHistory && currentPage && currentPage !== pageName) {
        state.pushToHistory(currentPage);
    }
    
    state.setCurrentPage(pageName);
    ui.renderPage(pageName, attachPageEventListeners);
    
    // Layout ni ekranga mahkamlash (navbar renderdan keyin)
    fixLayoutToScreen();
    
    // Telegram BackButton boshqaruvi
    updateTelegramBackButton(pageName);
}

// Tarixdan orqaga qaytish (back button uchun)
function goBack() {
    const previousPage = state.popFromHistory();
    navigateTo(previousPage, false); // Tarixga qo'shmaslik
}

// Telegram BackButton ni yangilash
function updateTelegramBackButton(pageName) {
    // Bosh sahifada BackButton yo'q
    if (pageName === 'home') {
        if (WebApp.BackButton) {
            WebApp.BackButton.hide();
            if (globalBackButtonCallback) {
                WebApp.BackButton.offClick(globalBackButtonCallback);
                globalBackButtonCallback = null;
            }
        }
        // Home sahifada tarixni tozalash
        state.clearHistory();
    } else {
        // Boshqa sahifalarda BackButton ko'rsatish
        if (WebApp.BackButton) {
            if (globalBackButtonCallback) {
                WebApp.BackButton.offClick(globalBackButtonCallback);
            }
            
            globalBackButtonCallback = () => {
                goBack();
            };
            
            WebApp.BackButton.onClick(globalBackButtonCallback);
            WebApp.BackButton.show();
        }
    }
}

function attachPageEventListeners(pageName) {
    console.log('🔗 Attaching event listeners for page:', pageName);
    
    document.querySelectorAll('.navbar button').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    // CRITICAL FIX: Render products FIRST, then attach event listeners
    switch (pageName) {
        case 'home':
            ui.initCarousel();
            ui.renderProducts();
            
            // PERFORMANCE: Infinite scroll sozlash (DOM tayyor bo'lgandan keyin)
            setTimeout(() => setupInfiniteScroll(), 100);
            
            // O'ZGARTIRILDI: Search funksiyasini qo'shish
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase().trim();
                    const allProducts = state.getAllProducts(); // Filter qo'llanmagan barcha mahsulotlar
                    
                    if (query.length > 0) {
                        // Mahsulot nomida qidiruv
                        const filtered = allProducts.filter(p => 
                            p.name && p.name.toLowerCase().includes(query)
                        );
                        state.setFilteredProducts(filtered);
                    } else {
                        // Query bo'sh bo'lsa - barcha mahsulotlarni ko'rsatish
                        state.setFilteredProducts(null);
                    }
                    
                    ui.renderProducts();
                });
            }
            
            // Kategoriyalar bosilganda katalogga o'tish
            document.getElementById('categories-btn')?.addEventListener('click', () => {
                navigateTo('catalog');
            });
            
            // PERFORMANCE: "Barcha mahsulotlar" tugmasi - pagination bilan
            document.getElementById('show-all-btn')?.addEventListener('click', async () => {
                state.setSelectedCategory(null); // Filtrni tozalash
                state.setFilteredProducts(null); // Search filtrni ham tozalash
                // PERFORMANCE: Pagination bilan yuklash
                await loadInitialData();
                navigateTo('home');
            });
            break;
        case 'profile':
            // Main menu listeners
            document.getElementById('edit-profile-icon')?.addEventListener('click', () => {
                ui.showProfileSection('edit');
                // Telefon formatlashni qo'shish
                setTimeout(attachPhoneFormatting, 0);
            });
            document.getElementById('menu-item-orders')?.addEventListener('click', () => {
                ui.showProfileSection('orders');
                ui.renderOrders(); // Initial render
            });
            document.getElementById('menu-item-language')?.addEventListener('click', handleOpenLanguageModal);
            document.getElementById('menu-item-about')?.addEventListener('click', () => WebApp.showAlert('Biz haqimizda sahifasi tez orada!'));
            document.getElementById('menu-item-contact')?.addEventListener('click', () => WebApp.showAlert('Biz bilan bog\'lanish sahifasi tez orada!'));
            document.getElementById('logout-btn')?.addEventListener('click', () => WebApp.showAlert('Chiqish funksiyasi tez orada qo\'shiladi!'));

            // Back tugmasi Telegram BackButton orqali boshqariladi (ui.js da)
            // Listeners for hidden sections
            document.getElementById('save-profile-btn')?.addEventListener('click', handleSaveProfile);
            document.querySelectorAll('.orders-tabs .orders-tab-button').forEach(tab => {
                tab.addEventListener('click', handleOrderTabClick);
            });
            
            // Telefon formatlashni qo'shish (agar edit section ko'rinsa)
            attachPhoneFormatting();
            break;
        case 'cart':
            // YANGI: Cart page event listeners (server-based API)
            // Quantity buttons
            document.querySelectorAll('.cart-item-qty-btn').forEach(btn => {
                btn.addEventListener('click', handleCartQuantityChange);
            });
            
            // Delete buttons
            document.querySelectorAll('.cart-item-delete-btn').forEach(btn => {
                btn.addEventListener('click', handleDeleteCartItem);
            });
            
            // Like buttons
            document.querySelectorAll('.cart-item-like-btn').forEach(btn => {
                btn.addEventListener('click', handleCartItemLike);
            });
            
            // Checkboxes
            document.querySelectorAll('.cart-item-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', handleCartItemCheckbox);
            });
            
            // Checkout button
            document.getElementById('confirm-order-btn')?.addEventListener('click', handleConfirmOrder);
            break;
        case 'catalog':
            // O'ZGARTIRILDI: Kategoriya kartochkalariga event listener
            document.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', async () => {
                    const categoryId = parseInt(card.dataset.id);
                    await handleCategoryFilter(categoryId);
                });
            });
            break;
        case 'favorites':
            ui.renderProducts();
            break;
    }
    
    // CRITICAL FIX: Attach product-related event listeners AFTER rendering
    // This ensures buttons exist in DOM before attaching listeners
    const productCards = document.querySelectorAll('.product-card');
    const likeButtons = document.querySelectorAll('.like-btn');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    console.log('📦 Found elements:', {
        productCards: productCards.length,
        likeButtons: likeButtons.length,
        addToCartButtons: addToCartButtons.length
    });
    
    productCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn') || e.target.closest('.add-to-cart-btn')) {
                return;
            }
            const productId = card.dataset.id;
            WebApp.showAlert(ui.t('product_details_not_ready', { id: productId }));
        });
    });

    likeButtons.forEach(btn => {
        console.log('❤️ Attaching like listener to button:', btn.dataset.id);
        btn.addEventListener('click', handleToggleFavorite);
    });

    addToCartButtons.forEach(btn => {
        console.log('🛒 Attaching cart listener to button:', btn.dataset.id);
        btn.addEventListener('click', handleAddToCart);
    });
}

function attachModalEventListeners() {
    document.getElementById('register-submit-btn')?.addEventListener('click', handleRegisterUser);
    document.getElementById('register-cancel-btn')?.addEventListener('click', ui.closeRegisterModal);
    // Telefon formatlashni qo'shish
    attachPhoneFormatting();
}

function handleOpenLanguageModal() {
    ui.renderLanguageModal();
    
    const modalOverlay = document.getElementById('language-modal-overlay');
    
    // Modal tashqarisiga bosilganda yopish
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            ui.closeLanguageModal();
        }
    });

    // Til tanlanganda
    document.querySelectorAll('input[name="language"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            handleLanguageChange(e.target.value);
            ui.closeLanguageModal();
        });
    });
}

async function handleLanguageChange(lang) {
    state.setLang(lang);
    await loadInitialData();
    navigateTo(state.getCurrentPage());
}

// O'ZGARTIRILDI: Kategoriya bo'yicha filtrlash
async function handleCategoryFilter(categoryId) {
    try {
        // Kategoriyani state'ga saqlash
        state.setSelectedCategory(categoryId);
        
        // Loading ko'rsatish
        ui.showLoading(ui.t('loading'));
        
        // PERFORMANCE: Filtrlangan mahsulotlarni yuklash (pagination bilan)
        const productsData = await api.getProducts(categoryId, 20, 0);
        state.setProducts(productsData, false); // Yangi yuklash
        state.setFilteredProducts(null); // Search filtrini tozalash
        
        // Home sahifaga o'tish va mahsulotlarni ko'rsatish
        navigateTo('home');
    } catch (error) {
        console.error('Category filter error:', error);
        WebApp.showAlert(ui.t('error_server'));
    } finally {
        ui.hideLoading();
    }
}

function handleOrderTabClick(event) {
    const clickedTab = event.target;
    // Boshqa tablardan 'active' klassini olib tashlaymiz
    document.querySelectorAll('.orders-tabs .orders-tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    // Bosilgan tabga 'active' klassini qo'shamiz
    clickedTab.classList.add('active');
    // Buyurtmalarni filtrlab qayta chizamiz
    ui.renderOrders(clickedTab.dataset.tab);
}

async function handleSaveProfile() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim().replace(/\s/g, '');

    if (!firstName || phone.length !== 9) {
        WebApp.showAlert(ui.t('please_fill_fields'));
        return;
    }
    try {
        const updatedUser = await api.updateUser({
            first_name: firstName,
            last_name: lastName,
            phone: '+998' + phone,
        });
        state.setUser(updatedUser);
        WebApp.showAlert(ui.t('profile_saved'));
        navigateTo('profile'); // Re-render profile page to show updated info and return to menu
    } catch (err) {
        // Texnik xatolikni console'ga yozish (developer uchun)
        console.error('Profile save error:', err);
        
        // Foydalanuvchiga tushunarli xabar ko'rsatish
        let userMessage = ui.t('error_saving');
        
        if (err.status === 400) {
            // Backend'dan kelgan validatsiya xabari (masalan: "Telefon raqam noto'g'ri")
            userMessage = err.message;
        } else if (err.status === 401 || err.status === 403) {
            userMessage = ui.t('error_auth');
        } else if (err.status === 500) {
            userMessage = ui.t('error_server');
        }
        
        WebApp.showAlert(userMessage);
    }
}

function handleAddToCart(event) {
    console.log('🛒 handleAddToCart called', event.target);
    event.stopPropagation();
    event.preventDefault();
    
    // O'ZGARTIRILDI: Tugma yoki uning ichidagi elementni topish
    let btn = event.target.closest('.add-to-cart-btn');
    if (!btn) {
        // Agar to'g'ridan-to'g'ri tugma bosilgan bo'lsa
        btn = event.target;
        if (!btn.classList.contains('add-to-cart-btn')) {
            console.error('❌ Add to cart button not found!', event.target);
            return;
        }
    }
    
    const productId = parseInt(btn.dataset.id);
    console.log('📦 Product ID:', productId, 'Button:', btn);
    
    if (!productId || isNaN(productId)) {
        console.error('❌ Invalid product ID:', productId, btn);
        return;
    }
    
    // Modal ochish
    console.log('🔓 Opening cart modal for product:', productId);
    ui.openCartModal(productId);
    
    // O'ZGARTIRILDI: Modal DOM'ga qo'shilgandan keyin event listenerlar qo'shish
    // setTimeout ishlatamiz - DOM yangilanishini kafolatlaydi
    setTimeout(() => {
        console.log('🔗 Attaching cart modal event listeners');
        attachCartModalEventListeners(productId);
    }, 50);
}

// Cart modal event listenerlari
function attachCartModalEventListeners(productId) {
    const overlay = document.getElementById('cart-modal-overlay');
    const buyBtn = document.querySelector('.cart-modal-buy-btn');
    const qtyBtns = document.querySelectorAll('.qty-btn');
    const qtyValue = document.getElementById(`qty-value-${productId}`);
    
    if (!overlay) {
        console.error('Cart modal overlay not found!');
        return;
    }
    
    if (!qtyValue) {
        console.error('Quantity value element not found!');
        return;
    }
    
    // O'ZGARTIRILDI: Modal tashqarisiga bosilganda savatga qo'shish va yopish
    overlay.addEventListener('click', async function overlayClickHandler(e) {
        if (e.target === overlay) {
            // Tanlangan miqdorni olish
            const quantity = parseInt(qtyValue.textContent) || 1;
            
            // Savatga qo'shish (agar ro'yxatdan o'tgan bo'lsa)
            if (state.isRegistered()) {
                await addToCartSilently(productId, quantity);
            }
            
            ui.closeCartModal();
        }
    });
    
    // Miqdorni o'zgartirish
    qtyBtns.forEach(btn => {
        btn.addEventListener('click', function qtyClickHandler(e) {
            e.stopPropagation();
            const change = parseInt(btn.dataset.change);
            const currentQty = parseInt(qtyValue.textContent) || 1;
            const newQty = Math.max(1, currentQty + change);
            qtyValue.textContent = newQty;
        });
    });
    
    // Sotib olish tugmasi
    if (buyBtn) {
        buyBtn.addEventListener('click', async function buyClickHandler(e) {
            e.stopPropagation();
            // Joriy miqdorni olish
            const quantity = parseInt(qtyValue.textContent) || 1;
            
            if (!state.isRegistered()) {
                ui.closeCartModal();
                pendingAction = () => addToCartAndCheckout(productId, quantity);
                ui.openRegisterModal();
                attachModalEventListeners();
                return;
            }
            
            await addToCartAndCheckout(productId, quantity);
        });
    }
}

// YANGI: Modal yopilganda savatga qo'shish (yangi API)
async function addToCartSilently(productId, quantity) {
    try {
        // Yangi API: server'ga saqlash
        await api.addToCartAPI(productId, quantity);
        
        // Cart'ni yangilash (optionally reload cart from server)
        const cartData = await api.getCartItems();
        state.setCartItems(cartData.items);
        state.setCartSummary(cartData.summary);
    } catch (err) {
        console.error('Add to cart error:', err);
        // Xato bo'lsa ham davom etadi (modal yopiladi)
    }
}

// YANGI: Savatga qo'shish va checkout (yangi API)
async function addToCartAndCheckout(productId, quantity) {
    try {
        // Yangi API: server'ga saqlash
        await api.addToCartAPI(productId, quantity);
        
        // Cart'ni yangilash
        const cartData = await api.getCartItems();
        state.setCartItems(cartData.items);
        state.setCartSummary(cartData.summary);
        
        ui.closeCartModal();
        
        // Cart sahifasiga o'tish
        navigateTo('cart');
    } catch (err) {
        console.error('Add to cart error:', err);
        let userMessage = ui.t('error_saving');
        if (err.status === 401 || err.status === 403) {
            userMessage = ui.t('error_auth');
        } else if (err.status === 500) {
            userMessage = ui.t('error_server');
        }
        WebApp.showAlert(userMessage);
    }
}

async function handleToggleFavorite(event) {
    console.log('❤️ handleToggleFavorite called', event.target);
    event.stopPropagation();
    const btn = event.target.closest('.like-btn');
    
    if (!btn) {
        console.error('❌ Like button not found!', event.target);
        return;
    }
    
    const productId = parseInt(btn.dataset.id);
    console.log('📦 Product ID:', productId, 'Button:', btn);
    
    const svg = btn.querySelector('svg');
    
    const action = async () => {
        const added = state.toggleFavorite(productId);
        console.log('💾 Toggle favorite - added:', added);
        btn.classList.toggle('liked', added);
        
        // SVG rangini o'zgartirish
        if (svg) {
            svg.setAttribute('fill', added ? '#ff3b5c' : 'none');
            svg.setAttribute('stroke', added ? '#ff3b5c' : '#999');
        }

        try {
            console.log('🌐 Updating favorites on server...');
            console.log('📦 Sending favorites:', state.getFavorites());
            await api.updateFavorites(state.getFavorites());
            console.log('✅ Favorites updated successfully');
            if (state.getCurrentPage() === 'favorites') {
                navigateTo('favorites');
            }
        } catch (err) {
            // O'ZGARTIRILDI: Foydalanuvchiga tushunarli xabar
            console.error('❌ Toggle favorite error:', err);
            console.error('❌ Error details:', {
                message: err.message,
                status: err.status,
                stack: err.stack
            });
            
            let userMessage = ui.t('error_saving');
            if (err.status === 401 || err.status === 403) {
                userMessage = ui.t('error_auth');
            } else if (err.status === 500) {
                userMessage = ui.t('error_server') + ': ' + err.message;
            }
            WebApp.showAlert(userMessage);
            // Revert state change on failure
            state.toggleFavorite(productId);
            btn.classList.toggle('liked', !added);
            if (svg) {
                svg.setAttribute('fill', !added ? '#ff3b5c' : 'none');
                svg.setAttribute('stroke', !added ? '#ff3b5c' : '#999');
            }
        }
    };

    const isUserRegistered = state.isRegistered();
    console.log('👤 Is user registered:', isUserRegistered);
    
    if (isUserRegistered) {
        console.log('✅ User is registered, executing action...');
        await action();
    } else {
        console.log('❌ User not registered, opening register modal...');
        pendingAction = action;
        ui.openRegisterModal();
        attachModalEventListeners();
    }
}

// YANGI: Cart quantity change handler
async function handleCartQuantityChange(event) {
    const btn = event.currentTarget;
    const cartItemId = parseInt(btn.dataset.cartId);
    const action = btn.dataset.action; // 'increase' or 'decrease'
    
    const cartItem = state.getCartItems().find(item => item.id === cartItemId);
    if (!cartItem) return;
    
    const newQuantity = action === 'increase' ? cartItem.quantity + 1 : cartItem.quantity - 1;
    
    if (newQuantity < 1) return; // Minimum 1
    
    try {
        await api.updateCartItem(cartItemId, { quantity: newQuantity });
        
        // Update state
        state.updateCartItemInState(cartItemId, { quantity: newQuantity });
        
        // Re-render cart
        navigateTo('cart', false);
    } catch (err) {
        console.error('Update cart item error:', err);
        WebApp.showAlert('Xatolik yuz berdi');
    }
}

// YANGI: Cart item delete handler
async function handleDeleteCartItem(event) {
    const btn = event.currentTarget;
    const cartItemId = parseInt(btn.dataset.cartId);
    
    try {
        await api.deleteCartItem(cartItemId);
        
        // Update state
        state.removeCartItemFromState(cartItemId);
        
        // Re-render cart
        navigateTo('cart', false);
    } catch (err) {
        console.error('Delete cart item error:', err);
        WebApp.showAlert('Xatolik yuz berdi');
    }
}

// YANGI: Cart item like handler
async function handleCartItemLike(event) {
    const btn = event.currentTarget;
    const cartItemId = parseInt(btn.dataset.cartId);
    
    const cartItem = state.getCartItems().find(item => item.id === cartItemId);
    if (!cartItem) return;
    
    const newLikedState = !cartItem.is_liked;
    
    try {
        await api.updateCartItem(cartItemId, { is_liked: newLikedState });
        
        // Update state
        state.updateCartItemInState(cartItemId, { is_liked: newLikedState });
        
        // Update UI
        btn.classList.toggle('liked', newLikedState);
        const svg = btn.querySelector('svg');
        if (svg) {
            svg.setAttribute('fill', newLikedState ? '#ff3b5c' : 'none');
            svg.setAttribute('stroke', newLikedState ? '#ff3b5c' : '#999');
        }
    } catch (err) {
        console.error('Update cart item like error:', err);
    }
}

// YANGI: Cart item checkbox handler
async function handleCartItemCheckbox(event) {
    const checkbox = event.currentTarget;
    const cartItem = checkbox.closest('.cart-item');
    const cartItemId = parseInt(cartItem.dataset.cartId);
    
    const isSelected = checkbox.checked;
    
    try {
        await api.updateCartItem(cartItemId, { is_selected: isSelected });
        
        // Update state
        state.updateCartItemInState(cartItemId, { is_selected: isSelected });
        
        // Re-render to update summary
        navigateTo('cart', false);
    } catch (err) {
        console.error('Update cart item selection error:', err);
        // Revert checkbox
        checkbox.checked = !isSelected;
    }
}

async function handleConfirmOrder() {
    const cart = state.getCart();
    if (Object.keys(cart).length === 0) return;

    const orderData = {
        items: Object.entries(cart).map(([product_id, quantity]) => ({ product_id: parseInt(product_id), quantity })),
        payment_method: document.querySelector('input[name="payment"]:checked').value,
        delivery_method: document.querySelector('input[name="delivery"]:checked').value,
    };

    // O'ZGARTIRILDI: Loading holatini ko'rsatish
    const confirmBtn = document.getElementById('confirm-order-btn');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = ui.t('loading') || 'Yuklanmoqda...';

    try {
        const newOrder = await api.createOrder(orderData);
        WebApp.showAlert(ui.t('order_success', { order_number: newOrder.id }));
        state.clearCart();
        await api.updateCart(state.getCart()); // Clear cart on server
        const orders = await api.getOrders();
        state.setOrders(orders);
        navigateTo('profile');
    } catch (err) {
        // O'ZGARTIRILDI: Foydalanuvchiga tushunarli xabar
        console.error('Order creation error:', err);
        let userMessage = ui.t('order_failed');
        if (err.status === 400 && err.message) {
            userMessage = err.message; // Backend validatsiya xabari
        } else if (err.status === 401 || err.status === 403) {
            userMessage = ui.t('error_auth');
        } else if (err.status === 500) {
            userMessage = ui.t('error_server');
        }
        WebApp.showAlert(userMessage);
    } finally {
        // Tugmani asl holatiga qaytarish
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

async function handleRegisterUser() {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const phone = document.getElementById('regPhone').value.trim().replace(/\s/g, '');

    if (!firstName || phone.length !== 9) {
        WebApp.showAlert(ui.t('please_fill_fields'));
        return;
    }

    try {
        // O'ZGARTIRILDI: registerUser o'rniga updateUser ishlatiladi
        const newUser = await api.updateUser({
            first_name: firstName,
            last_name: lastName,
            phone: '+998' + phone, 
        });
        state.setUser(newUser);
        ui.closeRegisterModal();
        WebApp.showAlert(ui.t('profile_saved'));

        await loadInitialData(); 

        if (pendingAction) {
            pendingAction();
            pendingAction = null;
        } else {
            navigateTo(state.getCurrentPage()); 
        }
    } catch (err) {
        // O'ZGARTIRILDI: Foydalanuvchiga tushunarli xabar
        console.error('Registration error:', err);
        let userMessage = ui.t('error_saving');
        if (err.status === 400 && err.message) {
            userMessage = err.message; // Backend validatsiya xabari (masalan: telefon noto'g'ri)
        } else if (err.status === 401 || err.status === 403) {
            userMessage = ui.t('error_auth');
        } else if (err.status === 500) {
            userMessage = ui.t('error_server');
        }
        WebApp.showAlert(userMessage);
    }
}