# India Mobility Intelligence — Desktop Analytics

Executive-level analytics application for passenger movement and revenue across Indian metropolitan cities (Bengaluru, Chennai, Hyderabad, Mumbai, Delhi, Pune, Kolkata, Jaipur) and four transportation modes: **Bus**, **Car**, **Train**, and **Airplane**.

## Quickstart (Streamlit Desktop)

1. Ensure Python 3.9+ is installed.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the desktop application:
   ```bash
   streamlit run app.py
   ```
4. Run analytical test suite:
   ```bash
   python test_analytics.py
   ```

## Accounting Principles

- **Ticket Revenue**: Directly received by transit providers (Buses, Indian Railways, Airlines).
- **Private Car Outlay**: Strictly isolated from operator revenue as consumer road travel expenditure (fuel ~₹7/km + FASTag tolls ~₹2/km).
