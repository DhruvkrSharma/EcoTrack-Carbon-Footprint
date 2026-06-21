/* ===== EcoTrack Frontend Logic ===== */

// ── Navbar scroll & hamburger ──
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  // Active nav link
  document.querySelectorAll('.nav-links a').forEach(link => {
    const sec = document.querySelector(link.getAttribute('href'));
    if (sec) {
      const top = sec.offsetTop - 100, bot = top + sec.offsetHeight;
      link.classList.toggle('active', window.scrollY >= top && window.scrollY < bot);
    }
  });
});
hamburger?.addEventListener('click', () => navLinks.classList.toggle('open'));

// ── Scroll animations ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));

// ── Animate hero stats ──
function animateValue(el, end, duration = 1500) {
  const start = 0, startTime = performance.now();
  const isFloat = end % 1 !== 0;
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = start + (end - start) * ease;
    el.textContent = isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
setTimeout(() => {
  animateValue(document.getElementById('statTonnes'), 4.0);
  animateValue(document.getElementById('statTrees'), 60);
  animateValue(document.getElementById('statActions'), 8);
}, 500);

// ── Calculator ──
async function calculateFootprint() {
  const btn = document.getElementById('calcBtn');
  btn.textContent = '⏳ Calculating...';
  btn.disabled = true;

  const data = {
    transport_mode: document.getElementById('transportMode').value,
    transport_km: document.getElementById('transportKm').value || 0,
    energy_source: document.getElementById('energySource').value,
    electricity_kwh: document.getElementById('electricityKwh').value || 0,
    diet_type: document.getElementById('dietType').value,
    shopping_freq: document.getElementById('shoppingFreq').value,
  };

  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    displayResult(result);
  } catch (err) {
    console.error('Calc error:', err);
  } finally {
    btn.textContent = '🌍 Calculate My Footprint';
    btn.disabled = false;
  }
}

function displayResult(r) {
  // Animate number
  const numEl = document.getElementById('resultNum');
  animateValue(numEl, r.total_tonnes, 1200);
  numEl.style.color = r.rating_color;

  // Animate circle
  const circle = document.getElementById('progressCircle');
  const maxTonnes = 20;
  const pct = Math.min(r.total_tonnes / maxTonnes, 1);
  const offset = 534 - (534 * pct);
  circle.style.strokeDashoffset = offset;

  // Comparison text
  const compEl = document.getElementById('resultComparison');
  compEl.innerHTML = `<strong style="color:${r.rating_color}">${r.rating}</strong> — ${r.comparison}`;

  // Breakdown bars
  const bk = document.getElementById('resultBreakdown');
  const colors = { Transport: '#3b82f6', Energy: '#f59e0b', Food: '#22c55e', Shopping: '#a855f7' };
  const maxVal = Math.max(...Object.values(r.breakdown), 1);
  bk.innerHTML = Object.entries(r.breakdown).map(([k, v]) => `
    <div class="breakdown-item">
      <div class="breakdown-left">
        <div class="breakdown-dot" style="background:${colors[k] || '#888'}"></div>
        <span class="breakdown-label">${k}</span>
      </div>
      <div class="breakdown-bar-wrap">
        <div class="breakdown-bar" style="width:${(v / maxVal * 100)}%; background:${colors[k] || '#888'}"></div>
      </div>
      <span class="breakdown-val">${v} kg</span>
    </div>
  `).join('');
  // Animate bars
  setTimeout(() => {
    bk.querySelectorAll('.breakdown-bar').forEach(b => { b.style.width = b.style.width; });
  }, 50);

  // Update insights
  displayInsights(r.insights);
}

function displayInsights(insights) {
  const list = document.getElementById('insightsList');
  list.innerHTML = insights.map(i => `
    <div class="glass-card insight-card animate-in visible">
      <div class="insight-icon">${i.icon}</div>
      <div class="insight-body">
        <h4>${i.title}</h4>
        <p>${i.desc}</p>
      </div>
    </div>
  `).join('');
}

// ── Activity Logger ──
const activityOptions = {
  transport: [
    { value: 'car_petrol', label: 'Car (Petrol) — km' },
    { value: 'car_diesel', label: 'Car (Diesel) — km' },
    { value: 'bus', label: 'Bus — km' },
    { value: 'train', label: 'Train — km' },
    { value: 'flight_domestic', label: 'Flight (Domestic) — km' },
    { value: 'bicycle', label: 'Bicycle — km' },
  ],
  energy: [
    { value: 'electricity', label: 'Electricity — kWh' },
    { value: 'natural_gas', label: 'Natural Gas — m³' },
    { value: 'lpg', label: 'LPG — kg' },
  ],
  food: [
    { value: 'red_meat', label: 'Red Meat — kg' },
    { value: 'poultry', label: 'Poultry — kg' },
    { value: 'dairy', label: 'Dairy — kg' },
    { value: 'vegetables', label: 'Vegetables — kg' },
  ],
  shopping: [
    { value: 'clothing', label: 'Clothing — items' },
    { value: 'electronics', label: 'Electronics — items' },
    { value: 'online_order', label: 'Online Order — packages' },
    { value: 'groceries', label: 'Grocery Trip — trips' },
  ],
};

function updateLogActivities() {
  const cat = document.getElementById('logCategory').value;
  const sel = document.getElementById('logActivity');
  sel.innerHTML = (activityOptions[cat] || []).map(
    o => `<option value="${o.value}">${o.label}</option>`
  ).join('');
}

const categoryEmoji = { transport: '🚗', energy: '⚡', food: '🍽️', shopping: '🛍️' };

async function logActivity() {
  const category = document.getElementById('logCategory').value;
  const activity = document.getElementById('logActivity').value;
  const value = document.getElementById('logValue').value;
  if (!value || value <= 0) return alert('Please enter a valid amount');

  try {
    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, activity, value }),
    });
    const data = await res.json();
    renderLogList(data.activities);
    document.getElementById('logValue').value = '';
    loadWeeklyChart();
  } catch (err) {
    console.error('Log error:', err);
  }
}

function renderLogList(activities) {
  const el = document.getElementById('logList');
  if (!activities || activities.length === 0) {
    el.innerHTML = '<div class="log-empty">No activities logged yet. Start tracking!</div>';
    return;
  }
  el.innerHTML = activities.slice(0, 8).map(a => `
    <div class="log-entry">
      <div class="log-emoji">${categoryEmoji[a.category] || '📌'}</div>
      <div class="log-info">
        <div class="log-title">${a.activity}</div>
        <div class="log-detail">${a.date} at ${a.time}</div>
      </div>
      <div class="log-co2">${a.co2_kg} kg CO₂</div>
    </div>
  `).join('');
}

async function loadActivities() {
  try {
    const res = await fetch('/api/activities');
    const data = await res.json();
    renderLogList(data.activities);
  } catch (err) { /* ignore */ }
}

// ── Weekly Chart ──
async function loadWeeklyChart() {
  try {
    const res = await fetch('/api/weekly');
    const data = await res.json();
    renderWeeklyChart(data);
  } catch (err) { renderWeeklyChart({ labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values: [0,0,0,0,0,0,0] }); }
}

function renderWeeklyChart(data) {
  const maxVal = Math.max(...data.values, 1);
  const colors = ['#22c55e','#10b981','#14b8a6','#84cc16','#22c55e','#10b981','#14b8a6'];
  const chart = document.getElementById('weeklyChart');
  chart.innerHTML = data.labels.map((label, i) => `
    <div class="chart-bar-row">
      <span class="chart-bar-label">${label}</span>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${data.values[i] > 0 ? Math.max((data.values[i] / maxVal * 100), 5) : 2}%; background:${colors[i]}; opacity:${data.values[i] > 0 ? 1 : 0.2}">
          ${data.values[i] > 0 ? data.values[i].toFixed(1) : ''}
        </div>
      </div>
    </div>
  `).join('');
  const total = data.values.reduce((a, b) => a + b, 0);
  document.getElementById('weeklyTotal').textContent = total.toFixed(2) + ' kg';
}

// ── Pledge ──
function takePledge() {
  const btn = document.getElementById('pledgeBtn');
  btn.textContent = '✅ Pledge Taken!';
  btn.style.background = 'rgba(34,197,94,0.2)';
  btn.style.color = '#22c55e';
  btn.style.border = '1px solid rgba(34,197,94,0.3)';
  btn.disabled = true;
  const countEl = document.getElementById('pledgeCount');
  animateValue(countEl, 12848, 800);
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  updateLogActivities();
  loadActivities();
  loadWeeklyChart();
});
