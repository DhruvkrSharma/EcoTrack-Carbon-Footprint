# 🌿 EcoTrack — Carbon Footprint Awareness Platform

> **Helping individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.**

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)

---

## 🎯 Problem Statement

Climate change is one of the most pressing challenges of our time, yet most people don't know the size of their personal carbon footprint or what practical steps they can take to reduce it. EcoTrack bridges this gap by making carbon awareness **simple, visual, and actionable**.

## ✨ Features

### 🌍 Carbon Footprint Calculator
- Estimate your annual CO₂ emissions across **4 lifestyle categories**: Transportation, Home Energy, Diet, and Shopping
- Powered by scientifically-sourced emission factors (IPCC, EPA, DEFRA data)
- Animated circular gauge with real-time results
- Visual breakdown bars showing contribution per category
- Rating system (Excellent → Very High) with comparison against global average (4.0 tonnes/year)

### 💡 Personalized Insights
- AI-style recommendations generated based on your **highest-emission category**
- Actionable tips with specific kg CO₂ savings potential
- Tree planting offset calculations personalized to your footprint

### 📊 Daily Activity Tracker
- Log daily activities across transport, energy, food, and shopping
- Instant CO₂ calculation per activity using scientific emission factors
- Weekly bar chart visualization of emission trends
- Session-persistent log of last 50 activities

### 🌱 Eco Tips Gallery
- 8 curated high-impact tips with estimated annual savings
- Categorized by lifestyle area (transport, energy, food, shopping)
- Backed by real-world impact data

### ✋ Green Pledge
- Community pledge counter to commit to 10% annual reduction
- Collective CO₂ savings tracker

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.12 + Flask 3.1 |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Templating** | Jinja2 |
| **Styling** | Custom CSS — dark glassmorphism theme, gradients, animations |
| **Data Storage** | Flask session (server-side) |
| **Fonts** | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |

## 📁 Project Structure

```
EcoTrack-Carbon-Footprint/
├── app.py                    # Flask backend — routes, carbon engine, insights
├── requirements.txt          # Python dependencies
├── README.md                 # Project documentation
├── templates/
│   └── index.html            # Main Jinja2 template (single-page app)
└── static/
    ├── css/
    │   └── style.css         # Design system — tokens, components, animations
    └── js/
        └── app.js            # Frontend logic — calculator, tracker, charts
```

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/DhruvkrSharma/EcoTrack-Carbon-Footprint.git
cd EcoTrack-Carbon-Footprint

# Install dependencies
pip install -r requirements.txt

# Run the application
python3 app.py
```

Open **http://127.0.0.1:5000** in your browser.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serve main application page |
| `POST` | `/api/calculate` | Calculate annual carbon footprint from lifestyle data |
| `POST` | `/api/log` | Log a daily carbon-emitting activity |
| `GET` | `/api/activities` | Retrieve logged activities |
| `GET` | `/api/weekly` | Get weekly emission summary for chart |
| `GET` | `/api/tips` | Get eco tips (optional `?category=` filter) |

### Example — Calculate Footprint

```bash
curl -X POST http://127.0.0.1:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "transport_mode": "car_petrol",
    "transport_km": 20,
    "energy_source": "electricity",
    "electricity_kwh": 150,
    "diet_type": "mixed",
    "shopping_freq": "moderate"
  }'
```

## 📐 Emission Factors

Emission factors used in calculations are sourced from:

| Category | Source | Unit |
|----------|--------|------|
| Transport | DEFRA 2023 Conversion Factors | kg CO₂e per km |
| Energy | India CEA Grid Emission Factor | kg CO₂e per kWh |
| Food | Our World in Data / Poore & Nemecek (2018) | kg CO₂e per kg |
| Shopping | EPA / average lifecycle assessments | kg CO₂e per item |

## 🎨 Design Philosophy

- **Dark Mode First** — Eco-themed dark interface with green accent palette
- **Glassmorphism** — Frosted glass card effects with subtle borders
- **Micro-Animations** — Scroll reveals, hover effects, animated counters and gauges
- **Responsive** — Fully adaptive layout for mobile, tablet, and desktop
- **Accessibility** — Semantic HTML5, proper labels, keyboard navigation support

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with 💚 for a greener future
</p>
