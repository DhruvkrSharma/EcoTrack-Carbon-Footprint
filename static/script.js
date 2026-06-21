/* ===== EcoTrack Frontend (Lumina Nature Tailwind UI) ===== */

let lastResult = null;
let weeklyChartObj = null;

/* ── Tab Switching ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Reset all tabs
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('bg-primary/20', 'text-primary', 'border-primary/30');
      b.classList.add('text-on-surface-variant', 'border-transparent');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    
    // Activate clicked tab
    btn.classList.add('bg-primary/20', 'text-primary', 'border-primary/30');
    btn.classList.remove('text-on-surface-variant', 'border-transparent');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ── Calculator ── */
async function handleCalc(e) {
  e.preventDefault();
  const btn = document.getElementById('calcBtn');
  btn.textContent = '⏳ Analyzing...';
  btn.disabled = true;
  btn.classList.add('opacity-80');

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
    btn.textContent = 'Calculate My Impact';
    btn.disabled = false;
    btn.classList.remove('opacity-80');
  }
}

function showResult(r) {
  // Trigger layout shift
  const calcSection = document.getElementById('calculatorSection');
  const resultSection = document.getElementById('resultSection');
  
  // Shift calculator to left
  calcSection.classList.remove('max-w-2xl', 'mx-auto');
  calcSection.classList.add('md:w-5/12');
  
  // Show results
  resultSection.classList.remove('hidden');
  
  // Allow DOM to update display:block before fading in
  setTimeout(() => {
    resultSection.classList.remove('opacity-0');
    resultSection.classList.add('opacity-100');
  }, 50);

  document.getElementById('insightsContainer').style.display = 'block';
  
  // Set numeric value
  const displayValue = document.getElementById('display-value');
  displayValue.textContent = r.total_tonnes;
  
  // Update donut SVG offset
  const circle = document.getElementById('footprint-circle');
  const circumference = 251.2; // 2 * pi * r (r=40)
  // Assume a scale where 10 tonnes = full circle (100%)
  const percent = Math.min(r.total_tonnes / 10, 1);
  const offset = circumference - (percent * circumference);
  circle.style.strokeDashoffset = offset;

  // Rating and Comparison
  const badge = document.getElementById('resultRating');
  badge.textContent = r.rating;
  document.getElementById('resultComp').textContent = r.comparison;

  // Insights
  const grid = document.getElementById('insightsGrid');
  grid.innerHTML = (r.insights || []).map((i, index) => {
    // alternate border colors for variety
    const borderColor = index % 2 === 0 ? 'border-l-primary' : 'border-l-secondary';
    const iconColorClass = index % 2 === 0 ? 'text-primary bg-primary/20' : 'text-secondary bg-secondary/20';
    return `
    <div class="glass-card p-5 rounded-2xl border-l-4 ${borderColor} hover:bg-white/10 transition-colors group">
      <div class="flex items-start gap-4">
        <div class="${iconColorClass} p-2 rounded-full text-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          ${i.icon}
        </div>
        <div>
          <h4 class="font-bold text-white text-sm mb-1">${i.title}</h4>
          <p class="font-body-md text-on-surface-variant text-sm leading-snug">${i.desc}</p>
          ${i.saving ? `<span class="inline-block mt-2 text-xs text-primary font-bold">📉 ${i.saving}</span>` : ''}
        </div>
      </div>
    </div>
  `}).join('');
}

/* ── Compare ── */
document.querySelector('[data-tab="compare"]').addEventListener('click', loadCompare);

async function loadCompare() {
  if (!lastResult) {
    document.getElementById('compareContent').innerHTML = '<p class="text-on-surface-variant">Calculate your footprint first to see comparisons.</p>';
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
    { label: 'You', val: d.user, color: '#4edea3' },
    { label: 'India avg', val: d.india_avg, color: '#10b981' },
    { label: 'Global avg', val: d.global_avg, color: '#84cc16' },
    { label: 'US avg', val: d.us_avg, color: '#ef4444' },
    { label: '2°C target', val: d.target_2c, color: '#3b82f6' },
  ];
  
  const barsHtml = bars.map(b => `
    <div class="mb-4">
      <div class="flex justify-between text-sm mb-1">
        <span class="text-white">${b.label}</span>
        <span class="text-on-surface-variant">${b.val} t</span>
      </div>
      <div class="w-full bg-surface-container-lowest rounded-full h-3">
        <div class="h-3 rounded-full" style="width:${(b.val / maxVal * 100)}%; background-color:${b.color}"></div>
      </div>
    </div>
  `).join('');

  document.getElementById('compareContent').innerHTML = `
    <div class="mb-8">${barsHtml}</div>
    <p class="text-center text-sm text-on-surface-variant mb-6">
      You're better than <strong class="text-primary">${Math.round(d.percentile_india)}%</strong> of Indians
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="glass-card p-4 rounded-2xl text-center">
        <div class="text-3xl mb-2">🌳</div>
        <div class="text-2xl font-bold text-white">${d.trees_to_offset}</div>
        <div class="text-xs text-on-surface-variant">trees needed to offset</div>
      </div>
      <div class="glass-card p-4 rounded-2xl text-center">
        <div class="text-3xl mb-2">✈️</div>
        <div class="text-2xl font-bold text-white">${d.flights_equivalent}</div>
        <div class="text-xs text-on-surface-variant">Delhi-Mumbai flights</div>
      </div>
      <div class="glass-card p-4 rounded-2xl text-center">
        <div class="text-3xl mb-2">🚗</div>
        <div class="text-2xl font-bold text-white">${d.car_km_equivalent.toLocaleString()}</div>
        <div class="text-xs text-on-surface-variant">km driven by car</div>
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
    el.innerHTML = '<p class="text-on-surface-variant">No activities logged yet. Start tracking!</p>';
    return;
  }
  el.innerHTML = `<table class="w-full text-left text-sm text-on-surface-variant">
    <thead class="text-xs uppercase bg-white/5 text-on-background">
      <tr><th class="px-4 py-3 rounded-tl-xl rounded-bl-xl">Date</th><th class="px-4 py-3">Activity</th><th class="px-4 py-3 rounded-tr-xl rounded-br-xl">CO₂</th></tr>
    </thead>
    <tbody>${activities.slice(0, 10).map(a => `
      <tr class="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
        <td class="px-4 py-3">${a.date}</td>
        <td class="px-4 py-3 font-medium text-white">${a.activity}</td>
        <td class="px-4 py-3 text-primary">${a.co2_kg} kg</td>
      </tr>
    `).join('')}</tbody>
  </table>`;
}

function renderStreak(streak, badges) {
  document.getElementById('streakCountText').textContent = streak;
  const container = document.getElementById('badgesContainer');
  
  if (badges && badges.length > 0) {
    const badgeDefs = {
      first_log: { icon: '🌱', name: 'First Log' },
      week_warrior: { icon: '🔥', name: 'Week Warrior' },
      low_carbon: { icon: '🏅', name: 'Low Carbon' },
      plant_based: { icon: '🥬', name: 'Plant Based' },
      cycle_hero: { icon: '🚴', name: 'Cycle Hero' },
    };
    container.innerHTML = badges.map(b => {
      const def = badgeDefs[b] || { icon: '🏅', name: b };
      return `<span class="bg-secondary/20 text-secondary px-3 py-1 text-xs rounded-full font-bold border border-secondary/30">${def.icon} ${def.name}</span>`;
    }).join('');
  } else {
    container.innerHTML = '';
  }
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
        backgroundColor: '#4edea3',
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#bbcabf' } },
        x: { grid: { display: false }, ticks: { color: '#bbcabf' } },
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
  messages.innerHTML += `
    <div class="flex items-start gap-3 justify-end">
      <div class="bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-none px-4 py-3 text-white max-w-[85%]">
        ${escapeHtml(msg)}
      </div>
      <div class="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">👤</div>
    </div>`;
  
  input.value = '';
  input.disabled = true;
  sendBtn.disabled = true;
  typing.classList.remove('hidden');
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
    messages.innerHTML += `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">🤖</div>
        <div class="bg-surface-container-high rounded-2xl rounded-tl-none px-4 py-3 text-on-background max-w-[85%]">
          ${escapeHtml(data.reply)}
        </div>
      </div>`;
  } catch (err) {
    messages.innerHTML += `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">⚠️</div>
        <div class="bg-surface-container-high rounded-2xl rounded-tl-none px-4 py-3 text-on-background max-w-[85%]">
          Sorry, something went wrong. Try again!
        </div>
      </div>`;
  } finally {
    typing.classList.add('hidden');
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
