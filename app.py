"""
EcoTrack — Carbon Footprint Awareness Platform
Flask backend with Groq AI insights, activity tracking, streaks & badges.
"""

from flask import Flask, render_template, request, jsonify, session
from datetime import datetime
import json
import uuid
import os

from groq import Groq

app = Flask(__name__)
app.secret_key = os.urandom(24)

# ── Groq client ──
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

# ── Carbon Emission Factors (kg CO2e per unit) ──
EMISSION_FACTORS = {
    "transport": {
        "car_petrol": 0.21,
        "car_diesel": 0.17,
        "car_electric": 0.05,
        "bus": 0.089,
        "train": 0.041,
        "flight_domestic": 0.255,
        "flight_international": 0.195,
        "bicycle": 0.0,
        "walking": 0.0,
        "motorcycle": 0.113,
    },
    "energy": {
        "electricity": 0.82,
        "natural_gas": 2.0,
        "lpg": 2.98,
        "solar": 0.05,
    },
    "food": {
        "red_meat": 27.0,
        "poultry": 6.9,
        "fish": 6.1,
        "dairy": 3.2,
        "vegetables": 2.0,
        "fruits": 1.1,
        "grains": 1.4,
        "processed": 5.0,
    },
    "shopping": {
        "clothing": 10.0,
        "electronics": 50.0,
        "furniture": 30.0,
        "groceries": 2.5,
        "online_order": 3.5,
    },
}

GLOBAL_AVG = 4.0
INDIA_AVG = 1.9
US_AVG = 15.5

TIPS = [
    {"icon": "🚲", "title": "Switch to cycling", "desc": "Replace short car trips with cycling. A 5km daily bike commute saves ~300 kg CO2/year.", "impact": "Save 300 kg/year", "bg": "rgba(59,130,246,0.12)", "category": "transport"},
    {"icon": "💡", "title": "Switch to LED bulbs", "desc": "LED bulbs use 75% less energy than incandescent. Switch all bulbs to save significantly.", "impact": "Save 100 kg/year", "bg": "rgba(245,158,11,0.12)", "category": "energy"},
    {"icon": "🥗", "title": "Eat more plant-based meals", "desc": "Replacing beef with plant proteins just 3 days a week cuts your food footprint by 25%.", "impact": "Save 500 kg/year", "bg": "rgba(34,197,94,0.12)", "category": "food"},
    {"icon": "🛍️", "title": "Buy second-hand", "desc": "Second-hand clothing has 82% lower carbon impact than new. Try thrift stores first!", "impact": "Save 150 kg/year", "bg": "rgba(168,85,247,0.12)", "category": "shopping"},
    {"icon": "🌡️", "title": "Optimize AC temperature", "desc": "Setting AC to 24°C instead of 20°C reduces energy use by up to 30% in summer.", "impact": "Save 200 kg/year", "bg": "rgba(239,68,68,0.12)", "category": "energy"},
    {"icon": "🚆", "title": "Take the train", "desc": "Trains emit 80% less CO2 than flights for the same journey. Choose rail when possible.", "impact": "Save 600 kg/trip", "bg": "rgba(14,184,166,0.12)", "category": "transport"},
    {"icon": "📦", "title": "Consolidate deliveries", "desc": "Grouping online orders into fewer deliveries reduces packaging waste and transport emissions.", "impact": "Save 50 kg/year", "bg": "rgba(132,204,22,0.12)", "category": "shopping"},
    {"icon": "☀️", "title": "Use solar energy", "desc": "A rooftop solar panel system can eliminate 80% of household electricity emissions.", "impact": "Save 1.5 tonnes/yr", "bg": "rgba(251,191,36,0.12)", "category": "energy"},
]

# ── Badge definitions ──
BADGE_DEFS = {
    "first_log":    {"name": "First Log",    "icon": "🌱", "desc": "Logged your first activity"},
    "week_warrior": {"name": "Week Warrior",  "icon": "🔥", "desc": "7-day logging streak"},
    "low_carbon":   {"name": "Low Carbon",    "icon": "🏅", "desc": "Footprint under 2 tonnes"},
    "plant_based":  {"name": "Plant Based",   "icon": "🥬", "desc": "5 veggie/vegan food logs"},
    "cycle_hero":   {"name": "Cycle Hero",    "icon": "🚴", "desc": "3 bicycle transport logs"},
}


def init_session():
    """Initialize session data if not present."""
    if "activities" not in session:
        session["activities"] = []
    if "user_id" not in session:
        session["user_id"] = str(uuid.uuid4())[:8]
    if "streak" not in session:
        session["streak"] = 0
    if "badges" not in session:
        session["badges"] = []
    if "last_log_date" not in session:
        session["last_log_date"] = ""
    if "chat_history" not in session:
        session["chat_history"] = []
    if "last_footprint" not in session:
        session["last_footprint"] = None


# ── Routes ──

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
    mode = data.get("transport_mode", "car_petrol")
    km_per_day = float(data.get("transport_km", 0))
    factor = EMISSION_FACTORS["transport"].get(mode, 0.15)
    transport_co2 = km_per_day * factor * 365
    breakdown["Transport"] = round(transport_co2, 1)
    total += transport_co2

    # Energy
    kwh = float(data.get("electricity_kwh", 0))
    energy_source = data.get("energy_source", "electricity")
    e_factor = EMISSION_FACTORS["energy"].get(energy_source, 0.82)
    energy_co2 = kwh * e_factor * 12
    breakdown["Energy"] = round(energy_co2, 1)
    total += energy_co2

    # Food
    diet = data.get("diet_type", "mixed")
    diet_factors = {"vegan": 1.5, "vegetarian": 1.7, "mixed": 2.5, "heavy_meat": 3.3}
    food_co2 = diet_factors.get(diet, 2.5) * 365
    breakdown["Food"] = round(food_co2, 1)
    total += food_co2

    # Shopping
    shopping_freq = data.get("shopping_freq", "moderate")
    shop_factors = {"minimal": 200, "moderate": 500, "frequent": 1000, "heavy": 1800}
    shop_co2 = shop_factors.get(shopping_freq, 500)
    breakdown["Shopping"] = round(shop_co2, 1)
    total += shop_co2

    total_tonnes = round(total / 1000, 2)

    if total_tonnes <= 2:
        rating, color = "Excellent", "#22c55e"
    elif total_tonnes <= 4:
        rating, color = "Good", "#84cc16"
    elif total_tonnes <= 8:
        rating, color = "Average", "#f59e0b"
    elif total_tonnes <= 12:
        rating, color = "High", "#f97316"
    else:
        rating, color = "Very High", "#ef4444"

    comparison = round((total_tonnes / GLOBAL_AVG) * 100 - 100, 0)
    comp_text = (
        f"{abs(int(comparison))}% {'below' if comparison < 0 else 'above'} "
        f"global average ({GLOBAL_AVG}t)"
    )

    # Save to session for chat / compare
    init_session()
    session["last_footprint"] = {
        "breakdown": breakdown,
        "total_tonnes": total_tonnes,
        "transport_mode": data.get("transport_mode"),
        "diet_type": data.get("diet_type"),
        "energy_source": data.get("energy_source"),
    }

    # Check low_carbon badge
    if total_tonnes < 2 and "low_carbon" not in session.get("badges", []):
        badges = session.get("badges", [])
        badges.append("low_carbon")
        session["badges"] = badges

    # Generate insights (AI with fallback)
    insights = generate_insights_ai(breakdown, total_tonnes, data)

    return jsonify({
        "total_kg": round(total, 1),
        "total_tonnes": total_tonnes,
        "breakdown": breakdown,
        "rating": rating,
        "rating_color": color,
        "comparison": comp_text,
        "insights": insights,
    })


def generate_insights_ai(breakdown, total_tonnes, data):
    """Generate insights via Groq LLaMA 3.3, with rule-based fallback."""
    try:
        system_prompt = (
            "You are EcoTrack's AI climate advisor. You give warm, specific, actionable "
            "carbon reduction advice for Indian users. Always be encouraging, never preachy. "
            "Output ONLY a valid JSON array of exactly 4 objects, each with keys: "
            "icon (single emoji), title (max 6 words), desc (1-2 sentences, specific to "
            "the user's data), saving (e.g. 'Save ~300 kg/year'). "
            "No preamble, no markdown, no explanation — raw JSON only."
        )
        user_msg = (
            f"User footprint breakdown (kg CO2/year): {json.dumps(breakdown)}. "
            f"Total: {total_tonnes} tonnes. "
            f"Transport mode: {data.get('transport_mode')}. "
            f"Diet: {data.get('diet_type')}. "
            f"Energy source: {data.get('energy_source')}. "
            f"Location: India. Generate 4 personalised reduction tips."
        )
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.7,
            max_tokens=600,
        )
        raw = resp.choices[0].message.content.strip()
        insights = json.loads(raw)
        if isinstance(insights, list) and len(insights) >= 1:
            return insights[:4]
    except Exception:
        pass
    return generate_insights_fallback(breakdown, total_tonnes, data)


def generate_insights_fallback(breakdown, total_tonnes, data):
    """Rule-based fallback insights."""
    insights = []
    sorted_cats = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)
    top = sorted_cats[0][0] if sorted_cats else "Transport"

    if top == "Transport":
        mode = data.get("transport_mode", "car_petrol")
        if mode.startswith("car"):
            insights.append({
                "icon": "🚌", "title": "Try public transport",
                "desc": f"Switching from {mode.replace('_', ' ')} to bus for 2 days could save ~{int(breakdown['Transport'] * 0.3)} kg CO2/year.",
                "saving": f"Save ~{int(breakdown['Transport'] * 0.3)} kg/year"
            })
        insights.append({
            "icon": "🏠", "title": "Work from home",
            "desc": "Each WFH day eliminates your commute emissions entirely.",
            "saving": "Save ~200 kg/year"
        })
    if top == "Energy":
        insights.append({
            "icon": "⚡", "title": "Switch to green energy",
            "desc": "Renewable energy can cut your electricity emissions by up to 90%.",
            "saving": "Save ~800 kg/year"
        })
        insights.append({
            "icon": "🌡️", "title": "Improve insulation",
            "desc": "Better insulation reduces heating/cooling energy by 25-40%.",
            "saving": "Save ~300 kg/year"
        })
    if top == "Food":
        insights.append({
            "icon": "🌿", "title": "Try Meatless Mondays",
            "desc": "One meat-free day per week can save ~200 kg CO2 annually.",
            "saving": "Save ~200 kg/year"
        })
        insights.append({
            "icon": "🥬", "title": "Buy local produce",
            "desc": "Local food travels less, cutting transport emissions by up to 50%.",
            "saving": "Save ~150 kg/year"
        })
    if top == "Shopping":
        insights.append({
            "icon": "♻️", "title": "Adopt minimalism",
            "desc": "Buying less and choosing quality over quantity drastically cuts emissions.",
            "saving": "Save ~400 kg/year"
        })

    insights.append({
        "icon": "🌱", "title": "Plant trees to offset",
        "desc": f"To offset your {total_tonnes}t footprint, plant ~{int(total_tonnes * 45)} trees/year.",
        "saving": f"Offset {total_tonnes}t/year"
    })
    return insights[:4]


@app.route("/api/log", methods=["POST"])
def log_activity():
    """Log a daily activity with streak & badge tracking."""
    init_session()
    data = request.json
    category = data.get("category", "transport")
    activity = data.get("activity", "")
    value = float(data.get("value", 0))

    cat_factors = EMISSION_FACTORS.get(category, {})
    factor = cat_factors.get(activity, 0.5)
    co2 = round(value * factor, 2)

    today_str = datetime.now().strftime("%Y-%m-%d")
    entry = {
        "id": str(uuid.uuid4())[:8],
        "category": category,
        "activity": activity.replace("_", " ").title(),
        "activity_raw": activity,
        "value": value,
        "co2_kg": co2,
        "date": today_str,
        "time": datetime.now().strftime("%H:%M"),
    }

    activities = session.get("activities", [])
    activities.insert(0, entry)
    session["activities"] = activities[:50]

    # ── Streak logic ──
    last_date = session.get("last_log_date", "")
    if last_date == today_str:
        pass  # already logged today
    elif last_date:
        try:
            last_dt = datetime.strptime(last_date, "%Y-%m-%d")
            today_dt = datetime.strptime(today_str, "%Y-%m-%d")
            diff = (today_dt - last_dt).days
            if diff == 1:
                session["streak"] = session.get("streak", 0) + 1
            elif diff > 1:
                session["streak"] = 1
        except ValueError:
            session["streak"] = 1
    else:
        session["streak"] = 1
    session["last_log_date"] = today_str

    # ── Badge checks ──
    new_badges = []
    badges = session.get("badges", [])

    # first_log
    if "first_log" not in badges:
        badges.append("first_log")
        new_badges.append("first_log")

    # week_warrior
    if session.get("streak", 0) >= 7 and "week_warrior" not in badges:
        badges.append("week_warrior")
        new_badges.append("week_warrior")

    # plant_based — 5 food logs with vegetable or vegan
    if "plant_based" not in badges:
        plant_count = sum(
            1 for a in session["activities"]
            if a["category"] == "food" and
            any(kw in a.get("activity_raw", "").lower() for kw in ("vegetable", "vegetables", "vegan"))
        )
        if plant_count >= 5:
            badges.append("plant_based")
            new_badges.append("plant_based")

    # cycle_hero — 3 bicycle logs
    if "cycle_hero" not in badges:
        cycle_count = sum(
            1 for a in session["activities"]
            if a["category"] == "transport" and a.get("activity_raw", "") == "bicycle"
        )
        if cycle_count >= 3:
            badges.append("cycle_hero")
            new_badges.append("cycle_hero")

    session["badges"] = badges

    return jsonify({
        "status": "ok",
        "entry": entry,
        "activities": session["activities"],
        "streak": session.get("streak", 0),
        "new_badges": new_badges,
    })


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
            if (today - act_date).days < 7:
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


@app.route("/api/compare", methods=["POST"])
def compare_footprint():
    """Compare user's footprint against benchmarks."""
    data = request.json
    total_tonnes = float(data.get("total_tonnes", 0))
    percentile = max(5, min(95, (1 - total_tonnes / 5) * 100))
    return jsonify({
        "user": round(total_tonnes, 2),
        "global_avg": GLOBAL_AVG,
        "india_avg": INDIA_AVG,
        "us_avg": US_AVG,
        "target_2c": 2.0,
        "percentile_india": round(percentile, 0),
        "trees_to_offset": round(total_tonnes * 45),
        "flights_equivalent": round(total_tonnes / 0.255),
        "car_km_equivalent": round(total_tonnes * 4400),
    })


@app.route("/api/ai-chat", methods=["POST"])
def ai_chat():
    """AI chat endpoint with rolling conversation history."""
    init_session()
    data = request.json
    user_message = data.get("message", "").strip()
    context = data.get("context", session.get("last_footprint", {}))

    if not user_message:
        return jsonify({"reply": "Please type a message to get started!"})

    system_prompt = (
        "You are EcoTrack's friendly AI climate coach. "
        f"The user's carbon data: {json.dumps(context) if context else 'not yet calculated'}. "
        "Give concise, warm, India-specific advice in 2-3 sentences max. "
        "Never use bullet points."
    )

    history = session.get("chat_history", [])
    history.append({"role": "user", "content": user_message})
    # Keep last 6 messages
    if len(history) > 6:
        history = history[-6:]

    messages = [{"role": "system", "content": system_prompt}] + history

    try:
        resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=200,
        )
        reply = resp.choices[0].message.content.strip()
    except Exception:
        reply = "I'm having trouble connecting right now. Try again in a moment!"

    history.append({"role": "assistant", "content": reply})
    if len(history) > 6:
        history = history[-6:]
    session["chat_history"] = history

    return jsonify({"reply": reply})


@app.route("/api/badges", methods=["GET"])
def get_badges():
    """Return earned badges and streak."""
    init_session()
    return jsonify({
        "badges": session.get("badges", []),
        "streak": session.get("streak", 0),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
