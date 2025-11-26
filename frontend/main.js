import * as api from './api.js';
import * as state from './state.js';
import * as ui from './ui.js';

const WebApp = window.Telegram.WebApp;
let pendingAction = null;

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
    
    // Fon rangini qora qilish (qora lenta bilan mos)
    if (WebApp.setBackgroundColor) {
        WebApp.setBackgroundColor('#000000');
    }
    
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
        const [products, banners] = await Promise.all([
            api.getProducts(),
            api.getBanners()
        ]);

        state.setProducts(products);
        state.setBanners(banners);

        if (state.isRegistered()) {
            try {
                const orders = await api.getOrders();
                state.setOrders(orders);
            } catch (orderError) {
                console.error("Could not load user orders:", orderError);
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
    document.querySelectorAll('.navbar button').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn') || e.target.closest('.add-to-cart-btn')) {
                return;
            }
            const productId = card.dataset.id;
            WebApp.showAlert(ui.t('product_details_not_ready', { id: productId }));
        });
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', handleToggleFavorite);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });

    switch (pageName) {
        case 'home':
            ui.initCarousel();
            ui.renderProducts();
            document.getElementById('location-btn')?.addEventListener('click', () => {
                WebApp.openTelegramLink('https://t.me/uzrailway_bot');
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
            document.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', handleUpdateCartItem);
            });
            document.getElementById('confirm-order-btn')?.addEventListener('click', handleConfirmOrder);
            break;
        case 'favorites':
            ui.renderProducts();
            break;
    }
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
        WebApp.showAlert(`${ui.t('error_saving')}: ${err.message}`);
    }
}

async function handleAddToCart(event) {
    event.stopPropagation();
    const productId = parseInt(event.target.dataset.id);
    const action = async () => {
        state.addToCart(productId);
        try {
            await api.updateCart(state.getCart());
            const product = state.getProductById(productId);
            WebApp.showPopup({ title: "✅", message: ui.t('added_to_cart', { name: product.name }) });
        } catch (err) {
            WebApp.showAlert(`${ui.t('error_saving')}: ${err.message}`);
            // Revert state change on failure
            state.updateCartItemQuantity(productId, (state.getCart()[productId] || 1) - 1);
        }
    };

    if (state.isRegistered()) {
        await action();
    } else {
        pendingAction = action;
        ui.openRegisterModal();
        attachModalEventListeners();
    }
}

async function handleToggleFavorite(event) {
    event.stopPropagation();
    const btn = event.target;
    const productId = parseInt(btn.dataset.id);
    const action = async () => {
        const added = state.toggleFavorite(productId);
        btn.classList.toggle('liked', added);
        btn.textContent = added ? '❤️' : '♡';

        try {
            await api.updateFavorites(state.getFavorites());
            WebApp.showPopup({
                title: added ? '❤️' : '🤍',
                message: added ? ui.t('added_to_favorites', { id: productId }) : ui.t('removed_from_favorites', { id: productId })
            });
            if (state.getCurrentPage() === 'favorites') {
                navigateTo('favorites');
            }
        } catch (err) {
            WebApp.showAlert(`${ui.t('error_saving')}: ${err.message}`);
            // Revert state change on failure
            state.toggleFavorite(productId);
            btn.classList.toggle('liked', !added);
            btn.textContent = !added ? '❤️' : '♡';
        }
    };

    if (state.isRegistered()) {
        await action();
    } else {
        pendingAction = action;
        ui.openRegisterModal();
        attachModalEventListeners();
    }
}

async function handleUpdateCartItem(event) {
    const productId = parseInt(event.target.dataset.id);
    const change = parseInt(event.target.dataset.change);
    const currentQuantity = state.getCart()[productId] || 0;
    const newQuantity = currentQuantity + change;
    state.updateCartItemQuantity(productId, newQuantity);
    try {
        await api.updateCart(state.getCart());
        navigateTo('cart');
    } catch (err) {
        WebApp.showAlert(`${ui.t('error_saving')}: ${err.message}`);
        // Revert state change
        state.updateCartItemQuantity(productId, currentQuantity);
        navigateTo('cart');
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

    try {
        const newOrder = await api.createOrder(orderData);
        WebApp.showAlert(ui.t('order_success', { order_number: newOrder.id }));
        state.clearCart();
        await api.updateCart(state.getCart()); // Clear cart on server
        const orders = await api.getOrders();
        state.setOrders(orders);
        navigateTo('profile');
    } catch (err) {
        WebApp.showAlert(`${ui.t('order_failed')}: ${err.message}`);
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
        WebApp.showAlert(`${ui.t('error_saving')}: ${err.message}`);
    }
}