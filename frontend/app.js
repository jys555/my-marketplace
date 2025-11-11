// Backend URL (Railway)
const backendUrl = 'https://my-marketplace-production.up.railway.app';

// Telegram foydalanuvchisi
const WebApp = window.Telegram.WebApp;
const user = WebApp.initDataUnsafe?.user;
let isRegistered = false;

// Dastlabki tekshirish
if (!user) {
  document.getElementById('loading').innerText = '⚠️ Telegram ichida ochilmadi.';
} else {
  checkRegistration();
}

// Server orqali ro'yxatdan o'tganligini tekshirish
async function checkRegistration() {
  try {
    const res = await fetch(`${backendUrl}/api/users/check/${user.id}`);
    const data = await res.json();
    isRegistered = data.exists;
    showHome(); // Bitta asosiy sahifa
  } catch (err) {
    console.error("Xatolik:", err);
    document.getElementById('loading').innerText = '⚠️ Server bilan aloqada xatolik.';
  }
}

// Bitta asosiy sahifa — guest ham, ro'yxatdan o'tgan ham shu ko'rinishda
function showHome() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('main').classList.remove('hidden');
  document.getElementById('navbar').classList.remove('hidden');

  // Foydalanuvchi ismini ko'rsatish (agar ro'yxatdan o'tgan bo'lsa)
  const displayName = isRegistered ? user.first_name : 'Mehmon';

  document.getElementById('main').innerHTML = `
    <header class="header">
      <div class="logo">🛒 Amazing Store</div>
      <div class="user-greeting">Salom, <strong>${displayName}</strong>!</div>
      <input type="text" placeholder="Mahsulotlarni toping..." ${isRegistered ? '' : 'disabled'}>
      <button id="location">Buyerdan olib ketish mumkin</button>
    </header>

    <div class="carousel" id="carousel">
      <img src="https://via.placeholder.com/375x150/4a90e2/ffffff?text=Banner+1" class="slide active">
      <img src="https://via.placeholder.com/375x150/50c878/ffffff?text=Banner+2" class="slide">
      <img src="https://via.placeholder.com/375x150/ff6f61/ffffff?text=Banner+3" class="slide">
    </div>

    <h3>🔥 Mashhur tovarlar</h3>
    <div class="products-grid" id="products"></div>
  `;

  // Har doim navigatsiya belgilangan bo'lsin
  document.querySelectorAll('.navbar button').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.navbar button').classList.add('active'); // Home aktiv

  initCarousel();
  loadProducts();

  // Lokatsiya tugmasi
  document.getElementById('location')?.addEventListener('click', () => {
    WebApp.openTelegramLink('https://t.me/nearby');
  });
}

// Navigatsiya — boshqa sahifalar
function showPage(pageName) {
  if (!isRegistered && pageName !== 'home') {
    requireRegistration(() => showPage(pageName));
    return;
  }

  if (pageName === 'home') {
    showHome();
    return;
  }

  document.getElementById('loading').classList.add('hidden');
  document.getElementById('main').classList.remove('hidden');
  document.getElementById('navbar').classList.remove('hidden');

  let content = '';
  if (pageName === 'profile') {
    content = `<h2>👤 Profilim</h2><p>Salom, ${user.first_name}!</p>`;
  } else {
    content = `<h2>${pageName} sahifasi hali tayyor emas.</h2>`;
  }

  document.getElementById('main').innerHTML = content;

  // Navigatsiyani yangilash
  document.querySelectorAll('.navbar button').forEach(btn => btn.classList.remove('active'));
  const activeBtn = [...document.querySelectorAll('.navbar button')].find(btn =>
    btn.innerHTML.includes(
      pageName === 'home' ? '🏠' :
      pageName === 'catalog' ? '🛍️' :
      pageName === 'favorites' ? '❤️' :
      pageName === 'cart' ? '🛒' : '👤'
    )
  );
  activeBtn?.classList.add('active');
}

// Karusel (avtomatik + surish)
function initCarousel() {
  let startX = 0;
  let currentSlide = 0;
  const slides = document.querySelectorAll('.slide');
  
  // Avtomatik o'tish
  setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
  }, 4000);

  // Surish (touch)
  const carousel = document.getElementById('carousel');
  if (!carousel) return; // Agar element yo'q bo'lsa — xavfsizlik

  carousel.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  carousel.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (diff > 50) {
      currentSlide = (currentSlide + 1) % slides.length;
    } else if (diff < -50) {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    }
    updateCarousel();
  });
}

function updateCarousel() {
  document.querySelectorAll('.slide').forEach((slide, i) => {
    slide.classList.toggle('active', i === currentSlide);
  });
}

// Tovarlar ro'yxati
async function loadProducts() {
  try {
    const res = await fetch(`${backendUrl}/api/products`);
    const products = await res.json();
    
    const productsHtml = products.map(p => `
      <div class="product-card" onclick="requireRegistration(() => viewProduct(${p.id}))">
        <img src="${p.image}" alt="${p.name}">
        <div class="like-btn" onclick="event.stopPropagation(); requireRegistration(() => toggleLike(${p.id}))">♡</div>
        <h4>${p.name}</h4>
        <p>
          <span class="price">${p.display_price} so'm</span>
          ${p.sale_price ? `<span class="old-price">${p.price} so'm</span>` : ''}
        </p>
      </div>
    `).join('');

    document.getElementById('products').innerHTML = productsHtml;
  } catch (err) {
    document.getElementById('products').innerHTML = '<p>❌ Tovarlar yuklanmadi</p>';
  }
}

// Harakatdan keyin ro'yxatdan o'tish
function requireRegistration(callback) {
  if (isRegistered) {
    callback();
  } else {
    openModal();
    window.pendingAction = callback;
  }
}

// Modal
function openModal() {
  document.getElementById('registerModal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('registerModal').classList.add('hidden');
}

// Ro'yxatdan o'tish
async function registerUser() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const countryCode = document.getElementById('countryCode').value;
  const phone = document.getElementById('phone').value.trim();
  const fullPhone = countryCode + phone.replace(/\s/g, '');

  if (!firstName || !fullPhone) {
    alert("Iltimos, barcha maydonlarni to'ldiring");
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
      isRegistered = true;
      closeModal();
      alert("✅ Profilingiz saqlandi!");
      if (window.pendingAction) {
        window.pendingAction();
        delete window.pendingAction;
      }
      // Ro'yxatdan keyin yana asosiy sahifaga qaytish
      showHome();
    } else {
      throw new Error("Saqlashda xatolik");
    }
  } catch (err) {
    alert("❌ Xatolik: " + err.message);
  }
}

// `viewProduct` va `toggleLike` funksiyalari (hali to'ldirilmagan)
function viewProduct(id) {
  alert(`Tovar #${id} tafsiloti hali tayyor emas.`);
}
function toggleLike(id) {
  alert(`Tovar #${id} sevimlilarga qo'shildi.`);
}