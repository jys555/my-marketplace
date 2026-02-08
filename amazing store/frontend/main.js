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
    
    // Cart bottom bar uchun navbar top pozitsiyasini CSS custom property sifatida saqlash
    document.documentElement.style.setProperty('--navbar-top', `${navbarTop}px`);
    document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);
    
    // Cart page bo'lsa, bottom bar pozitsiyasini yangilash
    if (state.getCurrentPage() === 'cart') {
        updateCartBottomBarPosition();
    }
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
                ui.ui.updateCartBadges(); // Cart badge'larni yangilash
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
    
    // Cart page bo'lsa, bottom bar pozitsiyasini yangilash
    if (pageName === 'cart') {
        setTimeout(() => {
            updateCartBottomBarPosition();
        }, 100);
    }
    
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
            
            // Like buttons - umumiy like button ishlatiladi
            document.querySelectorAll('.cart-item-actions .like-btn').forEach(btn => {
                btn.addEventListener('click', handleToggleFavorite);
            });
            
            // Professional checkbox handlers
            document.querySelectorAll('.cart-item-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', handleCartItemCheckbox);
            });
            
            const selectAllCheckbox = document.getElementById('cart-select-all');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', handleSelectAllCartItems);
                updateSelectAllCheckboxState();
            }
            
            // Address delete button
            document.querySelector('.cart-address-delete-btn')?.addEventListener('click', handleDeleteAllCartItems);
            
            // Checkout button
            document.getElementById('confirm-order-btn')?.addEventListener('click', handleConfirmOrder);
            
            // Empty cart button (bo'sh savat holatida)
            document.querySelector('.cart-empty-btn[data-page]')?.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                if (page) {
                    navigateTo(page);
                }
            });
            
            // Cart bottom bar pozitsiyasini yangilash
            updateCartBottomBarPosition();
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
            // ⭐ CRITICAL FIX: Favorites sahifasida renderProducts() chaqirilmasligi kerak
            // chunki getFavoritesContent() allaqachon to'g'ri mahsulotlarni render qilgan
            // ui.renderProducts() barcha mahsulotlarni qayta render qiladi va bu muammoga olib keladi
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
    const qtyBtns = document.querySelectorAll('.cart-modal-qty-btn');
    const qtyValue = document.getElementById(`qty-value-${productId}`);
    const addBtn = document.querySelector('.cart-modal-add-btn');
    
    if (!overlay) {
        console.error('Cart modal overlay not found!');
        return;
    }
    
    if (!qtyValue) {
        console.error('Quantity value element not found!');
        return;
    }
    
    // O'ZGARTIRILDI: Modal tashqarisiga bosilganda faqat yopish (savatga qo'shish yo'q)
    overlay.addEventListener('click', async function overlayClickHandler(e) {
        if (e.target === overlay) {
            ui.closeCartModal();
        }
    });
    
    // CRITICAL FIX: Counter o'zgartirganda bevosita savatda yangilanishi (tasdiqlash yo'q)
    qtyBtns.forEach(btn => {
        btn.addEventListener('click', async function qtyClickHandler(e) {
            e.stopPropagation();
            const change = parseInt(btn.dataset.change);
            const currentQty = parseInt(qtyValue.textContent) || 1;
            const newQty = Math.max(0, currentQty + change); // 0 gacha boradi
            
            // Agar 0 bo'lsa, tovar o'chiriladi va modal yopiladi
            if (newQty === 0) {
                if (state.isRegistered()) {
                    const cartItems = state.getCartItems();
                    const cartItem = cartItems.find(item => item.product_id === productId);
                    if (cartItem) {
                        try {
                            await api.deleteCartItem(cartItem.id);
                            state.removeCartItemFromState(cartItem.id);
                            ui.updateCartBadges();
                        } catch (err) {
                            console.error('Delete cart item error:', err);
                            // Rollback UI
                            qtyValue.textContent = currentQty;
                            return;
                        }
                    }
                }
                ui.closeCartModal();
                return;
            }
            
            // OPTIMISTIC UPDATE: Avval UI yangilanadi
            qtyValue.textContent = newQty;
            
            // CRITICAL: Bevosita savatda yangilanishi (tasdiqlash yo'q)
            if (state.isRegistered()) {
                const cartItems = state.getCartItems();
                const cartItem = cartItems.find(item => item.product_id === productId);
                
                if (cartItem) {
                    // Tovar savatda bor - quantity'ni yangilash
                    try {
                        // OPTIMISTIC: Avval state yangilanadi
                        state.updateCartItemInState(cartItem.id, { quantity: newQty });
                        ui.updateCartBadges();
                        
                        // Keyin serverga yuboriladi (background)
                        api.updateCartItem(cartItem.id, { quantity: newQty }).catch(err => {
                            console.error('Update cart item error:', err);
                            // Rollback on error
                            state.updateCartItemInState(cartItem.id, { quantity: currentQty });
                            qtyValue.textContent = currentQty;
                            ui.updateCartBadges();
                        });
                    } catch (err) {
                        console.error('Update cart item error:', err);
                        // Rollback UI
                        qtyValue.textContent = currentQty;
                    }
                } else {
                    // Tovar savatda yo'q - yangi qo'shish
                    try {
                        await api.addToCartAPI(productId, newQty);
                        const updatedCartData = await api.getCartItems();
                        state.setCartItems(updatedCartData.items);
                        state.setCartSummary(updatedCartData.summary);
                        ui.updateCartBadges();
                    } catch (err) {
                        console.error('Add to cart error:', err);
                        // Rollback UI
                        qtyValue.textContent = currentQty;
                    }
                }
            }
        });
    });
    
    // CRITICAL: "Savatga" tugmasi - faqat savat sahifasiga yunaltiradi (qiymat allaqachon saqlangan)
    const cartBtn = document.querySelector('.cart-modal-cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', async function cartBtnClickHandler(e) {
            e.stopPropagation();
            
            if (!state.isRegistered()) {
                ui.closeCartModal();
                pendingAction = () => {
                    navigateTo('cart');
                };
                ui.openRegisterModal();
                attachModalEventListeners();
                return;
            }
            
            // Modal yopiladi va savat sahifasiga o'tiladi
            // Qiymat allaqachon counter o'zgartirganda saqlangan
            ui.closeCartModal();
            navigateTo('cart');
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
        ui.updateCartBadges(); // Cart badge'larni yangilash
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
        
        // Cart badge'larni yangilash
        ui.updateCartBadges();
        
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

// ⭐ BEST PRACTICE: Faqat bitta button'ni yangilash funksiyasi
function updateLikeButton(button, productId) {
    if (!button || isNaN(productId)) {
        console.warn('⚠️ updateLikeButton: Invalid button or productId', { button, productId });
        return;
    }
    
    const isLiked = state.isFavorite(productId);
    const svg = button.querySelector('svg');
    const buttonDataId = button.dataset.id;
    
    // ⭐ DEBUG: Button ma'lumotlarini tekshirish
    console.log(`🔍 updateLikeButton: productId=${productId}, buttonDataId=${buttonDataId}, isLiked=${isLiked}`);
    
    // ⭐ CRITICAL FIX: Faqat to'g'ri product ID uchun yangilash
    if (parseInt(buttonDataId) !== productId) {
        console.warn(`⚠️ updateLikeButton: Product ID mismatch! Expected ${productId}, got ${buttonDataId}`);
        return;
    }
    
    // Class yangilash (toggle emas, to'g'ridan-to'g'ri set)
    if (isLiked) {
        button.classList.add('liked');
    } else {
        button.classList.remove('liked');
    }
    
    // SVG rangini yangilash
    if (svg) {
        svg.setAttribute('fill', isLiked ? '#ff3b5c' : 'none');
        svg.setAttribute('stroke', isLiked ? '#ff3b5c' : '#999');
    }
}

// ⭐ BEST PRACTICE: Faqat o'zgargan product ID uchun barcha button'larni yangilash
// (bir xil product bir necha joyda bo'lishi mumkin - home, favorites, cart)
function updateLikeButtonsForProduct(productId) {
    console.log(`🔄 updateLikeButtonsForProduct: Looking for buttons with productId=${productId}`);
    
    // ⭐ CRITICAL FIX: To'g'ri selector - faqat aniq productId uchun
    const buttons = document.querySelectorAll(`.like-btn[data-id="${productId}"]`);
    console.log(`🔍 Found ${buttons.length} button(s) for productId=${productId}`);
    
    // ⭐ DEBUG: Barcha button'larni tekshirish
    buttons.forEach((btn, index) => {
        const btnDataId = btn.dataset.id;
        console.log(`  Button ${index + 1}: data-id="${btnDataId}", matches=${parseInt(btnDataId) === productId}`);
    });
    
    buttons.forEach(btn => {
        const btnDataId = btn.dataset.id;
        // ⭐ CRITICAL FIX: Qo'shimcha tekshiruv
        if (parseInt(btnDataId) === productId) {
            updateLikeButton(btn, productId);
        } else {
            console.warn(`⚠️ Skipping button with mismatched data-id: ${btnDataId} (expected ${productId})`);
        }
    });
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
    if (isNaN(productId)) {
        console.error('❌ Invalid product ID:', btn.dataset.id);
        return;
    }
    
    console.log('📦 Product ID:', productId, 'Button:', btn);
    
    // ⭐ BEST PRACTICE: Oldingi holatni saqlash (revert uchun)
    const previousState = state.isFavorite(productId);
    
    const action = async () => {
        // ⭐ DEBUG: Oldingi favorites holatini ko'rsatish
        const favoritesBefore = [...state.getFavorites()];
        console.log('📋 Favorites BEFORE toggle:', favoritesBefore);
        
        const added = state.toggleFavorite(productId);
        
        // ⭐ DEBUG: Keyingi favorites holatini ko'rsatish
        const favoritesAfter = [...state.getFavorites()];
        console.log('📋 Favorites AFTER toggle:', favoritesAfter);
        console.log('💾 Toggle favorite - added:', added, 'Previous state:', previousState);
        console.log('🔍 Product ID that was toggled:', productId);
        
        // ⭐ CRITICAL FIX: Faqat o'zgargan product uchun button'larni yangilash
        // (bir xil product bir necha joyda bo'lishi mumkin)
        updateLikeButtonsForProduct(productId);

        try {
            console.log('🌐 Updating favorites on server...');
            console.log('📦 Sending favorites:', state.getFavorites());
            await api.updateFavorites(state.getFavorites());
            console.log('✅ Favorites updated successfully');
            
            // ⭐ BEST PRACTICE: Agar favorites sahifasida bo'lsa, qayta render qilish
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
            
            // ⭐ BEST PRACTICE: Revert state change on failure
            state.toggleFavorite(productId);
            // ⭐ BEST PRACTICE: Revert qilganda ham faqat o'sha product uchun yangilash
            updateLikeButtonsForProduct(productId);
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
    
    const oldQuantity = cartItem.quantity;
    const newQuantity = action === 'increase' ? oldQuantity + 1 : oldQuantity - 1;
    
    if (newQuantity < 1) return; // Minimum 1
    
    // OPTIMISTIC UPDATE: Avval UI yangilanadi (tez javob)
    updateCartItemQuantityUI(cartItemId, newQuantity);
    state.updateCartItemInState(cartItemId, { quantity: newQuantity });
    updateCartCheckoutButton();
    ui.updateCartBadges(); // Cart badge'larni yangilash
    
    try {
        // Keyin serverga yuboriladi (background)
        await api.updateCartItem(cartItemId, { quantity: newQuantity });
    } catch (err) {
        // Xatolik bo'lsa, eski qiymatga qaytariladi
        console.error('Update cart item error:', err);
        updateCartItemQuantityUI(cartItemId, oldQuantity);
        state.updateCartItemInState(cartItemId, { quantity: oldQuantity });
        updateCartCheckoutButton();
        WebApp.showAlert('Xatolik yuz berdi');
    }
}

// Real-time counter UI yangilash
function updateCartItemQuantityUI(cartItemId, quantity) {
    const cartItem = document.querySelector(`.cart-item[data-cart-id="${cartItemId}"]`);
    if (!cartItem) return;
    
    const qtyValue = cartItem.querySelector('.cart-item-qty-value');
    const decreaseBtn = cartItem.querySelector('.cart-item-qty-btn[data-action="decrease"]');
    
    if (qtyValue) {
        qtyValue.textContent = quantity;
    }
    
    if (decreaseBtn) {
        decreaseBtn.disabled = quantity <= 1;
    }
}

/**
 * Real-time checkout button yangilash
 * 
 * REAL-TIME MEXANIZM TUSHUNTIRISH:
 * 
 * 1. USLUB: Event-Driven (Faqat o'zgarishda yangilanadi)
 *    - Doimiy polling YO'Q (setInterval, setTimeout ishlatilmaydi)
 *    - Faqat user action bo'lganda ishlaydi (checkbox, quantity, delete)
 *    - Bu juda samarali, chunki:
 *      * CPU yuklamasi minimal (faqat kerak bo'lganda ishlaydi)
 *      * Network yuklamasi yo'q (polling requestlar yo'q)
 *      * Battery tejaladi (background ishlar yo'q)
 * 
 * 2. YANGILANISH VAQTI: Darhol (0ms delay)
 *    - State o'zgarganda darhol UI yangilanadi
 *    - Optimistic update: Avval UI, keyin server
 *    - User tez javob ko'radi
 * 
 * 3. YUKLAMA: Minimal
 *    - Faqat DOM elementlarini yangilaydi (textContent o'zgartirish)
 *    - Hech qanday qayta render YO'Q (navigateTo chaqirilmaydi)
 *    - Faqat kerakli elementlar yangilanadi
 * 
 * 4. ISHLASH PRINTSIPI:
 *    a) User action (checkbox, quantity button) → Event listener
 *    b) State yangilanadi (updateCartItemInState)
 *    c) Summary hisoblanadi (calculateCartSummary - avtomatik)
 *    d) UI yangilanadi (updateCartCheckoutButton, updateCartItemQuantityUI)
 *    e) Serverga yuboriladi (background, async)
 * 
 * 5. FOYDALARI:
 *    - Tez javob (optimistic update)
 *    - Kam yuklama (faqat o'zgarishda)
 *    - Xavfsiz (xatolik bo'lsa, eski qiymatga qaytariladi)
 *    - Offline-friendly (state local'da saqlanadi)
 */
// YANGI: Cart badge'larni yangilash (barcha product kartochkalarida)
// updateCartBadges moved to ui.js to avoid circular dependency

function updateCartCheckoutButton() {
    const summary = state.getCartSummary();
    const checkoutBtn = document.getElementById('confirm-order-btn');
    if (!checkoutBtn) return;
    
    const leftSpan = checkoutBtn.querySelector('.cart-checkout-left');
    const rightSpan = checkoutBtn.querySelector('.cart-checkout-right');
    
    if (leftSpan) {
        leftSpan.textContent = `${summary.totalItems || 0} ta tovar`;
    }
    
    if (rightSpan) {
        rightSpan.textContent = `${Number(summary.totalAmount || 0).toLocaleString()} so'm`;
    }
    
    // Disable/enable button
    checkoutBtn.disabled = (summary.totalItems || 0) === 0;
}

// YANGI: Cart item delete handler
async function handleDeleteCartItem(event) {
    const btn = event.currentTarget;
    const cartItemId = parseInt(btn.dataset.cartId);
    
    try {
        await api.deleteCartItem(cartItemId);
        
        // Update state
        state.removeCartItemFromState(cartItemId);
        
        // Cart badge'larni yangilash
        ui.updateCartBadges();
        
        // Re-render cart
        navigateTo('cart', false);
    } catch (err) {
        console.error('Delete cart item error:', err);
        WebApp.showAlert('Xatolik yuz berdi');
    }
}

// Professional checkbox functionality
async function handleCartItemCheckbox(event) {
    const checkbox = event.currentTarget;
    const cartItemId = parseInt(checkbox.dataset.cartId);
    const isSelected = checkbox.checked;
    
    // OPTIMISTIC UPDATE: Avval UI yangilanadi
    state.updateCartItemInState(cartItemId, { is_selected: isSelected });
    updateSelectAllCheckboxState();
    updateCartCheckoutButton();
    
    try {
        // Keyin serverga yuboriladi
        await api.updateCartItem(cartItemId, { is_selected: isSelected });
    } catch (err) {
        // Xatolik bo'lsa, eski holatga qaytariladi
        console.error('Cart item checkbox error:', err);
        checkbox.checked = !isSelected;
        state.updateCartItemInState(cartItemId, { is_selected: !isSelected });
        updateSelectAllCheckboxState();
        updateCartCheckoutButton();
    }
}

async function handleSelectAllCartItems(event) {
    const selectAllCheckbox = event.currentTarget;
    const isSelected = selectAllCheckbox.checked;
    
    const cartItems = state.getCartItems();
    
    // OPTIMISTIC UPDATE: Avval UI yangilanadi
    cartItems.forEach(item => {
        state.updateCartItemInState(item.id, { is_selected: isSelected });
    });
    
    document.querySelectorAll('.cart-item-checkbox').forEach(checkbox => {
        checkbox.checked = isSelected;
    });
    
    updateCartCheckoutButton();
    
    try {
        // Keyin serverga yuboriladi
        const updatePromises = cartItems.map(item => 
            api.updateCartItem(item.id, { is_selected: isSelected })
        );
        await Promise.all(updatePromises);
    } catch (err) {
        // Xatolik bo'lsa, eski holatga qaytariladi
        console.error('Select all cart items error:', err);
        selectAllCheckbox.checked = !isSelected;
        cartItems.forEach(item => {
            state.updateCartItemInState(item.id, { is_selected: !isSelected });
        });
        document.querySelectorAll('.cart-item-checkbox').forEach(checkbox => {
            checkbox.checked = !isSelected;
        });
        updateCartCheckoutButton();
    }
}

function updateSelectAllCheckboxState() {
    const selectAllCheckbox = document.getElementById('cart-select-all');
    if (!selectAllCheckbox) return;
    
    const cartItems = state.getCartItems();
    if (cartItems.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }
    
    const selectedCount = cartItems.filter(item => item.is_selected).length;
    
    if (selectedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedCount === cartItems.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}


// YANGI: Delete all cart items handler
async function handleDeleteAllCartItems() {
    const cartItems = state.getCartItems();
    if (cartItems.length === 0) return;
    
    const confirmed = confirm('Barcha tovarlarni savatdan olib tashlamoqchimisiz?');
    if (!confirmed) return;
    
    try {
        // Delete all cart items
        for (const item of cartItems) {
            await api.deleteCartItem(item.id);
        }
        
        // Clear cart in state
        state.clearCart();
        
        // Re-render cart
        navigateTo('cart', false);
    } catch (err) {
        console.error('Delete all cart items error:', err);
        WebApp.showAlert('Xatolik yuz berdi');
    }
}

// YANGI: Update cart bottom bar position
function updateCartBottomBarPosition() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    const navbarTop = navbar.offsetTop;
    const navbarHeight = navbar.offsetHeight;
    
    // Update CSS custom property
    document.documentElement.style.setProperty('--navbar-top', `${navbarTop}px`);
    document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);
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