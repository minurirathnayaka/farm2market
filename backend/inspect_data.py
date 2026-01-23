import pandas as pd

df = pd.read_csv("../data/final_dataset.csv")

print("Shape:", df.shape)
print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 5 rows:")
print(df.head())

df["date"] = pd.to_datetime(df["date"])

print("\nDate range:")
print(df["date"].min(), "→", df["date"].max())

print("\nVegetables:")
print(df["name"].nunique())

print("\nMarkets:")
print(df["market"].nunique())

print("\nMissing values:")
print(df.isna().sum())
