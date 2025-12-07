// API configuration
const API_BASE_URL = '/api/seller';

// Telegram Web App initialization
let tg = null;
let isTelegramContext = false;

if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    tg = window.Telegram.WebApp;
    isTelegramContext = true;
    tg.ready();
    
    // Platformani aniqlash
    const platform = tg.platform || 'unknown';
    console.log('🔍 Platform detected:', platform);
    
    // Desktop platformalari
    const isDesktop = platform === 'desktop' || platform === 'tdesktop' || platform === 'web';
    
    // Mobile platformalari
    const isMobile = platform === 'ios' || platform === 'android' || platform === 'unknown';
    
    console.log('🔍 isDesktop:', isDesktop, 'isMobile:', isMobile);
    
    // Desktop'da fullscreen rejimini yoqish
    if (isDesktop) {
        console.log('🖥️ Desktop detected - enabling fullscreen mode');
        tg.expand();
        if (tg.requestFullscreen) {
            tg.requestFullscreen();
        }
    } else {
        // Mobile'da fullsize rejimida qoladi (bot lentalari ko'rinib turadi)
        // tg.expand() chaqirilmaydi
        console.log('📱 Mobile detected - keeping fullsize mode (bot lentalari ko\'rinib turadi)');
        // Expand() ni chaqirmaymiz - bu fullsize rejimida qoladi
    }
    
    // Viewport sozlamalari
    if (tg.setHeaderColor) {
        tg.setHeaderColor('#030303');
    }
    if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#258de8');
    }
    if (tg.setBottomBarColor) {
        tg.setBottomBarColor('#181818');
    }
    
    // Yopishdan oldin tasdiqlash
    tg.enableClosingConfirmation();
    
    console.log('✅ Telegram Web App initialized - Platform:', platform, isDesktop ? '(Fullscreen)' : '(Fullsize - bot lentalari ko\'rinib turadi)');
}

// Get Telegram auth data
function getTelegramAuthData() {
    if (!tg || !tg.initData) {
        return null;
    }
    return tg.initData;
}

// Check if running in Telegram Web App context
function isInTelegramContext() {
    return isTelegramContext && tg !== null;
}

// API request with authentication
async function apiRequest(endpoint, options = {}) {
    const authData = getTelegramAuthData();
    
    if (!authData) {
        throw new Error('Telegram authentication data not available');
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-telegram-data': authData,
        ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401 || response.status === 403) {
        // Authentication failed
        showAuthError();
        throw new Error('Authentication failed');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || 'API request failed');
    }

    return response.json();
}

// Show authentication error
function showAuthError() {
    const authError = document.getElementById('auth-error');
    if (authError) {
        authError.classList.add('show');
    }
    // Hide main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    // Hide navigation
    const nav = document.querySelector('nav');
    if (nav) {
        nav.style.display = 'none';
    }
}

// Hide authentication error (when admin access granted)
function hideAuthError() {
    const authError = document.getElementById('auth-error');
    if (authError) {
        authError.classList.remove('show');
    }
    // Show main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    // Show navigation
    const nav = document.querySelector('nav');
    if (nav) {
        nav.style.display = 'flex';
    }
}

// Check admin status on page load
async function checkAdminStatus() {
    // Agar Telegram Web App kontekstida bo'lmasa, to'g'ridan-to'g'ri URL orqali kirilgan
    if (!isInTelegramContext()) {
        console.log('❌ Not in Telegram context');
        showAuthError();
        return false;
    }

    try {
        const authData = getTelegramAuthData();
        if (!authData) {
            console.log('❌ No Telegram auth data');
            showAuthError();
            return false;
        }

        console.log('✅ Checking admin status...');
        const response = await fetch(`${API_BASE_URL}/check-admin`, {
            headers: {
                'x-telegram-data': authData
            }
        });

        console.log('Response status:', response.status);

        if (response.status === 401 || response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Admin check failed:', errorData);
            showAuthError();
            return false;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Response not OK:', errorData);
            showAuthError();
            return false;
        }

        const data = await response.json();
        console.log('✅ Admin check result:', data);
        
        if (data.is_admin === true) {
            console.log('✅ Admin access granted');
            hideAuthError(); // Xatolik ko'rsatilgan bo'lsa, yashirish
            return true;
        } else {
            console.log('❌ User is not admin');
            showAuthError();
            return false;
        }
    } catch (error) {
        console.error('❌ Admin check error:', error);
        showAuthError();
        return false;
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiRequest, checkAdminStatus, getTelegramAuthData, isInTelegramContext };
}
