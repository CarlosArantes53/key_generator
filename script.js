/* ──────────────────────────────────────────
   State
────────────────────────────────────────── */
let activeTab  = 'password';
let pwCount    = 1;
let envCount   = 1;
let envFmt     = 'bash';

/* ──────────────────────────────────────────
   Tab switching
────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    activeTab = t.dataset.tab;
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + activeTab).classList.add('active');
    clearOutput();
  });
});

/* ──────────────────────────────────────────
   Count buttons (password)
────────────────────────────────────────── */
document.querySelectorAll('#tab-password .count-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#tab-password .count-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    pwCount = parseInt(b.dataset.count);
  });
});

/* ENV count */
document.querySelectorAll('#env-count-btns .count-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#env-count-btns .count-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    envCount = parseInt(b.dataset.count);
  });
});

/* ENV format */
document.querySelectorAll('[data-fmt]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('[data-fmt]').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    envFmt = b.dataset.fmt;
  });
});

/* ──────────────────────────────────────────
   Crypto-grade random string
────────────────────────────────────────── */
const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS  = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?/~`';

function secureRand(charset, length) {
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => charset[v % charset.length]).join('');
}

function generatePassword(length, lower, upper, digits, symbols) {
  let charset = '';
  let required = [];
  if (lower)   { charset += LOWER;   required.push(secureRand(LOWER, 1)); }
  if (upper)   { charset += UPPER;   required.push(secureRand(UPPER, 1)); }
  if (digits)  { charset += DIGITS;  required.push(secureRand(DIGITS, 1)); }
  if (symbols) { charset += SYMBOLS; required.push(secureRand(SYMBOLS, 1)); }
  if (!charset) charset = LOWER + DIGITS;

  const rest = secureRand(charset, Math.max(0, length - required.length));
  const raw  = required.join('') + rest;

  // Fisher-Yates shuffle
  const a = raw.split('');
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join('');
}

/* ──────────────────────────────────────────
   Entropy estimation  H = L * log2(N)
────────────────────────────────────────── */
function estimateEntropy(pw) {
  let n = 0;
  if (/[a-z]/.test(pw)) n += 26;
  if (/[A-Z]/.test(pw)) n += 26;
  if (/[0-9]/.test(pw)) n += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) n += 32;
  return n > 0 ? +(pw.length * Math.log2(n)).toFixed(1) : 0;
}

function entropyLevel(bits) {
  if (bits < 28)  return { label: '🟥 Muito Fraca',   cls: 'lvl-very-weak',   pct: bits/28*12 };
  if (bits < 36)  return { label: '🟧 Fraca',          cls: 'lvl-weak',        pct: 12 + (bits-28)/8*12 };
  if (bits < 60)  return { label: '🟨 Moderada',       cls: 'lvl-moderate',    pct: 24 + (bits-36)/24*22 };
  if (bits < 80)  return { label: '🟩 Forte',          cls: 'lvl-strong',      pct: 46 + (bits-60)/20*20 };
  if (bits < 100) return { label: '🟦 Muito Forte',    cls: 'lvl-very-strong', pct: 66 + (bits-80)/20*20 };
  return           { label: '🟪 Excelente',            cls: 'lvl-excellent',   pct: Math.min(100, 86 + (bits-100)/50*14) };
}

const barColors = {
  'lvl-very-weak':   '#ff4d6d',
  'lvl-weak':        '#ffb703',
  'lvl-moderate':    '#fdd024',
  'lvl-strong':      '#06d6a0',
  'lvl-very-strong': '#0af',
  'lvl-excellent':   '#b5e48c',
};

/* ──────────────────────────────────────────
   Build output rows
────────────────────────────────────────── */
function buildRow(text, delay = 0) {
  const ent  = estimateEntropy(text);
  const info = entropyLevel(ent);

  const row = document.createElement('div');
  row.className = 'pw-row';
  row.style.animationDelay = delay + 'ms';

  const pwSpan = document.createElement('span');
  pwSpan.className = 'pw-text';
  pwSpan.textContent = text;

  const badge = document.createElement('span');
  badge.className = `entropy-badge ${info.cls}`;
  badge.textContent = `${ent} bits · ${info.label.split(' ').slice(1).join(' ')}`;

  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.title = 'Copiar';
  btn.textContent = '⧉';
  btn.addEventListener('click', () => copyOne(btn, text));

  row.appendChild(pwSpan);
  row.appendChild(badge);
  row.appendChild(btn);
  return row;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ──────────────────────────────────────────
   Generate handler
────────────────────────────────────────── */
document.getElementById('btn-generate').addEventListener('click', () => {
  const area = document.getElementById('output-area');
  const card = document.getElementById('output-card');
  area.innerHTML = '';

  if (activeTab === 'password') {
    const len     = parseInt(document.getElementById('pw-length').value);
    const lower   = document.getElementById('inc-lower').checked;
    const upper   = document.getElementById('inc-upper').checked;
    const digits  = document.getElementById('inc-digits').checked;
    const symbols = document.getElementById('inc-symbols').checked;

    for (let i = 0; i < pwCount; i++) {
      const pw = generatePassword(len, lower, upper, digits, symbols);
      area.appendChild(buildRow(pw, i * 60));
    }
  } else {
    const prefix = (document.getElementById('env-prefix').value || 'SECRET').toUpperCase().replace(/[^A-Z0-9_]/g,'_');
    const len    = parseInt(document.getElementById('env-length').value);

    for (let i = 0; i < envCount; i++) {
      const key = envCount > 1 ? `${prefix}_${i+1}` : prefix;
      const val = generatePassword(len, true, true, true, false); // alphanumeric for env safety
      let   line;
      if (envFmt === 'bash')   line = `export ${key}="${val}"`;
      else if (envFmt === 'dotenv') line = `${key}=${val}`;
      else                     line = `--env ${key}="${val}"`;
      area.appendChild(buildRow(line, i * 60));
    }
  }

  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/* ──────────────────────────────────────────
   Copy helpers
────────────────────────────────────────── */
function copyOne(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '⧉'; btn.classList.remove('copied'); }, 1500);
  });
}

document.getElementById('btn-copy-all').addEventListener('click', () => {
  const texts = [...document.querySelectorAll('.pw-text')].map(el => el.textContent);
  navigator.clipboard.writeText(texts.join('\n')).then(() => {
    const btn = document.getElementById('btn-copy-all');
    btn.textContent = '✓ COPIADO!';
    setTimeout(() => btn.textContent = '📋 COPIAR TODOS', 1800);
  });
});

function clearOutput() {
  document.getElementById('output-area').innerHTML = '';
  document.getElementById('output-card').style.display = 'none';
}

/* ──────────────────────────────────────────
   Live meter on Enter
────────────────────────────────────────── */
document.getElementById('check-pw').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPassword();
});

function checkPassword() {
  const pw = document.getElementById('check-pw').value;
  if (!pw) return;

  const ent  = estimateEntropy(pw);
  const info = entropyLevel(ent);
  const pct  = Math.min(100, info.pct);

  const result  = document.getElementById('meter-result');
  const bar     = document.getElementById('entropy-bar');
  const label   = document.getElementById('strength-label');

  document.getElementById('ent-val').textContent     = ent;
  document.getElementById('ent-len').textContent     = pw.length;

  let cs = 0;
  if (/[a-z]/.test(pw)) cs += 26;
  if (/[A-Z]/.test(pw)) cs += 26;
  if (/[0-9]/.test(pw)) cs += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) cs += 32;
  document.getElementById('ent-charset').textContent = cs;

  bar.style.width      = pct + '%';
  bar.style.background = barColors[info.cls];

  label.className      = 'strength-label entropy-badge ' + info.cls;
  label.textContent    = info.label;

  result.classList.add('visible');
}
