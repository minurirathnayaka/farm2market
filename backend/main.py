import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# -----------------------
# Paths
# -----------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# -----------------------
# App
# -----------------------

app = FastAPI(
    title="Veg Price Prediction API",
    version="2.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# In-memory model cache
# -----------------------

MODEL_CACHE = {}

# -----------------------
# Utilities
# -----------------------

def get_model_path(veg: str, market: str) -> str:
    filename = f"{veg}_{market}.pkl".replace(" ", "_")
    return os.path.join(MODEL_DIR, filename)


def load_model(model_path: str):
    if model_path in MODEL_CACHE:
        return MODEL_CACHE[model_path]

    try:
        model = joblib.load(model_path)
        MODEL_CACHE[model_path] = model
        return model
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load model: {str(e)}"
        )

# -----------------------
# Routes
# -----------------------

@app.get("/")
def root():
    return {"status": "API running"}

@app.get("/models")
def list_models():
    if not os.path.exists(MODEL_DIR):
        return {"count": 0, "models": []}

    models = [
        f.replace(".pkl", "")
        for f in os.listdir(MODEL_DIR)
        if f.endswith(".pkl")
    ]

    return {
        "count": len(models),
        "models": models
    }

@app.get("/predict")
def predict(
    veg: str = Query(..., description="Vegetable key (exact)"),
    market: str = Query(..., description="Market key (exact)"),
    start: str = Query(..., description="Start date YYYY-MM-DD"),
    end: str = Query(..., description="End date YYYY-MM-DD")
):
    model_path = get_model_path(veg, market)

    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model not found for veg='{veg}' and market='{market}'"
        )

    # Parse dates
    try:
        start_date = pd.to_datetime(start)
        end_date = pd.to_datetime(end)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    if end_date <= start_date:
        raise HTTPException(
            status_code=400,
            detail="end must be after start"
        )

    days = (end_date - start_date).days

    if days > 180:
        raise HTTPException(
            status_code=400,
            detail="Maximum forecast range is 180 days"
        )

    model = load_model(model_path)

    try:
        future = model.make_future_dataframe(
            periods=days + 1,
            freq="D"
        )
        forecast = model.predict(future)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

    result = (
        forecast[
            (forecast["ds"] >= start_date) &
            (forecast["ds"] <= end_date)
        ][["ds", "yhat", "yhat_lower", "yhat_upper"]]
        .round(2)
    )

    return {
        "vegetable": veg,
        "market": market,
        "start": start,
        "end": end,
        "days": len(result),
        "predictions": result.to_dict(orient="records")
    }
