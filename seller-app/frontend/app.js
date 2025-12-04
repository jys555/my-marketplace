// Marketplace Selector
let selectedMarketplace = {
    id: 'amazing_store',
    name: 'AMAZING_STORE'
};

function openMarketplaceSelector() {
    const modal = document.getElementById('marketplace-modal');
    modal.classList.add('active');
}

function closeMarketplaceSelector(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('marketplace-modal');
    modal.classList.remove('active');
}

function selectMarketplace(id, name) {
    selectedMarketplace = { id, name };
    document.getElementById('selected-marketplace').textContent = name;
    closeMarketplaceSelector();
    loadDashboardData();
}

// Dashboard Data Loading
async function loadDashboardData() {
    // Load chart data
    loadChartData();
    
    // Load monthly stats
    loadMonthlyStats();
}

function loadChartData() {
    const ctx = document.getElementById('analytics-chart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (window.analyticsChart) {
        window.analyticsChart.destroy();
    }
    
    const monthSelector = document.getElementById('month-selector');
    const selectedMonth = monthSelector.value;
    
    // Generate daily data for the entire month
    const now = new Date();
    let year, month;
    
    if (selectedMonth === 'current') {
        year = now.getFullYear();
        month = now.getMonth();
    } else {
        // Previous month
        year = now.getFullYear();
        month = now.getMonth() - 1;
        if (month < 0) {
            month = 11;
            year--;
        }
    }
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Day names in Uzbek
    const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 
                       'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    
    // Generate data for each day of the month
    const fullDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = dayNames[date.getDay()];
        const monthName = monthNames[month];
        
        // Generate random data (will be replaced with API call)
        // More realistic data distribution
        const ordersCount = Math.floor(Math.random() * 20) + 5; // 5-25 orders
        // Orders sum between 300k-900k so'm (like in the image)
        const ordersSum = Math.floor(Math.random() * 600000) + 300000;
        
        fullDates.push({
            short: `${day}.${month + 1}`,
            full: `${day} ${monthName}, ${dayName}`,
            date: date.toISOString().split('T')[0],
            ordersCount: ordersCount,
            ordersSum: ordersSum
        });
    }
    
    const dates = fullDates.map(d => d.short);
    const ordersSum = fullDates.map(d => d.ordersSum);
    
    window.analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Buyurtmalar summasi',
                    data: ordersSum,
                    backgroundColor: '#FFC107',
                    yAxisID: 'y',
                }
            ]
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
                    // Don't hide immediately, use delay
                    scheduleTooltipHide();
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false // Disable default tooltip
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15, // Show approximately 15 dates
                        callback: function(value, index) {
                            // Show every few days to avoid crowding
                            const skip = Math.ceil(dates.length / 15);
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
                        stepSize: 200000, // 200k increments like in the image
                        maxTicksLimit: 6, // Show 6 ticks (0, 200k, 400k, 600k, 800k, 1M)
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
                    max: 1000000 // 1 million so'm max like in the image
                }
            }
        }
    });
    
    // Store full dates for tooltip
    window.chartFullDates = fullDates;
}

function loadMonthlyStats() {
    const monthSelector = document.getElementById('month-selector');
    const selectedMonth = monthSelector.value;
    
    // Mock data - will be replaced with API call
    if (selectedMonth === 'current') {
        document.getElementById('monthly-revenue').textContent = '2.3 million so\'m';
        document.getElementById('monthly-orders').textContent = '34';
        document.getElementById('monthly-profit').textContent = '450,000 so\'m';
    } else {
        document.getElementById('monthly-revenue').textContent = '2.1 million so\'m';
        document.getElementById('monthly-orders').textContent = '31';
        document.getElementById('monthly-profit').textContent = '420,000 so\'m';
    }
}

// Chart Tooltip Functions
let tooltipHideTimeout = null;

function showChartTooltip(event, data, bar, chart) {
    // Clear any pending hide timeout
    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = null;
    }
    
    const tooltip = document.getElementById('chart-tooltip-modal');
    const chartContainer = document.querySelector('.chart-container');
    const chartCanvas = document.getElementById('analytics-chart');
    const chartRect = chartCanvas.getBoundingClientRect();
    const containerRect = chartContainer.getBoundingClientRect();
    
    // Get chart scales to find top of chart area (where Y-axis max is)
    const chartArea = chart.chartArea;
    const topY = chartArea.top; // Top of chart area (where max Y value is)
    const bottomY = chartArea.bottom; // Bottom of chart area (where Y=0 is)
    
    // Get bar position
    const barX = bar.x;
    const barY = bar.y; // This is the top of the bar
    const barHeight = bar.height;
    
    // Update tooltip content
    document.getElementById('tooltip-date').textContent = data.full;
    document.getElementById('tooltip-orders-count').textContent = data.ordersCount;
    document.getElementById('tooltip-orders-sum').textContent = data.ordersSum.toLocaleString() + ' so\'m';
    
    // Make tooltip visible first to get accurate height
    tooltip.style.display = 'block';
    const tooltipHeight = tooltip.offsetHeight; // Get actual height
    const tooltipWidth = tooltip.offsetWidth; // Get actual width
    
    // Position tooltip on the right side of the bar
    // Tooltip's half height should be at the top of the bar (barY)
    const tooltipX = barX + 2; // Right side of the bar, 2px from vertical line
    const tooltipY = barY - (tooltipHeight / 2); // Tooltip's half height at bar top
    
    // Set tooltip position - always relative to bar, never adjust for container bounds
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
    
    // Show vertical line from top of chart area (topY) to bottom of bar (barBottom)
    const barBottom = barY + barHeight;
    const lineHeight = barBottom - topY;
    showVerticalLine(barX, topY, lineHeight, chartContainer);
    
    // Check if tooltip goes outside right edge, if so show on left side
    // But keep vertical position fixed (barY - tooltipHeight/2)
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > containerRect.right) {
        tooltip.style.left = (barX - tooltipWidth - 2) + 'px';
    }
    
    // IMPORTANT: Tooltip vertical position is ALWAYS FIXED at barY - tooltipHeight/2
    // Never adjust it, even if it goes outside container bounds
    // This ensures tooltip's half height is always exactly at bar top
    // Re-apply the position to ensure it's correct
    tooltip.style.top = (barY - tooltipHeight / 2) + 'px';
    // If it would go outside, adjust horizontally but keep at top
}

function showVerticalLine(x, startY, height, container) {
    let line = document.getElementById('chart-vertical-line');
    if (!line) {
        line = document.createElement('div');
        line.id = 'chart-vertical-line';
        line.className = 'chart-vertical-line';
        container.appendChild(line);
    }
    // Position line at bar X position, starting from top of chart area
    line.style.left = x + 'px';
    line.style.top = startY + 'px';
    line.style.height = height + 'px';
    line.style.display = 'block';
}

function hideVerticalLine() {
    const line = document.getElementById('chart-vertical-line');
    if (line) {
        line.style.display = 'none';
    }
}

function scheduleTooltipHide() {
    // Clear existing timeout
    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
    }
    
    // Schedule hide after 3-4 seconds
    tooltipHideTimeout = setTimeout(() => {
        hideChartTooltip();
    }, 3000);
}

function hideChartTooltip() {
    const tooltip = document.getElementById('chart-tooltip-modal');
    tooltip.style.display = 'none';
    hideVerticalLine();
    
    if (tooltipHideTimeout) {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = null;
    }
}

// Initialize on page load (only if not already initialized)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

function initializeApp() {
    console.log('📊 Initializing Seller App dashboard...');
    
    // Load dashboard data
    if (typeof loadDashboardData === 'function') {
        loadDashboardData();
    } else {
        console.warn('⚠️ loadDashboardData function not found');
    }
    
    // Month selector change
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
        monthSelector.addEventListener('change', (e) => {
            if (typeof loadChartData === 'function') {
                loadChartData();
            }
            if (typeof loadMonthlyStats === 'function') {
                loadMonthlyStats();
            }
        });
    }
    
    // Hide tooltip when mouse leaves chart (with delay)
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        chartContainer.addEventListener('mouseleave', () => {
            if (typeof scheduleTooltipHide === 'function') {
                scheduleTooltipHide();
            }
        });
    }
}

