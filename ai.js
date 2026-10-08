/* =========================================================
   ASHA – rule-based AI pattern detection
   Informational only. Does NOT diagnose.
   ========================================================= */
const STATUS_RANK = { normal: 0, attention: 1, alert: 2 };
const worst = (list) => list.reduce((w, s) => (STATUS_RANK[s] > STATUS_RANK[w] ? s : w), 'normal');

/* Reading classification used for Normal / Attention / Alert indicators */
const Vitals = {
  bp(s, d) {
    if (s == null || d == null) return null;
    if (s >= 140 || d >= 90) return 'alert';
    if (s < 90 || d < 60) return 'attention';
    if (s >= 130 || d >= 85) return 'attention';
    return 'normal';
  },
  sugar(v, type = 'fasting') {
    if (v == null) return null;
    if (v < 70) return 'alert';
    if (type === 'fasting') {
      if (v > 180) return 'alert';
      if (v > 130) return 'attention';
      return 'normal';
    }
    if (v > 250) return 'alert';
    if (v > 180) return 'attention';
    return 'normal';
  },
  heartRate(v) {
    if (v == null) return null;
    if (v < 50 || v > 110) return 'alert';
    if (v < 60 || v > 100) return 'attention';
    return 'normal';
  },
  spo2(v) {
    if (v == null) return null;
    if (v < 92) return 'alert';
    if (v < 95) return 'attention';
    return 'normal';
  },
  temp(v) {
    if (v == null) return null;
    if (v >= 100.4) return 'alert';
    if (v >= 99.5 || v < 96) return 'attention';
    return 'normal';
  },
  ofRecord(r) {
    return {
      bp: Vitals.bp(r.bpSys, r.bpDia),
      sugar: Vitals.sugar(r.sugar, r.sugarType),
      heartRate: Vitals.heartRate(r.heartRate),
      spo2: Vitals.spo2(r.spo2),
      temp: Vitals.temp(r.temp)
    };
  }
};

const AI = {
  analyze(data = Store.data, now = new Date()) {
    const insights = [];
    const today = U.ymd(now);
    const last7 = [...Array(7)].map((_, i) => U.ymd(U.addDays(now, -i))); // today first
    const prev7 = last7.slice(1); // completed days
    const g = data.goals;
    const add = (o) => insights.push(Object.assign({ id: o.id || o.issue }, o));

    /* 1. Medicines */
    const missedBy = {};
    let taken = 0, missed = 0, scheduled = 0;
    last7.forEach((date) => {
      Store.dosesFor(date).forEach(({ med, status }) => {
        if (status === 'taken') { taken++; scheduled++; }
        if (status === 'missed') {
          missed++; scheduled++;
          missedBy[med.id] = missedBy[med.id] || { med, count: 0, last: date };
          missedBy[med.id].count++;
          if (date > missedBy[med.id].last) missedBy[med.id].last = date;
        }
      });
    });
    const adherence = scheduled ? Math.round((taken / scheduled) * 100) : 100;
    const frequent = Object.values(missedBy).filter((x) => x.count >= 2);
    frequent.forEach(({ med, count, last }) => add({
      id: 'med-' + med.id, category: 'medicine', icon: 'pill',
      status: count >= 4 ? 'alert' : 'attention',
      issue: `${med.name} missed ${count} times this week`,
      issue_hi: `${med.name} इस सप्ताह ${count} बार छूट गई`,
      explanation: `ASHA noticed that ${med.name} (${med.dosage}) was marked as missed on ${count} of the last 7 days. Skipping doses often may make a medicine work less well.`,
      explanation_hi: `आशा ने देखा कि पिछले 7 दिनों में ${med.name} (${med.dosage}) ${count} बार छूटी है। खुराक छूटने से दवा का असर कम हो सकता है।`,
      when: U.dateTime(last, med.time),
      next: 'Keep this medicine somewhere you will see it at that time, keep reminders switched on, and let your caregiver or doctor know if you are finding it hard to take.',
      next_hi: 'इस दवा को ऐसी जगह रखें जहाँ समय पर आपकी नज़र पड़े, रिमाइंडर चालू रखें और कठिनाई होने पर डॉक्टर या देखभालकर्ता को बताएं।'
    }));
    if (!frequent.length && data.medicines.length) {
      add({
        id: 'med-ok', category: 'medicine', icon: 'pill', status: 'normal',
        issue: missed ? 'Medicines mostly on track' : 'Medicines taken as scheduled',
        issue_hi: missed ? 'दवाइयाँ ज़्यादातर समय पर ली गईं' : 'सभी दवाइयाँ समय पर ली गईं',
        explanation: `You took ${adherence}% of your recorded medicine doses in the last 7 days${missed ? ` (${U.plural(missed, 'dose')} missed)` : ''}. Well done!`,
        explanation_hi: `आपने पिछले 7 दिनों में अपनी दवाइयों की ${adherence}% खुराक ली है${missed ? ` (${missed} खुराक छूटी)` : ''}। बहुत बढ़िया!`,
        when: now, next: 'Keep following your usual medicine routine.',
        next_hi: 'अपनी नियमित दवा दिनचर्या का पालन जारी रखें।'
      });
    }

    /* 2. Repeated unusual readings */
    const recent = data.records.filter((r) => last7.includes(r.datetime.slice(0, 10)));
    const vitalRule = (cfg) => {
      const rows = recent.filter((r) => r[cfg.field] != null && r[cfg.field] !== '');
      if (!rows.length) {
        if (cfg.required) add({
          id: cfg.id + '-none', category: 'health', icon: cfg.icon, status: 'attention',
          issue: `No ${cfg.label} readings this week`,
          issue_hi: `इस सप्ताह ${cfg.label_hi || cfg.label} की कोई रीडिंग नहीं है`,
          explanation: `ASHA could not find any ${cfg.label} readings in the last 7 days, so it cannot check for patterns.`,
          explanation_hi: `आशा को पिछले 7 दिनों में ${cfg.label_hi || cfg.label} की कोई रीडिंग नहीं मिली, इसलिए पैटर्न की जांच नहीं हो सकी।`,
          when: now, next: `If your doctor asked you to check your ${cfg.label} regularly, please record a reading in Health Records.`,
          next_hi: `यदि आपके डॉक्टर ने नियमित रूप से ${cfg.label_hi || cfg.label} जांचने को कहा है, तो कृपया स्वास्थ्य रिकॉर्ड में रीडिंग दर्ज करें।`
        });
        return;
      }
      const flagged = rows.map((r) => ({ r, s: cfg.classify(r) })).filter((x) => x.s && x.s !== 'normal');
      const lastFlag = flagged.sort((a, b) => b.r.datetime.localeCompare(a.r.datetime))[0];
      if (flagged.length >= 2 || flagged.some((x) => x.s === 'alert' && cfg.singleAlert)) {
        add({
          id: cfg.id, category: 'health', icon: cfg.icon, status: 'alert',
          issue: flagged.length >= 2 ? `${cfg.Label} outside the usual range on ${flagged.length} days` : `${cfg.Label} reading needs review`,
          issue_hi: flagged.length >= 2 ? `${cfg.Label_hi || cfg.Label} ${flagged.length} दिनों में सामान्य सीमा से बाहर रही` : `${cfg.Label_hi || cfg.Label} की रीडिंग की समीक्षा आवश्यक है`,
          explanation: cfg.explain(flagged.map((x) => x.r), rows.length),
          explanation_hi: cfg.explain_hi ? cfg.explain_hi(flagged.map((x) => x.r), rows.length) : cfg.explain(flagged.map((x) => x.r), rows.length),
          when: U.parseDT(lastFlag.r.datetime), next: cfg.next,
          next_hi: cfg.next_hi || cfg.next
        });
      } else if (flagged.length === 1) {
        add({
          id: cfg.id, category: 'health', icon: cfg.icon, status: 'attention',
          issue: `One unusual ${cfg.label} reading`,
          issue_hi: `${cfg.Label_hi || cfg.label} की एक असामान्य रीडिंग मिली`,
          explanation: cfg.explain(flagged.map((x) => x.r), rows.length),
          explanation_hi: cfg.explain_hi ? cfg.explain_hi(flagged.map((x) => x.r), rows.length) : cfg.explain(flagged.map((x) => x.r), rows.length),
          when: U.parseDT(lastFlag.r.datetime),
          next: `Keep recording your ${cfg.label} as usual. If it happens again, ASHA will let you and your caregiver know.`,
          next_hi: `हमेशा की तरह अपनी ${cfg.label_hi || cfg.label} रीडिंग दर्ज करते रहें। यदि ऐसा दोबारा होता है, तो आशा आपको और आपके देखभालकर्ता को सूचित करेगी।`
        });
      } else {
        add({
          id: cfg.id + '-ok', category: 'health', icon: cfg.icon, status: 'normal',
          issue: `${cfg.Label} readings look steady`,
          issue_hi: `${cfg.Label_hi || cfg.Label} की रीडिंग सामान्य और स्थिर है`,
          explanation: `All ${U.plural(rows.length, 'reading')} in the last 7 days were in the usual range.`,
          explanation_hi: `पिछले 7 दिनों की सभी ${rows.length} रीडिंग सामान्य सीमा में थीं।`,
          when: U.parseDT(rows.sort((a, b) => b.datetime.localeCompare(a.datetime))[0].datetime),
          next: 'Keep up your routine and continue recording readings.',
          next_hi: 'अपनी दिनचर्या बनाए रखें और नियमित रीडिंग दर्ज करते रहें।'
        });
      }
    };

    vitalRule({
      id: 'bp', field: 'bpSys', label: 'blood pressure', Label: 'Blood pressure', label_hi: 'रक्तचाप', Label_hi: 'रक्तचाप', icon: 'heartPulse', required: true,
      classify: (r) => Vitals.bp(r.bpSys, r.bpDia),
      explain: (rs, n) => `${rs.map((r) => `${r.bpSys}/${r.bpDia}`).join(' and ')} mmHg ${rs.length > 1 ? 'were' : 'was'} recorded, which is higher or lower than the usual range (below 130/85). ${rs.length > 1 ? 'This happened more than once' : 'This happened once'} out of ${n} readings this week.`,
      explain_hi: (rs, n) => `${rs.map((r) => `${r.bpSys}/${r.bpDia}`).join(' और ')} mmHg दर्ज किया गया, जो सामान्य सीमा (130/85 से कम) से अलग है। इस सप्ताह ${n} में से ${rs.length > 1 ? 'एक से अधिक बार ऐसा हुआ' : 'एक बार ऐसा हुआ'}।`,
      next: 'Rest for 5 minutes and check again at the same time each day. Please share these readings with your doctor at your next visit, or sooner if you feel unwell.',
      next_hi: '5 मिनट आराम करें और प्रतिदिन एक ही समय पर पुनः जांचें। अगली मुलाकात में डॉक्टर को यह रीडिंग अवश्य दिखाएं, या अस्वस्थ महसूस होने पर तुरंत संपर्क करें।'
    });
    vitalRule({
      id: 'sugar', field: 'sugar', label: 'blood sugar', Label: 'Blood sugar', label_hi: 'ब्लड शुगर', Label_hi: 'ब्लड शुगर', icon: 'testTube', required: true, singleAlert: true,
      classify: (r) => Vitals.sugar(r.sugar, r.sugarType),
      explain: (rs, n) => `${rs.map((r) => `${r.sugar} mg/dL (${r.sugarType === 'fasting' ? 'fasting' : 'after meal'})`).join(', ')} ${rs.length > 1 ? 'were' : 'was'} outside the usual range out of ${n} readings this week.`,
      explain_hi: (rs, n) => `${rs.map((r) => `${r.sugar} mg/dL (${r.sugarType === 'fasting' ? 'उपवास' : 'भोजन के बाद'})`).join(', ')} इस सप्ताह की ${n} रीडिंग में से सामान्य सीमा से बाहर थी।`,
      next: 'Note what you ate before the reading. Share this pattern with your doctor. If you feel shaky, sweaty or confused, contact your caregiver or doctor straight away.',
      next_hi: 'रीडिंग से पहले आपने क्या खाया था, उस पर ध्यान दें। यह पैटर्न डॉक्टर को दिखाएं। यदि चक्कर या पसीना आए तो तुरंत डॉक्टर या देखभालकर्ता से संपर्क करें।'
    });
    vitalRule({
      id: 'hr', field: 'heartRate', label: 'heart rate', Label: 'Heart rate', label_hi: 'हृदय गति', Label_hi: 'हृदय गति', icon: 'heart',
      classify: (r) => Vitals.heartRate(r.heartRate),
      explain: (rs, n) => `Heart rate of ${rs.map((r) => r.heartRate).join(', ')} BPM was outside the usual 60–100 BPM range (${rs.length} of ${n} readings).`,
      explain_hi: (rs, n) => `${rs.map((r) => r.heartRate).join(', ')} BPM की हृदय गति सामान्य 60–100 BPM सीमा से बाहर थी (${n} में से ${rs.length} रीडिंग)।`,
      next: 'Sit and rest for a few minutes before checking. Talk to your doctor if this continues or you feel dizzy or breathless.',
      next_hi: 'जांचने से पहले कुछ मिनट शांत बैठें और आराम करें। यदि यह जारी रहे या सांस फूले तो डॉक्टर से बात करें।'
    });
    vitalRule({
      id: 'spo2', field: 'spo2', label: 'oxygen level', Label: 'Oxygen level (SpO2)', label_hi: 'ऑक्सीजन स्तर (SpO2)', Label_hi: 'ऑक्सीजन स्तर (SpO2)', icon: 'wind', singleAlert: true,
      classify: (r) => Vitals.spo2(r.spo2),
      explain: (rs, n) => `SpO2 of ${rs.map((r) => r.spo2 + '%').join(', ')} was below the usual 95% or above (${rs.length} of ${n} readings).`,
      explain_hi: (rs, n) => `${rs.map((r) => r.spo2 + '%').join(', ')} का SpO2 स्तर सामान्य 95% से कम था (${n} में से ${rs.length} रीडिंग)।`,
      next: 'Make sure your hands are warm and you are sitting still when measuring. If it stays low or you feel breathless, contact your doctor promptly.',
      next_hi: 'नापते समय हाथ गर्म रखें और शांत बैठें। यदि यह कम बना रहे या सांस लेने में परेशानी हो तो तुरंत डॉक्टर से संपर्क करें।'
    });
    vitalRule({
      id: 'temp', field: 'temp', label: 'temperature', Label: 'Temperature', label_hi: 'तापमान', Label_hi: 'तापमान', icon: 'thermometer', singleAlert: true,
      classify: (r) => Vitals.temp(r.temp),
      explain: (rs, n) => `Temperature of ${rs.map((r) => r.temp + '°F').join(', ')} was outside the usual range (${rs.length} of ${n} readings).`,
      explain_hi: (rs, n) => `${rs.map((r) => r.temp + '°F').join(', ')} का तापमान सामान्य सीमा से बाहर था (${n} में से ${rs.length} रीडिंग)।`,
      next: 'Drink fluids and rest. If the temperature stays high or you feel unwell, please contact your doctor.',
      next_hi: 'पानी व तरल पदार्थ पिएं और आराम करें। यदि तापमान अधिक बना रहे तो कृपया डॉक्टर से संपर्क करें।'
    });

    /* Weight change over 14 days */
    const wRows = data.records.filter((r) => r.weight != null && U.daysBetween(U.parseDT(r.datetime), now) <= 14)
      .sort((a, b) => a.datetime.localeCompare(b.datetime));
    if (wRows.length >= 2) {
      const diff = +(wRows[wRows.length - 1].weight - wRows[0].weight).toFixed(1);
      if (Math.abs(diff) >= 2) add({
        id: 'weight', category: 'health', icon: 'scale', status: 'attention',
        issue: `Weight ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} kg`,
        issue_hi: `वजन दो सप्ताह में ${Math.abs(diff)} किग्रा ${diff > 0 ? 'बढ़ा' : 'घटा'} है`,
        explanation: `Your weight changed from ${wRows[0].weight} kg to ${wRows[wRows.length - 1].weight} kg in about two weeks.`,
        explanation_hi: `लगभग दो सप्ताह में आपका वजन ${wRows[0].weight} किग्रा से बदलकर ${wRows[wRows.length - 1].weight} किग्रा हो गया।`,
        when: U.parseDT(wRows[wRows.length - 1].datetime),
        next: 'Sudden weight change is worth mentioning to your doctor at your next visit.',
        next_hi: 'अचानक वजन में बदलाव के बारे में अगली मुलाकात में डॉक्टर को अवश्य बताएं।'
      });
    }

    /* 3. Appointments */
    const missedAppts = data.appointments.filter((a) => {
      const age = U.daysBetween(U.parseDate(a.date), now);
      return age >= 0 && age <= 30 && (a.status === 'missed' || (a.status === 'upcoming' && Store.apptDate(a) < U.addDays(now, -1)));
    });
    if (missedAppts.length) {
      const a = missedAppts[0];
      add({
        id: 'appt-missed', category: 'appointment', icon: 'calendar', status: 'attention',
        issue: missedAppts.length > 1 ? `${missedAppts.length} appointments missed recently` : 'Missed doctor appointment',
        issue_hi: missedAppts.length > 1 ? `हाल ही में ${missedAppts.length} अपॉइंटमेंट छूट गए` : 'डॉक्टर का अपॉइंटमेंट छूट गया',
        explanation: `${a.purpose || 'Appointment'} with ${a.doctor} on ${U.fmtMed(U.parseDate(a.date))} was not attended${missedAppts.length > 1 ? ', along with other recent appointments' : ''}.`,
        explanation_hi: `${U.fmtMed(U.parseDate(a.date))} को ${a.doctor} के साथ ${a.purpose || 'अपॉइंटमेंट'} में उपस्थित नहीं हो सके।`,
        when: Store.apptDate(a),
        next: `Call ${a.hospital || 'the clinic'} to book a new date. Your caregiver can help you with this.`,
        next_hi: `${a.hospital || 'क्लीनिक'} को कॉल करके नई तारीख लें। आपका देखभालकर्ता इसमें आपकी मदद कर सकता है।`
      });
    }
    const soon = Store.upcomingAppointments().find((a) => U.daysBetween(now, U.parseDate(a.date)) <= 3);
    if (soon) add({
      id: 'appt-soon', category: 'appointment', icon: 'calendar', status: 'normal',
      issue: `Appointment ${U.relDay(soon.date).toLowerCase()}`,
      issue_hi: `अपॉइंटमेंट ${U.relDay(soon.date).toLowerCase() === 'today' ? 'आज है' : 'निकट है'}`,
      explanation: `${soon.doctor}${soon.specialty ? ' (' + soon.specialty + ')' : ''} at ${U.fmtTime(soon.time)}, ${soon.hospital}. Purpose: ${soon.purpose || '—'}.`,
      explanation_hi: `${soon.doctor}${soon.specialty ? ' (' + soon.specialty + ')' : ''} के साथ ${U.fmtTime(soon.time)} पर, ${soon.hospital} में। उद्देश्य: ${soon.purpose || '—'}।`,
      when: Store.apptDate(soon),
      next: 'Keep your medicine list and recent readings ready. Plan your travel and ask your caregiver to come along if needed.',
      next_hi: 'दवाइयों की सूची और हाल की रीडिंग तैयार रखें। जरूरत पड़ने पर अपने देखभालकर्ता को साथ ले जाएं।'
    });

    /* 4. Activity */
    const acts = prev7.map((d) => ({ d, a: Store.activity(d), has: !!data.activities[d] })).filter((x) => x.has);
    if (acts.length >= 3) {
      const avgWalk = Math.round(acts.reduce((s, x) => s + (x.a.walk || 0), 0) / acts.length);
      add(avgWalk < g.walk * 0.5 ? {
        id: 'walk', category: 'activity', icon: 'walk', status: 'attention',
        issue: 'Low physical activity this week',
        issue_hi: 'इस सप्ताह कम शारीरिक गतिविधि',
        explanation: `You walked about ${avgWalk} minutes a day on average, which is less than half of your ${g.walk}-minute goal.`,
        explanation_hi: `आप औसतन प्रतिदिन ${avgWalk} मिनट चले, जो आपके ${g.walk} मिनट के लक्ष्य के आधे से भी कम है।`,
        when: now, next: 'Try short 10-minute walks after meals, at a comfortable pace. Ask your doctor what level of activity is right for you.',
        next_hi: 'भोजन के बाद आरामदायक गति से 10 मिनट टहलने का प्रयास करें। डॉक्टर से पूछें कि कितनी गतिविधि आपके लिए सही है।'
      } : {
        id: 'walk-ok', category: 'activity', icon: 'walk', status: 'normal',
        issue: 'Staying active',
        issue_hi: 'सक्रिय दिनचर्या',
        explanation: `You walked about ${avgWalk} minutes a day on average this week (goal: ${g.walk} minutes).`,
        explanation_hi: `आप इस सप्ताह औसतन प्रतिदिन ${avgWalk} मिनट चले (लक्ष्य: ${g.walk} मिनट)।`,
        when: now, next: avgWalk >= g.walk ? 'Great work – keep it up!' : 'A short extra walk each day will help you reach your goal.',
        next_hi: avgWalk >= g.walk ? 'बहुत बढ़िया – इसे जारी रखें!' : 'रोज़ाना थोड़ी अतिरिक्त सैर आपको अपने लक्ष्य तक पहुँचाने में मदद करेगी।'
      });

      /* 5. Sleep */
      const sleeps = acts.filter((x) => x.a.sleep != null);
      if (sleeps.length) {
        const avgSleep = +(sleeps.reduce((s, x) => s + x.a.sleep, 0) / sleeps.length).toFixed(1);
        const poor = sleeps.filter((x) => x.a.sleep < 6);
        add(poor.length >= 3 || avgSleep < 5.5 ? {
          id: 'sleep', category: 'sleep', icon: 'moon', status: avgSleep < 5 ? 'alert' : 'attention',
          issue: `Poor sleep on ${U.plural(poor.length, 'night')}`,
          issue_hi: `पिछली ${poor.length} रातों में कम नींद आई`,
          explanation: `You slept less than 6 hours on ${poor.length} of the last ${sleeps.length} nights (average ${avgSleep} hours). Your goal is ${g.sleep} hours.`,
          explanation_hi: `आप पिछली ${sleeps.length} रातों में से ${poor.length} रातों में 6 घंटे से कम सोए (औसत ${avgSleep} घंटे)। आपका लक्ष्य ${g.sleep} घंटे है।`,
          when: U.dateTime(poor[0] ? poor[0].d : today, '07:00'),
          next: 'Try going to bed at the same time each night and avoid tea or coffee in the evening. Mention ongoing sleep trouble to your doctor.',
          next_hi: 'प्रतिदिन एक ही समय पर सोने की कोशिश करें और शाम को चाय या कॉफी से बचें। नींद की समस्या बनी रहे तो डॉक्टर को बताएं।'
        } : {
          id: 'sleep-ok', category: 'sleep', icon: 'moon', status: 'normal',
          issue: 'Sleep looks regular',
          issue_hi: 'नींद नियमित और अच्छी है',
          explanation: `You slept about ${avgSleep} hours a night on average this week.`,
          explanation_hi: `आप इस सप्ताह औसतन प्रति रात लगभग ${avgSleep} घंटे सोए।`,
          when: now, next: 'Keep a regular bedtime routine.',
          next_hi: 'सोने की नियमित दिनचर्या बनाए रखें।'
        });
      }

      /* 6. Water */
      const avgWater = +(acts.reduce((s, x) => s + (x.a.water || 0), 0) / acts.length).toFixed(1);
      add(avgWater < g.water * 0.6 ? {
        id: 'water', category: 'water', icon: 'droplet', status: 'attention',
        issue: 'Low water intake this week',
        issue_hi: 'इस सप्ताह पानी कम पिया गया',
        explanation: `You drank about ${avgWater} glasses a day on average, below your goal of ${g.water} glasses.`,
        explanation_hi: `आपने औसतन प्रतिदिन ${avgWater} गिलास पानी पिया, जो आपके ${g.water} गिलास के लक्ष्य से कम है।`,
        when: now, next: 'Keep a bottle of water nearby and take a few sips every hour. Check with your doctor if you have been told to limit fluids.',
        next_hi: 'पास में पानी की बोतल रखें और हर घंटे कुछ घूंट पिएं। यदि आपको पानी सीमित करने को कहा गया है तो डॉक्टर की सलाह लें।'
      } : {
        id: 'water-ok', category: 'water', icon: 'droplet', status: 'normal',
        issue: 'Drinking enough water',
        issue_hi: 'पर्याप्त पानी पी रहे हैं',
        explanation: `You drank about ${avgWater} glasses a day on average this week (goal: ${g.water}).`,
        explanation_hi: `आपने इस सप्ताह औसतन प्रतिदिन ${avgWater} गिलास पानी पिया (लक्ष्य: ${g.water} गिलास)।`,
        when: now, next: 'Keep sipping water through the day.',
        next_hi: 'दिन भर समय-समय पर पानी पीते रहें।'
      });

      /* Meals */
      const skipped = acts.reduce((s, x) => s + ['breakfast', 'lunch', 'dinner'].filter((k) => !x.a.meals[k]).length, 0);
      if (skipped >= 3) add({
        id: 'meals', category: 'activity', icon: 'utensils', status: 'attention',
        issue: `${skipped} main meals skipped this week`,
        issue_hi: `इस सप्ताह ${skipped} मुख्य भोजन छूटे हैं`,
        explanation: 'Regular meals help keep blood sugar and energy steady, especially when taking medicines.',
        explanation_hi: 'नियमित भोजन रक्त शर्करा और ऊर्जा को स्थिर रखता है, विशेष रूप से दवाइयाँ लेते समय।',
        when: now, next: 'Try to eat breakfast, lunch and dinner at regular times. Your caregiver can help plan simple meals.',
        next_hi: 'नाश्ता, दोपहर और रात का भोजन नियमित समय पर करने का प्रयास करें। आपका देखभालकर्ता सरल भोजन की योजना बनाने में मदद कर सकता है।'
      });
    }

    /* Today's water (evening check) */
    const ta = Store.activity(today);
    if (now.getHours() >= 18 && ta.water < g.water * 0.5) add({
      id: 'water-today', category: 'water', icon: 'droplet', status: 'attention',
      issue: 'Low water intake today',
      issue_hi: 'आज पानी का सेवन कम रहा है',
      explanation: `You have recorded ${ta.water} of ${g.water} glasses today.`,
      explanation_hi: `आपने आज ${g.water} में से केवल ${ta.water} गिलास पानी दर्ज किया है।`,
      when: now, next: 'Drink a glass of water now if you can.',
      next_hi: 'यदि संभव हो तो अभी एक गिलास पानी पिएं।'
    });

    insights.sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || b.when - a.when);
    const counts = { normal: 0, attention: 0, alert: 0 };
    insights.forEach((i) => counts[i.status]++);
    return { insights, counts, overall: worst(insights.map((i) => i.status)), adherence, analysedAt: now };
  },

  summary(data = Store.data, date = U.ymd()) {
    const doses = Store.dosesFor(date);
    const taken = doses.filter((d) => d.status === 'taken').length;
    const missed = doses.filter((d) => d.status === 'missed').length;
    const pending = doses.length - taken - missed;
    const bpR = Store.latest('bpSys', date);
    const hrR = Store.latest('heartRate', date);
    const sugarR = Store.latest('sugar', date);
    const spo2R = Store.latest('spo2', date);
    const a = Store.activity(date);
    const g = data.goals;
    const isToday = date === U.ymd();

    const vitalStatuses = [
      bpR && Vitals.bp(bpR.bpSys, bpR.bpDia),
      hrR && Vitals.heartRate(hrR.heartRate),
      sugarR && Vitals.sugar(sugarR.sugar, sugarR.sugarType),
      spo2R && Vitals.spo2(spo2R.spo2)
    ].filter(Boolean);
    const vitalState = worst(vitalStatuses);

    let opening;
    if (!vitalStatuses.length) opening = `No health readings were recorded ${isToday ? 'today yet' : 'on this day'}.`;
    else if (vitalState === 'normal') opening = `Your recorded health information looks stable ${isToday ? 'today' : 'on this day'}.`;
    else if (vitalState === 'attention') opening = 'Most of your readings look fine, but one is slightly outside the usual range.';
    else opening = 'Some of your readings are outside the usual range – it may be worth sharing them with your doctor.';

    const clauses = [];
    if (missed === 1) clauses.push('you missed one medicine');
    else if (missed > 1) clauses.push(`you missed ${missed} medicines`);
    else if (doses.length && !pending) clauses.push('you took all your medicines');
    if (isToday && pending) clauses.push(`${U.plural(pending, 'medicine')} ${pending === 1 ? 'is' : 'are'} still to be taken`);

    if (a.water >= g.water) clauses.push('you reached your water goal');
    else if (g.water - a.water <= 2) clauses.push('your water intake is slightly below your goal');
    else clauses.push('your water intake is below your goal');

    if (a.sleep != null && a.sleep < 6) clauses.push('you slept less than usual');
    if (a.walk >= g.walk) clauses.push('you reached your walking goal');

    const picked = clauses.slice(0, 3);
    let second = '';
    if (picked.length) {
      const s = picked.length > 1 ? picked.slice(0, -1).join(', ') + ' and ' + picked[picked.length - 1] : picked[0];
      second = ' ' + s.charAt(0).toUpperCase() + s.slice(1) + '.';
    }

    const status = worst([vitalState, missed ? 'attention' : 'normal']);
    return {
      date, doses, taken, missed, pending, bpR, hrR, sugarR, spo2R, activity: a, goals: g,
      text: opening + second, status
    };
  }
};
