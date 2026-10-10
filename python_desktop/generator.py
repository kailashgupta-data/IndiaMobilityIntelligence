"""
India Mobility Intelligence - Synthetic Data Generator (Python)
Generates 365 days of realistic intercity passenger movement and revenue data.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

CORRIDORS = [
    {"origin": "Bengaluru", "destination": "Chennai", "road_km": 348, "air_km": 290},
    {"origin": "Bengaluru", "destination": "Hyderabad", "road_km": 569, "air_km": 505},
    {"origin": "Mumbai", "destination": "Pune", "road_km": 149, "air_km": 120},
    {"origin": "Delhi", "destination": "Jaipur", "road_km": 281, "air_km": 235},
    {"origin": "Chennai", "destination": "Hyderabad", "road_km": 628, "air_km": 520},
    {"origin": "Mumbai", "destination": "Delhi", "road_km": 1420, "air_km": 1148},
    {"origin": "Delhi", "destination": "Kolkata", "road_km": 1530, "air_km": 1305},
    {"origin": "Bengaluru", "destination": "Mumbai", "road_km": 984, "air_km": 842},
]

HOLIDAYS = [
    {"name": "Diwali", "date": "2025-11-01", "days": 6, "mult": 1.95},
    {"name": "Christmas / New Year", "date": "2025-12-25", "days": 8, "mult": 1.50},
    {"name": "Pongal / Sankranti", "date": "2026-01-14", "days": 4, "mult": 1.65},
    {"name": "Holi", "date": "2026-03-04", "days": 3, "mult": 1.55},
    {"name": "Eid-ul-Fitr", "date": "2026-03-21", "days": 3, "mult": 1.45},
    {"name": "Summer Peak", "date": "2026-05-15", "days": 14, "mult": 1.38},
]

def generate_mobility_dataset(seed=42, day_count=365, start_date_str="2025-10-15") -> pd.DataFrame:
    np.random.seed(seed)
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    records = []

    modes = ["Bus", "Car", "Train", "Airplane"]

    for d in range(day_count):
        cur_date = start_date + timedelta(days=d)
        date_str = cur_date.strftime("%Y-%m-%d")
        dow = cur_date.weekday() # 0 Mon, 6 Sun
        is_weekend = dow in [5, 6]

        # Holiday check
        is_holiday = False
        holiday_name = None
        holiday_mult = 1.0
        for h in HOLIDAYS:
            h_dt = datetime.strptime(h["date"], "%Y-%m-%d")
            diff = (cur_date - h_dt).days
            if -1 <= diff <= h["days"]:
                is_holiday = True
                holiday_name = h["name"]
                dist_factor = max(0.6, 1.0 - abs(diff) * 0.12)
                holiday_mult = 1.0 + (h["mult"] - 1.0) * dist_factor
                break

        for corr in CORRIDORS:
            for orig, dest, direction in [(corr["origin"], corr["destination"], "Outbound"),
                                         (corr["destination"], corr["origin"], "Inbound")]:
                route_id = f"{orig[:3].upper()}-{dest[:3].upper()}"
                dist_km = corr["road_km"]

                base_vol = 14000
                if corr["origin"] == "Mumbai" and corr["destination"] == "Pune":
                    base_vol = 32000
                elif corr["origin"] == "Bengaluru" and corr["destination"] == "Chennai":
                    base_vol = 24000
                elif corr["origin"] == "Mumbai" and corr["destination"] == "Delhi":
                    base_vol = 26000

                dir_mult = 1.22 if (dow == 4 and direction == "Outbound") else (1.28 if (dow == 6 and direction == "Inbound") else 1.0)
                tot_demand = int(base_vol * holiday_mult * dir_mult * np.random.uniform(0.92, 1.08))

                # Modal share
                if dist_km <= 200:
                    shares = {"Car": 0.42, "Bus": 0.28, "Train": 0.27, "Airplane": 0.03}
                elif dist_km <= 400:
                    shares = {"Train": 0.38, "Bus": 0.26, "Car": 0.24, "Airplane": 0.12}
                elif dist_km <= 700:
                    shares = {"Train": 0.40, "Airplane": 0.28, "Bus": 0.20, "Car": 0.12}
                else:
                    shares = {"Airplane": 0.52, "Train": 0.42, "Bus": 0.04, "Car": 0.02}

                for m in modes:
                    pax = max(80, int(tot_demand * shares[m] * np.random.uniform(0.94, 1.06)))
                    ticket_rev = 0
                    car_exp = 0
                    trips = 0
                    cap = 0
                    avg_fare_or_exp = 0

                    if m == "Bus":
                        trips = max(2, int(np.ceil(pax / 36)))
                        cap = trips * 42
                        fare_km = 1.85 * (1.35 if is_holiday else (1.15 if is_weekend else 1.0))
                        avg_fare_or_exp = int(dist_km * fare_km * np.random.uniform(0.96, 1.04))
                        ticket_rev = pax * avg_fare_or_exp
                    elif m == "Car":
                        trips = max(5, int(pax / 2.95))
                        cap = int(trips * 4.5)
                        avg_fare_or_exp = int(dist_km * 3.10 * np.random.uniform(0.96, 1.04))
                        car_exp = pax * avg_fare_or_exp # Private road outlay isolated
                    elif m == "Train":
                        trips = max(2, int(np.ceil(pax / 980)))
                        cap = trips * 1100
                        fare_km = 1.45 * (1.20 if is_holiday else 1.0)
                        avg_fare_or_exp = int(dist_km * fare_km * np.random.uniform(0.96, 1.04))
                        ticket_rev = pax * avg_fare_or_exp
                    elif m == "Airplane":
                        trips = max(1, int(np.ceil(pax / 165)))
                        cap = trips * 186
                        base_air = 3200 + corr["air_km"] * 3.4
                        air_mult = 1.55 if is_holiday else (1.18 if is_weekend else 1.0)
                        avg_fare_or_exp = int(base_air * air_mult * np.random.uniform(0.95, 1.05))
                        ticket_rev = pax * avg_fare_or_exp

                    records.append({
                        "id": f"{date_str}_{route_id}_{m}_{direction}",
                        "date": date_str,
                        "origin": orig,
                        "destination": dest,
                        "route_id": route_id,
                        "direction": direction,
                        "mode": m,
                        "passengers": pax,
                        "trips": trips,
                        "avg_fare_or_exp": avg_fare_or_exp,
                        "ticket_revenue": ticket_rev,
                        "car_expenditure": car_exp,
                        "total_value": ticket_rev + car_exp,
                        "capacity": cap,
                        "occupancy_rate": min(1.0, pax / max(1, cap)),
                        "is_holiday": is_holiday,
                        "holiday_name": holiday_name,
                        "is_weekend": is_weekend
                    })

    return pd.DataFrame(records)

if __name__ == "__main__":
    df = generate_mobility_dataset(42, 30)
    print(f"Generated {len(df)} sample rows successfully. Columns: {list(df.columns)}")
