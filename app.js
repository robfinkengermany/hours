'use strict';

// ═══════════════════════════════════════════════
//  CRYPTO
// ═══════════════════════════════════════════════

const KEY_SALT   = 'uren_salt';
const KEY_VERIFY = 'uren_verify';
const KEY_DATA   = 'uren_data';
const VERIFY_TAG = 'UREN_APP_VALID_v1';

let _key  = null;   // CryptoKey (AES-GCM 256)
let _data = null;   // { entries: [...], paidHours: {...}, workedHours: {...} }

function rnd(n) { return crypto.getRandomValues(new Uint8Array(n)); }

function buf2b64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b642buf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function deriveKey(pin, salt) {
  const km = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' },
    km,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  );
}

async function encryptStr(key, plaintext) {
  const iv = rnd(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)
  );
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv);
  out.set(new Uint8Array(ct), 12);
  return buf2b64(out);
}

async function decryptStr(key, b64) {
  const data = b642buf(b64);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: data.slice(0, 12) }, key, data.slice(12)
  );
  return new TextDecoder().decode(pt);
}

// ═══════════════════════════════════════════════
//  STORAGE
// ═══════════════════════════════════════════════

async function saveData() {
  localStorage.setItem(KEY_DATA, await encryptStr(_key, JSON.stringify(_data)));
}

async function loadData() {
  const raw = localStorage.getItem(KEY_DATA);
  if (!raw) return { entries: [], paidHours: {}, workedHours: {} };
  return JSON.parse(await decryptStr(_key, raw));
}

// ═══════════════════════════════════════════════
//  CALCULATIONS
// ═══════════════════════════════════════════════

function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function calcHours(start, end, breakMin) {
  const diff = timeToMin(end) - timeToMin(start);
  return diff > 0 ? Math.max(0, (diff - (breakMin || 0)) / 60) : 0;
}

function entryHours(e) {
  return calcHours(e.start, e.end, e.breakMin);
}

function fmtH(h) {
  // Allow negative (overpaid months)
  const abs = Math.abs(h).toFixed(2).replace('.', ',');
  return h < 0 ? `-${abs}u` : `${abs}u`;
}

function monthKey(iso) { return iso.slice(0, 7); }

function groupByMonth(entries) {
  return entries.reduce((acc, e) => {
    const k = monthKey(e.date);
    (acc[k] = acc[k] || []).push(e);
    return acc;
  }, {});
}

function monthStats(mk) {
  const entries = _data.entries.filter(e => monthKey(e.date) === mk);
  // Use imported Gearbeitet value when available (avoids wrong totals from invalid dates)
  const workedHours = (_data.workedHours || {});
  const worked = mk in workedHours
    ? workedHours[mk]
    : entries.reduce((s, e) => s + entryHours(e), 0);
  const paid = (_data.paidHours[mk] || 0);
  return { entries, worked, paid, open: worked - paid };  // open may be negative = overpaid
}

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

function uid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ rnd(1)[0] & 15 >> c / 4).toString(16));
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

const MONTHS = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
function monthLabel(mk) {
  const [y, m] = mk.split('-');
  return `${MONTHS[+m - 1]} ${y}`;
}

function $(id) { return document.getElementById(id); }

// ═══════════════════════════════════════════════
//  LOGIN / PIN
// ═══════════════════════════════════════════════

function isFirstRun() { return !localStorage.getItem(KEY_SALT); }

async function setupPIN(pin) {
  const salt = rnd(16);
  const key  = await deriveKey(pin, salt);
  const init = { entries: [], paidHours: {}, workedHours: {} };
  localStorage.setItem(KEY_SALT,   buf2b64(salt));
  localStorage.setItem(KEY_VERIFY, await encryptStr(key, VERIFY_TAG));
  localStorage.setItem(KEY_DATA,   await encryptStr(key, JSON.stringify(init)));
  return { key, data: init };
}

async function verifyPIN(pin) {
  const salt = b642buf(localStorage.getItem(KEY_SALT));
  const key  = await deriveKey(pin, salt);
  try {
    const pt = await decryptStr(key, localStorage.getItem(KEY_VERIFY));
    if (pt === VERIFY_TAG) return key;
  } catch {}
  return null;
}

async function handleLogin() {
  const firstRun = isFirstRun();
  const pin  = $('pin-input').value.trim();
  const pin2 = $('pin-confirm').value.trim();
  const err  = $('login-error');
  err.classList.add('hidden');

  if (pin.length < 4) {
    err.textContent = 'PIN moet minimaal 4 tekens zijn.';
    err.classList.remove('hidden');
    return;
  }

  if (firstRun && pin !== pin2) {
    err.textContent = 'PINs komen niet overeen.';
    err.classList.remove('hidden');
    return;
  }

  $('login-btn').textContent = '…';
  $('login-btn').disabled = true;

  try {
    if (firstRun) {
      const r = await setupPIN(pin);
      _key  = r.key;
      _data = r.data;
    } else {
      _key = await verifyPIN(pin);
      if (!_key) {
        err.textContent = 'Verkeerde PIN. Probeer opnieuw.';
        err.classList.remove('hidden');
        return;
      }
      _data = await loadData();
    }
    $('pin-input').value = '';
    $('pin-confirm').value = '';
    $('login-screen').classList.add('hidden');
    $('app').classList.remove('hidden');
    $('f-date').value = new Date().toISOString().slice(0, 10);
  } catch (e) {
    err.textContent = 'Fout: ' + e.message;
    err.classList.remove('hidden');
  } finally {
    $('login-btn').textContent = firstRun ? 'PIN instellen' : 'Inloggen';
    $('login-btn').disabled = false;
  }
}

async function handleChangePIN() {
  const p1  = $('new-pin').value.trim();
  const p2  = $('new-pin-confirm').value.trim();
  const msg = $('pin-change-msg');
  msg.classList.add('hidden');

  if (p1.length < 4) {
    msg.textContent = 'PIN moet minimaal 4 tekens zijn.'; msg.className = 'error';
    msg.classList.remove('hidden'); return;
  }
  if (p1 !== p2) {
    msg.textContent = 'PINs komen niet overeen.'; msg.className = 'error';
    msg.classList.remove('hidden'); return;
  }

  const salt   = rnd(16);
  const newKey = await deriveKey(p1, salt);
  localStorage.setItem(KEY_SALT,   buf2b64(salt));
  localStorage.setItem(KEY_VERIFY, await encryptStr(newKey, VERIFY_TAG));
  _key = newKey;
  await saveData();

  $('new-pin').value = '';
  $('new-pin-confirm').value = '';
  msg.textContent = '✓ PIN gewijzigd.'; msg.className = 'success';
  msg.classList.remove('hidden');
}

// ═══════════════════════════════════════════════
//  TABS
// ═══════════════════════════════════════════════

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => {
    const active = c.id === `tab-${tab}`;
    c.classList.toggle('active', active);
    c.classList.toggle('hidden', !active);
  });
  if (tab === 'overview') renderOverview();
}

// ═══════════════════════════════════════════════
//  ENTRY FORM
// ═══════════════════════════════════════════════

function updatePreview() {
  const h = calcHours($('f-start').value, $('f-end').value, +$('f-break').value || 0);
  $('f-preview').textContent = h > 0 ? fmtH(h) : '–';
}

async function saveEntry() {
  const date     = $('f-date').value;
  const start    = $('f-start').value;
  const end      = $('f-end').value;
  const breakMin = +$('f-break').value || 0;

  if (!date || !start || !end) { alert('Vul datum, begin én einde in.'); return; }
  if (calcHours(start, end, breakMin) <= 0) { alert('Eindtijd moet na de begintijd liggen.'); return; }

  _data.entries.push({ id: uid(), date, start, end, breakMin });
  await saveData();
  $('f-break').value = 0;
  $('f-preview').textContent = '–';

  // Brief visual feedback
  const btn = $('save-btn');
  btn.textContent = '✓ Opgeslagen';
  setTimeout(() => { btn.textContent = 'Opslaan'; }, 1500);
}

// ═══════════════════════════════════════════════
//  OVERVIEW
// ═══════════════════════════════════════════════

function renderOverview() {
  const el = $('overview-content');
  if (!_data.entries.length) {
    el.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--muted)">Nog geen uren geregistreerd.</p>';
    return;
  }

  const sorted = Object.keys(groupByMonth(_data.entries)).sort().reverse();

  // ── Grand total banner ──
  const grandOpen = sorted.reduce((sum, mk) => sum + monthStats(mk).open, 0);
  const grandColor  = grandOpen > 0.01 ? 'var(--red)' : grandOpen < -0.01 ? 'var(--blue)' : 'var(--green)';
  const grandLabel  = grandOpen > 0.01
    ? `Totaal openstaand: <strong style="color:${grandColor}">${fmtH(grandOpen)}</strong>`
    : grandOpen < -0.01
      ? `Saldo: <strong style="color:${grandColor}">${fmtH(grandOpen)}</strong> (meer betaald dan gewerkt)`
      : `<strong style="color:${grandColor}">✓ Alles betaald</strong>`;

  const banner = `<div class="form-card" style="margin-bottom:1rem;flex-direction:row;align-items:center;gap:.5rem;">
    <span style="font-size:1.1rem">📊</span>
    <span style="font-size:.95rem">${grandLabel}</span>
  </div>`;

  const months = sorted.map(mk => {
    const s = monthStats(mk);
    const rows = [...s.entries].sort((a, b) => a.date.localeCompare(b.date));
    const openColor = s.open > 0.01 ? 'var(--red)' : s.open < -0.01 ? 'var(--blue)' : 'var(--green)';
    const paidVal   = s.paid.toFixed(2);

    const openPill = s.open > 0.01
      ? `<span class="stat-pill pill-open">${fmtH(s.open)} open</span>`
      : s.open < -0.01
        ? `<span class="stat-pill" style="background:#dbeafe;color:#1e40af">${fmtH(s.open)}</span>`
        : `<span class="stat-pill pill-paid">✓ betaald</span>`;

    return /* html */`
<div class="month-block">
  <div class="month-header" onclick="toggleMonth('${mk}')">
    <span class="month-title">${monthLabel(mk)}</span>
    <div class="month-stats">
      <span class="stat-pill pill-worked">${fmtH(s.worked)}</span>
      ${openPill}
    </div>
  </div>
  <div class="month-entries" id="entries-${mk}">
    ${rows.map(e => /* html */`
      <div class="entry-row" onclick="openEdit('${e.id}')">
        <span class="entry-date">${fmtDate(e.date)}</span>
        <span class="entry-times">${e.start}–${e.end}${e.breakMin ? ` (${e.breakMin}m)` : ''}</span>
        <span class="entry-hours">${fmtH(entryHours(e))}</span>
        <span class="entry-edit-hint">✎</span>
      </div>`).join('')}
  </div>
  <div class="month-footer">
    <span class="paid-label">Betaald:</span>
    <input class="paid-input" type="number" min="0" step="0.25"
      value="${paidVal}"
      onchange="setPaid('${mk}', this.value)"
      onclick="event.stopPropagation()">
    <span class="paid-label">uur</span>
    <span class="open-label">Open: <strong style="color:${openColor}">${fmtH(s.open)}</strong></span>
  </div>
</div>`;
  }).join('');

  el.innerHTML = banner + months;
}

function toggleMonth(mk) {
  const el = $(`entries-${mk}`);
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}

async function setPaid(mk, val) {
  _data.paidHours[mk] = Math.max(0, parseFloat(val) || 0);
  await saveData();
  renderOverview();
}

// ═══════════════════════════════════════════════
//  EDIT / DELETE MODAL
// ═══════════════════════════════════════════════

let _editId = null;

function openEdit(id) {
  const e = _data.entries.find(x => x.id === id);
  if (!e) return;
  _editId = id;
  $('e-date').value  = e.date;
  $('e-start').value = e.start;
  $('e-end').value   = e.end;
  $('e-break').value = e.breakMin || 0;
  $('edit-modal').classList.remove('hidden');
}

async function saveEdit() {
  const idx = _data.entries.findIndex(x => x.id === _editId);
  if (idx === -1) return;
  const start    = $('e-start').value;
  const end      = $('e-end').value;
  const breakMin = +$('e-break').value || 0;
  if (calcHours(start, end, breakMin) <= 0) { alert('Eindtijd moet na de begintijd liggen.'); return; }
  _data.entries[idx] = { ..._data.entries[idx], date: $('e-date').value, start, end, breakMin };
  await saveData();
  closeModal();
  renderOverview();
}

async function deleteEdit() {
  if (!confirm('Deze dag verwijderen?')) return;
  _data.entries = _data.entries.filter(x => x.id !== _editId);
  await saveData();
  closeModal();
  renderOverview();
}

function closeModal() {
  $('edit-modal').classList.add('hidden');
  _editId = null;
}

// ═══════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════

function download(content, filename, mime) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type: mime })),
    download: filename,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportCSV() {
  const rows = ['Datum;Begin;Einde;Pauze (min);Uren'];
  [..._data.entries].sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
    rows.push([fmtDate(e.date), e.start, e.end, e.breakMin,
      entryHours(e).toFixed(2).replace('.', ',')].join(';'));
  });
  rows.push('', 'Maand;Gewerkt;Betaald;Openstaand');
  Object.keys(groupByMonth(_data.entries)).sort().forEach(mk => {
    const s = monthStats(mk);
    rows.push([monthLabel(mk),
      s.worked.toFixed(2).replace('.', ','),
      s.paid.toFixed(2).replace('.', ','),
      s.open.toFixed(2).replace('.', ',')].join(';'));
  });
  download('\uFEFF' + rows.join('\r\n'), 'uren.csv', 'text/csv;charset=utf-8');
}

function exportJSON() {
  download(JSON.stringify(_data, null, 2), 'uren.json', 'application/json');
}

// ═══════════════════════════════════════════════
//  EXCEL IMPORT
// ═══════════════════════════════════════════════

let _importRows = [];
let _importPaid   = {};   // { 'YYYY-MM': betaald }
let _importWorked = {};   // { 'YYYY-MM': gewerkt } — uit Gearbeitet-kolom

// German + Dutch month names → month number (+ common typo variants)
const MONTH_NAME_MAP = {
  januar:1, februar:2, 'märz':3, marz:3, april:4, mai:5, juni:6,
  juli:7, august:8, september:9, oktober:10, november:11, dezember:12,
  januari:1, februari:2, maart:3, mei:5, augustus:8, december:12,
};

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      _importRows   = [];
      _importPaid   = {};
      _importWorked = {};
      wb.SheetNames.forEach(name => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false });
        parseSheet(rows);
      });
      showImportPreview();
    } catch (err) {
      alert('Kon het bestand niet lezen: ' + err.message);
    }
  };
  reader.readAsBinaryString(file);
}

function parseIsoDate(s) {
  if (!s) return null;
  s = String(s).trim();
  let m;
  if ((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) {
    const [, d, mo, y] = m;
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    const [, y, mo, d] = m;
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
    return s;
  }
  if ((m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/))) {
    const [, d, mo, y] = m;
    if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return null;
}

function parseTime(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2}):(\d{2})$/);
  return m ? `${m[1].padStart(2,'0')}:${m[2]}` : null;
}

function parseSheet(rows) {
  let pending     = null;   // huidig maandheader { mNum, worked, paid }
  let contextYear = null;   // lopend jaar (bijgehouden op basis van maandvolgorde)
  let lastMNum    = 0;      // maandnummer van de vorige maandrij

  for (const row of rows) {
    if (!row || row.length < 5) continue;

    // ── Maandrij? (col 0 = naam, col 1 = gewerkt, col 2 = betaald) ──
    const cell0 = String(row[0] || '').trim().toLowerCase();
    const mNum  = MONTH_NAME_MAP[cell0];
    if (mNum) {
      // Maandnummer gaat terug (bv. Dec→Jan) = nieuw jaar
      if (contextYear !== null && mNum <= lastMNum) contextYear++;
      lastMNum = mNum;
      pending  = {
        mNum,
        worked: parseFloat(String(row[1] || '0').replace(',', '.')) || 0,
        paid:   parseFloat(String(row[2] || '0').replace(',', '.')) || 0,
      };
    }

    // ── Datum staat ALTIJD in kolom 4 (index 4) ──
    const rawDate = parseIsoDate(row[4]);
    if (!rawDate) continue;
    const start = parseTime(row[5]);
    const end   = parseTime(row[6]);
    if (!start || !end) continue;

    // Initialiseer contextYear vanuit de eerste geldige datum
    if (contextYear === null) contextYear = parseInt(rawDate.slice(0, 4));

    // Gebruik contextYear + MM-DD (corrigeert typefout waarbij jaartal in datum fout is)
    const date = `${contextYear}-${rawDate.slice(5)}`;
    const mk   = monthKey(date);

    // Pauze in kolom 8 (in uren; ≤ 8 = uren, anders minuten)
    let breakMin = 0;
    const breakRaw = row[8];
    if (breakRaw) {
      const bv = parseFloat(String(breakRaw).replace(',', '.'));
      if (!isNaN(bv) && bv > 0)
        breakMin = bv <= 8 ? Math.round(bv * 60) : Math.round(bv);
    }

    const h = calcHours(start, end, breakMin);
    if (h <= 0 || h > 24) continue;

    // Koppel maandtotalen aan de eerste geldige datum van die maand
    if (pending && parseInt(mk.slice(5)) === pending.mNum) {
      if (!(mk in _importPaid))   _importPaid[mk]   = pending.paid;
      if (!(mk in _importWorked)) _importWorked[mk] = pending.worked;
      pending = null;
    }

    _importRows.push({ date, start, end, breakMin });
  }
}

function showImportPreview() {
  const preview = $('import-preview');
  const btn     = $('import-confirm');

  if (!_importRows.length) {
    preview.innerHTML = '<p class="error">Geen geldige rijen gevonden. Controleer het bestandsformaat.</p>';
    preview.classList.remove('hidden');
    btn.classList.add('hidden');
    return;
  }

  const sample = _importRows.slice(0, 6).map(r =>
    `<tr><td>${fmtDate(r.date)}</td><td>${r.start}</td><td>${r.end}</td>`+
    `<td>${r.breakMin}m</td><td>${fmtH(entryHours(r))}</td></tr>`
  ).join('');

  const paidLines = Object.entries(_importPaid)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([mk, p]) => `${monthLabel(mk)}: ${p.toFixed(2).replace('.',',')}u betaald`)
    .join(' · ');

  preview.innerHTML =
    `<p style="margin-bottom:.5rem;font-size:.85rem;color:var(--muted)">`+
    `${_importRows.length} rijen gevonden${_importRows.length > 6 ? ' (eerste 6 getoond)' : ''}:</p>`+
    `<table class="import-table"><thead>`+
    `<tr><th>Datum</th><th>Begin</th><th>Einde</th><th>Pauze</th><th>Uren</th></tr>`+
    `</thead><tbody>${sample}</tbody></table>`+
    (paidLines ? `<p style="margin-top:.75rem;font-size:.82rem;color:var(--muted)">💰 ${paidLines}</p>` : '');
  preview.classList.remove('hidden');
  btn.classList.remove('hidden');
}

async function confirmImport() {
  const existing = new Set(_data.entries.map(e => e.date));
  let added = 0, skipped = 0;
  for (const r of _importRows) {
    if (existing.has(r.date)) { skipped++; continue; }
    _data.entries.push({ id: uid(), ...r });
    added++;
  }
  // Betaald per maand (overschrijf niet als al handmatig ingevuld)
  for (const [mk, paid] of Object.entries(_importPaid)) {
    if (!_data.paidHours[mk]) _data.paidHours[mk] = paid;
  }
  // Gearbeitet per maand (altijd overnemen — correcte totalen ook bij ongeldige datums)
  if (!_data.workedHours) _data.workedHours = {};
  for (const [mk, worked] of Object.entries(_importWorked)) {
    _data.workedHours[mk] = worked;
  }
  await saveData();
  const paidCount   = Object.keys(_importPaid).length;
  const workedCount = Object.keys(_importWorked).length;
  $('import-preview').innerHTML =
    `<p class="success">✓ ${added} rijen geïmporteerd`+
    `${skipped ? `, ${skipped} overgeslagen (datum al bestaat)` : ''}`+
    `${workedCount ? `, gewerkte uren voor ${workedCount} maand(en) ingeladen` : ''}`+
    `${paidCount   ? `, betaald-bedragen voor ${paidCount} maand(en) ingeladen` : ''}.</p>`;
  $('import-confirm').classList.add('hidden');
  _importRows   = [];
  _importPaid   = {};
  _importWorked = {};
  $('import-file').value = '';
}

async function clearAllData() {
  if (!confirm('Weet je zeker dat je ALLE uren en betaald-bedragen wilt verwijderen?\nDit kan niet ongedaan worden gemaakt.')) return;
  if (!confirm('Laatste kans: alle data wordt permanent gewist. Doorgaan?')) return;
  _data = { entries: [], paidHours: {}, workedHours: {} };
  await saveData();
  renderOverview();
  alert('✓ Alle data gewist. Je kunt nu opnieuw importeren.');
}

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Service worker
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

  // First-run: show confirm field and change button label
  if (isFirstRun()) {
    $('login-label').textContent = 'Kies een PIN (minimaal 4 tekens)';
    $('login-btn').textContent   = 'PIN instellen';
    $('pin-confirm').classList.remove('hidden');
  }

  // Login
  $('login-btn').addEventListener('click', handleLogin);
  $('pin-input').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  $('pin-confirm').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

  // Tabs
  document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // Entry form
  ['f-start','f-end','f-break'].forEach(id => $(id).addEventListener('input', updatePreview));
  $('save-btn').addEventListener('click', saveEntry);

  // Edit modal
  $('edit-save').addEventListener('click', saveEdit);
  $('edit-delete').addEventListener('click', deleteEdit);
  $('edit-cancel').addEventListener('click', closeModal);
  $('edit-modal').addEventListener('click', e => { if (e.target === $('edit-modal')) closeModal(); });

  // Import
  $('import-file').addEventListener('change', handleImportFile);
  $('import-confirm').addEventListener('click', confirmImport);

  // Export
  $('export-csv').addEventListener('click', exportCSV);
  $('export-json').addEventListener('click', exportJSON);

  // PIN change
  $('change-pin-btn').addEventListener('click', handleChangePIN);

  // Clear all data
  $('clear-all-btn').addEventListener('click', clearAllData);
});
