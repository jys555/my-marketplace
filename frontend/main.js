import * as api from './api.js';
import * as state from './state.js';
import * as ui from './ui.js';

const WebApp = window.Telegram.WebApp;
let pendingAction = null; // Ro'yxatdan o'tgandan keyin bajariladigan amal

document.addEventListener('DOMContentLoaded', () => {
    if (!WebApp.initData) {
        ui.showLoading(ui.t('error_telegram'));
        console.error("Telegram.WebApp.initData is not available.");
        return;
    }
    // initData-ni state-ga saqlaymiz, toki api.js uni ishlata olsin
    state.setInitData(WebApp.initData);
    WebApp.ready();
    initializeApp();
});

async function initializeApp() {
    ui.showLoading();
    try {
        // 1. Backend bilan to'liq initData orqali xavfsiz autentifikatsiya
        const authResponse = await api.authenticateWithBackend();
        state.setUser(authResponse.user);
        
        // 2. Boshlang'ich ma'lumotlarni yuklash (mahsulotlar, buyurtmalar va hk)
        await loadInitialData();

        // 3. To'g'ri sahifaga o'tish
        navigateTo(state.getCurrentPage());

    } catch (err) {
        console.error("Initialization error:", err);
        // Agar autentifikatsiya foydalanuvchi ro'yxatdan o'tmaganligi sababli
        // xatolik bersa, ro'yxatdan o'tishni so'raymiz.
        if (err.status === 404 || err.message.includes('not registered')) {
             pendingAction = () => initializeApp(); // Ro'yxatdan o'tgandan keyin qayta ishga tushirish
             ui.openRegisterModal();
             attachModalEventListeners();
        } else {
            // Boshqa xatoliklar uchun (masalan, yaroqsiz xesh, server ishlamayapti)
            ui.showLoading(ui.t('error_server'));
            WebApp.showAlert(err.message || ui.t('error_server'));
        }
    }
}


async function loadInitialData() {
    try {
        // O'ZGARTIRILDI: Promise.all bilan bir vaqtda bir nechta so'rov yuborish
        const [products, banners] = await Promise.all([
            api.getProducts(),
            api.getBanners() 
        ]);

        state.setProducts(products);
        state.setBanners(banners); // QO'SHILDI: Olingan bannerlarni state'ga saqlash

        if (state.isRegistered()) {
            const orders = await api.getOrders();
            state.setOrders(orders);
        }
    } catch (err) {
        console.error("Data loading error:", err);
        WebApp.showAlert(ui.t('products_not_loaded'));
    }
}

function navigateTo(pageName) {
    const protectedPages = ['profile', 'favorites', 'cart'];
    if (protectedPages.includes(pageName) && !state.isRegistered()) {
        pendingAction = () => navigateTo(pageName);
        ui.openRegisterModal();
        attachModalEventListeners();
        return;
    }
    state.setCurrentPage(pageName);
    ui.renderPage(pageName, attachPageEventListeners);
}

function attachPageEventListeners(pageName) {
    // Umumiy event listener'lar
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

    // Sahifaga xos event listener'lar
    switch (pageName) {
        case 'home':
            ui.initCarousel();
            ui.renderProducts(); // Mahsulotlarni chizish
            document.getElementById('location-btn')?.addEventListener('click', () => {
                WebApp.openTelegramLink('https://t.me/uzrailway_bot');
            });
            break;
        case 'profile':
            document.getElementById('lang-uz-btn')?.addEventListener('click', () => handleLanguageChange('uz'));
            document.getElementById('lang-ru-btn')?.addEventListener('click', () => handleLanguageChange('ru'));
            document.getElementById('edit-profile-btn')?.addEventListener('click', handleProfileEditToggle);
            document.querySelectorAll('.tabs .tab-button').forEach(tab => {
                tab.addEventListener('click', handleOrderTabClick);
            });
            ui.renderOrders(); // By default, 'current' orders
            break;
        case 'cart':
            document.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', handleUpdateCartItem);
            });
            document.getElementById('confirm-order-btn')?.addEventListener('click', handleConfirmOrder);
            break;
        case 'favorites':
            ui.renderProducts(); // Favorites page also uses product grid
            break;
    }
}

function attachModalEventListeners() {
    document.getElementById('register-submit-btn')?.addEventListener('click', handleRegisterUser);
    document.getElementById('register-cancel-btn')?.addEventListener('click', ui.closeRegisterModal);
}

// --- Event Handlers --

async function handleLanguageChange(lang) {
    state.setLang(lang);
    await loadInitialData(); // Til o'zgarganda ma'lumotlarni qayta yuklash
    navigateTo(state.getCurrentPage());
}

async function handleProfileEditToggle(event) {
    const isEditing = !document.getElementById('profile-form').classList.contains('disabled');
    if (isEditing) {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const phone = document.getElementById('phone').value.trim().replace(/\s/g, '');

        if (!firstName || phone.length !== 9) {
            WebApp.showAlert(ui.t('please_fill_fields'));
            return;
        }
        try {
            const updatedUser = await api.updateUser({
                ...state.getUser(),
                first_name: firstName,
                last_name: lastName,
                phone: '+998' + phone,
            });
            state.setUser(updatedUser);
            WebApp.showAlert(ui.t('profile_saved'));
            ui.toggleProfileEdit(false);
        } catch (err) {
            WebApp.showAlert(`${ui.t('error_saving')}: ${err.message}`);
        }
    } else {
        ui.toggleProfileEdit(true);
    }
}

function handleOrderTabClick(event) {
    const tab = event.target.dataset.tab;
    document.querySelectorAll('.tabs .tab-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    ui.renderOrders(tab);
}

function handleAddToCart(event) {
    event.stopPropagation();
    const productId = parseInt(event.target.dataset.id);
    const action = () => {
        state.addToCart(productId);
        const product = state.getProductById(productId);
        WebApp.showPopup({ title: "✅", message: ui.t('added_to_cart', { name: product.name }) });
        // Update cart icon badge if needed
    };

    if (state.isRegistered()) {
        action();
    } else {
        pendingAction = action;
        ui.openRegisterModal();
        attachModalEventListeners();
    }
}

function handleToggleFavorite(event) {
    event.stopPropagation();
    const btn = event.target;
    const productId = parseInt(btn.dataset.id);
    const action = () => {
        const added = state.toggleFavorite(productId);
        btn.classList.toggle('liked', added);
        btn.textContent = added ? '❤️' : '♡';
        WebApp.showPopup({
            title: added ? '❤️' : '🤍',
            message: added ? ui.t('added_to_favorites', { id: productId }) : ui.t('removed_from_favorites', { id: productId })
        });
        if (state.getCurrentPage() === 'favorites') {
            navigateTo('favorites'); // Refresh favorites page
        }
    };

    if (state.isRegistered()) {
        action();
    } else {
        pendingAction = action;
        ui.openRegisterModal();
        attachModalEventListeners();
    }
}

function handleUpdateCartItem(event) {
    const productId = parseInt(event.target.dataset.id);
    const change = parseInt(event.target.dataset.change);
    const currentQuantity = state.getCart()[productId] || 0;
    const newQuantity = currentQuantity + change;
    state.updateCartItemQuantity(productId, newQuantity);
    navigateTo('cart'); // Refresh cart page
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
        const orders = await api.getOrders(); // Refresh orders
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
        // initData endi o'zgartirilgan api.js dagi X-Telegram-Data sarlavhasi
        // orqali avtomatik tarzda yuboriladi
        const newUser = await api.registerUser({
            first_name: firstName,
            last_name: lastName,
            phone: '+998' + phone,
        });
        state.setUser(newUser);
        ui.closeRegisterModal();
        WebApp.showAlert(ui.t('profile_saved'));

        // Ro'yxatdan o'tgandan so'ng, foydalanuvchiga xos ma'lumotlarni yuklaymiz
        await loadInitialData(); 

        // Agar kutayotgan amal bo'lsa, uni hozir bajaramiz
        if (pendingAction) {
            pendingAction();
            pendingAction = null;
        } else {
            // Aks holda, shunchaki joriy sahifani yangilaymiz
            navigateTo(state.getCurrentPage()); 
        }
    } catch (err) {
        WebApp.showAlert(`${ui.t('error_saving')}: ${err.message}`);
    }
}