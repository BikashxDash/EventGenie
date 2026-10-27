# EventGenie ✨
> **GenAI-Powered Event Planning Assistant for Weddings, Birthdays, and Community Celebrations**

EventGenie is a modern web application that transforms high-level event concepts into comprehensive, culturally contextual, and financially balanced event blueprints using the Google Gemini API.

---

## 🚀 Phase 1 Features

- **Intuitive Intake Form**:
  - Event type selector with interactive cards (Wedding, Birthday, Community Event)
  - Date, City, Guest count, and INR budget inputs (with Lakh/Crore auto-formatting helper)
  - Vibe & theme selector (Royal & Grand, Modern & Chic, Traditional, etc.)
  - Cultural & dietary preference tags (Marwari, South Indian, Strictly Vegetarian, Jain, Halal, etc.)
  - Special notes & custom requests textarea
- **GenAI Event Generation (Gemini API)**:
  - Strict JSON schema enforcement via `@google/generative-ai` (`gemini-flash-latest` / `gemini-3.8-flash`)
  - Automatic model fallback and retry resilience
  - Generates:
    - **Event Summary**: Catchy title, personalized tagline, and key highlights
    - **Budget Split**: Percentage breakdown and exact INR allocations summing to user budget
    - **Timeline Plan**: Countdown milestones (T-90, T-60, etc.) with urgency badges
    - **Vendor Checklist**: Critical categories, screening questions, and required documents
    - **Personalized Ideas**: Themes, decor concepts, authentic menus, and engaging guest activities
- **Aesthetic Glassmorphic UI**:
  - Dark mode with dynamic ambient gradient orbs
  - Google Fonts typography (Outfit & Inter)
  - Animated step-by-step loading state
  - Responsive design across desktop and mobile

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Vanilla CSS Design System, Axios
- **Backend**: Node.js, Express, Google Generative AI SDK (`@google/generative-ai`)
- **AI Model**: Google Gemini (`gemini-flash-latest`)

---

## 📁 Project Structure

```
EventGenie/
├── backend/
│   ├── prompts/
│   │   └── intake.js          # System & user prompt definitions
│   ├── routes/
│   │   └── plan.js            # POST /api/plan with structured schema
│   ├── .env.example           # Environment template
│   ├── package.json
│   └── server.js              # Express server entry point (:4000)
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js      # Axios API client configured with /api proxy
│   │   ├── components/
│   │   │   ├── IntakeForm.jsx # Validated multi-field event intake
│   │   │   └── LoadingState.jsx # Dynamic progress & waiting animation
│   │   ├── pages/
│   │   │   └── Home.jsx       # State orchestration (idle, loading, result, error)
│   │   ├── App.jsx            # Ambient background orbs & shell
│   │   └── index.css          # Core design tokens, glassmorphism, animations
│   ├── index.html
│   ├── package.json
│   └── vite.config.js         # Vite configuration with proxy to backend (:4000)
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` and add your API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=4000
```
Start the backend server:
```bash
npm run dev
# or: node server.js
```
The backend will run at `http://localhost:4000`.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🗺️ Roadmap & Upcoming Phases

- [x] **Phase 1**: Event intake form + Gemini structured JSON plan generation
- [x] **Phase 2**: Interactive Budget Planner with Recharts pie chart, lockable categories & editable sliders
- [x] **Phase 3**: Countdown Timeline view with calendar integration & task completion
- [x] **Phase 4**: Vendor management checklist with status tracking (Not Contacted / Quoted / Booked)
- [x] **Phase 5**: Personalized Ideas (5 per section, regeneration, favorites) + AI Co-Planner Chat Assistant with live plan modification & Undo
- [ ] **Phase 6**: PDF export & client presentation ready mode

---

## 💡 Phase 5 Highlights: Ideas & AI Co-Planner

### 1. Personalized Ideas Hub
- **4 Rich Categories**: Thematic Concepts, Decor & Ambience, Catering & Menu, and Guest Activities & Entertainment.
- **Dietary Strictness**: Catering menu strictly adheres to dietary preferences (Pure Vegetarian, Jain, Vegan, Halal).
- **Per-Section Regeneration**: Independent `🔄 Regenerate` buttons call `/api/plan/regenerate-section` to refresh only specific sections.
- **Favorites & Persistence**: Star favorite ideas across categories, persisted in `localStorage` with a dedicated `⭐ Saved` filter.

### 2. Conversational AI Co-Planner
- **Active Plan Awareness**: Real-time context of budget allocations, countdown timeline, vendor quotes, and idea cards.
- **Structured Plan Mutations**: Executes real state updates, not just conversational text:
  - *"cut the budget by 20%"*: Proportionally scales category amounts and ensures exact mathematical consistency.
  - *"make it vegetarian"*: Updates dietary preference, regenerates catering ideas with gourmet vegetarian concepts, and adjusts catering notes.
  - *"move the event 2 weeks earlier"*: Recalculates event date, updates timeline milestones, triggers rush compression if needed.
- **Before/After Diff & Undo**: Displays structured comparison badges and an interactive `↩ Undo` button to immediately revert any change.
