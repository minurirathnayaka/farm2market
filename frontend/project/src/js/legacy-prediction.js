const API_BASE = "http://127.0.0.1:8000"; // change to EC2 IP later
let chart;

async function loadModels() {
    const res = await fetch(`${API_BASE}/models`);
    const data = await res.json();

    const vegSet = new Set();
    const marketSet = new Set();

    data.models.forEach(m => {
        const parts = m.split("_");
        const market = parts.pop();
        const veg = parts.join("_");

        vegSet.add(veg);
        marketSet.add(market);
    });

    vegSet.forEach(v => {
        document.getElementById("vegSelect")
            .add(new Option(v, v));
    });

    marketSet.forEach(m => {
        document.getElementById("marketSelect")
            .add(new Option(m, m));
    });
}

async function loadPrediction() {
    const veg = document.getElementById("vegSelect").value;
    const market = document.getElementById("marketSelect").value;

    const res = await fetch(
        `${API_BASE}/predict?veg=${veg}&market=${market}&days=14`
    );
    const data = await res.json();

    const labels = data.predictions.map(p => p.ds);
    const prices = data.predictions.map(p => p.yhat);

    if (chart) chart.destroy();

    const ctx = document.getElementById("priceChart").getContext("2d");
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: `${veg} (${market})`,
                data: prices,
                borderColor: "blue",
                fill: false
            }]
        }
    });
}

// init
loadModels();
