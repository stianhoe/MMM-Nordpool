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
    return [
      "modules/MMM-Nordpool/node_modules/chart.js/dist/chart.umd.js",
      "modules/MMM-Nordpool/node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js"
    ];
  },

  getStyles: function () {
    return ["nordpool.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    const canvas = document.createElement("canvas");
    canvas.id = "nordpoolChart";
    wrapper.className = "nordpool-wrapper";
    wrapper.appendChild(canvas);
  

    if (!this.prices) {
      wrapper.innerHTML = "<p>Laster strømpriser...</p>";
    } else if (this.prices.error) {
      wrapper.innerHTML = `<p>Feil: ${this.prices.error}</p>`;
    } else if (this.prices.length === 0) {
      wrapper.innerHTML = "<p>Ingen strømpriser tilgjengelig.</p>";
    } else {
      this.renderGraph(canvas); // Tegn grafen når data er tilgjengelig
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
      this.updateDom();
    }
  },

  renderGraph: function (canvas) {
    if (this.chart) {
      this.chart.destroy();
    }
  
    const labels = this.prices.map(price => price.time); // Tidspunkter
    const currentHour = new Date().getHours(); // Nåværende time
    const data = this.prices.map(price => parseFloat(price.price)); // Priser som tall
  
    const backgroundColors = this.prices.map(price => {
      const hour = parseInt(price.time.split(":")[0]);
      if (hour < currentHour) return "rgba(100, 100, 100, 0.5)"; // Svakere farge for tidligere timer
      if (hour === currentHour) return "rgba(255, 99, 132, 0.8)"; // Fremhev nåværende time
      return "rgba(54, 162, 235, 0.5)"; // Normal farge for kommende timer
    });
  
    const borderColors = backgroundColors; // Border-fargen matcher bar-fargen
  
    this.chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true
          },
          datalabels: {
            display: (context) => {
              const hour = parseInt(labels[context.dataIndex].split(":")[0]);
              return hour === currentHour; // Vis kun verdien for nåværende time
            },
            color: 'white',
            font: {
              weight: 'bold',
              size: 14
            },
            formatter: (value) => `${value.toFixed(2)} NOK`, // Formater verdien
            anchor: 'end',
            align: 'start',
            offset: -5
          }
        },
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
              display: false
            }
          }
        }
      }
    });
  }  
});