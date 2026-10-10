"""
Unit Tests for India Mobility Intelligence (Python / Pytest)
"""

import pytest
from generator import generate_mobility_dataset

def test_data_generation_dimensions():
    df = generate_mobility_dataset(seed=42, day_count=14)
    assert len(df) > 100
    assert not df["passengers"].isnull().any()
    assert (df["passengers"] >= 0).all()

def test_car_expenditure_isolation():
    df = generate_mobility_dataset(seed=42, day_count=7)
    car_rows = df[df["mode"] == "Car"]
    comm_rows = df[df["mode"] != "Car"]

    # Car must have 0 operator ticket revenue
    assert (car_rows["ticket_revenue"] == 0).all()
    assert (car_rows["car_expenditure"] > 0).all()

    # Commercial modes must have 0 car expenditure
    assert (comm_rows["car_expenditure"] == 0).all()
    assert (comm_rows["ticket_revenue"] > 0).all()

def test_holiday_surge_uplift():
    df = generate_mobility_dataset(seed=42, day_count=365)
    holiday_mean = df[df["is_holiday"]]["passengers"].mean()
    normal_mean = df[(~df["is_holiday"]) & (~df["is_weekend"])]["passengers"].mean()

    assert holiday_mean > normal_mean * 1.20, f"Expected >20% surge, got {holiday_mean / normal_mean}"

if __name__ == "__main__":
    test_data_generation_dimensions()
    test_car_expenditure_isolation()
    test_holiday_surge_uplift()
    print("All Python unit tests passed successfully!")
