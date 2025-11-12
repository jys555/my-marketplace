// ... existing code ...
// Backend URL (Railway)
const backendUrl = 'https://my-marketplace-production.up.railway.app';

// Telegram foydalanuvchisi
const WebApp = window.Telegram.WebApp;
WebApp.ready(); // Telegram Web App tayyor ekanligini bildirish
const user = WebApp.initDataUnsafe?.user;
let isRegistered = false;
let currentUserData = {}; // Foydalanuvchi ma'lumotlarini saqlash uchun

// Til sozlamalari va tarjimalar
const translations = {
  uz: {
    loading: "Ma'lumotlar yuklanmoqda...",
    error_telegram: "⚠️ Ilovani Telegram ichida oching.",
    error_server: "⚠️ Server bilan aloqada xatolik.",
    guest: "Mehmon",
    home_greeting: "Salom, <strong>{name}</strong>!",
    search_placeholder: "Mahsulotlarni qidirish...",
    pickup_location: "Buyerdan olib ketish mumkin",
    popular_products: "🔥 Mashhur tovarlar",
    products_not_loaded: "❌ Tovarlar yuklanmadi",
    product_details_not_ready: "Tovar #{id} tafsiloti hali tayyor emas.",
    added_to_favorites: "Tovar #{id} sevimlilarga qo'shildi.",
    fill_profile_title: "Profilingizni to'ldiring",
    first_name_placeholder: "Ism",
    last_name_placeholder: "Familiya",
    phone_placeholder: "90 123 45 67",
    save_button: "Saqlash",
    cancel_button: "Bekor qilish",
    nav_home: "🏠",
    nav_catalog: "🛍️",
    nav_favorites: "❤️",
    nav_cart: "🛒",
    nav_profile: "👤",
    profile_title: "👤 Profilim",
    profile_info: "Shaxsiy ma'lumotlar",
    profile_language: "Ilova tili",
    edit_button: "Tahrirlash",
    please_fill_fields: "Iltimos, ism va telefon raqamini to'ldiring.",
    profile_saved: "✅ Profilingiz muvaffaqiyatli saqlandi!",
    error_saving: "Saqlashda xatolik",
    page_not_ready: "{pageName} sahifasi hali tayyor emas.",
    confirm_order: "Buyurtmani tasdiqlash"
  },
  ru: {
    loading: "Загрузка данных...",
    error_telegram: "⚠️ Откройте приложение внутри Telegram.",
    error_server: "⚠️ Ошибка соединения с сервером.",
    guest: "Гость",
    home_greeting: "Привет, <strong>{name}</strong>!",
    search_placeholder: "Поиск продуктов...",
    pickup_location: "Доступен самовывоз",
    popular_products: "🔥 Популярные товары",
    products_not_loaded: "❌ Не удалось загрузить товары",
    product_details_not_ready: "Информация о товаре #{id} еще не готова.",
    added_to_favorites: "Товар #{id} добавлен в избранное.",
    fill_profile_title: "Заполните свой профиль",
    first_name_placeholder: "Имя",
    last_name_placeholder: "Фамилия",
    phone_placeholder: "90 123 45 67",
    save_button: "Сохранить",
    cancel_button: "Отмена",
    nav_home: "🏠",
    nav_catalog: "🛍️",
    nav_favorites: "❤️",
    nav_cart: "🛒",
    nav_profile: "👤",
    profile_title: "👤 Мой профиль",
    profile_info: "Личные данные",
    profile_language: "Язык приложения",
    edit_button: "Редактировать",
    please_fill_fields: "Пожалуйста, введите имя и номер телефона.",
    profile_saved: "✅ Ваш профиль успешно сохранен!",
    error_saving: "Ошибка сохранения",
    page_not_ready: "Страница {pageName} еще не готова.",
    confirm_order: "Подтвердить заказ"
  }
};

let currentLang = getLanguage();

function getLanguage() {
  return localStorage.getItem('userLang') || 'uz';
}

function setLanguage(lang) {
  if (['uz', 'ru'].includes(lang)) {
    currentLang = lang;
    localStorage.setItem('userLang', lang);
    document.documentElement.lang = lang;
    rerenderCurrentPage();
  }
}

function t(key, params = {}) {
  let text = translations[currentLang][key] || key;
  for (const param in params) {
    text = text.replace(`{${param}}`, params[param]);
  }
  return text;
}

// Dastlabki tekshirish
document.addEventListener('DOMContentLoaded', () => {
  if (!user) {
    document.getElementById('loading').innerText = t('error_telegram');
  } else {
    checkRegistration();
  }
});

// Server orqali ro'yxatdan o'tganligini tekshirish
async function checkRegistration() {
  try {
    const res = await fetch(`${backendUrl}/api/users/check/${user.id}`);
    if (!res.ok) throw new Error('Server check failed');
    const data = await res.json();
    isRegistered = data.exists;
    if (isRegistered) {
        // Agar user ro'yxatdan o'tgan bo'lsa, uning ma'lumotlarini olamiz
        const userRes = await fetch(`${backendUrl}/api/users/${user.id}`);
        currentUserData = await userRes.json();
    }
    rerenderCurrentPage(); // Bosh sahifani yoki joriy sahifani yangilash
  } catch (err) {
    console.error("Xatolik:", err);
    document.getElementById('loading').innerText = t('error_server');
  }
}

function rerenderCurrentPage() {
    const activeBtn = document.querySelector('.navbar button.active');
    let page = 'home'; // default
    if (activeBtn) {
        const pageName = activeBtn.getAttribute('onclick').match(/showPage\('(\w+)'\)/);
        if (pageName && pageName[1]) {
            page = pageName[1];
        }
    }
    showPage(page);
}


// Sahifalarni ko'rsatish
function showPage(pageName) {
  // Ro'yxatdan o'tish kerak bo'lgan sahifalar
  const protectedPages = ['profile', 'favorites', 'cart'];
  if (protectedPages.includes(pageName) && !isRegistered) {
    requireRegistration(() => showPage(pageName));
    return;
  }

  document.getElementById('loading').classList.add('hidden');
  const main = document.getElementById('main');
  main.classList.remove('hidden');
  const navbar = document.getElementById('navbar');
  navbar.classList.remove('hidden');
  
  let content = '';
  switch (pageName) {
    case 'home':
      content = getHomeContent();
      break;
    case 'profile':
      content = getProfileContent();
      break;
    default:
      content = `<h2>${t('page_not_ready', { pageName })}</h2>`;
  }
  main.innerHTML = content;

  // Event listenerlarni qayta bog'lash
  if (pageName === 'home') {
    initCarousel();
    loadProducts();
    document.getElementById('location')?.addEventListener('click', () => {
      WebApp.openTelegramLink('https://t.me/uzrailway_bot'); // Misol uchun
    });
  } else if (pageName === 'profile') {
      document.getElementById('edit-profile-btn')?.addEventListener('click', toggleProfileEdit);
      document.getElementById('lang-uz-btn')?.addEventListener('click', () => setLanguage('uz'));
      document.getElementById('lang-ru-btn')?.addEventListener('click', () => setLanguage('ru'));
  }

  updateNavbar(pageName);
}

function updateNavbar(pageName) {
    document.querySelectorAll('.navbar button').forEach(btn => btn.classList.remove('active'));
    const activeBtn = [...document.querySelectorAll('.navbar button')].find(btn =>
        btn.getAttribute('onclick')?.includes(`showPage('${pageName}')`)
    );
    activeBtn?.classList.add('active');
}

// Asosiy sahifa kontenti
function getHomeContent() {
  const displayName = isRegistered ? (currentUserData.first_name || user.first_name) : t('guest');
  return `
    <header class="header">
      <div class="logo">🛒 Amazing Store</div>
      <div class="user-greeting">${t('home_greeting', { name: displayName })}</div>
      <input type="text" placeholder="${t('search_placeholder')}" ${isRegistered ? '' : 'disabled'}>
      <button id="location">${t('pickup_location')}</button>
    </header>
    <div class="carousel" id="carousel">
      <img src="https://via.placeholder.com/375x150/4a90e2/ffffff?text=Banner+1" class="slide active">
      <img src="https://via.placeholder.com/375x150/50c878/ffffff?text=Banner+2" class="slide">
      <img src="https://via.placeholder.com/375x150/ff6f61/ffffff?text=Banner+3" class="slide">
    </div>
    <h3>${t('popular_products')}</h3>
    <div class="products-grid" id="products"></div>
  `;
}

// Profil sahifasi kontenti
function getProfileContent() {
    const { first_name = '', last_name = '', phone = '' } = currentUserData;
    const phoneParts = { code: '+998', number: '' };
    if (phone) {
        if (phone.startsWith('+7')) {
            phoneParts.code = '+7';
            phoneParts.number = phone.substring(2);
        } else if (phone.startsWith('+1')) {
            phoneParts.code = '+1';
            phoneParts.number = phone.substring(2);
        } else {
            phoneParts.code = '+998';
            phoneParts.number = phone.startsWith('+998') ? phone.substring(4) : phone;
        }
    }

    return `
    <div class="profile-page">
        <h2>${t('profile_title')}</h2>
        
        <div class="profile-section">
            <h3>${t('profile_info')}</h3>
            <form id="profile-form" class="disabled">
                <div class="form-group">
                    <label for="firstName">${t('first_name_placeholder')}</label>
                    <input type="text" id="firstName" value="${first_name}" disabled>
                </div>
                <div class="form-group">
                    <label for="lastName">${t('last_name_placeholder')}</label>
                    <input type="text" id="lastName" value="${last_name || ''}" disabled>
                </div>
                <div class="form-group">
                    <label for="phone">${t('phone_placeholder')}</label>
                    <div class="phone-input">
                        <select id="countryCode" disabled>
                            <option value="+998" ${phoneParts.code === '+998' ? 'selected' : ''}>🇺🇿 +998</option>
                            <option value="+7" ${phoneParts.code === '+7' ? 'selected' : ''}>🇷🇺 +7</option>
                            <option value="+1" ${phoneParts.code === '+1' ? 'selected' : ''}>🇺🇸 +1</option>
                        </select>
                        <input type="tel" id="phone" value="${phoneParts.number}" placeholder="${t('phone_placeholder')}" disabled>
                    </div>
                </div>
                <button type="button" id="edit-profile-btn">${t('edit_button')}</button>
            </form>
        </div>

        <div class="profile-section">
            <h3>${t('profile_language')}</h3>
            <div class="lang-switcher">
                <button id="lang-uz-btn" class="${currentLang === 'uz' ? 'active' : ''}">O'zbekcha</button>
                <button id="lang-ru-btn" class="${currentLang === 'ru' ? 'active' : ''}">Русский</button>
            </div>
        </div>
    </div>
    `;
}

function toggleProfileEdit(event) {
    const form = document.getElementById('profile-form');
    const isEditing = !form.classList.contains('disabled');
    const button = event.target;

    if (isEditing) {
        // Saqlash logikasi
        saveProfile();
    } else {
        // Tahrirlash rejimiga o'tish
        form.classList.remove('disabled');
        form.querySelectorAll('input, select').forEach(el => el.disabled = false);
        button.textContent = t('save_button');
    }
}

async function saveProfile() {
    const form = document.getElementById('profile-form');
    const button = document.getElementById('edit-profile-btn');

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const countryCode = document.getElementById('countryCode').value;
    const phone = document.getElementById('phone').value.trim();
    const fullPhone = countryCode + phone.replace(/\s/g, '');

    if (!firstName || !fullPhone) {
        WebApp.showAlert(t('please_fill_fields'));
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: user.id,
                first_name: firstName,
                last_name: lastName,
                phone: fullPhone,
                username: user.username || null
            })
        });

        if (response.ok) {
            currentUserData = await response.json();
            isRegistered = true;
            WebApp.showAlert(t('profile_saved'));
            
            // Tahrirlash rejimini o'chirish
            form.classList.add('disabled');
            form.querySelectorAll('input, select').forEach(el => el.disabled = true);
            button.textContent = t('edit_button');

        } else {
            throw new Error(t('error_saving'));
        }
    } catch (err) {
        WebApp.showAlert(`❌ ${t('error_saving')}: ${err.message}`);
    }
}


// Karusel
function initCarousel() {
// ... existing code ...
  let startX = 0;
  let currentSlide = 0;
  const slides = document.querySelectorAll('.slide');
  if (slides.length === 0) return;

  const updateCarousel = () => {
    slides.forEach((slide, i) => {
      slide.style.transform = `translateX(${(i - currentSlide) * 100}%)`;
    });
  };
  
  // Avtomatik o'tish
  const autoSlide = setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
  }, 4000);

  // Surish (touch)
  const carousel = document.getElementById('carousel');
  if (!carousel) return;

  carousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    clearInterval(autoSlide); // Surish boshlanganda avto-o'tishni to'xtatish
  });
  carousel.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (diff > 50) { // O'ngga surish
      currentSlide = (currentSlide + 1) % slides.length;
    } else if (diff < -50) { // Chapga surish
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    }
    updateCarousel();
  });
  
  updateCarousel();
}

// Tovarlar ro'yxati
async function loadProducts() {
  const productsContainer = document.getElementById('products');
  if (!productsContainer) return;
  productsContainer.innerHTML = `<p>${t('loading')}</p>`;

  try {
    const res = await fetch(`${backendUrl}/api/products?lang=${currentLang}`);
    const products = await res.json();
    
    if (products.length === 0) {
        productsContainer.innerHTML = `<p>Hozircha mahsulotlar yo'q.</p>`;
        return;
    }

    const productsHtml = products.map(p => `
      <div class="product-card" onclick="viewProduct(${p.id})">
        <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
        <div class="like-btn" onclick="event.stopPropagation(); toggleLike(${p.id}, this)">♡</div>
        <h4>${p.name}</h4>
        <p>
          <span class="price">${p.display_price} so'm</span>
          ${p.sale_price ? `<span class="old-price">${p.price} so'm</span>` : ''}
        </p>
        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id})">${t('nav_cart')}</button>
      </div>
    `).join('');

    productsContainer.innerHTML = productsHtml;
  } catch (err) {
    console.error(err);
    productsContainer.innerHTML = `<p>${t('products_not_loaded')}</p>`;
  }
}

// Harakatdan oldin ro'yxatdan o'tishni talab qilish
function requireRegistration(callback) {
// ... existing code ...
  if (isRegistered) {
    callback();
  } else {
    openModal();
    window.pendingAction = callback;
  }
}

// Modal oynalar
function openModal() {
  const modal = document.getElementById('registerModal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${t('fill_profile_title')}</h3>
      <input type="text" id="regFirstName" placeholder="${t('first_name_placeholder')}" value="${user.first_name || ''}" required>
      <input type="text" id="regLastName" placeholder="${t('last_name_placeholder')}" value="${user.last_name || ''}">
      <div class="phone-input">
        <select id="regCountryCode">
          <option value="+998">🇺🇿 +998</option>
          <option value="+7">🇷🇺 +7</option>
          <option value="+1">🇺🇸 +1</option>
        </select>
        <input type="tel" id="regPhone" placeholder="${t('phone_placeholder')}" required>
      </div>
      <button onclick="registerUser()">${t('save_button')}</button>
      <button onclick="closeModal()">${t('cancel_button')}</button>
    </div>
  `;
}
function closeModal() {
  document.getElementById('registerModal').classList.add('hidden');
}

// Ro'yxatdan o'tish
async function registerUser() {
  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName = document.getElementById('regLastName').value.trim();
  const countryCode = document.getElementById('regCountryCode').value;
  const phone = document.getElementById('regPhone').value.trim();
  const fullPhone = countryCode + phone.replace(/\s/g, '');

  if (!firstName || !fullPhone) {
    WebApp.showAlert(t('please_fill_fields'));
    return;
  }

  try {
    const response = await fetch(`${backendUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone: fullPhone,
        username: user.username || null
      })
    });

    if (response.ok) {
      currentUserData = await response.json();
      isRegistered = true;
      closeModal();
      WebApp.showAlert(t('profile_saved'));
      if (window.pendingAction) {
        window.pendingAction();
        delete window.pendingAction;
      }
      rerenderCurrentPage(); // Sahifani yangilash
    } else {
      throw new Error(t('error_saving'));
    }
  } catch (err) {
    WebApp.showAlert(`❌ ${t('error_saving')}: ${err.message}`);
  }
}

// `viewProduct` va `toggleLike` funksiyalari
function viewProduct(id) {
  WebApp.showAlert(t('product_details_not_ready', { id }));
}
function toggleLike(id, element) {
    element.classList.toggle('liked');
    element.textContent = element.classList.contains('liked') ? '❤️' : '♡';
    // WebApp.showAlert(t('added_to_favorites', { id }));
}

function addToCart(id) {
    // Savatga qo'shish logikasi...
    WebApp.MainButton.setText(t('confirm_order'));
    WebApp.MainButton.show();
    WebApp.onEvent('mainButtonClicked', () => {
        WebApp.showAlert(`Buyurtma #${id} rasmiylashtirildi!`);
        WebApp.MainButton.hide();
    });
}