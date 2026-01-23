import os
import pandas as pd
from prophet import Prophet
import joblib

# -----------------------
# Paths (EC2 safe)
# -----------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "final_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")

# -----------------------
# Trainer
# -----------------------

def main():
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = pd.read_csv(DATA_PATH)
    df["date"] = pd.to_datetime(df["date"])

    vegetables = df["name"].unique()
    markets = df["market"].unique()

    for market in markets:
        for veg in vegetables:
            df_f = df[(df["name"] == veg) & (df["market"] == market)].copy()

            if len(df_f) < 60:
                continue  # skip tiny series

            # Aggregate duplicate dates
            df_f = (
                df_f.groupby("date", as_index=False)
                .agg({"price": "mean"})
                .sort_values("date")
            )

            # Create full daily range
            full_dates = pd.date_range(
                start=df_f["date"].min(),
                end=df_f["date"].max(),
                freq="D"
            )

            df_f = df_f.set_index("date").reindex(full_dates)
            df_f.index.name = "ds"

            # Interpolate missing values
            df_f["y"] = df_f["price"].interpolate()

            prophet_df = df_f[["y"]].reset_index()

            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False
            )

            model.fit(prophet_df)

            filename = f"{veg}_{market}.pkl".replace(" ", "_")
            model_path = os.path.join(MODEL_DIR, filename)

            joblib.dump(model, model_path)

            print("Trained:", filename)

    print("All models trained successfully.")


if __name__ == "__main__":
    main()
