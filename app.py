"""
EcoTrack - Carbon Footprint Awareness Platform
Flask backend with carbon calculation engine and activity tracking.
"""

from flask import Flask, render_template, request, jsonify, session
from datetime import datetime, timedelta
import json
import uuid
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)

# ── Carbon Emission Factors (kg CO2e per unit) ──
EMISSION_FACTORS = {
    "transport": {
        "car_petrol": 0.21,      # per km
        "car_diesel": 0.17,
        "car_electric": 0.05,
        "bus": 0.089,
        "train": 0.041,
        "flight_domestic": 0.255, # per km
        "flight_international": 0.195,
        "bicycle": 0.0,
        "walking": 0.0,
        "motorcycle": 0.113,
    },
    "energy": {
        "electricity": 0.82,     # per kWh (India grid avg)
        "natural_gas": 2.0,      # per cubic meter
        "lpg": 2.98,             # per kg
        "solar": 0.05,
    },
    "food": {
        "red_meat": 27.0,        # per kg
        "poultry": 6.9,
        "fish": 6.1,
        "dairy": 3.2,
        "vegetables": 2.0,
        "fruits": 1.1,
        "grains": 1.4,
        "processed": 5.0,
    },
    "shopping": {
        "clothing": 10.0,       # per item avg
        "electronics": 50.0,
        "furniture": 30.0,
        "groceries": 2.5,       # per trip
        "online_order": 3.5,    # per package
    },
}

# Average annual footprint per capita (tonnes CO2e)
GLOBAL_AVG = 4.0
INDIA_AVG = 1.9
US_AVG = 15.5

TIPS = [
    {
        "icon": "🚲", "title": "Switch to cycling",
        "desc": "Replace short car trips with cycling. A 5km daily bike commute saves ~300 kg CO2/year.",
        "impact": "Save 300 kg/year", "bg": "rgba(59,130,246,0.12)",
        "category": "transport"
    },
    {
        "icon": "💡", "title": "Switch to LED bulbs",
        "desc": "LED bulbs use 75% less energy than incandescent. Switch all bulbs to save significantly.",
        "impact": "Save 100 kg/year", "bg": "rgba(245,158,11,0.12)",
        "category": "energy"
    },
    {
        "icon": "🥗", "title": "Eat more plant-based meals",
        "desc": "Replacing beef with plant proteins just 3 days a week cuts your food footprint by 25%.",
        "impact": "Save 500 kg/year", "bg": "rgba(34,197,94,0.12)",
        "category": "food"
    },
    {
        "icon": "🛍️", "title": "Buy second-hand",
        "desc": "Second-hand clothing has 82% lower carbon impact than new. Try thrift stores first!",
        "impact": "Save 150 kg/year", "bg": "rgba(168,85,247,0.12)",
        "category": "shopping"
    },
    {
        "icon": "🌡️", "title": "Optimize AC temperature",
        "desc": "Setting AC to 24°C instead of 20°C reduces energy use by up to 30% in summer.",
        "impact": "Save 200 kg/year", "bg": "rgba(239,68,68,0.12)",
        "category": "energy"
    },
    {
        "icon": "🚆", "title": "Take the train",
        "desc": "Trains emit 80% less CO2 than flights for the same journey. Choose rail when possible.",
        "impact": "Save 600 kg/trip", "bg": "rgba(14,184,166,0.12)",
        "category": "transport"
    },
    {
        "icon": "📦", "title": "Consolidate deliveries",
        "desc": "Grouping online orders into fewer deliveries reduces packaging waste and transport emissions.",
        "impact": "Save 50 kg/year", "bg": "rgba(132,204,22,0.12)",
        "category": "shopping"
    },
    {
        "icon": "☀️", "title": "Use solar energy",
        "desc": "A rooftop solar panel system can eliminate 80% of household electricity emissions.",
        "impact": "Save 1.5 tonnes/yr", "bg": "rgba(251,191,36,0.12)",
        "category": "energy"
    },
]


def init_session():
    """Initialize session data if not present."""
    if "activities" not in session:
        session["activities"] = []
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())[:8]


@app.route("/")
def index():
    """Main page."""
    init_session()
    return render_template("index.html", tips=TIPS)


@app.route("/api/calculate", methods=["POST"])
def calculate_footprint():
    """Calculate carbon footprint from form data."""
    data = request.json
    breakdown = {}
    total = 0.0

    # Transport
    transport_co2 = 0.0
    mode = data.get("transport_mode", "car_petrol")
    km_per_day = float(data.get("transport_km", 0))
    factor = EMISSION_FACTORS["transport"].get(mode, 0.15)
    transport_co2 = km_per_day * factor * 365
    breakdown["Transport"] = round(transport_co2, 1)
    total += transport_co2

    # Energy
    energy_co2 = 0.0
    kwh = float(data.get("electricity_kwh", 0))
    energy_source = data.get("energy_source", "electricity")
    e_factor = EMISSION_FACTORS["energy"].get(energy_source, 0.82)
    energy_co2 = kwh * e_factor * 12  # monthly to yearly
    breakdown["Energy"] = round(energy_co2, 1)
    total += energy_co2

    # Food
    food_co2 = 0.0
    diet = data.get("diet_type", "mixed")
    diet_factors = {
        "vegan": 1.5, "vegetarian": 1.7,
        "mixed": 2.5, "heavy_meat": 3.3
    }
    food_co2 = diet_factors.get(diet, 2.5) * 365
    breakdown["Food"] = round(food_co2, 1)
    total += food_co2

    # Shopping
    shop_co2 = 0.0
    shopping_freq = data.get("shopping_freq", "moderate")
    shop_factors = {"minimal": 200, "moderate": 500, "frequent": 1000, "heavy": 1800}
    shop_co2 = shop_factors.get(shopping_freq, 500)
    breakdown["Shopping"] = round(shop_co2, 1)
    total += shop_co2

    total_tonnes = round(total / 1000, 2)

    # Determine rating
    if total_tonnes <= 2:
        rating = "Excellent"
        color = "#22c55e"
    elif total_tonnes <= 4:
        rating = "Good"
        color = "#84cc16"
    elif total_tonnes <= 8:
        rating = "Average"
        color = "#f59e0b"
    elif total_tonnes <= 12:
        rating = "High"
        color = "#f97316"
    else:
        rating = "Very High"
        color = "#ef4444"

    comparison = round((total_tonnes / GLOBAL_AVG) * 100 - 100, 0)
    comp_text = (
        f"{abs(int(comparison))}% {'below' if comparison < 0 else 'above'} "
        f"global average ({GLOBAL_AVG}t)"
    )

    # Generate personalized insights
    insights = generate_insights(breakdown, total_tonnes, data)

    return jsonify({
        "total_kg": round(total, 1),
        "total_tonnes": total_tonnes,
        "breakdown": breakdown,
        "rating": rating,
        "rating_color": color,
        "comparison": comp_text,
        "insights": insights,
    })


def generate_insights(breakdown, total_tonnes, data):
    """Generate personalized tips based on user's data."""
    insights = []
    sorted_cats = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)
    top = sorted_cats[0][0] if sorted_cats else "Transport"

    if top == "Transport":
        mode = data.get("transport_mode", "car_petrol")
        if mode.startswith("car"):
            insights.append({
                "icon": "🚌", "title": "Try public transport 2 days/week",
                "desc": f"Switching from {mode.replace('_', ' ')} to bus for 2 days could save ~{int(breakdown['Transport'] * 0.3)} kg CO2/year."
            })
        insights.append({
            "icon": "🏠", "title": "Work from home when possible",
            "desc": "Each WFH day eliminates your commute emissions entirely."
        })

    if top == "Energy":
        insights.append({
            "icon": "⚡", "title": "Switch to a green energy provider",
            "desc": "Renewable energy can cut your electricity emissions by up to 90%."
        })
        insights.append({
            "icon": "🌡️", "title": "Improve home insulation",
            "desc": "Better insulation reduces heating/cooling energy by 25-40%."
        })

    if top == "Food":
        diet = data.get("diet_type", "mixed")
        if diet in ("mixed", "heavy_meat"):
            insights.append({
                "icon": "🌿", "title": "Try Meatless Mondays",
                "desc": "One meat-free day per week can save ~200 kg CO2 annually."
            })
        insights.append({
            "icon": "🥬", "title": "Buy local & seasonal produce",
            "desc": "Local food travels less, cutting transport emissions by up to 50%."
        })

    if top == "Shopping":
        insights.append({
            "icon": "♻️", "title": "Adopt a minimalist approach",
            "desc": "Buying less and choosing quality over quantity drastically cuts emissions."
        })

    insights.append({
        "icon": "🌱", "title": "Plant trees to offset",
        "desc": f"To offset your {total_tonnes}t footprint, plant ~{int(total_tonnes * 15)} trees/year."
    })

    return insights[:4]


@app.route("/api/log", methods=["POST"])
def log_activity():
    """Log a daily activity."""
    init_session()
    data = request.json
    category = data.get("category", "transport")
    activity = data.get("activity", "")
    value = float(data.get("value", 0))

    # Calculate CO2 for this activity
    cat_factors = EMISSION_FACTORS.get(category, {})
    factor = cat_factors.get(activity, 0.5)
    co2 = round(value * factor, 2)

    entry = {
        "id": str(uuid.uuid4())[:8],
        "category": category,
        "activity": activity.replace("_", " ").title(),
        "value": value,
        "co2_kg": co2,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M"),
    }

    activities = session.get("activities", [])
    activities.insert(0, entry)
    session["activities"] = activities[:50]  # Keep last 50

    return jsonify({"status": "ok", "entry": entry, "activities": session["activities"]})


@app.route("/api/activities", methods=["GET"])
def get_activities():
    """Get logged activities."""
    init_session()
    return jsonify({"activities": session.get("activities", [])})


@app.route("/api/weekly", methods=["GET"])
def weekly_summary():
    """Get weekly summary for chart."""
    init_session()
    activities = session.get("activities", [])
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekly = {d: 0 for d in days}

    today = datetime.now()
    for act in activities:
        try:
            act_date = datetime.strptime(act["date"], "%Y-%m-%d")
            diff = (today - act_date).days
            if diff < 7:
                day_name = act_date.strftime("%a")
                if day_name in weekly:
                    weekly[day_name] += act["co2_kg"]
        except (ValueError, KeyError):
            continue

    return jsonify({
        "labels": days,
        "values": [round(weekly[d], 2) for d in days],
    })


@app.route("/api/tips", methods=["GET"])
def get_tips():
    """Return eco tips, optionally filtered."""
    category = request.args.get("category", "all")
    if category == "all":
        return jsonify({"tips": TIPS})
    filtered = [t for t in TIPS if t["category"] == category]
    return jsonify({"tips": filtered})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
