let chart

document.getElementById('predictBtn').addEventListener('click', loadPrediction)

async function loadPrediction() {
  const veg = document.getElementById('vegSelect').value
  const market = document.getElementById('marketSelect').value

  const res = await fetch(`/predict?vegetable=${veg}&market=${market}`)
  const data = await res.json()

  const ctx = document.getElementById('priceChart')

  if (chart) chart.destroy()

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels || ['Day 1','Day 2','Day 3','Day 4','Day 5'],
      datasets: [{
        label: `${veg} price in ${market}`,
        data: data.prices,
        borderWidth: 2
      }]
    }
  })
}
