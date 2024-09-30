Module.register("MMM-Nordpool", {
  defaults: {
    baseUrl: "https://www.hvakosterstrommen.no/api/v1/prices",
    updateInterval: 60 * 60 * 1000, // Oppdatering hver time
    displayCurrency: "NOK",
    region: "NO3"
  },

  start: function () {
    this.prices = null;
    this.chart = null;
    this.updatePrices();
    setInterval(() => {
      this.updatePrices();
    }, this.config.updateInterval);
  },

  getScripts: function () {
    return ["modules/MMM-Nordpool/node_modules/chart.js/dist/chart.umd.js"];
  },

  getStyles: function () {
    return ["nordpool.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    const canvas = document.createElement("canvas");
    canvas.id = "nordpoolChart";
    wrapper.appendChild(canvas);

    if (!this.prices) {
      wrapper.innerHTML += "<p>Laster strømpriser...</p>";
    } else if (this.prices.error) {
      wrapper.innerHTML = `<p>Feil: ${this.prices.error}</p>`;
    } else if (this.prices.length === 0) {
      wrapper.innerHTML = "<p>Ingen strømpriser tilgjengelig.</p>";
    }

    return wrapper;
  },

  updatePrices: function () {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Legg til ledende null
    const day = String(today.getDate()).padStart(2, '0'); // Legg til ledende null
    const formattedDate = `${year}/${month}-${day}`;
    const apiUrl = `${this.config.baseUrl}/${formattedDate}_${this.config.region}.json`;

    console.log("MMM-Nordpool: Oppdaterer priser fra API med dynamisk URL:", apiUrl);
    this.sendSocketNotification("GET_NORDPOOL_PRICES", { apiUrl: apiUrl });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NORDPOOL_PRICES") {
      this.prices = payload;
      console.log("MMM-Nordpool: Mottatte priser i socketNotificationReceived:", this.prices);
      this.updateDom(); // Oppdaterer DOM-en først
      const canvas = document.getElementById("nordpoolChart");
      if (canvas) {
        this.renderGraph(canvas); // Tegner grafen etter at DOM-en er oppdatert
      }
    }
  },

  renderGraph: function (canvas) {
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.prices.map(price => price.time || ""); // Tidspunkter
    const data = this.prices.map(price => parseFloat(price.price) || 0); // Priser som tall

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Strømpriser (${this.config.displayCurrency})`,
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: `Pris (${this.config.displayCurrency}/kWh)`
            }
          },
          x: {
            title: {
              display: true,
              text: "Tidspunkt"
            }
          }
        }
      }
    });
  }
});
