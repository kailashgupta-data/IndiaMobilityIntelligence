"""
India Mobility Intelligence - Desktop Streamlit Application
Interactive Executive Analytics Dashboard for Intercity Passenger Movement & Revenue.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from generator import generate_mobility_dataset

st.set_page_config(
    page_title="India Mobility Intelligence",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for Desktop UI
st.markdown("""
<style>
    .metric-card {
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 16px;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data(seed=42):
    return generate_mobility_dataset(seed=seed, day_count=365)

df = load_data()

# Sidebar Navigation & Filters
st.sidebar.title("🧭 India Mobility")
st.sidebar.caption("Executive Desktop Analytics")

page = st.sidebar.radio(
    "Navigation",
    ["Executive Overview", "Passenger Movement", "Mode Analytics", "Holiday Intelligence", "Revenue Intelligence", "Data Explorer"]
)

# Global Filters in Sidebar
st.sidebar.subheader("Filter Corridors")
all_cities = sorted(list(set(df["origin"].unique()).union(set(df["destination"].unique()))))
selected_origin = st.sidebar.selectbox("Origin City", ["All"] + all_cities)
selected_dest = st.sidebar.selectbox("Destination City", ["All"] + all_cities)
selected_mode = st.sidebar.selectbox("Transport Mode", ["All", "Bus", "Car", "Train", "Airplane"])
selected_day_type = st.sidebar.selectbox("Day Type", ["All", "Weekday", "Weekend", "Holiday"])

# Filter DataFrame
filtered_df = df.copy()
if selected_origin != "All":
    filtered_df = filtered_df[filtered_df["origin"] == selected_origin]
if selected_dest != "All":
    filtered_df = filtered_df[filtered_df["destination"] == selected_dest]
if selected_mode != "All":
    filtered_df = filtered_df[filtered_df["mode"] == selected_mode]
if selected_day_type == "Weekday":
    filtered_df = filtered_df[~filtered_df["is_weekend"]]
elif selected_day_type == "Weekend":
    filtered_df = filtered_df[filtered_df["is_weekend"]]
elif selected_day_type == "Holiday":
    filtered_df = filtered_df[filtered_df["is_holiday"]]

# Header
st.title("India Mobility Intelligence")
st.caption(f"Analyzing {len(filtered_df):,} intercity transit manifests across Indian metropolitan corridors")

# Page Routing
if page == "Executive Overview":
    tot_pax = filtered_df["passengers"].sum()
    ticket_rev = filtered_df["ticket_revenue"].sum()
    car_exp = filtered_df["car_expenditure"].sum()
    tot_trips = filtered_df["trips"].sum()
    comm_pax = filtered_df[filtered_df["mode"] != "Car"]["passengers"].sum()
    avg_yield = int(ticket_rev / comm_pax) if comm_pax > 0 else 0

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Passengers", f"{tot_pax:,}")
    col2.metric("Operator Ticket Revenue", f"₹{ticket_rev/1e7:.2f} Cr")
    col3.metric("Private Car Road Outlay", f"₹{car_exp/1e7:.2f} Cr", help="Isolated consumer expenditure")
    col4.metric("Avg Ticket Yield", f"₹{avg_yield:,} / pax")

    # Dual line chart
    daily = filtered_df.groupby("date").agg({"passengers": "sum", "ticket_revenue": "sum"}).reset_index()
    fig_time = px.line(daily, x="date", y="passengers", title="Daily Passenger Demand Timeseries", template="plotly_dark")
    st.plotly_chart(fig_time, use_container_width=True)

    c_left, c_right = st.columns(2)
    # Mode Pie
    mode_sum = filtered_df.groupby("mode")["passengers"].sum().reset_index()
    fig_pie = px.pie(mode_sum, names="mode", values="passengers", title="Transport Mode Share", hole=0.4, template="plotly_dark")
    c_left.plotly_chart(fig_pie, use_container_width=True)

    # Corridor Bar
    filtered_df["corridor"] = filtered_df["origin"] + " ↔ " + filtered_df["destination"]
    corr_sum = filtered_df.groupby("corridor")["passengers"].sum().reset_index().sort_values("passengers", ascending=False).head(6)
    fig_bar = px.bar(corr_sum, x="corridor", y="passengers", title="Top Metropolitan Corridors", template="plotly_dark")
    c_right.plotly_chart(fig_bar, use_container_width=True)

elif page == "Passenger Movement":
    st.subheader("Origin-Destination Matrix")
    od = filtered_df.pivot_table(index="origin", columns="destination", values="passengers", aggfunc="sum", fill_value=0)
    fig_heatmap = px.imshow(od, text_auto=True, color_continuous_scale="Viridis", template="plotly_dark")
    st.plotly_chart(fig_heatmap, use_container_width=True)

elif page == "Holiday Intelligence":
    st.subheader("Festival Travel Surges")
    hol_df = df[df["is_holiday"]].groupby("holiday_name")["passengers"].sum().reset_index().sort_values("passengers", ascending=False)
    fig_hol = px.bar(hol_df, x="holiday_name", y="passengers", title="Passenger Demand by Festival Window", template="plotly_dark")
    st.plotly_chart(fig_hol, use_container_width=True)

elif page == "Data Explorer":
    st.subheader("Granular Manifest Explorer")
    st.dataframe(filtered_df.head(200), use_container_width=True)
    csv = filtered_df.to_csv(index=False).encode('utf-8')
    st.download_button("Download Filtered CSV", csv, "india_mobility_data.csv", "text/csv")
