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
    const urls = [];

    // Hent dagens priser
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Legg til ledende null
    const day = String(today.getDate()).padStart(2, '0'); // Legg til ledende null
    const todayFormattedDate = `${year}/${month}-${day}`;
    urls.push(`${this.config.baseUrl}/${todayFormattedDate}_${this.config.region}.json`);

    if (currentHour >= 13) {
      // Etter kl 13:00, hent også morgendagens priser
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // Legg til ledende null
      const day = String(tomorrow.getDate()).padStart(2, '0'); // Legg til ledende null
      const tomorrowFormattedDate = `${year}/${month}-${day}`;
      urls.push(`${this.config.baseUrl}/${tomorrowFormattedDate}_${this.config.region}.json`);
    }

    console.log("MMM-Nordpool: Oppdaterer priser fra API med følgende URLer:", urls);
    urls.forEach(url => {
      this.sendSocketNotification("GET_NORDPOOL_PRICES", { apiUrl: url });
    });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NORDPOOL_PRICES") {
      if (!this.prices) {
        this.prices = [];
      }

      if (payload.error) {
        console.error("MMM-Nordpool: Feil ved henting av priser:", payload.error);
      } else {
        // Fjern eventuelle duplikater basert på tidspunktet for hver pris
        const newPrices = payload.filter(newPrice => !this.prices.some(existingPrice => existingPrice.time === newPrice.time));
        this.prices = [...this.prices, ...newPrices].sort((a, b) => new Date(a.time) - new Date(b.time));
      }

      // Oppdater DOM når prisene er ferdig lastet
      this.updateDom();
    }
  },

  renderGraph: function (canvas) {
    if (this.chart) {
      this.chart.destroy();
    }
  
    const labels = this.prices.map(price => {
      const time = price.time.split(' ')[1]; // Bruker kun tid som etikett på x-aksen
      return time;
    });
    const currentHour = new Date().getHours(); // Nåværende time
    const data = this.prices.map(price => parseFloat(price.price)); // Priser som tall
  
    const backgroundColors = this.prices.map(price => {
      const priceDate = new Date(price.time);
      const isToday = priceDate.getDate() === new Date().getDate();
      const hour = priceDate.getHours();

      if (!isToday) {
        return "rgba(54, 162, 235, 0.5)"; // Normal farge for morgendagens timer
      }
      if (hour < currentHour) {
        return "rgba(100, 100, 100, 0.5)"; // Svakere farge for tidligere timer
      }
      if (hour === currentHour) {
        return "rgba(255, 99, 132, 0.8)"; // Fremhev nåværende time
      }
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
              display: true,
              text: "Tid"
            }
          }
        }
      }
    });
  }  
});