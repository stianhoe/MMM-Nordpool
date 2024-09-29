Module.register("MMM-NordPool", {
  defaults: {
    apiUrl: "https://www.nordpoolgroup.com/api/marketdata/page/10?currency=,EUR,EUR,EUR",
    updateInterval: 60 * 60 * 1000, // Oppdatering hver time
    displayCurrency: "NOK", // Endre til ønsket valuta
    region: "NO1" // Sett ønsket område (eks. NO1, NO2, SE3, osv.)
  },

  start: function () {
    this.prices = null;
    this.chart = null; // Referanse til Chart.js-grafen
    this.updatePrices();
    setInterval(() => {
      this.updatePrices();
    }, this.config.updateInterval);
  },

  getScripts: function () {
    return ["modules/MMM-NordPool/node_modules/chart.js/dist/chart.min.js"];
  },

  getStyles: function () {
    return ["MMM-NordPool.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    // Opprett en canvas for Chart.js
    const canvas = document.createElement("canvas");
    canvas.id = "nordpoolChart";
    wrapper.appendChild(canvas);

    if (!this.prices) {
      wrapper.innerHTML += "<p>Laster strømpriser...</p>";
      this.renderDummyGraph(canvas); // Vis dummy-graf hvis det ikke er priser
    } else {
      this.renderGraph(canvas); // Vis ekte graf hvis data er tilgjengelig
    }

    return wrapper;
  },

  updatePrices: function () {
    this.sendSocketNotification("GET_NORDPOOL_PRICES", {
      apiUrl: this.config.apiUrl,
      region: this.config.region,
      currency: this.config.displayCurrency
    });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NORDPOOL_PRICES") {
      this.prices = payload;
      this.updateDom();
    }
  },

  renderGraph: function (canvas) {
    // Hvis en graf allerede finnes, ødelegger vi den for å lage en ny
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.prices.map(price => price.hour);
    const data = this.prices.map(price => price.price);

    // Opprett en ny Chart.js-graf med ekte data
    this.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `Strømpriser (${this.config.displayCurrency})`,
            data: data,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  },

  renderDummyGraph: function (canvas) {
    // Dummy-data for fallback-graf
    const dummyLabels = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00"];
    const dummyData = [45.0, 40.3, 42.8, 38.1, 36.7, 35.9, 34.5];

    // Hvis en graf allerede finnes, ødelegger vi den for å lage en ny
    if (this.chart) {
      this.chart.destroy();
    }

    // Opprett en Chart.js-graf med dummy-data
    this.chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: dummyLabels,
        datasets: [
          {
            label: "Eksempelpriser (NOK)",
            data: dummyData,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
});
