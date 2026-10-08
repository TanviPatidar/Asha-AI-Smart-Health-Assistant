/* =========================================================
   ASHA – AI Smart Health Assistant
   Application UI, routing, forms and reminders
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const h = U.esc;

/* =========================================================
   LANGUAGE + VOICE ASSISTANCE
   ========================================================= */

let currentLanguage = localStorage.getItem('asha_language') || 'en';

const LANG = {
  en: {
    name: 'English',
    voice: 'en-IN'
  },

  hi: {
    name: 'हिंदी',
    voice: 'hi-IN'
  }
};

function setLanguage(lang) {
  if (!LANG[lang]) return;

  currentLanguage = lang;

  localStorage.setItem('asha_language', lang);

  render();

  toast(
    lang === 'hi'
      ? 'भाषा हिंदी में बदल दी गई है।'
      : 'Language changed to English.'
  );
}


function speak(text) {
  if (!('speechSynthesis' in window)) {
    toast(currentLanguage === 'hi' ? 'इस ब्राउज़र में वॉयस असिस्टेंस समर्थित नहीं है।' : 'Voice assistance is not supported in this browser.', 'warn');
    return;
  }

  if (!text) return;

  // Stop previous speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = (LANG[currentLanguage] && LANG[currentLanguage].voice) ? LANG[currentLanguage].voice : (currentLanguage === 'hi' ? 'hi-IN' : 'en-IN');
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}


function stopSpeaking() {

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

}
const TEXT = {
  en: {
    dashboard: 'Dashboard',
    medicines: 'Medicines',
    appointments: 'Appointments',
    activities: 'Daily Activities',
    records: 'Health Records',
    insights: 'AI Insights',
    summary: 'Daily Summary',
    caregiver: 'Caregiver',
    notifications: 'Notifications',
    profile: 'Profile & Settings',
    emergency: 'Emergency Help',
    listen: 'Listen',
    stop: 'Stop'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    medicines: 'दवाइयाँ',
    appointments: 'अपॉइंटमेंट',
    activities: 'दैनिक गतिविधियां',
    records: 'स्वास्थ्य रिकॉर्ड',
    insights: 'AI स्वास्थ्य जानकारी',
    summary: 'दैनिक सारांश',
    caregiver: 'देखभाल करने वाला',
    notifications: 'सूचनाएँ',
    profile: 'प्रोफ़ाइल और सेटिंग्स',
    emergency: 'आपातकालीन सहायता',
    listen: 'सुनें',
    stop: 'रोकें'
  }
};

function t(key) {
  return TEXT[currentLanguage][key] || TEXT.en[key] || key;
}


const S = {
  role: null,
  route: null,
  chartMetric: 'bp',
  insightFilter: 'all',
  notifFilter: 'all',
  summaryDate: null,
  authMode: 'login',
  confirmFn: null,
  lastFocus: null
};
const RO = () => S.role === 'caregiver';

const ROUTES = {
  dashboard: { title: 'Dashboard', icon: 'home', render: () => pageDashboard() },
  medicines: { title: 'Medicines', icon: 'pill', render: () => pageMedicines() },
  appointments: { title: 'Appointments', icon: 'calendar', render: () => pageAppointments() },
  activities: { title: 'Daily Activities', icon: 'activity', render: () => pageActivities() },
  records: { title: 'Health Records', icon: 'heartPulse', render: () => pageRecords() },
  insights: { title: 'AI Insights', icon: 'sparkles', render: () => pageInsights() },
  summary: { title: 'Daily Summary', icon: 'clipboard', render: () => pageSummary() },
  caregiver: { title: 'Caregiver', icon: 'users', render: () => pageCaregiver() },
  notifications: { title: 'Notifications', icon: 'bell', render: () => pageNotifications() },
  profile: { title: 'Profile & Settings', icon: 'user', render: () => pageProfile() }
};
const NAV = {
  user: ['dashboard', 'medicines', 'appointments', 'activities', 'records', 'insights', 'summary', 'caregiver', 'notifications', 'profile'],
  caregiver: ['caregiver', 'medicines', 'insights', 'summary', 'records', 'notifications']
};
const BOTTOM = {
  user: ['dashboard', 'medicines', 'activities', 'records'],
  caregiver: ['caregiver', 'medicines', 'insights', 'records']
};
const SHORT_LABEL = { dashboard: 'Home', medicines: 'Medicine', activities: 'Activity', records: 'Health', caregiver: 'Overview', insights: 'Insights', summary: 'Summary' };
const routeTitle = (r) => (S.role === 'caregiver' && r === 'caregiver' ? (typeof currentLanguage !== 'undefined' && currentLanguage === 'hi' ? 'देखभालकर्ता डैशबोर्ड' : 'Caregiver Dashboard') : (typeof t === 'function' ? t(r) : ROUTES[r].title));

/* =========================================================
   Small UI helpers
   ========================================================= */
const STATUS_LABEL = { normal: 'Normal', attention: 'Attention', alert: 'Alert' };
const STATUS_ICON = { normal: 'checkCircle', attention: 'alertCircle', alert: 'alert' };

function badge(status, opts = {}) {
  if (!status) return '';
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  const label = opts.label || (opts.insight && status === 'alert' ? (isHi ? 'समीक्षा आवश्यक' : 'Needs Review') : (isHi ? ({ normal: 'सामान्य', attention: 'ध्यान दें', alert: 'अलर्ट' }[status] || STATUS_LABEL[status]) : STATUS_LABEL[status]));
  return `<span class="badge badge-${status}">${icon(STATUS_ICON[status] || 'info')}${h(label)}</span>`;
}
function pill(label, cls = 'neutral', ic) {
  return `<span class="badge badge-${cls}">${ic ? icon(ic) : ''}${h(label)}</span>`;
}
function progress(value, max, color = '', size = '') {
  const pct = max ? U.clamp(Math.round((value / max) * 100), 0, 100) : 0;
  return `<div class="progress ${color} ${size}" role="progressbar" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><span style="width:${pct}%"></span></div>`;
}
function emptyState(ic, title, text, action = '') {
  return `<div class="empty"><div class="card-icon">${icon(ic)}</div><h3>${h(title)}</h3><p>${h(text)}</p>${action}</div>`;
}
function timeUntil(date) {
  const mins = Math.round((date - Date.now()) / 60000);
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  if (mins <= 0) return isHi ? 'अभी' : 'now';
  if (mins < 60) return isHi ? `${mins} मिनट में` : `in ${mins} min`;
  const hrs = Math.floor(mins / 60), m = mins % 60;
  if (hrs < 24) return isHi ? `${hrs} घंटे${m ? ` ${m} मिनट` : ''} में` : `in ${hrs} hr${m ? ` ${m} min` : ''}`;
  return isHi ? `${Math.round(hrs / 24)} दिनों में` : `in ${Math.round(hrs / 24)} days`;
}
function greeting() {
  const hr = new Date().getHours();
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  if (hr < 12) return isHi ? 'शुभ प्रभात' : 'Good morning';
  if (hr < 17) return isHi ? 'शुभ दोपहर' : 'Good afternoon';
  return isHi ? 'शुभ संध्या' : 'Good evening';
}
function telHref(p) { return 'tel:' + String(p || '').replace(/[^\d+]/g, ''); }
function waHref(p, text = '') {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) d = '91' + d;
  return `https://wa.me/${d}${text ? '?text=' + encodeURIComponent(text) : ''}`;
}

function toast(msg, type = 'ok') {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === 'ok' ? 'checkCircle' : type === 'warn' ? 'alertCircle' : 'info')}<span>${h(msg)}</span>`;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/* ---- Modal ---- */
function openModal({ title, body, size = '', ic = '' }) {
  S.lastFocus = document.activeElement;
  $('#modal-root').innerHTML = `
    <div class="modal-backdrop">
      <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-head">
          <h2 id="modal-title">${ic ? icon(ic) : ''}${h(title)}</h2>
          <button class="icon-btn" type="button" data-action="close-modal" aria-label="Close">${icon('x')}</button>
        </div>
        <div class="modal-body">${body}</div>
      </div>
    </div>`;
  const first = $('#modal-root').querySelector('.modal-body input:not([type=hidden]), .modal-body select, .modal-body textarea, .modal-body .btn, .modal-body a');
  (first || $('#modal-root .icon-btn')).focus();
}
function closeModal() {
  $('#modal-root').innerHTML = '';
  S.confirmFn = null;
  if (S.lastFocus && document.contains(S.lastFocus)) S.lastFocus.focus();
}
const modalOpen = () => !!$('#modal-root').firstElementChild;

function confirmDialog({ title, message, yes = 'Yes, delete', danger = true, onYes }) {
  openModal({
    title, size: 'sm', ic: danger ? 'alert' : 'info',
    body: `<p style="font-size:1.08rem">${h(message)}</p>
      <div class="form-actions">
        <button class="btn btn-ghost btn-lg" type="button" data-action="close-modal">No, go back</button>
        <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'} btn-lg" type="button" data-action="confirm-yes">${h(yes)}</button>
      </div>`
  });
  S.confirmFn = onYes;
}

/* =========================================================
   Welcome / Login
   ========================================================= */
function renderAuth() {
  const mode = S.authMode;
  const tab = (id, label) => `<button class="tab" role="tab" type="button" aria-selected="${mode === id}" data-action="auth-tab" data-v="${id}">${label}</button>`;
  const p = Store.data.profile;
  let form = '';
  if (mode === 'login') {
    form = `
      <h2>Welcome back</h2>
      <p class="lead">Log in with your phone number and PIN.</p>
      <form class="form" data-form="login" novalidate>
        <div id="auth-error"></div>
        <div class="field"><label for="l-phone">Phone number</label>
          <input id="l-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile number" required></div>
        <div class="field"><label for="l-pin">PIN</label>
          <input id="l-pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="4-digit PIN" maxlength="6" required></div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${icon('lock')} Log in</button>
        <p class="muted" style="text-align:center">New to ASHA? <button type="button" class="link-btn" data-action="auth-tab" data-v="register">Create an account</button></p>
      </form>
      <div class="demo-hint">
        <div><strong>Try the demo:</strong> Phone <b>${h(p.phone || '9876543210')}</b> · PIN <b>${h(p.pin || '1234')}</b></div>
        <button class="btn btn-secondary btn-block" type="button" data-action="demo-login" data-v="user">${icon('user')} Open demo account (Kamala)</button>
      </div>`;
  } else if (mode === 'register') {
    form = `
      <h2>Create your account</h2>
      <p class="lead">It takes less than a minute.</p>
      <form class="form" data-form="register" novalidate>
        <div id="auth-error"></div>
        <div class="field"><label for="r-name">Your full name</label><input id="r-name" name="name" autocomplete="name" required></div>
        <div class="form-row">
          <div class="field"><label for="r-age">Age</label><input id="r-age" name="age" type="number" inputmode="numeric" min="18" max="120" required></div>
          <div class="field"><label for="r-phone">Phone number</label><input id="r-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" required></div>
        </div>
        <div class="form-row">
          <div class="field"><label for="r-pin">Choose a PIN</label><input id="r-pin" name="pin" type="password" inputmode="numeric" maxlength="6" placeholder="4 to 6 digits" required></div>
          <div class="field"><label for="r-pin2">Repeat PIN</label><input id="r-pin2" name="pin2" type="password" inputmode="numeric" maxlength="6" required></div>
        </div>
        <div class="form-row">
          <div class="field"><label for="r-cg">Caregiver name <span class="muted">(optional)</span></label><input id="r-cg" name="cgName"></div>
          <div class="field"><label for="r-cgp">Caregiver phone <span class="muted">(optional)</span></label><input id="r-cgp" name="cgPhone" type="tel" inputmode="numeric"></div>
        </div>
        <p class="small muted">${icon('info')} A new account is created on this device. Demo data will be replaced.</p>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${icon('check')} Create account</button>
      </form>`;
  } else {
    form = `
      <h2>Caregiver login</h2>
      <p class="lead">Family members and carers can check on their loved one.</p>
      <form class="form" data-form="caregiver-login" novalidate>
        <div id="auth-error"></div>
        <div class="field"><label for="c-phone">Caregiver phone number</label>
          <input id="c-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" required></div>
        <div class="field"><label for="c-pin">Caregiver PIN</label>
          <input id="c-pin" name="pin" type="password" inputmode="numeric" maxlength="6" required></div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${icon('users')} Log in as caregiver</button>
      </form>
      <div class="demo-hint">
        <div><strong>Demo caregiver:</strong> Phone <b>${h(p.caregiver.phone || '9123456780')}</b> · PIN <b>${h(p.caregiver.pin || '1234')}</b></div>
        <button class="btn btn-secondary btn-block" type="button" data-action="demo-login" data-v="caregiver">${icon('users')} Open demo caregiver view (Rahul)</button>
      </div>`;
  }

  $('#auth-screen').innerHTML = `
    <section class="auth-hero">
      <div class="auth-logo">
        <img src="assets/logo.svg" alt="ASHA logo">
        <div><div class="name">ASHA</div><div class="sub">AI Smart Health Assistant</div></div>
      </div>
      <p class="auth-tagline">Your caring companion for everyday health.</p>
      <p class="auth-intro">ASHA reminds you to take your medicines and go to your doctor visits, keeps track of your daily health, and gives you and your family a simple summary every day.</p>
      <ul class="auth-features">
        <li><span class="fi">${icon('pill')}</span>Medicine reminders</li>
        <li><span class="fi">${icon('calendar')}</span>Doctor appointments</li>
        <li><span class="fi">${icon('heartPulse')}</span>Health records &amp; trends</li>
        <li><span class="fi">${icon('sparkles')}</span>Smart AI insights</li>
        <li><span class="fi">${icon('clipboard')}</span>Daily health summary</li>
        <li><span class="fi">${icon('users')}</span>Caregiver connect</li>
      </ul>
      <p class="auth-trust">${icon('shield')} Your information stays private on this device.</p>
    </section>
    <section class="auth-panel">
      <div class="auth-top"><button class="btn btn-emergency btn-lg" type="button" data-action="emergency">${icon('siren')} Emergency Help</button></div>
      <div class="auth-card-wrap">
        <div class="auth-card">
          <div class="tabs" role="tablist" aria-label="Choose how to sign in">
            ${tab('login', 'User Login')}${tab('register', 'Register')}${tab('caregiver', 'Caregiver')}
          </div>
          ${form}
        </div>
      </div>
    </section>`;
}

function showAuth() {
  $('#app').hidden = true;
  $('#auth-screen').hidden = false;
  document.title = 'ASHA – AI Smart Health Assistant';
  renderAuth();
}

function startSession(role) {
  S.role = role;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ role }));
  $('#auth-screen').hidden = true;
  $('#app').hidden = false;
  const def = role === 'caregiver' ? 'caregiver' : 'dashboard';
  if (!location.hash || !NAV[role].includes(location.hash.replace('#/', ''))) location.hash = '#/' + def;
  S.route = null;
  render();
  Reminders.start();
}

function logout() {
  Reminders.stop();
  localStorage.removeItem(SESSION_KEY);
  S.role = null;
  S.authMode = 'login';
  history.replaceState(null, '', location.pathname);
  showAuth();
  toast('You have been logged out.', 'info');
}

/* =========================================================
   App shell + routing
   ========================================================= */
function currentRoute() {
  const r = location.hash.replace('#/', '');
  return NAV[S.role].includes(r) ? r : NAV[S.role][0];
}

function renderShell(route) {
  const unread = Store.unreadCount();
  const label = (r) => (S.role === 'caregiver' && r === 'caregiver' ? 'Overview' : ROUTES[r].title);

  $('#nav').innerHTML = (S.role === 'caregiver' ? '<div class="nav-label">Caregiver view</div>' : '') +
    NAV[S.role].map((r) => `<a href="#/${r}" ${r === route ? 'aria-current="page"' : ''}>${icon(ROUTES[r].icon)}<span>${t(r)}</span>${r === 'notifications' && unread ? `<span class="count">${unread}</span>` : ''}</a>`).join('') +
    `<a href="#" data-action="logout">${icon('logout')}<span>Log out</span></a>`;

  $('#bottom-nav').innerHTML = BOTTOM[S.role].map((r) =>
    `<a href="#/${r}" ${r === route ? 'aria-current="page"' : ''}>${icon(ROUTES[r].icon)}<span>${t(r)}</span></a>`
  ).join('') + `<button class="sos" type="button" data-action="emergency">${icon('siren')}<span>Help</span></button>`;

  $('#page-title').textContent = t(route);
  $('#page-date').textContent = U.fmtLong(new Date());
  $('.menu-btn').innerHTML = icon('menu');
  $('.sidebar-foot .btn').innerHTML = `${icon('siren')} Emergency Help`;
  $('.topbar-sos').innerHTML = `${icon('siren')} Emergency`;
  $('#bell-btn').innerHTML = icon('bell') + (unread ? `<span class="dot">${unread > 9 ? '9+' : unread}</span>` : '');
  $('#bell-btn').setAttribute('aria-label', `Notifications${unread ? `, ${unread} unread` : ''}`);
  const name = S.role === 'caregiver' ? Store.data.profile.caregiver.name : Store.data.profile.name;
  const av = $('#avatar-btn');
  av.textContent = U.initials(name);
  av.hidden = S.role === 'caregiver';

  const langBtns = document.querySelectorAll('.btn-lang');
  if (langBtns.length) {
    langBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.lang === currentLanguage);
    });
  }
}

function render() {
  if (!S.role) return;
  const route = currentRoute();
  const changed = route !== S.route;
  const a = document.activeElement;
  const focusKey = !changed && a && a.dataset && a.dataset.action ? `[data-action="${a.dataset.action}"]${a.dataset.id ? `[data-id="${a.dataset.id}"]` : ''}${a.dataset.v ? `[data-v="${a.dataset.v}"]` : ''}` : null;

  S.route = route;
  renderShell(route);
  $('#main').innerHTML = ROUTES[route].render();
  document.title = `${routeTitle(route)} · ASHA`;
  document.body.classList.remove('menu-open');

  if (changed) {
    window.scrollTo(0, 0);
    $('#main').focus({ preventScroll: true });
  } else if (focusKey) {
    const el = $(focusKey);
    if (el) el.focus({ preventScroll: true });
  }
  afterRender(route);
}

function afterRender(route) {
  if (route === 'records') drawRecordsChart();
}

/* =========================================================
   Medicine helpers
   ========================================================= */
function doseState({ med, date, status }) {
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  if (status === 'taken') return { key: 'taken', label: isHi ? 'ली गई' : 'Taken', cls: 'normal', ic: 'checkCircle' };
  if (status === 'missed') return { key: 'missed', label: isHi ? 'छूट गई' : 'Missed', cls: 'alert', ic: 'xCircle' };
  const today = U.ymd();
  if (date < today) return { key: 'pending', label: isHi ? 'रिकॉर्ड नहीं' : 'Not recorded', cls: 'neutral', ic: 'info' };
  const diff = (Date.now() - U.dateTime(date, med.time)) / 60000;
  if (date === today && diff > 60) return { key: 'overdue', label: isHi ? 'देर हो गई' : 'Overdue', cls: 'attention', ic: 'alertCircle' };
  if (date === today && diff >= -15) return { key: 'due', label: isHi ? 'अभी लेनी है' : 'Due now', cls: 'attention', ic: 'bellRing' };
  return { key: 'pending', label: isHi ? 'आने वाली' : 'Upcoming', cls: 'neutral', ic: 'clock' };
}

function doseCard(d, compact = false) {
  const m = d.med;
  const st = doseState(d);
  const cls = st.key === 'taken' ? 'taken' : st.key === 'missed' ? 'missed' : st.key === 'overdue' ? 'overdue' : `accent-${m.color || 'teal'}`;
  let actions = '';
  if (!RO()) {
    const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
    actions = d.status === 'pending'
      ? `<button class="btn btn-success ${compact ? 'btn-sm' : ''}" type="button" data-action="dose" data-id="${m.id}" data-v="taken" data-date="${d.date}">${icon('check')} ${isHi ? 'ली गई' : 'Taken'}</button>
         <button class="btn btn-warn ${compact ? 'btn-sm' : ''}" type="button" data-action="dose" data-id="${m.id}" data-v="missed" data-date="${d.date}">${icon('x')} ${isHi ? 'छूट गई' : 'Missed'}</button>`
      : `<button class="btn btn-ghost btn-sm" type="button" data-action="dose" data-id="${m.id}" data-v="" data-date="${d.date}">${isHi ? 'पूर्ववत करें' : 'Undo'}</button>`;
  }
  return `
    <div class="dose ${cls}">
      <div class="dose-time">${U.fmtTime(m.time).replace(/ (AM|PM)/, '')}<small>${m.time >= '12:00' ? 'PM' : 'AM'}</small></div>
      <div>
        <h4>${h(m.name)} ${pill(st.label, st.cls, st.ic)}</h4>
        <p>${h(m.dosage)}${m.instructions && !compact ? ' · ' + h(m.instructions) : ''}</p>
      </div>
      ${actions ? `<div class="dose-actions">${actions}</div>` : ''}
    </div>`;
}

function nextDose(doses) {
  const now = Date.now();
  const pending = doses.filter((d) => d.status === 'pending');
  return pending.find((d) => U.dateTime(d.date, d.med.time).getTime() >= now - 60 * 60000) || pending[0] || null;
}

/* =========================================================
   1. DASHBOARD
   ========================================================= */
function vitalCard({ ic, color, label, value, unit, status, rec, route = 'records' }) {
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  return `
    <div class="card">
      <div class="card-head">
        <h3><span class="card-icon ${color}">${icon(ic)}</span>${label}</h3>
        ${status ? badge(status) : ''}
      </div>
      ${rec ? `<div class="vital-value">${value}<small>${unit}</small></div>
        <p class="vital-meta">${icon('clock')} ${U.relDateTime(U.parseDT(rec.datetime))}</p>`
      : `<p class="muted">${isHi ? 'अभी तक कोई रीडिंग नहीं।' : 'No reading yet.'}</p>`}
      <div class="card-foot"><a class="link-btn" href="#/${route}">${isHi ? 'इतिहास देखें' : 'View history'} ${icon('chevronRight')}</a></div>
    </div>`;
}

function pageDashboard() {
  const d = Store.data, p = d.profile, g = d.goals, today = U.ymd();
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  const doses = Store.dosesFor(today);
  const taken = doses.filter((x) => x.status === 'taken').length;
  const missed = doses.filter((x) => x.status === 'missed').length;
  const next = nextDose(doses);
  const appt = Store.upcomingAppointments()[0];
  const bp = Store.latest('bpSys'), sugar = Store.latest('sugar'), hr = Store.latest('heartRate');
  const act = Store.activity(today);
  const ai = AI.analyze(d);
  const sum = AI.summary(d, today);
  const topIssues = ai.insights.filter((i) => i.status !== 'normal').slice(0, 3);
  const statusText = isHi
    ? { normal: 'सब कुछ ठीक दिख रहा है', attention: 'थोड़ा ध्यान देने की आवश्यकता है', alert: 'कुछ बातों की समीक्षा ज़रूरी है' }[ai.overall]
    : { normal: 'All looks good', attention: 'Needs a little attention', alert: 'Some things need review' }[ai.overall];

  return `
  <div class="stack">
    <section class="hero" aria-label="Welcome">
      <div>
        <span class="status-pill ${ai.overall}">${icon(STATUS_ICON[ai.overall])} ${isHi ? 'AI स्वास्थ्य स्थिति:' : 'AI health status:'} ${statusText}</span>
        <h2 style="margin-top:.9rem">${greeting()}, ${h(U.firstName(p.name))}!</h2>
        <p class="date">${new Intl.DateTimeFormat(isHi ? 'hi-IN' : 'en-US', { dateStyle: 'full' }).format(new Date())}</p>
        <div class="ai-line">${icon('sparkles')}<p>${h(isHi && sum.text_hi ? sum.text_hi : sum.text)}</p></div>
      </div>
      <div class="hero-actions">
        <a class="btn btn-light btn-lg" href="#/summary">${icon('clipboard')} ${isHi ? 'आज का सारांश' : "Today's summary"}</a>
        <a class="btn btn-outline-light btn-lg" href="#/insights">${icon('sparkles')} ${isHi ? 'AI जानकारी' : 'AI insights'}</a>
      </div>
    </section>

    <!-- Elder Voice Update to Caregiver Card -->
    <section class="card voice-update-card" style="border: 2px solid var(--brand); background: linear-gradient(135deg, #f0fdfa, #f8fafc); box-shadow: 0 4px 14px rgba(13,124,116,0.12)">
      <div class="card-head">
        <h3 style="color:var(--brand-700);font-size:1.35rem">📢 ${currentLanguage === 'hi' ? 'देखभालकर्ता को संदेश भेजें' : 'Send Update to Caregiver'}</h3>
        ${p.caregiver && p.caregiver.name ? `<span class="badge badge-info">${currentLanguage === 'hi' ? 'के लिए: ' : 'To: '}${h(p.caregiver.name)}</span>` : ''}
      </div>
      <p class="muted" style="margin-bottom:0.8rem;font-size:1rem">${currentLanguage === 'hi' ? 'बोलकर या लिखकर अपने देखभालकर्ता को बताएं कि आप कैसा महसूस कर रहे हैं।' : 'Tap the mic to dictate an update about your health or day for your caregiver.'}</p>
      
      <div style="display:flex;gap:0.75rem;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <textarea id="elder-voice-text" data-voice-target="true" placeholder="${currentLanguage === 'hi' ? 'यहाँ बोलें या लिखें... (जैसे: आज मैं बेहतर महसूस कर रहा हूँ)' : 'Speak or write your update here... (e.g., Feeling much better today)'}" style="width:100%;min-height:4.6rem;padding:0.75rem;border-radius:12px;border:1.5px solid var(--brand-300);font-size:1.05rem;line-height:1.5"></textarea>
          <div id="dashboard-mic-indicator" class="recording-indicator" style="display:none;margin-top:0.4rem;color:#b91c1c;font-weight:700;font-size:0.95rem">
            <span class="recording-dot"></span> ${currentLanguage === 'hi' ? 'Listening... बोलिए' : 'Listening... Speak now'}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <button type="button" class="btn btn-primary btn-lg" data-action="record-caregiver-msg" data-target="elder-voice-text" aria-label="${currentLanguage === 'hi' ? 'बोलकर संदेश रिकॉर्ड करें' : 'Tap to Speak'}" style="min-height:48px;min-width:180px;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;font-weight:700">
            🎙️ ${currentLanguage === 'hi' ? 'बोलकर संदेश रिकॉर्ड करें' : 'Tap to Speak'}
          </button>
          <button type="button" class="btn btn-secondary btn-lg" data-action="send-caregiver-msg" data-target="elder-voice-text" style="min-height:48px;min-width:180px;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;font-weight:700">
            ✉️ ${currentLanguage === 'hi' ? 'संदेश भेजें' : 'Send to Caregiver'}
          </button>
        </div>
      </div>
    </section>

    <div class="quick-actions">
      <button class="quick" type="button" data-action="add-record"><span class="card-icon rose">${icon('heartPulse')}</span>${isHi ? 'स्वास्थ्य रीडिंग जोड़ें' : 'Add health reading'}</button>
      <button class="quick" type="button" data-action="water" data-v="1"><span class="card-icon sky">${icon('droplet')}</span>${isHi ? 'मैंने 1 गिलास पानी पिया' : 'I drank a glass of water'}</button>
      <button class="quick" type="button" data-action="add-med"><span class="card-icon blue">${icon('pill')}</span>${isHi ? 'दवाई जोड़ें' : 'Add medicine'}</button>
      <button class="quick" type="button" data-action="add-appt"><span class="card-icon violet">${icon('calendar')}</span>${isHi ? 'अपॉइंटमेंट जोड़ें' : 'Add appointment'}</button>
    </div>

    <div class="grid grid-3">
      <div class="card">
        <div class="card-head"><h3><span class="card-icon">${icon('pill')}</span>${isHi ? 'आज की दवाइयाँ' : 'Medicines today'}</h3>${missed ? badge('attention', { label: isHi ? `${missed} छूट गई` : `${missed} missed` }) : doses.length && taken === doses.length ? badge('normal', { label: isHi ? 'सभी ले ली' : 'All taken' }) : ''}</div>
        ${doses.length ? `
          <div class="big-num">${taken}<small>${isHi ? `कुल ${doses.length} में से` : `of ${doses.length} taken`}</small></div>
          <div style="margin:.8rem 0">${progress(taken, doses.length, 'green', 'lg')}</div>
          <div class="chips">${pill(isHi ? `${taken} ले ली` : `${taken} taken`, 'normal', 'check')}${missed ? pill(isHi ? `${missed} छूट गई` : `${missed} missed`, 'alert', 'x') : ''}${pill(isHi ? `${doses.length - taken - missed} लेनी हैं` : `${doses.length - taken - missed} to take`, 'neutral', 'clock')}</div>`
      : emptyState('pill', isHi ? 'आज कोई दवाई नहीं' : 'No medicines today', isHi ? 'रिमाइंडर पाने के लिए अपनी दवाइयाँ जोड़ें।' : 'Add your medicines to get reminders.')}
        <div class="card-foot"><a class="link-btn" href="#/medicines">${isHi ? 'सभी दवाइयाँ देखें' : 'See all medicines'} ${icon('chevronRight')}</a></div>
      </div>

      <div class="card">
        <div class="card-head"><h3><span class="card-icon blue">${icon('bellRing')}</span>${isHi ? 'अगली दवाई' : 'Next medicine'}</h3>${next ? pill(doseState(next).label, doseState(next).cls) : ''}</div>
        ${next ? `
          <div class="big-num" style="font-size:1.7rem">${h(next.med.name)}</div>
          <p style="margin:.35rem 0 .2rem;font-size:1.05rem"><b>${U.fmtTime(next.med.time)}</b> · ${timeUntil(U.dateTime(today, next.med.time))}</p>
          <p class="muted">${h(next.med.dosage)}${next.med.instructions ? ' · ' + h(next.med.instructions) : ''}</p>
          <div class="row" style="margin-top:1rem">
            <button class="btn btn-success" type="button" data-action="dose" data-id="${next.med.id}" data-v="taken" data-date="${today}">${icon('check')} ${isHi ? 'ली गई चिह्नित करें' : 'Mark as taken'}</button>
          </div>`
      : emptyState('checkCircle', isHi ? 'आज के लिए कुछ नहीं बचा' : 'Nothing left for today', doses.length ? (isHi ? 'आज की सभी दवाइयाँ रिकॉर्ड हो गई हैं।' : 'All of today’s medicines are recorded.') : (isHi ? 'कोई दवाई निर्धारित नहीं है।' : 'No medicines scheduled.'))}
      </div>

      <div class="card">
        <div class="card-head"><h3><span class="card-icon violet">${icon('calendar')}</span>${isHi ? 'आने वाला अपॉइंटमेंट' : 'Upcoming appointment'}</h3>${appt ? pill(isHi ? { 'Today': 'आज', 'Tomorrow': 'कल' }[U.relDay(appt.date)] || U.relDay(appt.date) : U.relDay(appt.date), 'info') : ''}</div>
        ${appt ? `
          <div class="big-num" style="font-size:1.45rem">${h(appt.doctor)}</div>
          <p class="muted">${h(appt.specialty || '')}</p>
          <div class="appt" style="grid-template-columns:1fr"><div class="meta">
            <div>${icon('clock')}<span>${new Intl.DateTimeFormat(isHi ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' }).format(U.parseDate(appt.date))} ${isHi ? 'को' : 'at'} ${U.fmtTime(appt.time)}</span></div>
            <div>${icon('mapPin')}<span>${h(appt.hospital)}</span></div>
            ${appt.purpose ? `<div>${icon('stethoscope')}<span>${h(appt.purpose)}</span></div>` : ''}
          </div></div>`
      : emptyState('calendar', isHi ? 'कोई आगामी विजिट नहीं' : 'No upcoming visits', isHi ? 'अपना अगला डॉक्टर अपॉइंटमेंट जोड़ें।' : 'Add your next doctor appointment.')}
        <div class="card-foot"><a class="link-btn" href="#/appointments">${isHi ? 'सभी अपॉइंटमेंट' : 'All appointments'} ${icon('chevronRight')}</a></div>
      </div>
    </div>

    <div>
      <div class="section-title"><h2>${icon('heartPulse')} ${isHi ? 'नवीनतम स्वास्थ्य रीडिंग' : 'Latest health readings'}</h2><button class="btn btn-secondary btn-sm" type="button" data-action="add-record">${icon('plus')} ${isHi ? 'रीडिंग जोड़ें' : 'Add reading'}</button></div>
      <div class="grid grid-3">
        ${vitalCard({ ic: 'heartPulse', color: 'rose', label: isHi ? 'रक्तचाप' : 'Blood pressure', value: bp ? `${bp.bpSys}/${bp.bpDia}` : '', unit: 'mmHg', status: bp && Vitals.bp(bp.bpSys, bp.bpDia), rec: bp })}
        ${vitalCard({ ic: 'testTube', color: 'violet', label: isHi ? 'रक्त शर्करा' : 'Blood sugar', value: sugar ? sugar.sugar : '', unit: `mg/dL${sugar ? (sugar.sugarType === 'fasting' ? (isHi ? ' · खाली पेट' : ' · fasting') : (isHi ? ' · भोजन के बाद' : ' · after meal')) : ''}`, status: sugar && Vitals.sugar(sugar.sugar, sugar.sugarType), rec: sugar })}
        ${vitalCard({ ic: 'heart', color: 'red', label: isHi ? 'हृदय गति' : 'Heart rate', value: hr ? hr.heartRate : '', unit: 'BPM', status: hr && Vitals.heartRate(hr.heartRate), rec: hr })}
      </div>
    </div>

    <div>
      <div class="section-title"><h2>${icon('activity')} ${isHi ? 'आज की गतिविधियाँ' : "Today's activity"}</h2><a class="link-btn" href="#/activities">${isHi ? 'गतिविधियाँ अपडेट करें' : 'Update activities'} ${icon('chevronRight')}</a></div>
      <div class="grid grid-3">
        <div class="card">
          <div class="card-head"><h3><span class="card-icon sky">${icon('droplet')}</span>${isHi ? 'पानी का सेवन' : 'Water intake'}</h3>${act.water >= g.water ? badge('normal', { label: isHi ? 'लक्ष्य पूरा' : 'Goal met' }) : ''}</div>
          <div class="row-between"><div class="big-num">${act.water}<small>/ ${g.water} ${isHi ? 'गिलास' : 'glasses'}</small></div>
            <button class="btn btn-primary" type="button" data-action="water" data-v="1" aria-label="${isHi ? 'एक गिलास पानी जोड़ें' : 'Add one glass of water'}">${icon('plus')} 1 ${isHi ? 'गिलास' : 'glass'}</button></div>
          <div style="margin-top:.9rem">${progress(act.water, g.water, 'blue', 'lg')}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3><span class="card-icon violet">${icon('moon')}</span>${isHi ? 'पिछली रात की नींद' : 'Sleep last night'}</h3>${act.sleep != null ? badge(act.sleep >= 6 ? 'normal' : 'attention') : ''}</div>
          <div class="big-num">${act.sleep != null ? act.sleep : '–'}<small>/ ${g.sleep} ${isHi ? 'घंटे' : 'hours'}</small></div>
          <div style="margin-top:.9rem">${progress(act.sleep || 0, g.sleep, 'violet', 'lg')}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3><span class="card-icon green">${icon('walk')}</span>${isHi ? 'पैदल चलना' : 'Walking'}</h3>${act.walk >= g.walk ? badge('normal', { label: isHi ? 'लक्ष्य पूरा' : 'Goal met' }) : ''}</div>
          <div class="big-num">${act.walk}<small>/ ${g.walk} ${isHi ? 'मिनट' : 'minutes'}</small></div>
          <div style="margin-top:.9rem">${progress(act.walk, g.walk, 'green', 'lg')}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card card-status-${ai.overall}">
        <div class="card-head"><h3><span class="card-icon">${icon('sparkles')}</span>${isHi ? 'AI स्वास्थ्य स्थिति' : 'AI health status'}</h3>${badge(ai.overall, { insight: true })}</div>
        ${topIssues.length ? `<ul class="list">${topIssues.map((i) => {
          const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
          const issueText = isHi ? (i.issue_hi || i.issue) : i.issue;
          const nextText = isHi ? (i.next_hi || i.next) : i.next;
          return `
          <li class="list-item"><span class="card-icon ${i.status === 'alert' ? 'red' : 'amber'}">${icon(i.icon)}</span>
            <div class="grow"><h4>${h(issueText)}</h4><p>${h(nextText)}</p></div></li>`;
        }).join('')}</ul>`
      : `<p style="font-size:1.08rem">${typeof currentLanguage !== 'undefined' && currentLanguage === 'hi' ? 'आशा को आपके हालिया रिकॉर्ड में कोई चिंताजनक पैटर्न नहीं मिला। इसे बनाए रखें!' : 'ASHA did not find any concerning patterns in your recent records. Keep it up!'}</p>`}
        <div class="card-foot"><span class="small muted">${icon('info')} ${isHi ? 'केवल जानकारी के लिए – यह निदान नहीं है।' : 'Informational only – not a diagnosis.'}</span><a class="link-btn" href="#/insights">${isHi ? 'सभी जानकारी' : 'All insights'} ${icon('chevronRight')}</a></div>
      </div>
      <div class="card">
        <div class="card-head"><h3><span class="card-icon">${icon('clipboard')}</span>${isHi ? 'आज का स्वास्थ्य सारांश' : "Today's health summary"}</h3>${badge(sum.status)}</div>
        <div class="summary-lines">
          <div><span class="ok">${icon('checkCircle')}</span>${sum.taken} ${isHi ? 'दवाई ली गई' : U.plural(sum.taken, 'medicine') + ' taken'}</div>
          ${sum.missed ? `<div><span class="warn">${icon('alert')}</span>${sum.missed} ${isHi ? 'दवाई छूट गई' : U.plural(sum.missed, 'medicine') + ' missed'}</div>` : ''}
          <div>${icon('heartPulse')} ${isHi ? 'रक्तचाप' : 'Blood pressure'} <b>${sum.bpR ? `${sum.bpR.bpSys}/${sum.bpR.bpDia}` : '–'}</b></div>
          <div>${icon('droplet')} ${isHi ? 'पानी' : 'Water'} <b>${sum.activity.water}/${g.water} ${isHi ? 'गिलास' : 'glasses'}</b></div>
        </div>
        <div class="card-foot"><a class="btn btn-secondary" href="#/summary">${icon('clipboard')} ${isHi ? 'पूरा सारांश खोलें' : 'Open full summary'}</a></div>
      </div>
    </div>
  </div>`;
}

/* =========================================================
   2. MEDICINES
   ========================================================= */
function pageMedicines() {
  const d = Store.data, today = U.ymd();
  const doses = Store.dosesFor(today);
  const taken = doses.filter((x) => x.status === 'taken').length;
  const missed = doses.filter((x) => x.status === 'missed').length;
  const next = nextDose(doses);
  const days = [...Array(7)].map((_, i) => U.ymd(U.addDays(new Date(), i - 6)));

  let banner = '';
  if (!d.settings.medReminders) {
    banner = `<div class="banner warn">${icon('bell')}<div class="grow"><b>Medicine reminders are switched off.</b> Turn them on so ASHA can remind you on time.</div><a class="btn btn-ghost btn-sm" href="#/profile">Settings</a></div>`;
  } else if (next) {
    banner = `<div class="banner">${icon('bellRing')}<div class="grow"><b>Next reminder:</b> ${h(next.med.name)} (${h(next.med.dosage)}) at <b>${U.fmtTime(next.med.time)}</b> – ${timeUntil(U.dateTime(today, next.med.time))}</div></div>`;
  } else if (doses.length) {
    banner = `<div class="banner ok">${icon('checkCircle')}<div class="grow"><b>All of today's medicines are recorded.</b> ${missed ? `${U.plural(missed, 'dose')} marked as missed.` : 'Well done!'}</div></div>`;
  }

  const adherenceRows = d.medicines.filter((m) => m.frequency !== 'asneeded').map((m) => `
    <tr><td>${h(m.name)}</td>${days.map((day) => {
    if (!Store.isDue(m, day)) return '<td><span class="sr-only">Not scheduled</span></td>';
    const st = (d.doseLog[day] || {})[m.id];
    if (st === 'taken') return `<td><span class="adh t" title="Taken">${icon('check')}<span class="sr-only">Taken</span></span></td>`;
    if (st === 'missed') return `<td><span class="adh m" title="Missed">${icon('x')}<span class="sr-only">Missed</span></span></td>`;
    return `<td><span class="adh p" title="Not recorded">–<span class="sr-only">Not recorded</span></span></td>`;
  }).join('')}</tr>`).join('');

  return `
  <div class="stack">
    <div class="page-head">
      <div><h2>Your medicines</h2><p>Today: ${taken} taken${missed ? `, ${missed} missed` : ''}, ${doses.length - taken - missed} still to take.</p></div>
      <button class="btn btn-primary btn-lg" type="button" data-action="add-med">${icon('plus')} Add medicine</button>
    </div>
    ${banner}

    <section class="card">
      <div class="section-title"><h2>${icon('clock')} Today's schedule</h2>${doses.length ? `<div style="min-width:200px;flex:0 1 260px">${progress(taken, doses.length, 'green', 'lg')}</div>` : ''}</div>
      ${doses.length ? `<div class="list">${doses.map((x) => doseCard(x)).join('')}</div>`
      : emptyState('pill', 'No medicines scheduled today', 'Tap “Add medicine” to add your first medicine and get reminders.', `<button class="btn btn-primary" type="button" data-action="add-med">${icon('plus')} Add medicine</button>`)}
    </section>

    <section>
      <div class="section-title"><h2>${icon('pill')} All medicines (${d.medicines.length})</h2></div>
      ${d.medicines.length ? `<div class="grid grid-auto">${d.medicines.map((m) => {
        const ended = m.end && m.end < today;
        return `
        <article class="card med-card accent-${m.color || 'teal'}">
          <div class="row-between"><h3 style="font-size:1.25rem">${h(m.name)}</h3>${ended ? pill('Course ended', 'neutral') : pill(FREQUENCIES[m.frequency] || 'Every day', 'info')}</div>
          <div class="meta">
            <div>${icon('pill')}<span>${h(m.dosage)}</span></div>
            <div>${icon('clock')}<span>${m.frequency === 'asneeded' ? 'When needed' : U.fmtTime(m.time)}</span></div>
            <div>${icon('calendar')}<span>${m.start ? U.fmtShort(U.parseDate(m.start)) : 'Today'} → ${m.end ? U.fmtShort(U.parseDate(m.end)) : 'Ongoing'}</span></div>
            ${m.instructions ? `<div>${icon('info')}<span>${h(m.instructions)}</span></div>` : ''}
          </div>
          <div class="card-foot" style="justify-content:flex-start">
            <button class="btn btn-ghost btn-sm" type="button" data-action="edit-med" data-id="${m.id}">${icon('edit')} Edit</button>
            <button class="btn btn-danger btn-sm" type="button" data-action="del-med" data-id="${m.id}">${icon('trash')} Delete</button>
          </div>
        </article>`;
      }).join('')}</div>` : `<div class="card">${emptyState('pill', 'No medicines added', 'Your medicine list will appear here.')}</div>`}
    </section>

    ${adherenceRows ? `
    <section class="card">
      <div class="section-title"><h2>${icon('trendingUp')} Last 7 days</h2>
        <div class="chips">${pill('Taken', 'normal', 'check')}${pill('Missed', 'alert', 'x')}${pill('Not recorded', 'neutral')}</div></div>
      <div class="table-wrap"><table class="adherence">
        <thead><tr><th scope="col">Medicine</th>${days.map((day) => `<th scope="col">${day === today ? 'Today' : U.parseDate(day).toLocaleDateString('en-IN', { weekday: 'short' })}</th>`).join('')}</tr></thead>
        <tbody>${adherenceRows}</tbody>
      </table></div>
    </section>` : ''}
  </div>`;
}

function medicineForm(m = {}) {
  const today = U.ymd();
  return `
  <form class="form" data-form="medicine">
    <input type="hidden" name="id" value="${h(m.id || '')}">
    <div class="field"><label for="m-name">Medicine name *</label>
      <input id="m-name" name="name" required value="${h(m.name || '')}" placeholder="e.g. Metformin" autocomplete="off"></div>
    <div class="form-row">
      <div class="field"><label for="m-dose">Dosage *</label>
        <input id="m-dose" name="dosage" required value="${h(m.dosage || '')}" placeholder="e.g. 500 mg – 1 tablet"></div>
      <div class="field"><label for="m-time">Time *</label>
        <input id="m-time" name="time" type="time" required value="${h(m.time || '08:00')}"></div>
    </div>
    <div class="field"><label for="m-freq">How often?</label>
      <select id="m-freq" name="frequency">${Object.entries(FREQUENCIES).map(([k, v]) => `<option value="${k}" ${m.frequency === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div class="form-row">
      <div class="field"><label for="m-start">Start date</label><input id="m-start" name="start" type="date" value="${h(m.start || today)}"></div>
      <div class="field"><label for="m-end">End date <span class="muted">(optional)</span></label><input id="m-end" name="end" type="date" value="${h(m.end || '')}"><span class="hint">Leave empty if ongoing.</span></div>
    </div>
    <div class="field"><label for="m-ins">Instructions</label>
      <textarea id="m-ins" name="instructions" placeholder="e.g. Take after breakfast with water">${h(m.instructions || '')}</textarea></div>
    <div class="field"><span class="label">Colour tag</span>
      <div class="chips">${['teal', 'blue', 'violet', 'amber', 'rose'].map((c) => `
        <label class="badge badge-neutral" style="cursor:pointer;min-height:2.6rem"><input type="radio" name="color" value="${c}" ${(m.color || 'teal') === c ? 'checked' : ''} style="width:auto;min-height:0"> ${c[0].toUpperCase() + c.slice(1)}</label>`).join('')}</div></div>
    <div id="form-error"></div>
    <div class="form-actions">
      <button class="btn btn-ghost btn-lg" type="button" data-action="close-modal">Cancel</button>
      <button class="btn btn-primary btn-lg" type="submit">${icon('check')} ${m.id ? 'Save changes' : 'Add medicine'}</button>
    </div>
  </form>`;
}

/* =========================================================
   3. APPOINTMENTS
   ========================================================= */
function apptCard(a) {
  const dt = Store.apptDate(a);
  const isUpcoming = a.status === 'upcoming' && dt >= new Date(Date.now() - 60 * 60000);
  const needsUpdate = a.status === 'upcoming' && !isUpcoming;
  const d = U.parseDate(a.date);
  const lead = Store.data.settings.apptLead;
  const leadText = lead >= 1440 ? '1 day' : lead >= 60 ? `${lead / 60} hour${lead > 60 ? 's' : ''}` : `${lead} minutes`;
  let statusBadge;
  if (isUpcoming) statusBadge = pill(U.relDay(a.date), 'info', 'calendar');
  else if (needsUpdate) statusBadge = badge('attention', { label: 'Did you go?' });
  else if (a.status === 'completed') statusBadge = badge('normal', { label: 'Attended' });
  else statusBadge = badge('alert', { label: 'Missed' });

  return `
  <article class="card">
    <div class="appt">
      <div class="date-block ${isUpcoming ? '' : 'past'}" aria-hidden="true">
        <div class="m">${d.toLocaleDateString('en-IN', { month: 'short' })}</div>
        <div class="d">${d.getDate()}</div>
        <div class="w">${d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
      </div>
      <div>
        <div class="row-between"><h4>${h(a.doctor)}${a.specialty ? ` <span class="muted" style="font-weight:400">· ${h(a.specialty)}</span>` : ''}</h4>${statusBadge}</div>
        <div class="meta">
          <div>${icon('clock')}<span>${U.fmtLong(d)} at <b>${U.fmtTime(a.time)}</b></span></div>
          <div>${icon('hospital')}<span>${h(a.hospital)}</span></div>
          ${a.purpose ? `<div>${icon('stethoscope')}<span>${h(a.purpose)}</span></div>` : ''}
        </div>
        ${a.notes ? `<p class="note" style="margin-top:.7rem">${icon('fileText')} ${h(a.notes)}</p>` : ''}
        ${isUpcoming && Store.data.settings.apptReminders ? `<p class="small muted" style="margin-top:.6rem">${icon('bellRing')} Reminder ${leadText} before, and the day before.</p>` : ''}
        ${RO() ? '' : `<div class="row" style="margin-top:1rem">
          ${needsUpdate ? `<button class="btn btn-success btn-sm" type="button" data-action="appt-status" data-id="${a.id}" data-v="completed">${icon('check')} I went</button>
            <button class="btn btn-warn btn-sm" type="button" data-action="appt-status" data-id="${a.id}" data-v="missed">${icon('x')} I missed it</button>` : ''}
          <button class="btn btn-ghost btn-sm" type="button" data-action="edit-appt" data-id="${a.id}">${icon('edit')} Edit</button>
          <button class="btn btn-danger btn-sm" type="button" data-action="del-appt" data-id="${a.id}">${icon('trash')} Delete</button>
        </div>`}
      </div>
    </div>
  </article>`;
}

function pageAppointments() {
  const up = Store.upcomingAppointments();
  const past = Store.pastAppointments();
  const next = up[0];
  return `
  <div class="stack">
    <div class="page-head">
      <div><h2>Doctor appointments</h2><p>${up.length ? `You have ${U.plural(up.length, 'upcoming appointment')}.` : 'No upcoming appointments.'}</p></div>
      <button class="btn btn-primary btn-lg" type="button" data-action="add-appt">${icon('plus')} Add appointment</button>
    </div>
    ${next ? `<div class="banner">${icon('bellRing')}<div class="grow"><b>Next visit:</b> ${h(next.doctor)} – ${U.relDay(next.date)} at ${U.fmtTime(next.time)} (${timeUntil(Store.apptDate(next))})</div></div>` : ''}
    <section>
      <div class="section-title"><h2>${icon('calendar')} Upcoming</h2></div>
      ${up.length ? `<div class="grid grid-2">${up.map(apptCard).join('')}</div>`
      : `<div class="card">${emptyState('calendar', 'No upcoming appointments', 'Add your next doctor visit and ASHA will remind you.', `<button class="btn btn-primary" type="button" data-action="add-appt">${icon('plus')} Add appointment</button>`)}</div>`}
    </section>
    <section>
      <div class="section-title"><h2>${icon('clock')} Previous</h2></div>
      ${past.length ? `<div class="grid grid-2">${past.map(apptCard).join('')}</div>` : `<div class="card">${emptyState('clock', 'No previous appointments', 'Past visits will appear here.')}</div>`}
    </section>
  </div>`;
}

function apptForm(a = {}) {
  return `
  <form class="form" data-form="appointment">
    <input type="hidden" name="id" value="${h(a.id || '')}">
    <div class="form-row">
      <div class="field"><label for="a-doc">Doctor name *</label><input id="a-doc" name="doctor" required value="${h(a.doctor || '')}" placeholder="e.g. Dr. Anil Mehta"></div>
      <div class="field"><label for="a-sp">Speciality <span class="muted">(optional)</span></label><input id="a-sp" name="specialty" value="${h(a.specialty || '')}" placeholder="e.g. Cardiologist"></div>
    </div>
    <div class="field"><label for="a-hos">Hospital / clinic *</label><input id="a-hos" name="hospital" required value="${h(a.hospital || '')}" placeholder="e.g. Apollo Hospital"></div>
    <div class="form-row">
      <div class="field"><label for="a-date">Date *</label><input id="a-date" name="date" type="date" required value="${h(a.date || U.ymd(U.addDays(new Date(), 1)))}"></div>
      <div class="field"><label for="a-time">Time *</label><input id="a-time" name="time" type="time" required value="${h(a.time || '10:00')}"></div>
    </div>
    <div class="field"><label for="a-pur">Purpose</label><input id="a-pur" name="purpose" value="${h(a.purpose || '')}" placeholder="e.g. Blood pressure check-up"></div>
    <div class="field"><label for="a-notes">Notes</label><textarea id="a-notes" name="notes" placeholder="e.g. Bring old reports, fasting needed">${h(a.notes || '')}</textarea></div>
    ${a.id ? `<div class="field"><label for="a-st">Status</label><select id="a-st" name="status">
      ${[['upcoming', 'Upcoming'], ['completed', 'Attended'], ['missed', 'Missed']].map(([k, v]) => `<option value="${k}" ${a.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>` : ''}
    <div id="form-error"></div>
    <div class="form-actions">
      <button class="btn btn-ghost btn-lg" type="button" data-action="close-modal">Cancel</button>
      <button class="btn btn-primary btn-lg" type="submit">${icon('check')} ${a.id ? 'Save changes' : 'Add appointment'}</button>
    </div>
  </form>`;
}

/* =========================================================
   4. DAILY ACTIVITIES
   ========================================================= */
function weekBars(field, goal, color, unit) {
  const days = [...Array(7)].map((_, i) => U.ymd(U.addDays(new Date(), i - 6)));
  const vals = days.map((d) => Store.activity(d)[field] || 0);
  const max = Math.max(goal, ...vals) * 1.1 || 1;
  return `<div class="week-bars" role="img" aria-label="${field} for the last 7 days: ${vals.join(', ')} ${unit}">
    ${days.map((d, i) => `<div class="week-bar ${i === 6 ? 'today' : ''}">
      <span class="v">${vals[i]}</span>
      <div class="track"><div class="b ${color} ${vals[i] >= goal ? 'goal' : ''}" style="height:${Math.max(4, (vals[i] / max) * 100)}%"></div></div>
      <span class="l">${i === 6 ? 'Today' : U.parseDate(d).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
    </div>`).join('')}
  </div>`;
}

function pageActivities() {
  const g = Store.data.goals, today = U.ymd(), a = Store.activity(today);
  const meals = [['breakfast', 'Breakfast', 'sun'], ['lunch', 'Lunch', 'utensils'], ['snack', 'Evening snack', 'smile'], ['dinner', 'Dinner', 'moon']];
  const mealsDone = meals.filter(([k]) => a.meals[k]).length;
  const otherTotal = a.other.reduce((s, o) => s + (+o.minutes || 0), 0);
  const goalsMet = [a.water >= g.water, a.walk >= g.walk, (a.sleep || 0) >= g.sleep, mealsDone >= 3].filter(Boolean).length;

  return `
  <div class="stack">
    <div class="page-head">
      <div><h2>Today's activities</h2><p>${U.fmtLong(new Date())} · ${goalsMet} of 4 daily goals reached</p></div>
      <div style="min-width:220px">${progress(goalsMet, 4, '', 'lg')}</div>
    </div>

    <div class="grid grid-2">
      <section class="card">
        <div class="card-head"><h3><span class="card-icon sky">${icon('droplet')}</span>Water intake</h3>${a.water >= g.water ? badge('normal', { label: 'Goal met' }) : pill(`${Math.max(0, g.water - a.water)} more to go`, 'info')}</div>
        <div class="counter">
          <button class="counter-btn" type="button" data-action="water" data-v="-1" aria-label="Remove one glass">${icon('minus')}</button>
          <div class="counter-value" aria-live="polite"><div class="n">${a.water}</div><div class="u">of ${g.water} glasses</div></div>
          <button class="counter-btn plus" type="button" data-action="water" data-v="1" aria-label="Add one glass">${icon('plus')}</button>
        </div>
        <div class="glasses" aria-hidden="true">${[...Array(Math.max(g.water, a.water))].map((_, i) => `<span class="glass ${i < a.water ? 'full' : ''}">${icon('droplet')}</span>`).join('')}</div>
        ${progress(a.water, g.water, 'blue', 'lg')}
      </section>

      <section class="card">
        <div class="card-head"><h3><span class="card-icon amber">${icon('utensils')}</span>Meals</h3>${pill(`${mealsDone} of 4 eaten`, mealsDone >= 3 ? 'normal' : 'neutral')}</div>
        <p class="muted" style="margin-bottom:.9rem">Tap a meal when you have eaten it.</p>
        <div class="meal-grid">${meals.map(([k, l, ic]) => `
          <button class="meal-btn" type="button" aria-pressed="${a.meals[k]}" data-action="meal" data-v="${k}">${a.meals[k] ? icon('checkCircle') : icon(ic)} ${l}</button>`).join('')}</div>
      </section>

      <section class="card">
        <div class="card-head"><h3><span class="card-icon green">${icon('walk')}</span>Walking / exercise</h3>${a.walk >= g.walk ? badge('normal', { label: 'Goal met' }) : pill(`Goal ${g.walk} min`, 'info')}</div>
        <div class="counter">
          <button class="counter-btn" type="button" data-action="walk" data-v="-5" aria-label="Remove 5 minutes">${icon('minus')}</button>
          <div class="counter-value" aria-live="polite"><div class="n">${a.walk}</div><div class="u">minutes today</div></div>
          <button class="counter-btn plus" type="button" data-action="walk" data-v="5" aria-label="Add 5 minutes">${icon('plus')}</button>
        </div>
        <div class="row" style="justify-content:center;margin-bottom:1rem">
          <button class="btn btn-secondary btn-sm" type="button" data-action="walk" data-v="10">+10 min</button>
          <button class="btn btn-secondary btn-sm" type="button" data-action="walk" data-v="15">+15 min</button>
          <button class="btn btn-secondary btn-sm" type="button" data-action="walk" data-v="30">+30 min</button>
        </div>
        ${progress(a.walk, g.walk, 'green', 'lg')}
      </section>

      <section class="card">
        <div class="card-head"><h3><span class="card-icon violet">${icon('moon')}</span>Sleep last night</h3>${a.sleep == null ? pill('Not recorded', 'neutral') : badge(a.sleep >= 6 ? 'normal' : 'attention', { label: a.sleep >= g.sleep ? 'Goal met' : a.sleep >= 6 ? 'Normal' : 'Less than usual' })}</div>
        <div class="counter">
          <button class="counter-btn" type="button" data-action="sleep" data-v="-0.5" aria-label="Half an hour less">${icon('minus')}</button>
          <div class="counter-value" aria-live="polite"><div class="n">${a.sleep ?? '–'}</div><div class="u">hours of sleep</div></div>
          <button class="counter-btn plus" type="button" data-action="sleep" data-v="0.5" aria-label="Half an hour more">${icon('plus')}</button>
        </div>
        <div class="row" style="justify-content:center;margin-bottom:1rem">
          ${[5, 6, 7, 8].map((n) => `<button class="btn ${a.sleep === n ? 'btn-primary' : 'btn-secondary'} btn-sm" type="button" data-action="sleep-set" data-v="${n}">${n} hours</button>`).join('')}
        </div>
        ${progress(a.sleep || 0, g.sleep, 'violet', 'lg')}
      </section>
    </div>

    <section class="card">
      <div class="card-head"><h3><span class="card-icon">${icon('smile')}</span>Other activities</h3>${otherTotal ? pill(`${otherTotal} minutes`, 'info') : ''}</div>
      ${RO() ? '' : `<form class="form-row-3" data-form="other" style="align-items:end;margin-bottom:1rem">
        <div class="field"><label for="o-name">Activity</label>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <input id="o-name" name="name" required placeholder="e.g. Yoga, gardening, prayer" list="activity-ideas" style="flex:1">
            <button type="button" class="icon-btn btn-mic" data-action="dictate" data-target="o-name" aria-label="🎙️ Speak to update" style="width:48px;height:48px;border-radius:50%;color:var(--brand);flex-shrink:0;padding:0;font-size:1.5rem">🎙️</button>
          </div>
        </div>
        <div class="field"><label for="o-min">Minutes</label><input id="o-min" name="minutes" type="number" inputmode="numeric" min="1" max="600" value="15" required></div>
        <button class="btn btn-primary btn-lg" type="submit">${icon('plus')} Add activity</button>
        <datalist id="activity-ideas"><option value="Yoga"><option value="Gardening"><option value="Prayer / meditation"><option value="Stretching"><option value="Reading"><option value="Talking with family"><option value="Breathing exercises"></datalist>
      </form>`}
      ${a.other.length ? `<ul class="list">${a.other.map((o) => `
        <li class="list-item"><span class="card-icon">${icon('checkCircle')}</span>
          <div class="grow"><h4>${h(o.name)}</h4><p>${o.minutes} minutes</p></div>
          ${RO() ? '' : `<button class="btn btn-danger btn-sm" type="button" data-action="del-other" data-id="${o.id}" aria-label="Delete ${h(o.name)}">${icon('trash')}</button>`}
        </li>`).join('')}</ul>` : `<p class="muted">No other activities added today.</p>`}
    </section>

    <section class="card">
      <div class="section-title"><h2>${icon('trendingUp')} This week</h2><span class="small muted">Darker bars mean the goal was reached.</span></div>
      <div class="grid grid-3">
        <div><h3 class="row">${icon('droplet')} Water (glasses)</h3>${weekBars('water', g.water, 'blue', 'glasses')}</div>
        <div><h3 class="row">${icon('walk')} Walking (minutes)</h3>${weekBars('walk', g.walk, '', 'minutes')}</div>
        <div><h3 class="row">${icon('moon')} Sleep (hours)</h3>${weekBars('sleep', g.sleep, 'violet', 'hours')}</div>
      </div>
    </section>
  </div>`;
}

/* =========================================================
   5. HEALTH RECORDS
   ========================================================= */
const METRICS = {
  bp: { label: 'Blood pressure', unit: 'mmHg', icon: 'heartPulse', band: [60, 130], series: [{ key: 'bpSys', label: 'Top number (systolic)', color: '#d6406a' }, { key: 'bpDia', label: 'Bottom number (diastolic)', color: '#2f7de1' }], classify: (r) => Vitals.bp(r.bpSys, r.bpDia) },
  sugar: { label: 'Blood sugar', unit: 'mg/dL', icon: 'testTube', band: [70, 130], series: [{ key: 'sugar', label: 'Blood sugar', color: '#7c4ddb' }], classify: (r) => Vitals.sugar(r.sugar, r.sugarType) },
  heartRate: { label: 'Heart rate', unit: 'BPM', icon: 'heart', band: [60, 100], series: [{ key: 'heartRate', label: 'Heart rate', color: '#d6406a' }], classify: (r) => Vitals.heartRate(r.heartRate) },
  weight: { label: 'Weight', unit: 'kg', icon: 'scale', series: [{ key: 'weight', label: 'Weight', color: '#0d7c74' }], decimals: 1, classify: () => 'normal' },
  spo2: { label: 'Oxygen (SpO2)', unit: '%', icon: 'wind', band: [95, 100], series: [{ key: 'spo2', label: 'SpO2', color: '#0b6f96' }], classify: (r) => Vitals.spo2(r.spo2) },
  temp: { label: 'Temperature', unit: '°F', icon: 'thermometer', band: [97, 99.4], series: [{ key: 'temp', label: 'Temperature', color: '#e3a21a' }], decimals: 1, classify: (r) => Vitals.temp(r.temp) }
};

function chartRows(metric) {
  const key = METRICS[metric].series[0].key;
  const from = U.ymd(U.addDays(new Date(), -13));
  return [...Store.data.records].filter((r) => r[key] != null && r.datetime.slice(0, 10) >= from).sort((a, b) => a.datetime.localeCompare(b.datetime));
}

function drawRecordsChart() {
  const canvas = $('#records-chart');
  if (!canvas) return;
  const m = METRICS[S.chartMetric];
  const rows = chartRows(S.chartMetric);
  const flags = rows.map(m.classify);
  drawLineChart(canvas, {
    labels: rows.map((r) => U.fmtShort(U.parseDT(r.datetime))),
    series: m.series.map((s) => ({ color: s.color, data: rows.map((r) => r[s.key]), flags })),
    band: m.band, decimals: m.decimals
  });
}

function recordValueCell(r, field) {
  const st = Vitals.ofRecord(r);
  const map = {
    bp: r.bpSys != null ? [`${r.bpSys}/${r.bpDia}`, st.bp] : null,
    sugar: r.sugar != null ? [`${r.sugar} <span class="muted small">${r.sugarType === 'fasting' ? 'F' : 'PP'}</span>`, st.sugar] : null,
    heartRate: r.heartRate != null ? [r.heartRate, st.heartRate] : null,
    weight: r.weight != null ? [r.weight, null] : null,
    temp: r.temp != null ? [r.temp, st.temp] : null,
    spo2: r.spo2 != null ? [r.spo2 + '%', st.spo2] : null
  }[field];
  if (!map) return '<span class="muted">–</span>';
  const [v, s] = map;
  return `<span class="${s && s !== 'normal' ? 'val-' + s : ''}">${v}${s && s !== 'normal' ? ' ' + icon(STATUS_ICON[s]) : ''}</span>`;
}

function pageRecords() {
  const latest = {
    bp: Store.latest('bpSys'), sugar: Store.latest('sugar'), heartRate: Store.latest('heartRate'),
    weight: Store.latest('weight'), temp: Store.latest('temp'), spo2: Store.latest('spo2')
  };
  const tile = (key, ic, color, label, value, unit, status) => {
    const r = latest[key];
    return `<div class="card">
      <div class="card-head"><h3><span class="card-icon ${color}">${icon(ic)}</span>${label}</h3>${r && status ? badge(status) : ''}</div>
      ${r ? `<div class="vital-value">${value}<small>${unit}</small></div><p class="vital-meta">${U.relDateTime(U.parseDT(r.datetime))}</p>` : '<p class="muted">No reading yet</p>'}
    </div>`;
  };
  const m = METRICS[S.chartMetric];
  const rows = chartRows(S.chartMetric);
  const flagged = rows.filter((r) => { const s = m.classify(r); return s && s !== 'normal'; }).length;
  let caption;
  if (!rows.length) caption = `No ${m.label.toLowerCase()} readings in the last 14 days.`;
  else if (S.chartMetric === 'weight') {
    const diff = +(rows[rows.length - 1].weight - rows[0].weight).toFixed(1);
    caption = Math.abs(diff) < 1 ? `Your weight has stayed steady (about ${rows[rows.length - 1].weight} kg).` : `Your weight has ${diff > 0 ? 'gone up' : 'gone down'} by ${Math.abs(diff)} kg in the last two weeks.`;
  } else if (!flagged) caption = `All ${rows.length} readings in the last 14 days were inside the usual range (green shaded area).`;
  else caption = `Most readings were in the usual range. ${U.plural(flagged, 'reading')} ${flagged === 1 ? 'was' : 'were'} outside it – shown as coloured dots.`;

  const all = Store.recordsSorted();
  const l = latest;
  return `
  <div class="stack">
    <div class="page-head">
      <div><h2>Health records</h2><p>Your readings and how they are changing over time.</p></div>
      ${RO() ? '' : `<button class="btn btn-primary btn-lg" type="button" data-action="add-record">${icon('plus')} Add new reading</button>`}
    </div>

    <div class="grid grid-3">
      ${tile('bp', 'heartPulse', 'rose', 'Blood pressure', l.bp ? `${l.bp.bpSys}/${l.bp.bpDia}` : '', 'mmHg', l.bp && Vitals.bp(l.bp.bpSys, l.bp.bpDia))}
      ${tile('sugar', 'testTube', 'violet', 'Blood sugar', l.sugar ? l.sugar.sugar : '', 'mg/dL', l.sugar && Vitals.sugar(l.sugar.sugar, l.sugar.sugarType))}
      ${tile('heartRate', 'heart', 'red', 'Heart rate', l.heartRate ? l.heartRate.heartRate : '', 'BPM', l.heartRate && Vitals.heartRate(l.heartRate.heartRate))}
      ${tile('weight', 'scale', '', 'Weight', l.weight ? l.weight.weight : '', 'kg', null)}
      ${tile('temp', 'thermometer', 'amber', 'Temperature', l.temp ? l.temp.temp : '', '°F', l.temp && Vitals.temp(l.temp.temp))}
      ${tile('spo2', 'wind', 'sky', 'Oxygen (SpO2)', l.spo2 ? l.spo2.spo2 : '', '%', l.spo2 && Vitals.spo2(l.spo2.spo2))}
    </div>

    <section class="card">
      <div class="section-title"><h2>${icon('trendingUp')} Trends – last 14 days</h2></div>
      <div class="seg" role="group" aria-label="Choose what to show in the chart">
        ${Object.entries(METRICS).map(([k, v]) => `<button type="button" aria-pressed="${S.chartMetric === k}" data-action="chart-metric" data-v="${k}">${icon(v.icon)} ${v.label}</button>`).join('')}
      </div>
      <div class="chart-wrap"><canvas id="records-chart" role="img" aria-label="${m.label} chart. ${h(caption)}"></canvas></div>
      <div class="chart-legend">
        ${m.series.map((s) => `<span><i style="background:${s.color}"></i>${s.label} (${m.unit})</span>`).join('')}
        ${m.band ? '<span><i style="background:rgba(19,112,58,.18);border:1px dashed #13703a"></i>Usual range</span>' : ''}
        ${m.band ? '<span><i style="background:#e0a52e;border-radius:50%"></i>Attention</span><span><i style="background:#b42020;border-radius:50%"></i>Alert</span>' : ''}
      </div>
      <p class="chart-caption">${icon('lightbulb')}<span>${h(caption)}</span></p>
    </section>

    <section class="card">
      <div class="section-title"><h2>${icon('fileText')} All readings (${all.length})</h2></div>
      ${all.length ? `<div class="table-wrap"><table class="table responsive">
        <thead><tr><th>Date &amp; time</th><th>Blood pressure</th><th>Sugar</th><th>Heart rate</th><th>Weight</th><th>Temp °F</th><th>SpO2</th><th>Notes</th>${RO() ? '' : '<th><span class="sr-only">Actions</span></th>'}</tr></thead>
        <tbody>${all.map((r) => `<tr>
          <td data-label="Date"><b>${U.relDateTime(U.parseDT(r.datetime))}</b></td>
          <td data-label="Blood pressure">${recordValueCell(r, 'bp')}</td>
          <td data-label="Sugar">${recordValueCell(r, 'sugar')}</td>
          <td data-label="Heart rate">${recordValueCell(r, 'heartRate')}</td>
          <td data-label="Weight">${recordValueCell(r, 'weight')}</td>
          <td data-label="Temperature">${recordValueCell(r, 'temp')}</td>
          <td data-label="SpO2">${recordValueCell(r, 'spo2')}</td>
          <td data-label="Notes">${r.notes ? h(r.notes) : '<span class="muted">–</span>'}</td>
          ${RO() ? '' : `<td data-label=""><div class="row" style="flex-wrap:nowrap;gap:.4rem">
            <button class="btn btn-ghost btn-sm" type="button" data-action="edit-record" data-id="${r.id}" aria-label="Edit reading">${icon('edit')}</button>
            <button class="btn btn-danger btn-sm" type="button" data-action="del-record" data-id="${r.id}" aria-label="Delete reading">${icon('trash')}</button></div></td>`}
        </tr>`).join('')}</tbody></table></div>`
      : emptyState('heartPulse', 'No readings yet', 'Add your first blood pressure, sugar or heart rate reading.')}
      <p class="small muted" style="margin-top:.8rem">F = fasting · PP = after meal. ${icon('alertCircle')} marks readings outside the usual range.</p>
    </section>
  </div>`;
}

function recordForm(r = {}) {
  const now = new Date();
  const [date, time] = r.datetime ? r.datetime.split('T') : [U.ymd(now), U.hm(now)];
  const v = (k) => (r[k] ?? '');
  return `
  <form class="form" data-form="record">
    <input type="hidden" name="id" value="${h(r.id || '')}">
    <div class="form-row">
      <div class="field"><label for="h-date">Date</label><input id="h-date" name="date" type="date" required value="${date}" max="${U.ymd()}"></div>
      <div class="field"><label for="h-time">Time</label><input id="h-time" name="time" type="time" required value="${time}"></div>
    </div>
    <p class="muted small">${icon('info')} Fill in only what you measured. Everything else can stay empty.</p>
    <fieldset><legend>${icon('heartPulse')} Blood pressure (mmHg)</legend>
      <div class="form-row">
        <div class="field"><label for="h-sys">Top number</label><input id="h-sys" name="bpSys" type="number" inputmode="numeric" min="60" max="260" placeholder="e.g. 128" value="${v('bpSys')}"></div>
        <div class="field"><label for="h-dia">Bottom number</label><input id="h-dia" name="bpDia" type="number" inputmode="numeric" min="30" max="160" placeholder="e.g. 82" value="${v('bpDia')}"></div>
      </div></fieldset>
    <fieldset><legend>${icon('testTube')} Blood sugar (mg/dL)</legend>
      <div class="form-row">
        <div class="field"><label for="h-sug">Reading</label><input id="h-sug" name="sugar" type="number" inputmode="numeric" min="20" max="600" placeholder="e.g. 110" value="${v('sugar')}"></div>
        <div class="field"><label for="h-sugt">When was it taken?</label><select id="h-sugt" name="sugarType">
          <option value="fasting" ${r.sugarType !== 'after-meal' ? 'selected' : ''}>Fasting (before food)</option>
          <option value="after-meal" ${r.sugarType === 'after-meal' ? 'selected' : ''}>After a meal</option></select></div>
      </div></fieldset>
    <div class="form-row">
      <div class="field"><label for="h-hr">Heart rate (BPM)</label><input id="h-hr" name="heartRate" type="number" inputmode="numeric" min="30" max="220" placeholder="e.g. 74" value="${v('heartRate')}"></div>
      <div class="field"><label for="h-spo2">Oxygen SpO2 (%)</label><input id="h-spo2" name="spo2" type="number" inputmode="numeric" min="50" max="100" placeholder="e.g. 97" value="${v('spo2')}"></div>
    </div>
    <div class="form-row">
      <div class="field"><label for="h-w">Weight (kg)</label><input id="h-w" name="weight" type="number" inputmode="decimal" step="0.1" min="20" max="250" placeholder="e.g. 64.2" value="${v('weight')}"></div>
      <div class="field"><label for="h-t">Temperature (°F)</label><input id="h-t" name="temp" type="number" inputmode="decimal" step="0.1" min="90" max="110" placeholder="e.g. 98.4" value="${v('temp')}"></div>
    </div>
    <div class="field"><label for="h-n">Notes</label>
      <div style="display:flex;gap:0.5rem;align-items:flex-start">
        <textarea id="h-n" name="notes" placeholder="How are you feeling? e.g. Slight headache in the morning" style="flex:1">${h(r.notes || '')}</textarea>
        <button type="button" class="icon-btn btn-mic" data-action="dictate" data-target="h-n" aria-label="🎙️ Speak to update" style="width:48px;height:48px;border-radius:50%;color:var(--brand);flex-shrink:0;padding:0;font-size:1.5rem">🎙️</button>
      </div>
    </div>
    <div id="form-error"></div>
    <div class="form-actions">
      <button class="btn btn-ghost btn-lg" type="button" data-action="close-modal">Cancel</button>
      <button class="btn btn-primary btn-lg" type="submit">${icon('check')} ${r.id ? 'Save changes' : 'Save reading'}</button>
    </div>
  </form>`;
}

/* =========================================================
   6. AI INSIGHTS
   ========================================================= */
const getDisclaimer = () => {
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  return `<div class="disclaimer" role="note">${icon('info')}<div><strong>${isHi ? 'आशा की AI स्वास्थ्य जानकारी केवल सूचना के उद्देश्य से है।' : "ASHA's AI insights are for information only."}</strong> ${isHi ? 'यह आपके द्वारा दर्ज की गई जानकारी में पैटर्न्स को दर्शाती है और <strong>कोई चिकित्सीय निदान नहीं है</strong>। किसी भी चिकित्सीय समस्या के लिए योग्य डॉक्टर या स्वास्थ्य पेशेवर से परामर्श लें। आपात स्थिति में तुरंत <a href="tel:108">108</a> पर कॉल करें।' : 'They point out patterns in the information you recorded and are <strong>not a medical diagnosis</strong>. Please consult a qualified doctor or healthcare professional for any medical concern. In an emergency, call <a href="tel:108">108</a> immediately.'}</div></div>`;
};

function insightCard(i) {
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  const color =
    i.status === 'alert'
      ? 'red'
      : i.status === 'attention'
        ? 'amber'
        : 'green';

  const issueText = isHi ? (i.issue_hi || i.issue) : i.issue;
  const expText = isHi ? (i.explanation_hi || i.explanation) : i.explanation;
  const nextText = isHi ? (i.next_hi || i.next) : i.next;
  const nextStepLabel = isHi ? 'सुझाया गया अगला कदम:' : 'Suggested next step:';

  const voiceText =
    `${issueText}. ${expText}. ${isHi ? 'सुझाया गया अगला कदम' : 'Suggested next step'}: ${nextText}`;

  return `
  <article class="card insight ${i.status}">

    <span class="card-icon ${color}">
      ${icon(i.icon)}
    </span>

    <div class="grow">

      <div class="row-between">
        <h3>${h(issueText)}</h3>
        ${badge(i.status, { insight: true })}
      </div>

      <p class="explain">
        ${h(expText)}
      </p>

      <p class="when">
        ${icon('clock')} ${U.relDateTime(i.when)}
      </p>

      <div class="next-step">
        ${icon('lightbulb')}
        <div>
          <b>${nextStepLabel}</b>
          ${h(nextText)}
        </div>
      </div>

      <div class="row" style="margin-top:1rem;gap:.6rem">

        <button
          class="btn btn-secondary btn-sm"
          type="button"
          data-action="speak"
          data-text="${h(voiceText)}"
          aria-label="${isHi ? 'इस स्वास्थ्य जानकारी को सुनें' : 'Listen to this health insight'}">

          ${icon('volume')}
          ${isHi ? 'सुनें' : 'Listen'}

        </button>

        <button
          class="btn btn-ghost btn-sm"
          type="button"
          data-action="stop-speaking">

          ${icon('x')}
          ${isHi ? 'रोकें' : 'Stop'}

        </button>

      </div>

    </div>

  </article>`;
}

function pageInsights() {
  const isHi = typeof currentLanguage !== 'undefined' && currentLanguage === 'hi';
  const ai = AI.analyze(Store.data);
  const f = S.insightFilter;
  const list = ai.insights.filter((i) => f === 'all' || i.status === f);
  const tile = (status, label, ic, color) => `
    <button class="card stat-tile" type="button" data-action="insight-filter" data-v="${status}" aria-pressed="${f === status}" style="cursor:pointer;text-align:left;font:inherit;${f === status ? 'outline:3px solid var(--brand);' : ''}">
      <span class="card-icon ${color}">${icon(ic)}</span><div><div class="n">${ai.counts[status]}</div><div class="muted">${label}</div></div>
    </button>`;

  const overallLabels = isHi
    ? { normal: 'सामान्य', attention: 'ध्यान दें', alert: 'समीक्षा आवश्यक' }
    : { normal: 'Normal', attention: 'Attention', alert: 'Needs Review' };

  const overallText = isHi
    ? {
        normal: 'सब कुछ सामान्य लग रहा है।',
        attention: 'कुछ बातों पर ध्यान देने की आवश्यकता है।',
        alert: 'कुछ पैटर्न्स की डॉक्टर या देखभालकर्ता से समीक्षा करानी चाहिए।'
      }[ai.overall]
    : {
        normal: 'Your recorded information looks stable. No concerning patterns found.',
        attention: 'A few things could use a little attention. See the suggestions below.',
        alert: 'Some patterns should be reviewed with your doctor or caregiver.'
      }[ai.overall];

  const filterTabs = isHi
    ? [['all', 'सभी'], ['alert', 'समीक्षा आवश्यक'], ['attention', 'ध्यान दें'], ['normal', 'सामान्य']]
    : [['all', 'All'], ['alert', 'Needs Review'], ['attention', 'Attention'], ['normal', 'Normal']];

  return `
  <div class="stack">
    <div class="page-head">
      <div>
        <h2>${icon('sparkles')} ${isHi ? 'AI स्वास्थ्य अंतर्दृष्टि' : 'AI health insights'}</h2>
        <p>${isHi ? 'आशा ने पिछले 7 दिनों की दवाइयों, रीडिंग्स और गतिविधियों का विश्लेषण किया है।' : 'ASHA looked at your medicines, readings, appointments and activities from the last 7 days.'}</p>
      </div>
      <button class="btn btn-secondary btn-lg" type="button" data-action="reanalyse">${icon('refresh')} ${isHi ? 'पुनः विश्लेषण करें' : 'Analyse again'}</button>
    </div>
    ${getDisclaimer()}

    <section class="card card-status-${ai.overall}">
      <div class="row-between">
        <div class="row"><span class="card-icon ${ai.overall === 'normal' ? 'green' : ai.overall === 'attention' ? 'amber' : 'red'}" style="width:3.6rem;height:3.6rem">${icon(STATUS_ICON[ai.overall])}</span>
          <div><h3>${isHi ? 'समग्र स्थिति:' : 'Overall:'} ${overallLabels[ai.overall]}</h3><p class="muted">${overallText}</p></div></div>
        <span class="small muted">${icon('clock')} ${isHi ? 'विश्लेषण किया गया' : 'Analysed'} ${U.relDateTime(ai.analysedAt)} · ${isHi ? 'दवा पालन' : 'Medicine adherence'} ${ai.adherence}%</span>
      </div>
    </section>

    <div class="grid grid-3">
      ${tile('alert', isHi ? 'समीक्षा आवश्यक' : 'Needs Review', 'alert', 'red')}
      ${tile('attention', isHi ? 'ध्यान दें' : 'Attention', 'alertCircle', 'amber')}
      ${tile('normal', isHi ? 'सामान्य' : 'Normal', 'checkCircle', 'green')}
    </div>

    <div class="row-between">
      <div class="seg" role="group" aria-label="${isHi ? 'फ़िल्टर करें' : 'Filter insights'}">
        ${filterTabs.map(([k, l]) => `<button type="button" aria-pressed="${f === k}" data-action="insight-filter" data-v="${k}">${l}</button>`).join('')}
      </div>
      <span class="muted">${U.plural(list.length, isHi ? 'जानकारी' : 'insight')}</span>
    </div>

    <div class="stack">${list.length ? list.map(insightCard).join('') : `<div class="card">${emptyState('checkCircle', isHi ? 'यहाँ कुछ नहीं है' : 'Nothing here', isHi ? 'इस समूह में कोई जानकारी नहीं है।' : 'No insights in this group.')}</div>`}</div>

    <details class="how">
      <summary>${icon('lightbulb')} ${isHi ? "आशा का AI कैसे काम करता है?" : "How does ASHA's AI work?"}</summary>
      <ul>
        <li><b>${isHi ? 'दवाइयाँ:' : 'Medicines:'}</b> ${isHi ? '7 दिनों में 2 या अधिक बार छूटी दवा को चिह्नित करता है।' : 'flags a medicine missed 2 or more times in 7 days.'}</li>
        <li><b>${isHi ? 'रक्तचाप:' : 'Blood pressure:'}</b> ${isHi ? 'सामान्य सीमा 130/85 mmHg से कम है। 140/90 या अधिक को अलर्ट माना जाता है।' : 'usual range is below 130/85 mmHg. 140/90 or higher is marked Alert; repeated unusual readings are marked Needs Review.'}</li>
        <li><b>${isHi ? 'रक्त शर्करा:' : 'Blood sugar:'}</b> ${isHi ? 'उपवास 70–130 mg/dL, भोजन के बाद 180 mg/dL से कम।' : 'fasting 70–130 mg/dL, after meals below 180 mg/dL. Below 70 is always marked for review.'}</li>
        <li><b>${isHi ? 'हृदय गति:' : 'Heart rate:'}</b> 60–100 BPM. <b>SpO2:</b> 95% ${isHi ? 'या अधिक' : 'or above'}. <b>${isHi ? 'तापमान:' : 'Temperature:'}</b> 97–99.4 °F.</li>
        <li><b>${isHi ? 'अपॉइंटमेंट:' : 'Appointments:'}</b> ${isHi ? 'पिछले 30 दिनों में छूटे अपॉइंटमेंट को चिह्नित करता है।' : 'flags appointments missed in the last 30 days.'}</li>
        <li><b>${isHi ? 'गतिविधि, नींद और पानी:' : 'Activity, sleep & water:'}</b> ${isHi ? 'आपके साप्ताहिक औसत की आपके लक्ष्यों से तुलना करता है।' : 'compares your weekly average with your goals (walking below half the goal, 3+ nights under 6 hours, water below 60% of the goal).'}</li>
        <li>${isHi ? 'ये सामान्य स्वास्थ्य सीमाएँ हैं। आपके डॉक्टर आपके लिए अलग लक्ष्य निर्धारित कर सकते हैं।' : 'These are general wellness ranges. Your doctor may set different targets for you.'}</li>
      </ul>
    </details>
  </div>`;
}

/* =========================================================
   7. DAILY SUMMARY
   ========================================================= */
function summaryText(sum) {
  const p = Store.data.profile;
  const lines = [
    `ASHA – Daily Health Summary`,
    `${p.name} · ${U.fmtLong(U.parseDate(sum.date))}`,
    '',
    'Medicines:',
    `✓ ${U.plural(sum.taken, 'medicine')} taken`,
    sum.missed ? `⚠ ${U.plural(sum.missed, 'medicine')} missed` : null,
    sum.pending ? `• ${sum.pending} still to take` : null,
    '',
    'Health:',
    `Blood Pressure: ${sum.bpR ? `${sum.bpR.bpSys}/${sum.bpR.bpDia}` : 'not recorded'}`,
    `Heart Rate: ${sum.hrR ? sum.hrR.heartRate + ' BPM' : 'not recorded'}`,
    sum.sugarR ? `Blood Sugar: ${sum.sugarR.sugar} mg/dL` : null,
    `Sleep: ${sum.activity.sleep != null ? sum.activity.sleep + ' hours' : 'not recorded'}`,
    '',
    'Activity:',
    `Walking: ${sum.activity.walk} minutes`,
    `Water: ${sum.activity.water}/${sum.goals.water} glasses`,
    '',
    `AI Summary: "${sum.text}"`,
    '',
    '(ASHA insights are informational and not a medical diagnosis.)'
  ];
  return lines.filter((l) => l !== null).join('\n');
}

function pageSummary() {
  const date = S.summaryDate || U.ymd();
  const isToday = date === U.ymd();
  const sum = AI.summary(Store.data, date);
  const g = sum.goals, a = sum.activity;
  const line = (cls, ic, text, val = '') => `<div><span class="${cls}">${icon(ic)}</span><span>${text}</span>${val ? `<b>${val}</b>` : ''}</div>`;
  const st = (s) => (s && s !== 'normal' ? ` ${badge(s)}` : '');

  return `
  <div class="stack">
    <div class="day-nav no-print">
      <button class="btn btn-ghost" type="button" data-action="summary-day" data-v="-1">${icon('chevronLeft')} Previous day</button>
      <span class="badge badge-info" style="font-size:1rem">${isToday ? 'Today' : U.fmtMed(U.parseDate(date))}</span>
      <button class="btn btn-ghost" type="button" data-action="summary-day" data-v="1" ${isToday ? 'disabled style="opacity:.45;cursor:not-allowed"' : ''}>Next day ${icon('chevronRight')}</button>
    </div>

    <article class="card summary-card">
      <header class="summary-head">
        <div><h2>${isToday ? "Today's" : 'Daily'} Health Summary</h2><p>${h(Store.data.profile.name)} · ${U.fmtLong(U.parseDate(date))}</p></div>
        <span class="status-pill ${sum.status}">${icon(STATUS_ICON[sum.status])} ${STATUS_LABEL[sum.status]}</span>
      </header>
      <div class="summary-body">
        <section class="summary-section">
          <h3>${icon('pill')} Medicines</h3>
          <div class="summary-lines">
            ${sum.doses.length ? `
              ${line('ok', 'checkCircle', `${U.plural(sum.taken, 'medicine')} taken`)}
              ${sum.missed ? line('warn', 'alert', `${U.plural(sum.missed, 'medicine')} missed`, sum.doses.filter((x) => x.status === 'missed').map((x) => h(x.med.name)).join(', ')) : ''}
              ${sum.pending ? line('', 'clock', `${sum.pending} ${isToday ? 'still to take' : 'not recorded'}`) : ''}`
      : line('', 'info', 'No medicines scheduled')}
          </div>
        </section>
        <section class="summary-section">
          <h3>${icon('heartPulse')} Health</h3>
          <div class="summary-lines">
            ${line('', 'heartPulse', 'Blood Pressure', sum.bpR ? `${sum.bpR.bpSys}/${sum.bpR.bpDia}${st(Vitals.bp(sum.bpR.bpSys, sum.bpR.bpDia))}` : 'Not recorded')}
            ${line('', 'heart', 'Heart Rate', sum.hrR ? `${sum.hrR.heartRate} BPM${st(Vitals.heartRate(sum.hrR.heartRate))}` : 'Not recorded')}
            ${sum.sugarR ? line('', 'testTube', 'Blood Sugar', `${sum.sugarR.sugar} mg/dL${st(Vitals.sugar(sum.sugarR.sugar, sum.sugarR.sugarType))}`) : ''}
            ${line('', 'moon', 'Sleep', a.sleep != null ? `${a.sleep} hours` : 'Not recorded')}
          </div>
        </section>
        <section class="summary-section">
          <h3>${icon('activity')} Activity</h3>
          <div class="summary-lines">
            ${line(a.walk >= g.walk ? 'ok' : '', 'walk', 'Walking', `${a.walk} minutes`)}
            ${line(a.water >= g.water ? 'ok' : 'warn', 'droplet', 'Water', `${a.water}/${g.water} glasses`)}
            ${line('', 'utensils', 'Meals', `${['breakfast', 'lunch', 'snack', 'dinner'].filter((k) => a.meals[k]).length} of 4`)}
          </div>
        </section>
        <div class="ai-quote">
          <div class="lbl">${icon('sparkles')} AI Summary</div>
          “${h(sum.text)}”
        </div>
        <p class="small muted">${icon('info')} This summary is informational and is not a medical diagnosis. Please consult a qualified healthcare professional for medical concerns.</p>
      </div>
    </article>

    <div class="card no-print" style="max-width:860px;margin:1.4rem auto 0;background:#fff;padding:1.5rem">
      <h3 style="margin-bottom:.8rem;color:var(--brand-700)">${icon('message')} Quick Health Update for Caregiver</h3>
      <div style="display:flex;gap:0.5rem;align-items:flex-start;margin-bottom:1rem">
        <textarea id="summary-note" placeholder="E.g. I am feeling much better today..." style="flex:1;min-height:3.2rem"></textarea>
        <button type="button" class="icon-btn btn-mic" data-action="dictate" data-target="summary-note" aria-label="🎙️ Speak to update" style="width:48px;height:48px;border-radius:50%;color:var(--brand);flex-shrink:0;padding:0;font-size:1.5rem">🎙️</button>
      </div>
      <div class="row" style="justify-content:center">
        <button class="btn btn-primary btn-lg" type="button" data-action="share-summary">${icon('share')} Share with caregiver</button>
        <button class="btn btn-ghost btn-lg" type="button" data-action="print">${icon('printer')} Print / Save as PDF</button>
      </div>
    </div>
  </div>`;
}

/* =========================================================
   8. CAREGIVER DASHBOARD
   ========================================================= */
function pageCaregiver() {
  const d = Store.data, p = d.profile, cg = p.caregiver, today = U.ymd(), g = d.goals;
  const ai = AI.analyze(d);
  const sum = AI.summary(d, today);
  const a = sum.activity;
  const up = Store.upcomingAppointments().slice(0, 2);
  const recent = Store.recordsSorted().slice(0, 4);
  const alerts = ai.insights.filter((i) => i.status !== 'normal');
  const ringColor = ai.adherence >= 90 ? 'var(--ok)' : ai.adherence >= 75 ? '#e0a52e' : 'var(--bad)';
  const overallText = { normal: 'Doing well', attention: 'Needs a little attention', alert: 'Needs review' }[ai.overall];

  return `
  <div class="stack">
    ${RO() ? '' : `<div class="banner">${icon('info')}<div class="grow">This is what your caregiver <b>${h(cg.name || 'your caregiver')}</b> sees when they log in.</div><a class="btn btn-ghost btn-sm" href="#/profile">Edit caregiver</a></div>`}

    <section class="card card-status-${ai.overall}">
      <div class="care-hero">
        <div class="care-avatar" aria-hidden="true">${U.initials(p.name)}</div>
        <div>
          ${RO() ? `<p class="muted">Hello ${h(U.firstName(cg.name))}, you are caring for</p>` : '<p class="muted">Caring for</p>'}
          <h2>${h(p.name)}${p.age ? `, ${h(p.age)}` : ''}</h2>
          <div class="row" style="margin-top:.5rem">${badge(ai.overall, { label: overallText })}<span class="muted small">${h(p.conditions || '')}</span></div>
        </div>
        <div class="row care-actions">
          ${p.phone ? `<a class="btn btn-primary" href="${telHref(p.phone)}">${icon('phone')} Call ${h(U.firstName(p.name))}</a>
          <a class="btn btn-ghost" href="${waHref(p.phone, `Hi ${U.firstName(p.name)}, just checking in. How are you feeling today?`)}" target="_blank" rel="noopener">${icon('message')} Message</a>` : ''}
        </div>
      </div>
    </section>

    <!-- Today's Voice Update from Elder -->
    <section class="card" style="border-left: 5px solid var(--brand); background: #f8fafc;">
      <div class="card-head">
        <h3><span class="card-icon blue">${icon('message')}</span>${currentLanguage === 'hi' ? `📢 आज का अपडेट (${h(U.firstName(p.name))})` : `📢 Today's Voice Update from ${h(U.firstName(p.name))}`}</h3>
        ${(Store.data.caregiverUpdates && Store.data.caregiverUpdates.length) ? pill(U.relDateTime(new Date(Store.data.caregiverUpdates[Store.data.caregiverUpdates.length - 1].timestamp)), 'info') : ''}
      </div>
      ${(Store.data.caregiverUpdates && Store.data.caregiverUpdates.length) ? `
        <div style="font-size:1.15rem;margin:0.75rem 0;padding:1rem;background:#fff;border-radius:10px;border:1px solid var(--border);line-height:1.6">
          “${h(Store.data.caregiverUpdates[Store.data.caregiverUpdates.length - 1].text)}”
        </div>
        <div class="row" style="gap:0.75rem;align-items:center">
          <button class="btn btn-secondary btn-sm" type="button" data-action="speak" data-text="${h(Store.data.caregiverUpdates[Store.data.caregiverUpdates.length - 1].text)}" style="min-height:44px;font-weight:600">
            ${icon('volume')} ${currentLanguage === 'hi' ? 'सुनें' : 'Listen'}
          </button>
          <button class="btn btn-ghost btn-sm" type="button" data-action="stop-speaking" style="min-height:44px">
            ${icon('x')} ${currentLanguage === 'hi' ? 'रोकें' : 'Stop'}
          </button>
          <span class="muted small">${U.fmtLong(new Date(Store.data.caregiverUpdates[Store.data.caregiverUpdates.length - 1].timestamp))}</span>
        </div>
      ` : `
        <p class="muted">${currentLanguage === 'hi' ? 'अभी तक कोई वॉयस अपडेट नहीं मिला है।' : 'No voice updates received yet today.'}</p>
      `}
    </section>

    <div class="grid grid-3">
      <section class="card">
        <div class="card-head">
          <h3><span class="card-icon">${icon('pill')}</span>Medicine adherence</h3>
          <button class="btn btn-primary btn-sm" type="button" data-action="add-med">${icon('plus')} ${currentLanguage === 'hi' ? 'दवा जोड़ें' : 'Add medicine'}</button>
        </div>
        <div class="row" style="gap:1.2rem">
          <div class="ring" style="--p:${ai.adherence};--c:${ringColor}" role="img" aria-label="${ai.adherence}% of medicines taken in the last 7 days"><div>${ai.adherence}%</div></div>
          <div><p class="muted">Last 7 days</p><p><b>Today:</b> ${sum.taken} taken, ${sum.missed} missed, ${sum.pending} to take</p></div>
        </div>
        <div class="list" style="margin-top:1rem">${sum.doses.slice(0, 5).map((x) => {
    const s = doseState(x);
    return `<div class="row-between"><span>${U.fmtTime(x.med.time)} · <b>${h(x.med.name)}</b></span>${pill(s.label, s.cls)}</div>`;
  }).join('') || '<p class="muted">No medicines today.</p>'}</div>
      </section>

      <section class="card">
        <div class="card-head"><h3><span class="card-icon violet">${icon('calendar')}</span>Upcoming appointments</h3></div>
        ${up.length ? `<ul class="list">${up.map((x) => `
          <li class="list-item"><div class="grow"><h4>${h(x.doctor)}</h4><p>${U.relDay(x.date)}, ${U.fmtTime(x.time)} · ${h(x.hospital)}</p>${x.purpose ? `<p>${h(x.purpose)}</p>` : ''}</div></li>`).join('')}</ul>`
      : '<p class="muted">No upcoming appointments.</p>'}
      </section>

      <section class="card">
        <div class="card-head"><h3><span class="card-icon sky">${icon('activity')}</span>Today's activities</h3></div>
        <div class="stack" style="gap:.9rem">
          <div><div class="row-between"><span>${icon('droplet')} Water</span><b>${a.water}/${g.water} glasses</b></div>${progress(a.water, g.water, 'blue')}</div>
          <div><div class="row-between"><span>${icon('walk')} Walking</span><b>${a.walk}/${g.walk} min</b></div>${progress(a.walk, g.walk, 'green')}</div>
          <div><div class="row-between"><span>${icon('moon')} Sleep</span><b>${a.sleep ?? '–'}/${g.sleep} hrs</b></div>${progress(a.sleep || 0, g.sleep, 'violet')}</div>
          <div class="row-between"><span>${icon('utensils')} Meals</span><b>${['breakfast', 'lunch', 'snack', 'dinner'].filter((k) => a.meals[k]).length} of 4</b></div>
        </div>
      </section>
    </div>

    <div class="grid grid-2">
      <section class="card">
        <div class="card-head"><h3><span class="card-icon rose">${icon('heartPulse')}</span>Recent health readings</h3><a class="link-btn" href="#/records">All ${icon('chevronRight')}</a></div>
        ${recent.length ? `<div class="table-wrap"><table class="table responsive">
          <thead><tr><th>When</th><th>BP</th><th>Sugar</th><th>Heart</th><th>SpO2</th></tr></thead>
          <tbody>${recent.map((r) => `<tr>
            <td data-label="When">${U.relDateTime(U.parseDT(r.datetime))}</td>
            <td data-label="BP">${recordValueCell(r, 'bp')}</td>
            <td data-label="Sugar">${recordValueCell(r, 'sugar')}</td>
            <td data-label="Heart">${recordValueCell(r, 'heartRate')}</td>
            <td data-label="SpO2">${recordValueCell(r, 'spo2')}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="muted">No readings recorded yet.</p>'}
      </section>

      <section class="card">
        <div class="card-head"><h3><span class="card-icon amber">${icon('sparkles')}</span>AI alerts</h3>${pill(`${alerts.length} active`, alerts.length ? 'attention' : 'normal')}</div>
        ${alerts.length ? `<ul class="list">${alerts.slice(0, 4).map((i) => `
          <li class="list-item"><span class="card-icon ${i.status === 'alert' ? 'red' : 'amber'}">${icon(i.icon)}</span>
            <div class="grow"><h4>${h(i.issue)}</h4><p>${U.relDateTime(i.when)}</p></div>${badge(i.status, { insight: true })}</li>`).join('')}</ul>`
      : '<p>No alerts. Everything recorded looks stable.</p>'}
        <div class="card-foot"><span class="small muted">Informational only – not a diagnosis.</span><a class="link-btn" href="#/insights">View insights ${icon('chevronRight')}</a></div>
      </section>
    </div>

    <section class="card">
      <div class="card-head"><h3><span class="card-icon">${icon('clipboard')}</span>Daily health summary</h3>${badge(sum.status)}</div>
      <div class="ai-quote"><div class="lbl">${icon('sparkles')} AI Summary</div>“${h(sum.text)}”</div>
      <div class="card-foot"><span class="muted small">${U.fmtLong(new Date())}</span><a class="btn btn-secondary" href="#/summary">${icon('clipboard')} Full summary</a></div>
    </section>
  </div>`;
}

/* =========================================================
   9. NOTIFICATIONS
   ========================================================= */
const NOTIF_META = {
  medicine: { label: 'Medicine', icon: 'pill', color: 'blue' },
  appointment: { label: 'Appointment', icon: 'calendar', color: 'violet' },
  health: { label: 'Health alert', icon: 'heartPulse', color: 'red' },
  summary: { label: 'Daily summary', icon: 'clipboard', color: '' }
};

function pageNotifications() {
  const all = Store.data.notifications;
  const f = S.notifFilter;
  const list = all.filter((n) => f === 'all' || n.type === f);
  const unread = Store.unreadCount();
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  return `
  <div class="stack">
    <div class="page-head">
      <div><h2>Notifications</h2><p>${unread ? `You have ${U.plural(unread, 'unread notification')}.` : 'You are all caught up.'}</p></div>
      <div class="row">
        <button class="btn btn-secondary" type="button" data-action="notif-read-all" ${unread ? '' : 'disabled'}>${icon('check')} Mark all as read</button>
        <button class="btn btn-danger" type="button" data-action="notif-clear" ${all.length ? '' : 'disabled'}>${icon('trash')} Clear all</button>
      </div>
    </div>
    ${!RO() && perm === 'default' ? `<div class="banner">${icon('bellRing')}<div class="grow"><b>Get reminders even when ASHA is in the background.</b> Allow notifications in your browser.</div><button class="btn btn-primary btn-sm" type="button" data-action="enable-browser-notif">Allow</button></div>` : ''}
    <div class="seg" role="group" aria-label="Filter notifications">
      ${[['all', 'All', 'bell'], ['medicine', 'Medicines', 'pill'], ['appointment', 'Appointments', 'calendar'], ['health', 'Health alerts', 'heartPulse'], ['summary', 'Summaries', 'clipboard']].map(([k, l, ic]) =>
    `<button type="button" aria-pressed="${f === k}" data-action="notif-filter" data-v="${k}">${icon(ic)} ${l} <span class="muted">(${k === 'all' ? all.length : all.filter((n) => n.type === k).length})</span></button>`).join('')}
    </div>
    ${list.length ? `<div class="list">${list.map((n) => {
      const m = NOTIF_META[n.type] || NOTIF_META.summary;
      return `<div class="notif ${n.read ? '' : 'unread'}" data-action="notif-open" data-id="${n.id}" role="button" tabindex="0">
        <span class="card-icon ${m.color}">${icon(m.icon)}</span>
        <div class="grow">
          <h4>${n.read ? '' : '<span class="unread-dot" aria-label="Unread"></span>'}${h(n.title)}</h4>
          <p>${h(n.message)}</p>
          <time datetime="${n.time}">${m.label} · ${U.timeAgo(n.time)}</time>
        </div>
        <button class="icon-btn" type="button" data-action="notif-del" data-id="${n.id}" aria-label="Delete notification">${icon('trash')}</button>
      </div>`;
    }).join('')}</div>` : `<div class="card">${emptyState('bell', 'No notifications', 'Reminders and alerts will appear here.')}</div>`}
  </div>`;
}

/* =========================================================
   10. PROFILE & SETTINGS
   ========================================================= */
function pageProfile() {
  const d = Store.data, p = d.profile, s = d.settings, g = d.goals;
  const sw = (key, title, desc) => `
    <div class="switch-row"><div><div class="t" id="sw-${key}">${title}</div><div class="d">${desc}</div></div>
      <label class="switch"><input type="checkbox" data-setting="${key}" ${s[key] ? 'checked' : ''} aria-labelledby="sw-${key}"><span class="track"></span></label></div>`;
  const fopt = (k, label, size) => `<button class="font-opt" type="button" aria-pressed="${s.fontSize === k}" data-action="font" data-v="${k}"><span class="A" style="font-size:${size}">Aa</span>${label}</button>`;

  return `
  <div class="stack">
    <section class="card">
      <div class="row">
        <div class="care-avatar" style="background:linear-gradient(135deg,#14b8a6,#0e6f8f)" aria-hidden="true">${U.initials(p.name)}</div>
        <div><h2>${h(p.name || 'Your profile')}</h2><p class="muted">${p.age ? `${h(p.age)} years` : ''}${p.bloodGroup ? ` · Blood group ${h(p.bloodGroup)}` : ''}${p.phone ? ` · ${h(p.phone)}` : ''}</p></div>
      </div>
    </section>

    <div class="grid grid-2" style="align-items:start">
      <form class="card form" data-form="profile">
        <fieldset class="form"><legend>${icon('user')} Personal details</legend>
          <div class="field"><label for="p-name">Full name</label><input id="p-name" name="name" required value="${h(p.name)}"></div>
          <div class="form-row">
            <div class="field"><label for="p-age">Age</label><input id="p-age" name="age" type="number" min="18" max="120" value="${h(p.age)}"></div>
            <div class="field"><label for="p-gender">Gender</label><select id="p-gender" name="gender">${['', 'Female', 'Male', 'Other'].map((x) => `<option ${p.gender === x ? 'selected' : ''} value="${x}">${x || 'Prefer not to say'}</option>`).join('')}</select></div>
          </div>
          <div class="form-row">
            <div class="field"><label for="p-phone">Phone</label><input id="p-phone" name="phone" type="tel" inputmode="numeric" required value="${h(p.phone)}"></div>
            <div class="field"><label for="p-bg">Blood group</label><select id="p-bg" name="bloodGroup">${['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((x) => `<option ${p.bloodGroup === x ? 'selected' : ''} value="${x}">${x || 'Not known'}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label for="p-cond">Health conditions</label><input id="p-cond" name="conditions" value="${h(p.conditions)}" placeholder="e.g. Diabetes, high blood pressure"><span class="hint">Shown to emergency helpers.</span></div>
          <div class="field"><label for="p-addr">Address</label><input id="p-addr" name="address" value="${h(p.address)}"></div>
          <div class="field"><label for="p-pin">Change PIN <span class="muted">(optional)</span></label><input id="p-pin" name="pin" type="password" inputmode="numeric" maxlength="6" placeholder="Leave empty to keep current PIN"></div>
        </fieldset>

        <fieldset class="form"><legend>${icon('siren')} Emergency contact</legend>
          <div class="form-row">
            <div class="field"><label for="e-name">Name</label><input id="e-name" name="em_name" value="${h(p.emergency.name)}"></div>
            <div class="field"><label for="e-rel">Relation</label><input id="e-rel" name="em_relation" value="${h(p.emergency.relation)}" placeholder="e.g. Daughter"></div>
          </div>
          <div class="field"><label for="e-phone">Phone</label><input id="e-phone" name="em_phone" type="tel" inputmode="numeric" value="${h(p.emergency.phone)}"></div>
        </fieldset>

        <fieldset class="form"><legend>${icon('users')} Caregiver details</legend>
          <div class="form-row">
            <div class="field"><label for="c-name">Name</label><input id="c-name" name="cg_name" value="${h(p.caregiver.name)}"></div>
            <div class="field"><label for="c-rel">Relation</label><input id="c-rel" name="cg_relation" value="${h(p.caregiver.relation)}" placeholder="e.g. Son"></div>
          </div>
          <div class="form-row">
            <div class="field"><label for="c-ph">Phone</label><input id="c-ph" name="cg_phone" type="tel" inputmode="numeric" value="${h(p.caregiver.phone)}"></div>
            <div class="field"><label for="c-em">Email</label><input id="c-em" name="cg_email" type="email" value="${h(p.caregiver.email)}"></div>
          </div>
          <div class="field"><label for="c-pin">Caregiver login PIN</label><input id="c-pin" name="cg_pin" inputmode="numeric" maxlength="6" value="${h(p.caregiver.pin)}"><span class="hint">Your caregiver logs in with their phone number and this PIN.</span></div>
        </fieldset>

        <fieldset class="form"><legend>${icon('target')} Health goals</legend>
          <div class="form-row-3">
            <div class="field"><label for="g-w">Water (glasses)</label><input id="g-w" name="goal_water" type="number" min="1" max="20" value="${g.water}"></div>
            <div class="field"><label for="g-k">Walking (minutes)</label><input id="g-k" name="goal_walk" type="number" min="5" max="240" step="5" value="${g.walk}"></div>
            <div class="field"><label for="g-s">Sleep (hours)</label><input id="g-s" name="goal_sleep" type="number" min="4" max="12" step="0.5" value="${g.sleep}"></div>
          </div>
        </fieldset>
        <div id="form-error"></div>
        <div class="form-actions"><button class="btn btn-primary btn-lg" type="submit">${icon('check')} Save changes</button></div>
      </form>

      <div class="stack">
        <section class="card">
          <div class="card-head"><h3><span class="card-icon">${icon('type')}</span>Text size</h3></div>
          <div class="font-options" role="group" aria-label="Text size">
            ${fopt('normal', 'Normal', '1.3rem')}${fopt('large', 'Large', '1.7rem')}${fopt('xl', 'Extra large', '2.1rem')}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h3><span class="card-icon blue">${icon('bellRing')}</span>Reminder settings</h3></div>
          ${sw('medReminders', 'Medicine reminders', 'A pop-up reminder at each medicine time.')}
          ${sw('apptReminders', 'Appointment reminders', 'A reminder before each doctor visit.')}
          ${sw('sound', 'Reminder sound', 'Play a gentle sound with reminders.')}
          ${sw('dailySummary', 'Daily summary notification', 'Get your health summary every evening at 8 PM.')}
          ${sw('browserNotif', 'Browser notifications', 'Show reminders even when ASHA is in another tab.')}
          <div class="switch-row"><div><div class="t"><label for="s-lead">Remind me before appointments</label></div><div class="d">How early to remind you.</div></div>
            <select id="s-lead" data-setting="apptLead" style="max-width:12rem">${[[15, '15 minutes'], [30, '30 minutes'], [60, '1 hour'], [120, '2 hours'], [1440, '1 day']].map(([v, l]) => `<option value="${v}" ${+s.apptLead === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="row" style="margin-top:1rem"><button class="btn btn-secondary" type="button" data-action="test-reminder">${icon('bell')} Test a reminder</button></div>
        </section>

        <section class="card">
          <div class="card-head"><h3><span class="card-icon amber">${icon('shield')}</span>Account &amp; data</h3></div>
          <p class="muted" style="margin-bottom:1rem">Your information is stored only in this browser on this device.</p>
          <div class="stack" style="gap:.7rem">
            <button class="btn btn-ghost btn-block" type="button" data-action="reset-demo">${icon('refresh')} Restore demo data</button>
            <button class="btn btn-danger btn-block" type="button" data-action="clear-data">${icon('trash')} Delete all my health data</button>
            <button class="btn btn-ghost btn-block" type="button" data-action="logout">${icon('logout')} Log out</button>
          </div>
        </section>
      </div>
    </div>
  </div>`;
}

/* =========================================================
   Emergency
   ========================================================= */
function openEmergency() {
  const p = Store.data.profile;
  const meds = Store.data.medicines.map((m) => `${m.name} ${m.dosage}`).join(', ');
  openModal({
    title: 'Emergency help', ic: 'siren',
    body: `
      <p style="font-size:1.1rem;margin-bottom:1rem">Tap a button to call for help straight away.</p>
      <div class="emergency-grid">
        <a class="emergency-btn primary" href="tel:108"><span class="card-icon">${icon('siren')}</span><span>Call Ambulance – 108<span class="sub">Medical emergency (India)</span></span></a>
        ${p.emergency.phone ? `<a class="emergency-btn" href="${telHref(p.emergency.phone)}"><span class="card-icon red">${icon('phone')}</span><span>Call ${h(p.emergency.name || 'emergency contact')}<span class="sub">${h(p.emergency.relation || 'Emergency contact')} · ${h(p.emergency.phone)}</span></span></a>` : ''}
        ${p.caregiver.phone ? `<a class="emergency-btn" href="${telHref(p.caregiver.phone)}"><span class="card-icon">${icon('users')}</span><span>Call ${h(p.caregiver.name || 'caregiver')}<span class="sub">${h(p.caregiver.relation || 'Caregiver')} · ${h(p.caregiver.phone)}</span></span></a>` : ''}
        <a class="emergency-btn" href="tel:112"><span class="card-icon blue">${icon('shield')}</span><span>National Emergency – 112<span class="sub">Police, fire and ambulance</span></span></a>
      </div>
      ${p.name ? `<div class="note" style="margin-top:1.2rem">
        <b>Medical information for helpers</b><br>
        ${h(p.name)}${p.age ? `, ${h(p.age)} years` : ''}${p.bloodGroup ? ` · Blood group ${h(p.bloodGroup)}` : ''}<br>
        ${p.conditions ? `Conditions: ${h(p.conditions)}<br>` : ''}
        ${meds ? `Medicines: ${h(meds)}` : ''}
      </div>` : ''}`
  });
}

/* =========================================================
   Reminder modals + engine
   ========================================================= */
function showMedReminder(med) {
  openModal({
    title: 'Medicine reminder', size: 'sm', ic: 'bellRing',
    body: `<div class="reminder-modal">
      <div class="ring-icon">${icon('pill')}</div>
      <h3>Time for your medicine</h3>
      <p class="big">${h(med.name)}</p>
      <p style="font-size:1.1rem">${h(med.dosage)} · ${U.fmtTime(med.time)}</p>
      ${med.instructions ? `<p class="note" style="margin-top:.8rem">${h(med.instructions)}</p>` : ''}
      <div class="actions">
        <button class="btn btn-success btn-lg btn-block" type="button" data-action="reminder-dose" data-id="${med.id}" data-v="taken">${icon('check')} I have taken it</button>
        <button class="btn btn-secondary btn-lg btn-block" type="button" data-action="snooze" data-id="${med.id}">${icon('clock')} Remind me in 10 minutes</button>
        <button class="btn btn-warn btn-lg btn-block" type="button" data-action="reminder-dose" data-id="${med.id}" data-v="missed">${icon('x')} Skip this dose</button>
      </div></div>`
  });
}

function showApptReminder(a) {
  openModal({
    title: 'Appointment reminder', size: 'sm', ic: 'bellRing',
    body: `<div class="reminder-modal">
      <div class="ring-icon">${icon('stethoscope')}</div>
      <h3>Doctor appointment ${timeUntil(Store.apptDate(a))}</h3>
      <p class="big">${h(a.doctor)}</p>
      <p style="font-size:1.1rem">${U.fmtTime(a.time)} · ${h(a.hospital)}</p>
      ${a.purpose ? `<p class="muted">${h(a.purpose)}</p>` : ''}
      ${a.notes ? `<p class="note" style="margin-top:.8rem">${h(a.notes)}</p>` : ''}
      <div class="actions"><button class="btn btn-primary btn-lg btn-block" type="button" data-action="close-modal">${icon('check')} OK, got it</button></div>
    </div>`
  });
}

const Reminders = {
  timer: null,
  start() {
    this.stop();
    this.check(true);
    this.timer = setInterval(() => this.check(false), 20000);
  },
  stop() { clearInterval(this.timer); this.timer = null; },

  check(initial) {
    if (S.role !== 'user') return;
    const d = Store.data, s = d.settings, now = new Date(), today = U.ymd(now);
    let popped = false;
    let changed = false;

    if (s.medReminders && !modalOpen()) {
      for (const dose of Store.dosesFor(today)) {
        if (dose.status !== 'pending') continue;
        const key = `med:${dose.med.id}:${today}`;
        const trig = d.snooze[key] ? new Date(d.snooze[key]) : U.dateTime(today, dose.med.time);
        const age = now - trig;
        if (age >= 0 && age < 2 * 3600000 && d.reminded[key] !== trig.getTime()) {
          d.reminded[key] = trig.getTime();
          Store.notify({ type: 'medicine', title: `Time for ${dose.med.name}`, message: `${dose.med.dosage}. ${dose.med.instructions || ''}`.trim(), key: `${key}:${trig.getTime()}` });
          this.alert(`Time for ${dose.med.name}`, dose.med.dosage);
          showMedReminder(dose.med);
          popped = changed = true;
          break;
        }
      }
    }

    if (s.apptReminders) {
      for (const a of Store.upcomingAppointments()) {
        const diff = Store.apptDate(a) - now;
        if (diff <= 0) continue;
        if (diff <= s.apptLead * 60000 && !d.reminded['appt:' + a.id] && !popped && !modalOpen()) {
          d.reminded['appt:' + a.id] = Date.now();
          Store.notify({ type: 'appointment', title: `Appointment ${timeUntil(Store.apptDate(a))}`, message: `${a.doctor} at ${U.fmtTime(a.time)} – ${a.hospital}.`, key: 'appt:' + a.id });
          this.alert('Appointment reminder', `${a.doctor} at ${U.fmtTime(a.time)}`);
          showApptReminder(a);
          popped = changed = true;
        } else if (diff <= 24 * 3600000 && !d.reminded['appt1d:' + a.id]) {
          d.reminded['appt1d:' + a.id] = Date.now();
          Store.notify({ type: 'appointment', title: `Appointment ${U.relDay(a.date).toLowerCase()}`, message: `${a.doctor} at ${U.fmtTime(a.time)} – ${a.hospital}. ${a.notes || ''}`.trim(), key: 'appt1d:' + a.id });
          changed = true;
        }
      }
    }

    if (s.dailySummary && now.getHours() >= 20 && !d.reminded['summary:' + today]) {
      d.reminded['summary:' + today] = Date.now();
      const sum = AI.summary(d, today);
      Store.notify({ type: 'summary', title: "Today's health summary is ready", message: sum.text, key: 'summary:' + today });
      this.browser("Today's health summary is ready", sum.text);
      changed = true;
    }

    if (initial) {
      AI.analyze(d).insights.filter((i) => i.status === 'alert').forEach((i) => {
        if (Store.notify({ type: i.category === 'health' ? 'health' : i.category === 'medicine' ? 'medicine' : 'health', title: i.issue, message: i.next, key: `ai:${i.id}:${today}` })) changed = true;
      });
    }

    if (changed) {
      Store.save();
      if (S.route === 'notifications' && !modalOpen()) render(); else renderShell(S.route || currentRoute());
    }
  },

  alert(title, body) {
    if (Store.data.settings.sound) this.beep();
    this.browser(title, body);
  },
  browser(title, body) {
    if (!Store.data.settings.browserNotif || !('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(title, { body, icon: 'assets/logo.svg' }); } catch (e) { /* not supported */ }
  },
  beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [0, 0.45, 0.9].forEach((t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = t === 0.9 ? 880 : 660;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.35);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.4);
      });
      setTimeout(() => ctx.close(), 1600);
    } catch (e) { /* audio unavailable */ }
  }
};

/* =========================================================
   Forms
   ========================================================= */
function formError(form, msg) {
  const el = form.querySelector('#form-error, #auth-error');
  if (el) { el.innerHTML = msg ? `<div class="form-error" role="alert">${icon('alertCircle')} ${h(msg)}</div>` : ''; }
  if (msg && el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return false;
}
const digits = (s) => String(s || '').replace(/\D/g, '');

const Forms = {
  login(f, v) {
    const p = Store.data.profile;
    if (!v.phone || !v.pin) return formError(f, 'Please enter your phone number and PIN.');
    if (digits(v.phone) !== digits(p.phone) || v.pin !== String(p.pin)) return formError(f, 'Phone number or PIN is not correct. Please try again.');
    startSession('user');
    toast(`Welcome back, ${U.firstName(p.name)}!`);
  },
  'caregiver-login'(f, v) {
    const c = Store.data.profile.caregiver;
    if (!v.phone || !v.pin) return formError(f, 'Please enter the caregiver phone number and PIN.');
    if (!c.phone || digits(v.phone) !== digits(c.phone) || v.pin !== String(c.pin)) return formError(f, 'Caregiver phone number or PIN is not correct.');
    startSession('caregiver');
    toast(`Welcome, ${U.firstName(c.name)}!`);
  },
  register(f, v) {
    if (!v.name.trim()) return formError(f, 'Please enter your name.');
    const age = U.num(v.age);
    if (!age || age < 18 || age > 120) return formError(f, 'Please enter a valid age.');
    if (digits(v.phone).length < 10) return formError(f, 'Please enter a valid 10-digit phone number.');
    if (!/^\d{4,6}$/.test(v.pin)) return formError(f, 'PIN must be 4 to 6 digits.');
    if (v.pin !== v.pin2) return formError(f, 'The two PINs do not match.');
    Store.replace(createEmptyData({
      name: v.name.trim(), age, phone: digits(v.phone), pin: v.pin,
      caregiver: { name: v.cgName.trim(), relation: '', phone: digits(v.cgPhone), email: '', pin: v.pin }
    }));
    applyFont();
    startSession('user');
    toast('Your account has been created. Welcome to ASHA!');
  },
  medicine(f, v) {
    if (!v.name.trim() || !v.dosage.trim() || !v.time) return formError(f, 'Please fill in the medicine name, dosage and time.');
    if (v.end && v.start && v.end < v.start) return formError(f, 'End date cannot be before the start date.');
    const data = { name: v.name.trim(), dosage: v.dosage.trim(), time: v.time, frequency: v.frequency, start: v.start || U.ymd(), end: v.end || '', instructions: v.instructions.trim(), color: v.color || 'teal' };
    if (v.id) Object.assign(Store.med(v.id), data);
    else Store.data.medicines.push(Object.assign({ id: U.uid() }, data));
    if (S.role === 'caregiver') {
      Store.notify({
        type: 'medicine',
        title: currentLanguage === 'hi' ? 'देखभालकर्ता ने दवाइयाँ अपडेट की हैं' : 'Caregiver updated your medicines',
        message: `${Store.data.profile.caregiver.name || (currentLanguage === 'hi' ? 'देखभालकर्ता' : 'Caregiver')} ${v.id ? (currentLanguage === 'hi' ? 'ने दवा अपडेट की:' : 'updated:') : (currentLanguage === 'hi' ? 'ने नई दवा जोड़ी:' : 'added:')} ${data.name}.`,
        key: 'med-cg:' + Date.now()
      });
    }
    Store.save();
    closeModal();
    toast(v.id ? (currentLanguage === 'hi' ? 'दवा अपडेट हो गई।' : 'Medicine updated.') : (currentLanguage === 'hi' ? `${data.name} जोड़ी गई।` : `${data.name} added. ASHA will remind you at ${U.fmtTime(data.time)}.`));
    render();
  },
  appointment(f, v) {
    if (!v.doctor.trim() || !v.hospital.trim() || !v.date || !v.time) return formError(f, 'Please fill in doctor, hospital, date and time.');
    const data = { doctor: v.doctor.trim(), specialty: v.specialty.trim(), hospital: v.hospital.trim(), date: v.date, time: v.time, purpose: v.purpose.trim(), notes: v.notes.trim() };
    if (v.id) {
      const a = Store.data.appointments.find((x) => x.id === v.id);
      Object.assign(a, data, { status: v.status || a.status });
      delete Store.data.reminded['appt:' + a.id];
      delete Store.data.reminded['appt1d:' + a.id];
    } else {
      if (U.dateTime(v.date, v.time) < new Date()) return formError(f, 'This date and time has already passed. Please choose a future time.');
      Store.data.appointments.push(Object.assign({ id: U.uid(), status: 'upcoming' }, data));
    }
    Store.save();
    closeModal();
    toast(v.id ? 'Appointment updated.' : 'Appointment added. ASHA will remind you before it.');
    render();
  },
  record(f, v) {
    const n = {};
    ['bpSys', 'bpDia', 'sugar', 'heartRate', 'weight', 'temp', 'spo2'].forEach((k) => { n[k] = U.num(v[k]); });
    if (Object.values(n).every((x) => x == null)) return formError(f, 'Please enter at least one reading.');
    if ((n.bpSys == null) !== (n.bpDia == null)) return formError(f, 'Please enter both the top and bottom blood pressure numbers.');
    const ranges = { bpSys: [60, 260, 'Top BP number'], bpDia: [30, 160, 'Bottom BP number'], sugar: [20, 600, 'Blood sugar'], heartRate: [30, 220, 'Heart rate'], weight: [20, 250, 'Weight'], temp: [90, 110, 'Temperature'], spo2: [50, 100, 'SpO2'] };
    for (const [k, [lo, hi, label]] of Object.entries(ranges)) {
      if (n[k] != null && (n[k] < lo || n[k] > hi)) return formError(f, `${label} should be between ${lo} and ${hi}. Please check the number.`);
    }
    if (n.bpSys != null && n.bpDia >= n.bpSys) return formError(f, 'The top blood pressure number should be bigger than the bottom number.');
    const rec = Object.assign({ datetime: `${v.date}T${v.time}`, sugarType: v.sugarType, notes: v.notes.trim() }, n);
    if (v.id) Object.assign(Store.data.records.find((r) => r.id === v.id), rec);
    else { rec.id = U.uid(); Store.data.records.push(rec); }
    Store.save();
    closeModal();

    const st = Object.entries(Vitals.ofRecord(rec)).filter(([, s]) => s && s !== 'normal');
    if (st.some(([, s]) => s === 'alert')) {
      Store.notify({ type: 'health', title: 'A reading is outside the usual range', message: 'One of your latest readings is outside the usual range. Rest and re-check, and share it with your doctor if it stays the same.', key: 'rec:' + (rec.id || v.id) });
      toast('Saved. One reading is outside the usual range – see AI Insights.', 'warn');
    } else if (st.length) toast('Saved. One reading needs a little attention.', 'warn');
    else toast('Reading saved. Everything looks in the usual range.');
    render();
  },
  other(f, v) {
    const minutes = U.num(v.minutes);
    if (!v.name.trim() || !minutes || minutes < 1) return;
    Store.updateActivity(U.ymd(), (a) => a.other.push({ id: U.uid(), name: v.name.trim(), minutes }));
    toast(`${v.name.trim()} added.`);
    render();
    const inp = $('#o-name'); if (inp) inp.focus();
  },
  profile(f, v) {
    if (!v.name.trim()) return formError(f, 'Please enter your name.');
    if (digits(v.phone).length < 10) return formError(f, 'Please enter a valid phone number.');
    if (v.pin && !/^\d{4,6}$/.test(v.pin)) return formError(f, 'PIN must be 4 to 6 digits.');
    if (v.cg_pin && !/^\d{4,6}$/.test(v.cg_pin)) return formError(f, 'Caregiver PIN must be 4 to 6 digits.');
    const d = Store.data, p = d.profile;
    Object.assign(p, { name: v.name.trim(), age: U.num(v.age) || '', gender: v.gender, phone: digits(v.phone), bloodGroup: v.bloodGroup, conditions: v.conditions.trim(), address: v.address.trim() });
    if (v.pin) p.pin = v.pin;
    p.emergency = { name: v.em_name.trim(), relation: v.em_relation.trim(), phone: digits(v.em_phone) };
    p.caregiver = { name: v.cg_name.trim(), relation: v.cg_relation.trim(), phone: digits(v.cg_phone), email: v.cg_email.trim(), pin: v.cg_pin || p.caregiver.pin };
    d.goals = {
      water: U.clamp(U.num(v.goal_water) || 8, 1, 20),
      walk: U.clamp(U.num(v.goal_walk) || 30, 5, 240),
      sleep: U.clamp(U.num(v.goal_sleep) || 7, 4, 12)
    };
    Store.save();
    toast('Your profile has been saved.');
    render();
  }
};

/* =========================================================
   Actions (click handlers)
   ========================================================= */
let activeRecognition = null;

function stopActiveRecognition() {
  if (activeRecognition) {
    try { activeRecognition.abort(); } catch (e) {}
    activeRecognition = null;
  }
}

const Actions = {
  dictate: (ds, el) => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast(currentLanguage === 'hi' ? 'इस ब्राउज़र में वॉइस इनपुट सपोर्ट नहीं है। कृपया Chrome यूज़ करें।' : 'Voice recognition not supported in this browser. Please use Chrome.', 'warn');
      return;
    }

    stopActiveRecognition();

    const targetEl = (ds && ds.target ? document.getElementById(ds.target) : null) || $('#elder-voice-text') || document.querySelector('[data-voice-target]') || $('#dashboard-voice-note');
    if (!targetEl) return;

    const rec = new SpeechRec();
    activeRecognition = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = (LANG[currentLanguage] && LANG[currentLanguage].voice) ? LANG[currentLanguage].voice : (currentLanguage === 'hi' ? 'hi-IN' : 'en-IN');

    rec.onstart = () => {
      if (el) el.classList.add('pulse');
      toast(currentLanguage === 'hi' ? '🎙️ सुन रहे हैं... बोलिए' : '🎙️ Listening... speak now', 'info');
    };

    let transcript = '';
    rec.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      transcript = finalTranscript || interim;
      if (transcript) {
        targetEl.value = transcript;
      }
      if (finalTranscript) {
        const lower = finalTranscript.toLowerCase();
        if ((lower.includes('water') && lower.includes('drank')) || lower.includes('paani') || lower.includes('pani')) {
          const num = finalTranscript.match(/\d+/) || [1];
          Store.updateActivity(U.ymd(), (a) => a.water += parseInt(num[0]));
          toast(`Added ${num[0]} glass(es) of water.`);
          render();
          return;
        }
        if (lower.includes('bp') || lower.includes('blood pressure')) {
          const nums = finalTranscript.match(/\d+/g);
          if (nums && nums.length >= 2) {
            const sysEl = document.getElementById('h-sys');
            const diaEl = document.getElementById('h-dia');
            if (sysEl && diaEl) {
              sysEl.value = nums[0];
              diaEl.value = nums[1];
              toast('Populated Blood Pressure fields.');
              return;
            }
          }
        }
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (el) el.classList.remove('pulse');
      toast(currentLanguage === 'hi' ? `माइक एरर: ${event.error}` : `Mic error: ${event.error}`, 'warn');
      activeRecognition = null;
    };

    rec.onend = () => {
      if (el) el.classList.remove('pulse');
      toast(currentLanguage === 'hi' ? 'रिकॉर्डिंग पूरी हुई।' : 'Recording finished.', 'ok');
      activeRecognition = null;
    };

    try {
      rec.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      toast(currentLanguage === 'hi' ? 'माइक शुरू नहीं हो सका।' : 'Could not start mic.', 'warn');
      activeRecognition = null;
    }
  },
  'set-language': (ds) => setLanguage(ds.lang),
  'record-caregiver-msg': (ds, el) => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast(currentLanguage === 'hi' ? 'इस ब्राउज़र में वॉइस इनपुट सपोर्ट नहीं है। कृपया Chrome यूज़ करें।' : 'Voice recognition not supported in this browser. Please use Chrome.', 'warn');
      return;
    }

    stopActiveRecognition();

    const targetInput = (ds && ds.target ? document.getElementById(ds.target) : null) || $('#elder-voice-text') || document.querySelector('[data-voice-target]') || $('#dashboard-voice-note');
    const indicator = document.getElementById('dashboard-mic-indicator');

    const rec = new SpeechRec();
    activeRecognition = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = (LANG[currentLanguage] && LANG[currentLanguage].voice) ? LANG[currentLanguage].voice : (currentLanguage === 'hi' ? 'hi-IN' : 'en-IN');

    rec.onstart = () => {
      if (indicator) indicator.style.display = 'flex';
      if (el) el.classList.add('pulse');
      toast(currentLanguage === 'hi' ? '🎙️ सुन रहे हैं... बोलिए' : '🎙️ Listening... speak now', 'info');
    };

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      if (targetInput) {
        targetInput.value = transcript;
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (indicator) indicator.style.display = 'none';
      if (el) el.classList.remove('pulse');
      toast(currentLanguage === 'hi' ? `माइक एरर: ${event.error}` : `Mic error: ${event.error}`, 'warn');
      activeRecognition = null;
    };

    rec.onend = () => {
      if (indicator) indicator.style.display = 'none';
      if (el) el.classList.remove('pulse');
      toast(currentLanguage === 'hi' ? 'रिकॉर्डिंग पूरी हुई।' : 'Recording finished.', 'ok');
      activeRecognition = null;
    };

    try {
      rec.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      toast(currentLanguage === 'hi' ? 'माइक शुरू नहीं हो सका।' : 'Could not start mic.', 'warn');
      activeRecognition = null;
    }
  },
  'send-caregiver-msg': (ds) => {
    const targetEl = (ds && ds.target ? document.getElementById(ds.target) : null) || $('#elder-voice-text') || document.querySelector('[data-voice-target]') || $('#dashboard-voice-note');
    const text = targetEl ? targetEl.value.trim() : '';
    if (!text) {
      toast(currentLanguage === 'hi' ? 'कृपया पहले संदेश बोलें या लिखें।' : 'Please speak or enter a message first.', 'warn');
      return;
    }
    Store.data.caregiverUpdates = Store.data.caregiverUpdates || [];
    Store.data.caregiverUpdates.push({
      id: U.uid(),
      text,
      timestamp: new Date().toISOString()
    });
    Store.notify({
      type: 'summary',
      title: currentLanguage === 'hi' ? 'देखभालकर्ता को वॉयस अपडेट भेजा गया' : 'Voice update sent to caregiver',
      message: text,
      key: 'cg-update:' + Date.now()
    });
    Store.save();
    if (targetEl) targetEl.value = '';
    toast(currentLanguage === 'hi' ? 'संदेश देखभालकर्ता को भेज दिया गया है' : 'Update sent to caregiver', 'ok');
    render();
  },
  'auth-tab': (ds) => { S.authMode = ds.v; renderAuth(); const f = $('#auth-screen input'); if (f) f.focus(); },
  'demo-login': (ds) => {
    const go = () => {
      startSession(ds.v);
      const p = Store.data.profile;
      toast(`Welcome, ${U.firstName(ds.v === 'caregiver' ? p.caregiver.name : p.name)}!`);
    };
    if (Store.data.profile.phone === '9876543210') return go();
    confirmDialog({
      title: 'Open the demo account?', message: 'This device has your own ASHA account. Opening the demo will replace it with demo data.', yes: 'Yes, open demo', danger: false,
      onYes: () => { Store.reset(); applyFont(); go(); }
    });
  },
  logout: () => confirmDialog({ title: 'Log out?', message: 'Do you want to log out of ASHA?', yes: 'Yes, log out', danger: false, onYes: logout }),
  emergency: () => openEmergency(),
  'open-menu': () => { document.body.classList.add('menu-open'); const a = $('#nav a'); if (a) a.focus(); },
  'close-menu': () => document.body.classList.remove('menu-open'),
  'close-modal': () => closeModal(),
  'confirm-yes': () => { const fn = S.confirmFn; closeModal(); if (fn) fn(); },
  go: (ds) => { location.hash = '#/' + ds.v; },

  /* Medicines */
  'add-med': () => openModal({ title: 'Add medicine', ic: 'pill', body: medicineForm() }),
  'edit-med': (ds) => openModal({ title: 'Edit medicine', ic: 'edit', body: medicineForm(Store.med(ds.id)) }),
  'del-med': (ds) => {
    const m = Store.med(ds.id);
    confirmDialog({
      title: 'Delete medicine?', message: `Are you sure you want to delete ${m.name}? Its reminders will stop.`,
      onYes: () => { Store.data.medicines = Store.data.medicines.filter((x) => x.id !== ds.id); Store.save(); toast(`${m.name} deleted.`); render(); }
    });
  },
  dose: (ds) => {
    const m = Store.med(ds.id);
    Store.setDose(ds.id, ds.date || U.ymd(), ds.v || null);
    toast(ds.v === 'taken' ? `${m.name} marked as taken. Well done!` : ds.v === 'missed' ? `${m.name} marked as missed.` : 'Status cleared.', ds.v === 'missed' ? 'warn' : 'ok');
    render();
  },
  'reminder-dose': (ds) => {
    const m = Store.med(ds.id);
    Store.setDose(ds.id, U.ymd(), ds.v);
    closeModal();
    toast(ds.v === 'taken' ? `${m.name} marked as taken. Well done!` : `${m.name} skipped.`, ds.v === 'taken' ? 'ok' : 'warn');
    render();
  },
  snooze: (ds) => {
    const key = `med:${ds.id}:${U.ymd()}`;
    Store.data.snooze[key] = Date.now() + 10 * 60000;
    Store.save();
    closeModal();
    toast('OK, ASHA will remind you again in 10 minutes.', 'info');
  },

  /* Appointments */
  'add-appt': () => openModal({ title: 'Add appointment', ic: 'calendar', body: apptForm() }),
  'edit-appt': (ds) => openModal({ title: 'Edit appointment', ic: 'edit', body: apptForm(Store.data.appointments.find((a) => a.id === ds.id)) }),
  'del-appt': (ds) => {
    const a = Store.data.appointments.find((x) => x.id === ds.id);
    confirmDialog({
      title: 'Delete appointment?', message: `Delete the appointment with ${a.doctor} on ${U.fmtMed(U.parseDate(a.date))}?`,
      onYes: () => { Store.data.appointments = Store.data.appointments.filter((x) => x.id !== ds.id); Store.save(); toast('Appointment deleted.'); render(); }
    });
  },
  'appt-status': (ds) => {
    const a = Store.data.appointments.find((x) => x.id === ds.id);
    a.status = ds.v;
    Store.save();
    toast(ds.v === 'completed' ? 'Marked as attended.' : 'Marked as missed. Remember to book a new date.', ds.v === 'completed' ? 'ok' : 'warn');
    render();
  },

  /* Activities */
  water: (ds) => {
    const a = Store.updateActivity(U.ymd(), (x) => { x.water = U.clamp((x.water || 0) + Number(ds.v), 0, 30); });
    if (Number(ds.v) > 0) toast(a.water >= Store.data.goals.water ? `${a.water} glasses – water goal reached!` : `${a.water} of ${Store.data.goals.water} glasses today.`);
    render();
  },
  walk: (ds) => { Store.updateActivity(U.ymd(), (x) => { x.walk = U.clamp((x.walk || 0) + Number(ds.v), 0, 600); }); render(); },
  sleep: (ds) => { Store.updateActivity(U.ymd(), (x) => { x.sleep = U.clamp((x.sleep ?? Store.data.goals.sleep) + Number(ds.v), 0, 16); }); render(); },
  'sleep-set': (ds) => { Store.updateActivity(U.ymd(), (x) => { x.sleep = Number(ds.v); }); render(); },
  meal: (ds) => { Store.updateActivity(U.ymd(), (x) => { x.meals[ds.v] = !x.meals[ds.v]; }); render(); },
  'del-other': (ds) => { Store.updateActivity(U.ymd(), (x) => { x.other = x.other.filter((o) => o.id !== ds.id); }); toast('Activity removed.'); render(); },

  /* Records */
  'add-record': () => openModal({ title: 'Add health reading', ic: 'heartPulse', body: recordForm() }),
  'edit-record': (ds) => openModal({ title: 'Edit reading', ic: 'edit', body: recordForm(Store.data.records.find((r) => r.id === ds.id)) }),
  'del-record': (ds) => confirmDialog({
    title: 'Delete reading?', message: 'Are you sure you want to delete this health reading?',
    onYes: () => { Store.data.records = Store.data.records.filter((r) => r.id !== ds.id); Store.save(); toast('Reading deleted.'); render(); }
  }),
  'chart-metric': (ds) => { S.chartMetric = ds.v; render(); },

  /* Insights & summary */
  'insight-filter': (ds) => { S.insightFilter = S.insightFilter === ds.v && ds.v !== 'all' ? 'all' : ds.v; render(); },
  reanalyse: () => { render(); toast('ASHA has re-checked your latest records.'); },
  'set-language': (ds) => {
  setLanguage(ds.lang);
},

'speak': (ds) => {
  speak(ds.text);
},

'stop-speaking': () => {
  stopSpeaking();
},
  'speak': (ds) => {
    speak(ds.text);
  },

  'stop-speaking': () => {
    stopSpeaking();
  },
  'summary-day': (ds) => {
    const cur = U.parseDate(S.summaryDate || U.ymd());
    const next = U.ymd(U.addDays(cur, Number(ds.v)));
    if (next > U.ymd()) return;
    S.summaryDate = next === U.ymd() ? null : next;
    render();
  },
  print: () => window.print(),
  'share-summary': async () => {
    const sum = AI.summary(Store.data, S.summaryDate || U.ymd());
    let text = summaryText(sum);
    const noteEl = document.getElementById('summary-note');
    if (noteEl && noteEl.value.trim()) {
      text = "Quick Update: " + noteEl.value.trim() + "\n\n" + text;
    }
    if (navigator.share) {
      try { await navigator.share({ title: 'ASHA – Daily Health Summary', text }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const cg = Store.data.profile.caregiver;
    if (cg.phone) window.open(waHref(cg.phone, text), '_blank', 'noopener');
    else if (navigator.clipboard) { await navigator.clipboard.writeText(text); toast('Summary copied. You can paste it in a message.'); }
  },

  /* Notifications */
  'notif-filter': (ds) => { S.notifFilter = ds.v; render(); },
  'notif-open': (ds) => {
    const n = Store.data.notifications.find((x) => x.id === ds.id);
    if (!n) return;
    n.read = true;
    Store.save();
    const target = { medicine: 'medicines', appointment: 'appointments', health: 'insights', summary: 'summary' }[n.type];
    if (target && NAV[S.role].includes(target)) location.hash = '#/' + target; else render();
  },
  'notif-del': (ds) => { Store.data.notifications = Store.data.notifications.filter((n) => n.id !== ds.id); Store.save(); render(); },
  'notif-read-all': () => { Store.data.notifications.forEach((n) => { n.read = true; }); Store.save(); toast('All notifications marked as read.'); render(); },
  'notif-clear': () => confirmDialog({
    title: 'Clear all notifications?', message: 'This removes every notification from the list.', yes: 'Yes, clear all',
    onYes: () => { Store.data.notifications = []; Store.save(); render(); }
  }),
  'enable-browser-notif': async () => {
    if (!('Notification' in window)) return toast('This browser does not support notifications.', 'warn');
    const res = await Notification.requestPermission();
    Store.data.settings.browserNotif = res === 'granted';
    Store.save();
    toast(res === 'granted' ? 'Browser notifications are on.' : 'Notifications were not allowed.', res === 'granted' ? 'ok' : 'warn');
    render();
  },

  /* Settings */
  font: (ds) => { Store.data.settings.fontSize = ds.v; Store.save(); applyFont(); render(); toast('Text size updated.'); },
  'test-reminder': () => {
    const m = Store.data.medicines[0] || { id: '', name: 'Sample medicine', dosage: '1 tablet', time: U.hm(), instructions: 'This is how a reminder looks.' };
    Reminders.alert(`Time for ${m.name}`, m.dosage);
    showMedReminder(m);
  },
  'reset-demo': () => confirmDialog({
    title: 'Restore demo data?', message: 'This replaces all current information with the demo account (Kamala Sharma).', yes: 'Yes, restore', danger: false,
    onYes: () => { Store.reset(); applyFont(); render(); Reminders.start(); toast('Demo data restored.'); }
  }),
  'clear-data': () => confirmDialog({
    title: 'Delete all health data?', message: 'All medicines, appointments, activities, readings and notifications will be permanently deleted. Your profile will be kept.', yes: 'Yes, delete everything',
    onYes: () => {
      const p = Store.data.profile, s = Store.data.settings, g = Store.data.goals;
      const fresh = createEmptyData(p);
      fresh.settings = s; fresh.goals = g;
      Store.replace(fresh);
      render();
      toast('All health data deleted.');
    }
  })
};

/* =========================================================
   Global events & init
   ========================================================= */
function applyFont() { document.documentElement.dataset.font = Store.data.settings.fontSize || 'normal'; }

function bindEvents() {
  document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) { closeModal(); return; }
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = Actions[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;
    const name = f.dataset.form;
    if (!name || !Forms[name]) return;
    e.preventDefault();
    if (!f.checkValidity()) {
      const bad = f.querySelector(':invalid');
      if (bad) { bad.setAttribute('aria-invalid', 'true'); bad.focus(); }
      const label = bad && f.querySelector(`label[for="${bad.id}"]`);
      return formError(f, `Please check “${label ? label.textContent.replace('*', '').trim() : 'this field'}”.`);
    }
    const values = Object.fromEntries(new FormData(f).entries());
    Object.keys(values).forEach((k) => { if (typeof values[k] !== 'string') values[k] = ''; });
    Forms[name](f, values);
  });

  document.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });

  document.addEventListener('change', async (e) => {
    const el = e.target;
    const key = el.dataset && el.dataset.setting;
    if (!key) return;
    const s = Store.data.settings;
    if (el.type === 'checkbox') {
      if (key === 'browserNotif' && el.checked) {
        if (!('Notification' in window)) { el.checked = false; return toast('This browser does not support notifications.', 'warn'); }
        const res = await Notification.requestPermission();
        if (res !== 'granted') { el.checked = false; s.browserNotif = false; Store.save(); return toast('Notifications were not allowed in the browser.', 'warn'); }
      }
      s[key] = el.checked;
    } else {
      s[key] = Number(el.value);
      Object.keys(Store.data.reminded).filter((k) => k.startsWith('appt:')).forEach((k) => delete Store.data.reminded[k]);
    }
    Store.save();
    toast('Setting saved.');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalOpen()) closeModal();
      else document.body.classList.remove('menu-open');
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-action]')) {
      e.preventDefault();
      e.target.click();
    }
    if (e.key === 'Tab' && modalOpen()) {
      const items = [...$('#modal-root').querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('hashchange', () => { if (S.role) render(); });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (S.route === 'records') drawRecordsChart(); }, 150); });

  // Refresh time-sensitive labels (due now / overdue) every minute
  setInterval(() => {
    if (!S.role || modalOpen()) return;
    const active = document.activeElement;
    if (active && /INPUT|SELECT|TEXTAREA/.test(active.tagName)) return;
    if (['dashboard', 'medicines', 'appointments', 'caregiver'].includes(S.route)) render();
  }, 60000);
}

function init() {
  Store.load();
  applyFont();
  bindEvents();
  let session = null;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { /* ignore */ }
  if (session && NAV[session.role]) startSession(session.role);
  else showAuth();
}

document.addEventListener('DOMContentLoaded', init);
