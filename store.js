/* =========================================================
   ASHA – data layer (localStorage + demo data)
   ========================================================= */
const ASHA_KEY = 'asha_data_v1';
const SESSION_KEY = 'asha_session_v1';

const U = {
  pad: (n) => String(n).padStart(2, '0'),
  ymd(d = new Date()) {
    const x = new Date(d);
    return `${x.getFullYear()}-${U.pad(x.getMonth() + 1)}-${U.pad(x.getDate())}`;
  },
  hm(d = new Date()) { return `${U.pad(d.getHours())}:${U.pad(d.getMinutes())}`; },
  addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; },
  parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
  dateTime(dateStr, timeStr = '00:00') {
    const d = U.parseDate(dateStr);
    const [h, mi] = timeStr.split(':').map(Number);
    d.setHours(h || 0, mi || 0, 0, 0);
    return d;
  },
  parseDT(s) { const [d, t] = s.split('T'); return U.dateTime(d, t); },
  daysBetween(a, b) {
    return Math.round((U.parseDate(U.ymd(b)) - U.parseDate(U.ymd(a))) / 86400000);
  },
  uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); },
  fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${(h % 12) || 12}:${U.pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
  },
  fmtLong(d) { return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); },
  fmtMed(d) { return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); },
  fmtShort(d) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); },
  relDay(dateStr) {
    const n = U.daysBetween(new Date(), U.parseDate(dateStr));
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n === -1) return 'Yesterday';
    if (n > 1 && n < 7) return `In ${n} days`;
    if (n < -1 && n > -7) return `${-n} days ago`;
    return U.fmtMed(U.parseDate(dateStr));
  },
  relDateTime(date) {
    const d = new Date(date);
    const n = U.daysBetween(d, new Date());
    const t = U.fmtTime(U.hm(d));
    if (n === 0) return `Today, ${t}`;
    if (n === 1) return `Yesterday, ${t}`;
    return `${U.fmtMed(d)}, ${t}`;
  },
  timeAgo(date) {
    const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 0) return U.relDateTime(date);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
    if (s < 172800) return 'Yesterday';
    return U.fmtMed(date);
  },
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  initials(name) {
    return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  },
  firstName(name) { return (name || '').trim().split(/\s+/)[0] || 'there'; },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
  num(v) { if (v === '' || v == null) return null; const n = Number(v); return Number.isFinite(n) ? n : null; },
  plural(n, w, p) { return `${n} ${n === 1 ? w : (p || w + 's')}`; }
};

const FREQUENCIES = {
  daily: 'Every day',
  alternate: 'Every other day',
  weekly: 'Once a week',
  asneeded: 'Only when needed'
};

function defaultActivity() {
  return { water: 0, meals: { breakfast: false, lunch: false, snack: false, dinner: false }, walk: 0, sleep: null, other: [] };
}

function defaultSettings() {
  return { medReminders: true, apptReminders: true, sound: true, apptLead: 60, browserNotif: false, fontSize: 'normal', dailySummary: true };
}

function createDemoData() {
  const today = new Date();
  const T = U.ymd(today);
  let seed = 20261008;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const r = (a, b) => a + Math.round(rnd() * (b - a));
  const start = U.ymd(U.addDays(today, -60));

  const medicines = [
    { id: 'm1', name: 'Thyroxine', dosage: '50 mcg – 1 tablet', time: '06:30', frequency: 'daily', start, end: '', instructions: 'Take on an empty stomach with water, 30 minutes before breakfast.', color: 'violet' },
    { id: 'm2', name: 'Metformin', dosage: '500 mg – 1 tablet', time: '08:30', frequency: 'daily', start, end: '', instructions: 'For blood sugar. Take after breakfast.', color: 'blue' },
    { id: 'm3', name: 'Amlodipine', dosage: '5 mg – 1 tablet', time: '09:00', frequency: 'daily', start, end: '', instructions: 'For blood pressure. Take at the same time every day.', color: 'teal' },
    { id: 'm4', name: 'Vitamin D3', dosage: '1000 IU – 1 capsule', time: '13:30', frequency: 'daily', start, end: U.ymd(U.addDays(today, 45)), instructions: 'Take after lunch.', color: 'amber' },
    { id: 'm5', name: 'Atorvastatin', dosage: '10 mg – 1 tablet', time: '21:00', frequency: 'daily', start, end: '', instructions: 'For cholesterol. Take after dinner.', color: 'rose' }
  ];

  const doseLog = {};
  const activities = {};
  const records = [];

  for (let i = 13; i >= 0; i--) {
    const date = U.ymd(U.addDays(today, -i));
    // Medicines
    doseLog[date] = {};
    medicines.forEach((m) => {
      let st = 'taken';
      if (m.id === 'm4' && (i === 2 || i === 5)) st = 'missed';
      if (m.id === 'm3' && i === 4) st = 'missed';
      if (i === 0) {
        if (m.id === 'm4') st = 'missed';
        else if (m.id === 'm5') return; // still to take today
      }
      doseLog[date][m.id] = st;
    });

    // Daily activities
    const sleepMap = { 1: 5, 4: 5.5, 6: 5 };
    activities[date] = {
      water: i === 0 ? 6 : r(5, 8),
      meals: { breakfast: true, lunch: true, snack: i === 0 ? false : rnd() > 0.3, dinner: i !== 0 },
      walk: i === 0 ? 25 : r(12, 32),
      sleep: i === 0 ? 7 : (sleepMap[i] ?? [6.5, 7, 7.5, 6][r(0, 3)]),
      other: i === 0
        ? [{ id: 'o1', name: 'Morning prayer & stretching', minutes: 15 }, { id: 'o2', name: 'Reading the newspaper', minutes: 30 }]
        : (rnd() > 0.5 ? [{ id: U.uid(), name: 'Gardening', minutes: r(15, 30) }] : [])
    };

    // Health records (morning reading every day)
    let sys = r(120, 132), dia = r(76, 84);
    if (i === 3) { sys = 144; dia = 92; }
    if (i === 5) { sys = 142; dia = 91; }
    if (i === 0) { sys = 128; dia = 82; }
    let sugar = r(104, 124);
    if (i === 2) sugar = 138;
    if (i === 0) sugar = 118;
    records.push({
      id: 'r' + i,
      datetime: `${date}T08:${U.pad(r(5, 25))}`,
      bpSys: sys, bpDia: dia,
      sugar, sugarType: 'fasting',
      heartRate: i === 0 ? 74 : r(68, 80),
      weight: +(64 + rnd() * 0.6).toFixed(1),
      temp: +(97.9 + rnd() * 0.7).toFixed(1),
      spo2: r(96, 98),
      notes: i === 3 ? 'Felt slightly dizzy after waking up.' : (i === 0 ? 'Feeling good today.' : '')
    });
  }

  const appointments = [
    { id: 'a1', doctor: 'Dr. Anil Mehta', specialty: 'Cardiologist', hospital: 'Apollo Hospital, Greams Road', date: U.ymd(U.addDays(today, 3)), time: '10:30', purpose: 'Blood pressure follow-up', notes: 'Carry the last 2 weeks of BP readings and current medicine list.', status: 'upcoming' },
    { id: 'a2', doctor: 'Dr. Sunita Rao', specialty: 'Diabetologist', hospital: 'City Diabetes Care Clinic', date: U.ymd(U.addDays(today, 12)), time: '11:00', purpose: 'Quarterly diabetes review & HbA1c test', notes: 'Fasting required – do not eat after 10 PM the night before.', status: 'upcoming' },
    { id: 'a3', doctor: 'Dr. Meena Iyer', specialty: 'Dentist', hospital: 'Smile Dental Centre', date: U.ymd(U.addDays(today, -6)), time: '16:00', purpose: 'Dental check-up', notes: '', status: 'missed' },
    { id: 'a4', doctor: 'Dr. Ravi Kumar', specialty: 'Ophthalmologist', hospital: 'Sankara Eye Hospital', date: U.ymd(U.addDays(today, -20)), time: '09:30', purpose: 'Annual eye check-up', notes: 'New reading glasses prescribed (+2.5).', status: 'completed' }
  ];

  const ago = (mins) => new Date(Date.now() - mins * 60000).toISOString();
  const notifications = [
    { id: 'n1', type: 'medicine', title: 'Medicine missed: Vitamin D3', message: 'Vitamin D3 (1000 IU) was marked as missed today.', time: ago(35), read: false, key: 'seed1' },
    { id: 'n2', type: 'health', title: 'Blood pressure needs attention', message: 'Your blood pressure was higher than usual on 2 days this week. Consider sharing this with your doctor.', time: ago(90), read: false, key: 'seed2' },
    { id: 'n3', type: 'appointment', title: 'Upcoming appointment', message: 'Dr. Anil Mehta (Cardiologist) in 3 days at 10:30 AM – Apollo Hospital.', time: ago(180), read: false, key: 'seed3' },
    { id: 'n4', type: 'medicine', title: 'Time for Amlodipine', message: 'Amlodipine 5 mg – 1 tablet. Take at the same time every day.', time: ago(300), read: true, key: 'seed4' },
    { id: 'n5', type: 'summary', title: "Yesterday's health summary is ready", message: 'All medicines taken. Water 7/8 glasses. Sleep 5 hours – a little less than usual.', time: ago(60 * 16), read: true, key: 'seed5' },
    { id: 'n6', type: 'appointment', title: 'Missed appointment', message: 'Dental check-up with Dr. Meena Iyer was marked as missed. You may want to reschedule.', time: ago(60 * 24 * 5), read: true, key: 'seed6' }
  ];

  return {
    version: 1,
    profile: {
      name: 'Kamala Sharma', age: 72, gender: 'Female', phone: '9876543210', pin: '1234',
      bloodGroup: 'B+', conditions: 'Type 2 diabetes, High blood pressure, Hypothyroidism',
      address: '12, Lakeview Apartments, Chennai',
      emergency: { name: 'Priya Sharma', relation: 'Daughter', phone: '9811122233' },
      caregiver: { name: 'Rahul Sharma', relation: 'Son', phone: '9123456780', email: 'rahul.sharma@example.com', pin: '1234' }
    },
    settings: defaultSettings(),
    goals: { water: 8, walk: 30, sleep: 7 },
    medicines, doseLog, appointments, activities, records, notifications,
    reminded: {}, snooze: {},
    createdOn: T
  };
}

function createEmptyData(profile) {
  return {
    version: 1,
    profile: Object.assign({
      name: '', age: '', gender: '', phone: '', pin: '', bloodGroup: '', conditions: '', address: '',
      emergency: { name: '', relation: '', phone: '' },
      caregiver: { name: '', relation: '', phone: '', email: '', pin: '' }
    }, profile),
    settings: defaultSettings(),
    goals: { water: 8, walk: 30, sleep: 7 },
    medicines: [], doseLog: {}, appointments: [], activities: {}, records: [],
    notifications: [{ id: U.uid(), type: 'summary', title: 'Welcome to ASHA', message: 'Start by adding your medicines and your next doctor appointment. ASHA will remind you on time.', time: new Date().toISOString(), read: false, key: 'welcome' }],
    reminded: {}, snooze: {},
    createdOn: U.ymd()
  };
}

const Store = {
  data: null,

  load() {
    try { this.data = JSON.parse(localStorage.getItem(ASHA_KEY)); } catch (e) { this.data = null; }
    if (!this.data || this.data.version !== 1) {
      this.data = createDemoData();
      this.save();
    }
    const d = this.data;
    d.settings = Object.assign(defaultSettings(), d.settings);
    d.reminded = d.reminded || {};
    d.snooze = d.snooze || {};
    return d;
  },
  save() {
    try { localStorage.setItem(ASHA_KEY, JSON.stringify(this.data)); } catch (e) { console.warn('ASHA: could not save', e); }
  },
  reset() { this.data = createDemoData(); this.save(); },
  replace(data) { this.data = data; this.save(); },

  /* ---- Activities ---- */
  activity(date = U.ymd()) {
    const a = this.data.activities[date];
    if (a) return Object.assign(defaultActivity(), a, { meals: Object.assign(defaultActivity().meals, a.meals) });
    return defaultActivity();
  },
  updateActivity(date, fn) {
    const a = this.activity(date);
    fn(a);
    this.data.activities[date] = a;
    this.save();
    return a;
  },

  /* ---- Medicines ---- */
  isDue(m, date) {
    if (m.start && date < m.start) return false;
    if (m.end && date > m.end) return false;
    const n = m.start ? U.daysBetween(U.parseDate(m.start), U.parseDate(date)) : 0;
    switch (m.frequency) {
      case 'alternate': return n % 2 === 0;
      case 'weekly': return n % 7 === 0;
      case 'asneeded': return false;
      default: return true;
    }
  },
  dosesFor(date = U.ymd()) {
    const log = this.data.doseLog[date] || {};
    return this.data.medicines
      .filter((m) => this.isDue(m, date))
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((m) => ({ med: m, date, status: log[m.id] || 'pending' }));
  },
  setDose(medId, date, status) {
    const log = this.data.doseLog;
    log[date] = log[date] || {};
    if (status) log[date][medId] = status; else delete log[date][medId];
    this.save();
  },
  med(id) { return this.data.medicines.find((m) => m.id === id); },

  /* ---- Appointments ---- */
  apptDate(a) { return U.dateTime(a.date, a.time); },
  upcomingAppointments() {
    const now = new Date();
    return this.data.appointments
      .filter((a) => a.status === 'upcoming' && this.apptDate(a) >= new Date(now.getTime() - 60 * 60000))
      .sort((a, b) => this.apptDate(a) - this.apptDate(b));
  },
  pastAppointments() {
    const up = new Set(this.upcomingAppointments().map((a) => a.id));
    return this.data.appointments.filter((a) => !up.has(a.id)).sort((a, b) => this.apptDate(b) - this.apptDate(a));
  },

  /* ---- Records ---- */
  recordsSorted() { return [...this.data.records].sort((a, b) => b.datetime.localeCompare(a.datetime)); },
  latest(field, date) {
    return this.recordsSorted().find((r) => r[field] != null && r[field] !== '' && (!date || r.datetime.startsWith(date)));
  },

  /* ---- Notifications ---- */
  notify({ type, title, message, key }) {
    if (key && this.data.notifications.some((n) => n.key === key)) return null;
    const n = { id: U.uid(), type, title, message, time: new Date().toISOString(), read: false, key: key || null };
    this.data.notifications.unshift(n);
    this.data.notifications = this.data.notifications.slice(0, 100);
    this.save();
    return n;
  },
  unreadCount() { return this.data.notifications.filter((n) => !n.read).length; }
};
