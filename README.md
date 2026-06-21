# EcoTrack — Carbon Footprint Awareness Platform

A web app that helps individuals understand, track, and reduce their carbon footprint through AI-powered insights and personalized recommendations.

## ✨ Features

- **AI-Powered Insights** — Personalized carbon reduction tips via Groq LLaMA 3.3 70B
- **Carbon Calculator** — Estimate annual footprint across transport, energy, food & shopping
- **Activity Tracker** — Log daily activities and visualize weekly emission trends
- **Streak & Badge System** — Stay motivated with daily streaks and achievement badges
- **Comparison Dashboard** — See how you stack up against India, global & US averages
- **AI Chat Coach** — Conversational climate advisor for India-specific guidance

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **AI**: Groq SDK + LLaMA 3.3 70B Versatile
- **Charts**: Chart.js
- **Frontend**: Vanilla JS + CSS (no frameworks)
- **Storage**: Flask session

## ⚡ Quick Start

```bash
git clone https://github.com/DhruvkrSharma/EcoTrack-Carbon-Footprint
cd EcoTrack-Carbon-Footprint
pip install -r requirements.txt
export GROQ_API_KEY=your_key_here
python app.py
# Open http://localhost:5000
```

## 🌍 Emission Factors

Calibrated for Indian context — uses India grid average of 0.82 kg CO₂/kWh (CEA 2023). Transport, food, and shopping factors sourced from DEFRA, IPCC, and lifecycle assessment databases.

## 📁 Project Structure

```
EcoTrack-Carbon-Footprint/
├── app.py              # Flask backend — routes, Groq AI, carbon engine
├── requirements.txt    # Python dependencies
├── README.md           # Documentation
├── templates/
│   └── index.html      # Single-page Jinja2 template
└── static/
    ├── style.css       # Design system
    └── script.js       # Frontend logic
```

## 🏆 Built for H2S PromptWars Challenge 3
