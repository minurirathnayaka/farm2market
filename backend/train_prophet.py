import os
import pandas as pd
from prophet import Prophet
import joblib

# -----------------------
# Paths (EC2 safe)
# -----------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "prophet_ready.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
FORECAST_PATH = os.path.join(
    BASE_DIR, "data", "forecast_big_onion_narahenpita.csv"
)

# -----------------------
# Config (edit as needed)
# -----------------------

VEG = "big_onion"
MARKET = "narahenpita"
PLOT = True  # set False on servers

# -----------------------
# Trainer
# -----------------------

def main():
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = pd.read_csv(DATA_PATH)
    df["ds"] = pd.to_datetime(df["ds"])

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False
    )

    model.fit(df)

    model_filename = f"{VEG}_{MARKET}.pkl"
    model_path = os.path.join(MODEL_DIR, model_filename)
    joblib.dump(model, model_path)

    future = model.make_future_dataframe(periods=14)
    forecast = model.predict(future)

    forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].to_csv(
        FORECAST_PATH,
        index=False
    )

    print("Training complete.")
    print("Model saved to:", model_path)
    print("Forecast saved to:", FORECAST_PATH)

    if PLOT:
        import matplotlib.pyplot as plt

        plt.figure(figsize=(10, 5))
        plt.plot(df["ds"], df["y"], label="Actual")
        plt.plot(
            forecast["ds"],
            forecast["yhat"],
            label="Predicted",
            linestyle="--"
        )
        plt.legend()
        plt.title(f"{VEG} Price Prediction ({MARKET})")
        plt.tight_layout()
        plt.show()


if __name__ == "__main__":
    main()
