// ===== Global Variables =====
let map;
let earthquakeLayer;
let tectonicLayer;
let earthquakeData = [];
let currentBasemap;
let timelineChart;
let magnitudeChart;

// ===== Basemap Definitions =====
const basemaps = {
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 19
    }),
    terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenTopoMap',
        maxZoom: 17
    }),
    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
    })
};

// ===== Color Functions =====
function getMagnitudeColor(mag) {
    if (mag >= 7) return '#9b59b6';
    if (mag >= 6) return '#e74c3c';
    if (mag >= 5) return '#e67e22';
    if (mag >= 4) return '#f1c40f';
    return '#2ecc71';
}

function getMagnitudeRadius(mag) {
    if (mag >= 7) return 18;
    if (mag >= 6) return 14;
    if (mag >= 5) return 11;
    if (mag >= 4) return 8;
    return 5;
}

// ===== Initialize Map =====
function initMap() {
    map = L.map('map', {
        center: [21.5, 96],
        zoom: 7,
        zoomControl: true
    });

    currentBasemap = basemaps.dark;
    currentBasemap.addTo(map);

    // Initialize layer groups
    earthquakeLayer = L.layerGroup().addTo(map);
    tectonicLayer = L.layerGroup().addTo(map);
}

// ===== Load Earthquake Data =====
async function loadEarthquakeData() {
    try {
        const response = await fetch('query.json');
        const data = await response.json();
        earthquakeData = data.features;

        updateStatistics();
        updateMagnitudeDistribution();
        displayEarthquakes(earthquakeData);
        displayMajorEvents();
        createCharts();

    } catch (error) {
        console.error('Error loading earthquake data:', error);
    }
}

// ===== Load Tectonic Data =====
async function loadTectonicData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/drtinkooo/myanmar-earthquake-archive/main/Myanmar_Tectonic_Map_2011.geojson');
        const data = await response.json();

        L.geoJSON(data, {
            style: {
                color: '#ff6b6b',
                weight: 2,
                opacity: 0.7,
                dashArray: '5, 5'
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties) {
                    const name = feature.properties.Name || feature.properties.name || 'Tectonic Lineament';
                    layer.bindPopup(`<div class="popup-title">${name}</div>`);
                }
            }
        }).addTo(tectonicLayer);

    } catch (error) {
        console.error('Error loading tectonic data:', error);
    }
}

// ===== Display Earthquakes =====
function displayEarthquakes(data) {
    earthquakeLayer.clearLayers();

    data.forEach(feature => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        const mag = props.mag;
        const color = getMagnitudeColor(mag);
        const radius = getMagnitudeRadius(mag);

        const marker = L.circleMarker([coords[1], coords[0]], {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.8
        });

        const date = new Date(props.time).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        marker.bindPopup(`
            <div class="popup-title">M ${mag.toFixed(1)} Earthquake</div>
            <div class="popup-info">
                <strong>Location:</strong> ${props.place}<br>
                <strong>Time:</strong> ${date}<br>
                <strong>Depth:</strong> ${coords[2] ? coords[2].toFixed(1) : 'N/A'} km<br>
                <strong>ID:</strong> ${feature.id}
            </div>
        `);

        marker.addTo(earthquakeLayer);
    });

    document.getElementById('filteredCount').textContent = `${data.length} events`;
}

// ===== Update Statistics =====
function updateStatistics() {
    const mags = earthquakeData.map(f => f.properties.mag);
    const depths = earthquakeData.map(f => f.geometry.coordinates[2] || 10);

    const total = earthquakeData.length;
    const maxMag = Math.max(...mags);
    const avgMag = (mags.reduce((a, b) => a + b, 0) / mags.length).toFixed(1);
    const avgDepth = (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1);

    document.getElementById('totalEvents').textContent = total;
    document.getElementById('maxMagnitude').textContent = maxMag.toFixed(1);
    document.getElementById('avgMagnitude').textContent = avgMag;
    document.getElementById('avgDepth').textContent = avgDepth;

    document.getElementById('headerTotal').textContent = total;
    document.getElementById('headerMaxMag').textContent = `M ${maxMag.toFixed(1)}`;
}

// ===== Update Magnitude Distribution =====
function updateMagnitudeDistribution() {
    const ranges = [
        { label: 'M 2.5-3.9', min: 2.5, max: 3.9, color: '#2ecc71' },
        { label: 'M 4.0-4.9', min: 4.0, max: 4.9, color: '#f1c40f' },
        { label: 'M 5.0-5.9', min: 5.0, max: 5.9, color: '#e67e22' },
        { label: 'M 6.0-6.9', min: 6.0, max: 6.9, color: '#e74c3c' },
        { label: 'M 7.0+', min: 7.0, max: 10, color: '#9b59b6' }
    ];

    const counts = ranges.map(range => ({
        ...range,
        count: earthquakeData.filter(f => f.properties.mag >= range.min && f.properties.mag <= range.max).length
    }));

    const maxCount = Math.max(...counts.map(c => c.count));
    const container = document.getElementById('magnitudeBars');
    container.innerHTML = '';

    counts.forEach(item => {
        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const row = document.createElement('div');
        row.className = 'mag-bar-row';
        row.innerHTML = `
            <span class="mag-label">${item.label}</span>
            <div class="mag-bar-container">
                <div class="mag-bar" style="width: ${percentage}%; background: ${item.color};">
                    <span class="mag-count">${item.count}</span>
                </div>
            </div>
        `;
        container.appendChild(row);
    });
}

// ===== Display Major Events =====
function displayMajorEvents() {
    const majorEvents = earthquakeData
        .filter(f => f.properties.mag >= 5.0)
        .sort((a, b) => b.properties.mag - a.properties.mag);

    const container = document.getElementById('majorEventsList');
    container.innerHTML = '';

    if (majorEvents.length === 0) {
        container.innerHTML = '<div class="loading">No major events found</div>';
        return;
    }

    majorEvents.forEach(feature => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        const date = new Date(props.time).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const isCritical = props.mag >= 6.0;
        const item = document.createElement('div');
        item.className = `event-item ${isCritical ? 'critical' : 'major'}`;
        item.innerHTML = `
            <div class="event-header">
                <span class="event-mag ${isCritical ? 'critical' : 'major'}">M ${props.mag.toFixed(1)}</span>
                <span class="event-date">${date}</span>
            </div>
            <div class="event-place">${props.place}</div>
        `;

        item.addEventListener('click', () => {
            map.flyTo([coords[1], coords[0]], 10, { duration: 1 });
        });

        container.appendChild(item);
    });
}

// ===== Create Charts =====
function createCharts() {
    createTimelineChart();
    createMagnitudeChart();
}

function createTimelineChart() {
    const ctx = document.getElementById('timelineChart').getContext('2d');

    // Group by month
    const monthCounts = {};
    earthquakeData.forEach(f => {
        const date = new Date(f.properties.time);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(monthCounts).sort();
    const labels = sortedKeys.map(k => {
        const [year, month] = k.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });

    timelineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Events',
                data: sortedKeys.map(k => monthCounts[k]),
                backgroundColor: 'rgba(0, 212, 255, 0.6)',
                borderColor: 'rgba(0, 212, 255, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: '#a0a0b0', font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    ticks: { color: '#a0a0b0' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

function createMagnitudeChart() {
    const ctx = document.getElementById('magnitudeChart').getContext('2d');

    const sortedData = [...earthquakeData].sort((a, b) => a.properties.time - b.properties.time);

    magnitudeChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Magnitude',
                data: sortedData.map(f => ({
                    x: new Date(f.properties.time),
                    y: f.properties.mag
                })),
                backgroundColor: sortedData.map(f => getMagnitudeColor(f.properties.mag)),
                pointRadius: sortedData.map(f => Math.max(3, f.properties.mag - 2)),
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `M ${ctx.parsed.y.toFixed(1)}`
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: { month: 'MMM yy' }
                    },
                    ticks: { color: '#a0a0b0', font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    min: 2,
                    max: 8,
                    ticks: { color: '#a0a0b0' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Magnitude Filter
    const magFilter = document.getElementById('magFilter');
    const filterValue = document.getElementById('filterValue');

    magFilter.addEventListener('input', (e) => {
        const minMag = parseFloat(e.target.value);
        filterValue.textContent = minMag.toFixed(1);
        const filtered = earthquakeData.filter(f => f.properties.mag >= minMag);
        displayEarthquakes(filtered);
    });

    // Layer Toggles
    document.getElementById('toggleEarthquakes').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(earthquakeLayer);
        } else {
            map.removeLayer(earthquakeLayer);
        }
    });

    document.getElementById('toggleFaults').addEventListener('change', (e) => {
        if (e.target.checked) {
            map.addLayer(tectonicLayer);
        } else {
            map.removeLayer(tectonicLayer);
        }
    });

    // Basemap Buttons
    document.querySelectorAll('.basemap-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.basemap-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const basemapName = btn.dataset.basemap;
            map.removeLayer(currentBasemap);
            currentBasemap = basemaps[basemapName];
            currentBasemap.addTo(map);
        });
    });
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadEarthquakeData();
    loadTectonicData();
    setupEventListeners();
});
