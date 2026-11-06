// AthleteOS - Core Logic
const STORAGE_KEY = 'athleteos_logs_v1';

// Default athlete profile
const PROFILE = {
  name: 'Arnesh',
  age: 17.5,
  height: 176,
  weight: 70.0,
  muscle: 30.0,
  fat: 14.5,
  rhr: 52
};

function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function showSection(name) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById('section-' + name);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
    btn.classList.add('text-gray-500');
    if (btn.dataset.section === name) {
      btn.classList.remove('text-gray-500');
      btn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    }
  });

  if (name === 'dashboard') renderDashboard();
  if (name === 'history') renderHistory();
  if (name === 'insights') generateInsights();
}

function renderDashboard() {
  const logs = loadLogs();
  const latest = logs[0];

  if (latest?.weight) document.getElementById('stat-weight').innerHTML = `${latest.weight} <span class="text-base font-normal text-gray-500">kg</span>`;
  if (latest?.rhr) document.getElementById('stat-rhr').innerHTML = `${latest.rhr} <span class="text-base font-normal text-gray-500">bpm</span>`;

  const recentEl = document.getElementById('recent-activity');
  if (logs.length === 0) {
    recentEl.innerHTML = '<p class="text-gray-400">No entries yet. Log your first session.</p>';
  } else {
    recentEl.innerHTML = logs.slice(0, 5).map(l => `
      <div class="flex justify-between items-start border-b border-gray-50 pb-2">
        <div>
          <p class="font-medium">${l.typeLabel || l.type} • ${l.date}</p>
          <p class="text-gray-500 text-xs">${l.distance ? l.distance + ' km' : ''} ${l.duration ? '• ' + l.duration + ' min' : ''} ${l.pace ? '• ' + l.pace : ''}</p>
        </div>
        <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">${l.feel ? l.feel + '/10' : ''}</span>
      </div>
    `).join('');
  }

  if (latest) {
    document.getElementById('rec-sleep').textContent = latest.sleep ? latest.sleep + '/10' : '—';
    document.getElementById('rec-feel').textContent = latest.feel ? latest.feel + '/10' : '—';
    document.getElementById('rec-rhr').textContent = latest.rhr ? latest.rhr + ' bpm' : '—';
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekLogs = logs.filter(l => new Date(l.date) >= weekAgo);
  const totalMin = weekLogs.reduce((sum, l) => sum + (parseFloat(l.duration) || 0), 0);
  document.getElementById('rec-load').textContent = totalMin ? totalMin + ' min' : '—';
}

function renderHistory() {
  const logs = loadLogs();
  const list = document.getElementById('history-list');
  if (logs.length === 0) {
    list.innerHTML = '<p class="text-gray-400 text-sm">No entries yet.</p>';
    return;
  }
  list.innerHTML = logs.map((l, i) => `
    <div class="bg-white rounded-xl border border-gray-100 p-4 flex justify-between items-start">
      <div>
        <p class="font-medium">${l.date} • ${l.typeLabel || l.type}</p>
        <p class="text-sm text-gray-500 mt-0.5">
          ${l.distance ? l.distance + ' km' : ''} 
          ${l.duration ? '• ' + l.duration + ' min' : ''} 
          ${l.pace ? '• Pace ' + l.pace : ''}
          ${l.maxhr ? '• Max HR ' + l.maxhr : ''}
        </p>
        ${l.notes ? `<p class="text-xs text-gray-400 mt-1">${l.notes}</p>` : ''}
      </div>
      <button onclick="deleteLog(${i})" class="text-xs text-red-500 hover:underline">Delete</button>
    </div>
  `).join('');
}

function deleteLog(index) {
  const logs = loadLogs();
  logs.splice(index, 1);
  saveLogs(logs);
  renderHistory();
  renderDashboard();
}

function generateInsights() {
  const logs = loadLogs();
  const el = document.getElementById('ai-insights');

  if (logs.length < 2) {
    el.innerHTML = '<p class="text-gray-400">Log at least 3–4 sessions to unlock personalized insights.</p>';
    return;
  }

  const insights = [];
  const recent = logs.slice(0, 7);

  insights.push(`You have logged <strong>${logs.length}</strong> total sessions. Consistency is the biggest predictor of progress at your age.`);

  const totalDist = recent.reduce((s, l) => s + (parseFloat(l.distance) || 0), 0);
  if (totalDist > 0) {
    insights.push(`Last 7 logged sessions covered ~<strong>${totalDist.toFixed(1)} km</strong>. For a 1 km specialist, quality speed work matters more than pure volume.`);
  }

  const avgFeel = recent.filter(l => l.feel).reduce((s, l) => s + parseInt(l.feel), 0) / (recent.filter(l => l.feel).length || 1);
  if (avgFeel >= 7) {
    insights.push(`Average “how you feel” score is <strong>${avgFeel.toFixed(1)}/10</strong> — solid recovery. You can push intensity on the clay track.`);
  } else if (avgFeel < 6) {
    insights.push(`Average feel score is <strong>${avgFeel.toFixed(1)}/10</strong>. Consider an extra easy/recovery day before hard intervals.`);
  }

  const rhrs = recent.filter(l => l.rhr).map(l => parseInt(l.rhr));
  if (rhrs.length >= 3) {
    const avgRhr = rhrs.reduce((a, b) => a + b, 0) / rhrs.length;
    if (avgRhr > 60) {
      insights.push(`Recent average RHR is elevated (~${avgRhr.toFixed(0)} bpm). Prioritise sleep and hydration.`);
    } else {
      insights.push(`Resting HR is in a good range. Cardiovascular base looks healthy.`);
    }
  }

  insights.push(`Primary goal remains <strong>1 km in 5:30–5:40</strong>. Focus on 2 quality interval sessions per week on the soft track + one longer easy run.`);

  el.innerHTML = insights.map(i => `<div class="p-3 bg-blue-50 rounded-lg text-gray-800">${i}</div>`).join('');
}

function exportData() {
  const logs = loadLogs();
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'athleteos-logs.json';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('log-form')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const typeSelect = document.getElementById('log-type');
  const entry = {
    id: Date.now(),
    date: document.getElementById('log-date').value,
    weight: document.getElementById('log-weight').value || null,
    rhr: document.getElementById('log-rhr').value || null,
    type: typeSelect.value,
    typeLabel: typeSelect.options[typeSelect.selectedIndex].text,
    distance: document.getElementById('log-distance').value || null,
    duration: document.getElementById('log-duration').value || null,
    pace: document.getElementById('log-pace').value || null,
    maxhr: document.getElementById('log-maxhr').value || null,
    sleep: document.getElementById('log-sleep').value || null,
    feel: document.getElementById('log-feel').value || null,
    notes: document.getElementById('log-notes').value || null
  };

  const logs = loadLogs();
  logs.unshift(entry);
  saveLogs(logs);

  e.target.reset();
  document.getElementById('log-date').valueAsDate = new Date();

  alert('Entry saved!');
  showSection('dashboard');
});

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('log-date');
  if (dateInput) dateInput.valueAsDate = new Date();
  renderDashboard();
});
