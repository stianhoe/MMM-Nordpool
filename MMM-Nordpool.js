Module.register("MMM-Nordpool", {
  defaults: {
    apiUrl: "https://www.nordpoolgroup.com/api/marketdata/page/10?currency=,EUR,EUR,EUR",
    updateInterval: 60 * 60 * 1000, // Oppdatering hver time
    displayCurrency: "NOK", // Endre til ønsket valuta
    region: "Tr.heim" // Velg ønsket region (eks. "Oslo", "Kr.sand", "Bergen", osv.)
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
    return ["modules/MMM-Nordpool/node_modules/chart.js/dist/chart.min.js"];
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
      this.renderDummyGraph(canvas); // Vis dummy-graf hvis det ikke er priser
    } else if (this.prices.error) {
      wrapper.innerHTML = `<p>Feil: ${this.prices.error}</p>`;
    } else if (this.prices.length === 0) {
      wrapper.innerHTML = "<p>Ingen strømpriser tilgjengelig.</p>";
    } else {
      // Legg til en debugging linje for å vise prisene i DOM
      console.log("MMM-Nordpool: Priser mottatt i frontend:", this.prices);
      wrapper.innerHTML += `<pre>${JSON.stringify(this.prices, null, 2)}</pre>`;
      this.renderGraph(canvas); // Vis ekte graf hvis data er tilgjengelig
    }

    return wrapper;
  },

  updatePrices: function () {
    console.log("MMM-Nordpool: Oppdaterer priser fra API...");
    this.sendSocketNotification("GET_NORDPOOL_PRICES", {
      apiUrl: this.config.apiUrl,
      region: this.config.region,
      currency: this.config.displayCurrency
    });
  },

  socketNotificationReceived: function (notification, payload) {
    console.log("MMM-Nordpool: Mottatt socket-notifikasjon:", notification, payload);
    if (notification === "NORDPOOL_PRICES") {
      this.prices = payload;
      if (!Array.isArray(this.prices) || this.prices.length === 0) {
        console.error("MMM-Nordpool: Ingen priser mottatt, viser dummy-graf.");
      } else {
        console.log("MMM-Nordpool: Prisdata mottatt i frontend:", this.prices);
      }
      this.updateDom();
    }
  },

  renderGraph: function (canvas) {
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.prices.map(price => price.hour);
    const data = this.prices.map(price => price.price);

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
    const dummyLabels = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00"];
    const dummyData = [45.0, 40.3, 42.8, 38.1, 36.7, 35.9, 34.5];

    if (this.chart) {
      this.chart.destroy();
    }

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
