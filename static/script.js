/* ===== EcoTrack Frontend ===== */

let lastResult = null;
let donutChart = null;
let weeklyChartObj = null;

/* ── Tab Switching ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ── Calculator ── */
async function handleCalc(e) {
  e.preventDefault();
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
    lastResult = await res.json();
    showResult(lastResult);
  } catch (err) {
    console.error(err);
  } finally {
    btn.textContent = '🌍 Calculate My Footprint';
    btn.disabled = false;
  }
}

function showResult(r) {
  document.getElementById('resultSection').style.display = 'block';
  document.getElementById('resultNum').textContent = r.total_tonnes;
  const badge = document.getElementById('resultRating');
  badge.textContent = r.rating;
  badge.style.background = r.rating_color + '20';
  badge.style.color = r.rating_color;
  document.getElementById('resultComp').textContent = r.comparison;

  // Donut chart
  const ctx = document.getElementById('donutChart').getContext('2d');
  if (donutChart) donutChart.destroy();
  const labels = Object.keys(r.breakdown);
  const vals = Object.values(r.breakdown);
  const colors = ['#3b82f6', '#d97706', '#3d9922', '#8b5cf6'];
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{ data: vals, backgroundColor: colors, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { family: "'Inter'" } } }
      }
    }
  });

  // Insights
  const grid = document.getElementById('insightsGrid');
  grid.innerHTML = (r.insights || []).map(i => `
    <div class="insight-card">
      <div class="insight-header">
        <span class="insight-icon">${i.icon}</span>
        <span class="insight-title">${i.title}</span>
      </div>
      <div class="insight-desc">${i.desc}</div>
      ${i.saving ? `<span class="insight-saving">📉 ${i.saving}</span>` : ''}
    </div>
  `).join('');
}

/* ── Compare ── */
document.querySelector('[data-tab="compare"]').addEventListener('click', loadCompare);

async function loadCompare() {
  if (!lastResult) {
    document.getElementById('compareContent').innerHTML = '<p class="empty-state">Calculate your footprint first to see comparisons.</p>';
    return;
  }
  try {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total_tonnes: lastResult.total_tonnes }),
    });
    const d = await res.json();
    renderCompare(d);
  } catch (err) { console.error(err); }
}

function renderCompare(d) {
  const maxVal = Math.max(d.user, d.us_avg, 16);
  const bars = [
    { label: 'You', val: d.user, color: '#3d9922' },
    { label: 'India avg', val: d.india_avg, color: '#2d6a0f' },
    { label: 'Global avg', val: d.global_avg, color: '#d97706' },
    { label: 'US avg', val: d.us_avg, color: '#dc2626' },
    { label: '2°C target', val: d.target_2c, color: '#0ea5e9' },
  ];
  const barsHtml = bars.map(b => `
    <div class="compare-row">
      <span class="compare-label">${b.label}</span>
      <div class="compare-track">
        <div class="compare-fill" style="width:${(b.val / maxVal * 100)}%; background:${b.color}">${b.val}t</div>
      </div>
    </div>
  `).join('');

  document.getElementById('compareContent').innerHTML = `
    <div class="compare-bar-group">${barsHtml}</div>
    <p style="text-align:center; font-size:0.85rem; color:var(--text-muted); margin:1rem 0;">
      You're better than <strong>${Math.round(d.percentile_india)}%</strong> of Indians
    </p>
    <div class="analogy-grid">
      <div class="card analogy-card">
        <div class="analogy-icon">🌳</div>
        <div class="analogy-num">${d.trees_to_offset}</div>
        <div class="analogy-label">trees needed to offset</div>
      </div>
      <div class="card analogy-card">
        <div class="analogy-icon">✈️</div>
        <div class="analogy-num">${d.flights_equivalent}</div>
        <div class="analogy-label">Delhi-Mumbai flights</div>
      </div>
      <div class="card analogy-card">
        <div class="analogy-icon">🚗</div>
        <div class="analogy-num">${d.car_km_equivalent.toLocaleString()}</div>
        <div class="analogy-label">km driven by car</div>
      </div>
    </div>
  `;
}

/* ── Activity Logger ── */
const logOptions = {
  transport: [
    { value: 'car_petrol', label: 'Car (Petrol) — km' },
    { value: 'car_diesel', label: 'Car (Diesel) — km' },
    { value: 'bus', label: 'Bus — km' },
    { value: 'train', label: 'Train — km' },
    { value: 'bicycle', label: 'Bicycle — km' },
    { value: 'walking', label: 'Walking — km' },
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
    { value: 'fruits', label: 'Fruits — kg' },
  ],
  shopping: [
    { value: 'clothing', label: 'Clothing — items' },
    { value: 'electronics', label: 'Electronics — items' },
    { value: 'online_order', label: 'Online Order — packages' },
    { value: 'groceries', label: 'Grocery Trip — trips' },
  ],
};

function updateLogOptions() {
  const cat = document.getElementById('logCategory').value;
  const sel = document.getElementById('logActivity');
  sel.innerHTML = (logOptions[cat] || []).map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

async function logActivity() {
  const category = document.getElementById('logCategory').value;
  const activity = document.getElementById('logActivity').value;
  const value = document.getElementById('logValue').value;
  if (!value || value <= 0) return alert('Enter a valid amount');

  try {
    const res = await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, activity, value }),
    });
    const data = await res.json();
    renderActivities(data.activities);
    renderStreak(data.streak, null);
    if (data.new_badges && data.new_badges.length > 0) {
      alert('🏆 Badge unlocked: ' + data.new_badges.join(', '));
    }
    document.getElementById('logValue').value = '';
    loadWeekly();
    loadBadges();
  } catch (err) { console.error(err); }
}

function renderActivities(activities) {
  const el = document.getElementById('activityList');
  if (!activities || activities.length === 0) {
    el.innerHTML = '<p class="empty-state">No activities logged yet. Start tracking!</p>';
    return;
  }
  el.innerHTML = `<table class="activity-table">
    <thead><tr><th>Date</th><th>Activity</th><th>CO₂</th></tr></thead>
    <tbody>${activities.slice(0, 10).map(a => `
      <tr><td>${a.date}</td><td>${a.activity}</td><td>${a.co2_kg} kg</td></tr>
    `).join('')}</tbody>
  </table>`;
}

function renderStreak(streak, badges) {
  const bar = document.getElementById('streakBar');
  let html = `<div class="streak-count">🔥 ${streak} day streak</div>`;
  if (badges && badges.length > 0) {
    const badgeDefs = {
      first_log: { icon: '🌱', name: 'First Log' },
      week_warrior: { icon: '🔥', name: 'Week Warrior' },
      low_carbon: { icon: '🏅', name: 'Low Carbon' },
      plant_based: { icon: '🥬', name: 'Plant Based' },
      cycle_hero: { icon: '🚴', name: 'Cycle Hero' },
    };
    html += badges.map(b => {
      const def = badgeDefs[b] || { icon: '🏅', name: b };
      return `<span class="badge-chip">${def.icon} ${def.name}</span>`;
    }).join('');
  }
  bar.innerHTML = html;
}

async function loadBadges() {
  try {
    const res = await fetch('/api/badges');
    const data = await res.json();
    renderStreak(data.streak, data.badges);
  } catch (err) { /* ignore */ }
}

async function loadActivities() {
  try {
    const res = await fetch('/api/activities');
    const data = await res.json();
    renderActivities(data.activities);
  } catch (err) { /* ignore */ }
}

/* ── Weekly Chart ── */
async function loadWeekly() {
  try {
    const res = await fetch('/api/weekly');
    const data = await res.json();
    renderWeekly(data);
  } catch (err) {
    renderWeekly({ labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values: [0,0,0,0,0,0,0] });
  }
}

function renderWeekly(data) {
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  if (weeklyChartObj) weeklyChartObj.destroy();
  weeklyChartObj = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'kg CO₂',
        data: data.values,
        backgroundColor: '#3d9922',
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: '#d4e8c2' } },
        x: { grid: { display: false } },
      },
      plugins: { legend: { display: false } }
    }
  });
}

/* ── AI Chat ── */
function sendQuick(el) {
  document.getElementById('chatInput').value = el.textContent;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  const messages = document.getElementById('chatMessages');
  const sendBtn = document.getElementById('chatSendBtn');
  const typing = document.getElementById('typingIndicator');

  // User message
  messages.innerHTML += `<div class="chat-msg user">${escapeHtml(msg)}</div>`;
  input.value = '';
  input.disabled = true;
  sendBtn.disabled = true;
  typing.classList.add('visible');
  messages.scrollTop = messages.scrollHeight;

  const context = lastResult ? {
    breakdown: lastResult.breakdown,
    total_tonnes: lastResult.total_tonnes,
    transport_mode: document.getElementById('transportMode').value,
    diet_type: document.getElementById('dietType').value,
  } : {};

  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, context }),
    });
    const data = await res.json();
    messages.innerHTML += `<div class="chat-msg ai">${escapeHtml(data.reply)}</div>`;
  } catch (err) {
    messages.innerHTML += `<div class="chat-msg ai">Sorry, something went wrong. Try again!</div>`;
  } finally {
    typing.classList.remove('visible');
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
    messages.scrollTop = messages.scrollHeight;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  updateLogOptions();
  loadActivities();
  loadWeekly();
  loadBadges();
});
