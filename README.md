# ASHA – AI Smart Health Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-blue.svg)](#accessibility--elderly-first-ux)
[![Language: English & Hindi](https://img.shields.io/badge/Language-English%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A4%BE-orange.svg)](#-bilingual-support-english--hindi)

**ASHA** (*आशा* / Hope) is an accessible, elderly-first, bilingual web application designed to support seniors in managing their day-to-day health routines and fostering seamless communication with their caregivers.

Built with an offline-first architecture, ASHA combines daily medicine schedules, vitals monitoring, appointment tracking, rule-based AI insights, and bidirectional voice capabilities (Speech-to-Text & Text-to-Speech) in both English and Hindi.

---

## 🌟 Key Features

### 🌐 Bilingual Support (English & हिंदी)
- **One-Tap Language Switcher**: Easily toggle between English and Hindi from the top navigation shell.
- **Full UI & AI Localization**: All navigation items, forms, alerts, medical summaries, and AI pattern analyses adapt dynamically based on the selected language.
- **Localized Voice Synthesis (TTS)**: Utterances are articulated using native Indian speech profiles (`en-IN` for English, `hi-IN` for Hindi) with clear pacing for elderly listeners.

### 🎙️ Elder Voice-to-Text & Mic Inputs
- **Accessible Voice Dictation**: Prominent $\ge 48\text{px} \times 48\text{px}$ touch-target mic buttons throughout the app.
- **Browser-Native Web Speech API**: Uses `SpeechRecognition` / `webkitSpeechRecognition` with real-time visual pulsating feedback (`"Listening... बोलिए"`).
- **Smart Health Parsing**:
  - Dictating *"paani piya"* or *"drank water"* automatically increments the hydration counter.
  - Dictating blood pressure numbers (e.g., *"BP 120 by 80"*) auto-populates the systolic and diastolic vital fields.
- **Graceful Fallbacks**: Provides helpful user feedback in case of unsupported browsers or microphone permission prompts.

### 📢 Elder Voice Updates to Caregiver
- **Dashboard Voice Message Card**: Seniors can dictate a message about their well-being and click **"Send to Caregiver"** (`संदेश भेजें`).
- **Caregiver Dashboard Integration**: Caregivers immediately see the latest dictated update with timestamps and an audio **Listen (`सुनें`)** button for voice playback.

### 🧠 Intelligent AI Health Insights
- **7-Day Trend Analysis**: Synthesizes records, dose compliance, appointment attendance, sleep, and hydration levels.
- **Categorized Wellness Classification**:
  - `Normal` / `सामान्य`
  - `Attention` / `ध्यान दें`
  - `Needs Review` / `समीक्षा आवश्यक`
- **Actionable Steps**: Provides clear, non-jargon suggestions (e.g., resting before re-testing BP, hydration reminders).
- **Full Hindi Voice Support**: Reads out health findings and suggested next steps completely in Hindi when Hindi is active.

### 💊 Medicine Tracking & Caregiver Management
- **Daily Dose Log**: Mark doses as taken or missed with progress bars and reminders.
- **Caregiver Collaboration**: Caregivers can view schedules and click **"+ Add Medicine"** (`+ दवा जोड़ें`) directly from the Caregiver view.
- **Change Notifications**: Automatically notifies the senior when a caregiver updates or adds medication.

### 📊 Health Records & Interactive Charts
- Log vital metrics: Blood Pressure (Sys/Dia), Blood Sugar (Fasting/Post-meal), Heart Rate (BPM), SpO2 (%), Temperature (°F), and Weight (kg).
- Color-coded clinical ranges with visual indicator tags and historical trend charts.

### 🚨 Emergency SOS & Caregiver Quick-Contact
- High-visibility Emergency button in the header and sidebar.
- Instant access to primary caregiver details, emergency contacts, and direct dialing for **108 Emergency Medical Services**.

---

## ♿ Elderly-First UX & Design Principles

- **Accessible Typography**: Uses Atkinson Hyperlegible and Plus Jakarta Sans with customizable font sizing (`Normal`, `Large`, `Extra Large`).
- **Target Sizes**: All buttons, inputs, and interactive icons comply with WCAG 2.1 touch target minimums ($\ge 48\text{px} \times 48\text{px}$).
- **High-Contrast Palette**: Calming, high-contrast teal and slate color system with distinct status tokens (Red/Amber/Green).
- **No Overwhelming Modals or Menus**: Clear feedback via screen-reader-friendly banners, accessible aria tags, and polite toast announcements.

---

## 📁 Project Structure

```text
Asha-AI smart health assistant/
│
├── index.html              # Main application shell & topbar navigation
├── README.md               # Project documentation
│
├── assets/
│   └── logo.svg            # Vector brand icon and logo
│
├── css/
│   └── styles.css          # Core design system, responsive layout & animations
│
└── js/
    ├── icons.js            # Feather-based accessible SVG icon definitions
    ├── store.js            # LocalStorage state management, notification engine & schema
    ├── ai.js               # Rule-based AI analyzer, bilingual insight generation & vitals evaluator
    ├── charts.js           # Lightweight Canvas-based vitals trend visualizations
    └── app.js              # Application routing, views, Web Speech API handlers & UI logic
```

---

## 🚀 Getting Started

ASHA is built with vanilla web standards and requires no heavy build tools, transpilers, or external runtime dependencies.

### Option 1: Run with Any Local Static Server

#### Using Python:
```bash
# Python 3.x
python -m http.server 8000
```
Then visit `http://localhost:8000` in Google Chrome or Microsoft Edge.

#### Using Node.js (`npx serve`):
```bash
npx serve .
```

#### Using VS Code Live Server:
Right-click `index.html` and select **"Open with Live Server"**.

> **Note for Voice Features**: Modern browsers require either `http://localhost` or a secure `https://` context to grant Microphone permissions for the Web Speech API.

---

## 👥 User Roles & Demo Access

ASHA supports two primary role perspectives:

1. **Elder (Patient)**:
   - Access to personal dashboard, voice logger, medicine reminders, hydration tracker, vitals history, and AI insights.
2. **Caregiver**:
   - Access to caregiver overview, today's elder voice messages, medication adherence rings, recent vital tables, AI alerts, and medicine management.

You can switch roles via the demo credentials on the login screen or explore using the sample profile.

---

## 🔒 Privacy & Offline Storage

- All medical records, activity metrics, and voice transcripts are stored locally in the browser's `localStorage`.
- No user health data is transmitted to external telemetry servers.

---

## ⚕️ Medical Disclaimer

ASHA is an informational health companion and routine-tracking aid. **It does not provide medical diagnosis, clinical treatment plans, or emergency triage.** All insights are based on general wellness guidelines. Users must always consult certified medical practitioners for clinical advice. In life-threatening emergencies, call **108** immediately.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
