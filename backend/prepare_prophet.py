import os
import pandas as pd

# -----------------------
# Paths (EC2 safe)
# -----------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "final_dataset.csv")
OUTPUT_PATH = os.path.join(BASE_DIR, "data", "prophet_ready.csv")

# -----------------------
# Config (edit as needed)
# -----------------------

VEG = "big_onion_local"
MARKET = "narahenpita"

# -----------------------
# Prep
# -----------------------

def main():
    df = pd.read_csv(DATA_PATH)
    df["date"] = pd.to_datetime(df["date"])

    df_f = df[(df["name"] == VEG) & (df["market"] == MARKET)].copy()

    if df_f.empty:
        raise ValueError("No data found for given veg + market")

    df_f = df_f.sort_values("date")

    full_dates = pd.date_range(
        start=df_f["date"].min(),
        end=df_f["date"].max(),
        freq="D"
    )

    df_f = df_f.set_index("date").reindex(full_dates)
    df_f.index.name = "ds"

    df_f["y"] = df_f["price"].interpolate(method="linear")

    prophet_df = df_f[["y"]].reset_index()

    print(prophet_df.head())
    print(prophet_df.tail())
    print("Rows:", len(prophet_df))
    print("Missing y:", prophet_df["y"].isna().sum())

    prophet_df.to_csv(OUTPUT_PATH, index=False)
    print("Saved:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
