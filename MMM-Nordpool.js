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
      "modules/MMM-Nordpool/node_modules/chart.js/dist/chart.umd.js"
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
    const currentHour = today.getHours();

    let year, month, day;
    let apiUrl;

    if (currentHour < 13) {
      // Hent gårsdagens og dagens priser
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      year = yesterday.getFullYear();
      month = String(yesterday.getMonth() + 1).padStart(2, '0');
      day = String(yesterday.getDate()).padStart(2, '0');
      const formattedYesterday = `${year}/${month}-${day}`;

      year = today.getFullYear();
      month = String(today.getMonth() + 1).padStart(2, '0');
      day = String(today.getDate()).padStart(2, '0');
      const formattedToday = `${year}/${month}-${day}`;

      apiUrl = [
        `${this.config.baseUrl}/${formattedYesterday}_${this.config.region}.json`,
        `${this.config.baseUrl}/${formattedToday}_${this.config.region}.json`
      ];
    } else {
      // Hent dagens og morgendagens priser
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      year = today.getFullYear();
      month = String(today.getMonth() + 1).padStart(2, '0');
      day = String(today.getDate()).padStart(2, '0');
      const formattedToday = `${year}/${month}-${day}`;

      year = tomorrow.getFullYear();
      month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      day = String(tomorrow.getDate()).padStart(2, '0');
      const formattedTomorrow = `${year}/${month}-${day}`;

      apiUrl = [
        `${this.config.baseUrl}/${formattedToday}_${this.config.region}.json`,
        `${this.config.baseUrl}/${formattedTomorrow}_${this.config.region}.json`
      ];
    }

    console.log("MMM-Nordpool: Oppdaterer priser fra API med dynamisk URL:", apiUrl);
    apiUrl.forEach(url => {
      this.sendSocketNotification("GET_NORDPOOL_PRICES", { apiUrl: url });
    });
  }
  ,

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