// ============================================
// Chart Manager Class
// ============================================
class ChartManager {
    constructor() {
        this.chart = null;
        this.fullDates = [];
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    create(ctx, config) {
        this.destroy();
        this.chart = new Chart(ctx, config);
        return this.chart;
    }

    getChart() {
        return this.chart;
    }
}

// ============================================
// App State
// ============================================
const AppState = {
    selectedMarketplace: {
        id: 'amazing_store',
        name: 'AMAZING_STORE'
    },
    chartManager: new ChartManager(),
    isInitialized: false,
    eventListeners: {
        initialized: false
    }
};

// ============================================
// Marketplace Selector Functions
// ============================================
function openMarketplaceSelector() {
    const modal = document.getElementById('marketplace-modal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
}

function closeMarketplaceSelector(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('marketplace-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

function selectMarketplace(id, name) {
    AppState.selectedMarketplace = { id, name };
    const selectedElement = document.getElementById('selected-marketplace');
    if (selectedElement) {
        selectedElement.textContent = name;
    }
    closeMarketplaceSelector();
    if (typeof loadDashboardData === 'function') {
        loadDashboardData();
    }
}

// ============================================
// Dashboard Data Loading
// ============================================
async function loadDashboardData() {
    try {
        loadChartData();
        loadMonthlyStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// ============================================
// Chart Data Loading
// ============================================
function loadChartData() {
    const ctx = document.getElementById('analytics-chart');
    if (!ctx) {
        console.warn('Chart canvas not found');
        return;
    }

    const monthSelector = document.getElementById('month-selector');
    if (!monthSelector) {
        console.warn('Month selector not found');
        return;
    }

    const selectedMonth = monthSelector.value;
    const now = new Date();
    let year, month;

    if (selectedMonth === 'current') {
        year = now.getFullYear();
        month = now.getMonth();
    } else {
        year = now.getFullYear();
        month = now.getMonth() - 1;
        if (month < 0) {
            month = 11;
            year--;
        }
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

    const fullDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = dayNames[date.getDay()];
        const monthName = monthNames[month];

        const ordersCount = Math.floor(Math.random() * 20) + 5;
        const ordersSum = Math.floor(Math.random() * 600000) + 300000;

        fullDates.push({
            short: `${day}.${month + 1}`,
            full: `${day} ${monthName}, ${dayName}`,
            date: date.toISOString().split('T')[0],
            ordersCount: ordersCount,
            ordersSum: ordersSum
        });
    }

    AppState.chartManager.fullDates = fullDates;
    const dates = fullDates.map(d => d.short);
    const ordersSum = fullDates.map(d => d.ordersSum);

    const isMobile = window.innerWidth <= 768;
    const chartConfig = {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Buyurtmalar summasi',
                data: ordersSum,
                backgroundColor: '#FFC107',
                yAxisID: 'y',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            onHover: (event, activeElements, chart) => {
                if (activeElements.length > 0) {
                    const element = activeElements[0];
                    const index = element.index;
                    const data = fullDates[index];
                    const bar = chart.getDatasetMeta(0).data[index];
                    showChartTooltip(event, data, bar, chart);
                } else {
                    // Mobile'da ham tooltip'ni 3 soniyada yopish
                    scheduleTooltipHide();
                }
            },
            plugins: {
                legend: {
                    display: !isMobile
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: isMobile ? 45 : 0,
                        minRotation: isMobile ? 45 : 0,
                        autoSkip: true,
                        maxTicksLimit: isMobile ? 10 : 15,
                        callback: function(value, index) {
                            const skip = Math.ceil(dates.length / (isMobile ? 10 : 15));
                            if (index % skip === 0 || index === dates.length - 1) {
                                return dates[index];
                            }
                            return '';
                        }
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                        stepSize: 200000,
                        maxTicksLimit: 6,
                        callback: function(value) {
                            if (value === 0) {
                                return 'O so\'m';
                            }
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + ' million so\'m';
                            }
                            return (value / 1000).toFixed(0) + 'k so\'m';
                        }
                    },
                    grid: {
                        color: '#f0f0f0'
                    },
                    max: 1000000
                }
            }
        }
    };

    AppState.chartManager.create(ctx, chartConfig);
}

// ============================================
// Monthly Stats Loading
// ============================================
function loadMonthlyStats() {
    const monthSelector = document.getElementById('month-selector');
    if (!monthSelector) return;

    const selectedMonth = monthSelector.value;
    const revenueEl = document.getElementById('monthly-revenue');
    const ordersEl = document.getElementById('monthly-orders');
    const profitEl = document.getElementById('monthly-profit');

    if (selectedMonth === 'current') {
        if (revenueEl) revenueEl.textContent = '2.3 million so\'m';
        if (ordersEl) ordersEl.textContent = '34';
        if (profitEl) profitEl.textContent = '450,000 so\'m';
    } else {
        if (revenueEl) revenueEl.textContent = '2.1 million so\'m';
        if (ordersEl) ordersEl.textContent = '31';
        if (profitEl) profitEl.textContent = '420,000 so\'m';
    }
}

// ============================================
// Chart Tooltip Functions
// ============================================
let tooltipHideTimeout = null;

function showChartTooltip(event, data, bar, chart) {
    // Clear any pending hide timeout
    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = null;
    }

    const tooltip = document.getElementById('chart-tooltip-modal');
    const chartContainer = document.querySelector('.chart-container');
    if (!tooltip || !chartContainer) return;

    const chartArea = chart.chartArea;
    const topY = chartArea.top;
    const barX = bar.x;
    const barY = bar.y;
    const barHeight = bar.height;

    const dateEl = document.getElementById('tooltip-date');
    const countEl = document.getElementById('tooltip-orders-count');
    const sumEl = document.getElementById('tooltip-orders-sum');

    if (dateEl) dateEl.textContent = data.full;
    if (countEl) countEl.textContent = data.ordersCount;
    if (sumEl) sumEl.textContent = data.ordersSum.toLocaleString() + ' so\'m';

    tooltip.style.display = 'block';
    tooltip.classList.add('show');
    const tooltipHeight = tooltip.offsetHeight;
    const tooltipWidth = tooltip.offsetWidth;
    
    // Mobile'da ham tooltip'ni 3 soniyada yopish
    scheduleTooltipHide();

    const tooltipX = barX + 2;
    const tooltipY = barY - (tooltipHeight / 2);

    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';

    const barBottom = barY + barHeight;
    const lineHeight = barBottom - topY;
    showVerticalLine(barX, topY, lineHeight, chartContainer);

    const tooltipRect = tooltip.getBoundingClientRect();
    const containerRect = chartContainer.getBoundingClientRect();
    if (tooltipRect.right > containerRect.right) {
        tooltip.style.left = (barX - tooltipWidth - 2) + 'px';
    }

    tooltip.style.top = (barY - tooltipHeight / 2) + 'px';
}

function showVerticalLine(x, startY, height, container) {
    let line = document.getElementById('chart-vertical-line');
    if (!line) {
        line = document.createElement('div');
        line.id = 'chart-vertical-line';
        line.className = 'chart-vertical-line';
        container.appendChild(line);
    }
    line.style.left = x + 'px';
    line.style.top = startY + 'px';
    line.style.height = height + 'px';
    line.style.display = 'block';
    line.classList.add('show');
}

function hideVerticalLine() {
    const line = document.getElementById('chart-vertical-line');
    if (line) {
        line.style.display = 'none';
        line.classList.remove('show');
    }
}

function scheduleTooltipHide() {
    // Clear existing timeout
    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = null;
    }
    
    // Schedule hide after 3 seconds (both mobile and desktop)
    tooltipHideTimeout = setTimeout(() => {
        hideChartTooltip();
    }, 3000);
}

function hideChartTooltip() {
    const tooltip = document.getElementById('chart-tooltip-modal');
    if (tooltip) {
        tooltip.style.display = 'none';
        tooltip.classList.remove('show');
    }
    hideVerticalLine();

    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = null;
    }
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
    if (AppState.eventListeners.initialized) {
        return;
    }
    AppState.eventListeners.initialized = true;

    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
        monthSelector.addEventListener('change', () => {
            loadChartData();
            loadMonthlyStats();
        });
    }

    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        // Mouse leave event (desktop)
        chartContainer.addEventListener('mouseleave', () => {
            scheduleTooltipHide();
        });
        
        // Touch end event (mobile) - tooltip'ni 3 soniyada yopish
        chartContainer.addEventListener('touchend', () => {
            scheduleTooltipHide();
        });
    }

    window.addEventListener('resize', () => {
        const chart = AppState.chartManager.getChart();
        if (chart) {
            chart.resize();
        }
    });
}

// ============================================
// App Initialization
// ============================================
function initializeApp() {
    if (AppState.isInitialized) {
        console.warn('⚠️ App already initialized');
        return;
    }

    console.log('📊 Initializing Seller App dashboard...');
    AppState.isInitialized = true;

    setupEventListeners();
    loadDashboardData();
}

// ============================================
// Auto-initialize when DOM is ready
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ============================================
// Export functions for global access
// ============================================
window.openMarketplaceSelector = openMarketplaceSelector;
window.closeMarketplaceSelector = closeMarketplaceSelector;
window.selectMarketplace = selectMarketplace;
window.loadDashboardData = loadDashboardData;
window.loadChartData = loadChartData;
window.loadMonthlyStats = loadMonthlyStats;
