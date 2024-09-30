Module.register("MMM-Nordpool", {
  defaults: {
    baseUrl: "https://www.hvakosterstrommen.no/api/v1/prices",
    updateInterval: 60 * 60 * 1000, // Oppdatering hver time
    displayCurrency: "NOK",
    region: "NO3" // Standard region
  },

  start: function () {
    this.prices = null;
    this.updatePrices();
    setInterval(() => {
      this.updatePrices();
    }, this.config.updateInterval);
  },

  getStyles: function () {
    return ["nordpool.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "nordpool-wrapper";

    if (!this.prices) {
      wrapper.innerHTML = "<p>Laster strømpriser...</p>";
    } else if (this.prices.error) {
      wrapper.innerHTML = `<p>Feil: ${this.prices.error}</p>`;
    } else if (this.prices.length === 0) {
      wrapper.innerHTML = "<p>Ingen strømpriser tilgjengelig.</p>";
    } else {
      let table = "<table class='nordpool-prices'><tr><th>Tidspunkt</th><th>Pris (NOK/kWh)</th></tr>";
      this.prices.forEach(price => {
        table += `<tr><td>${price.time}</td><td>${price.price}</td></tr>`;
      });
      table += "</table>";
      wrapper.innerHTML = table;
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
  
    console.log("MMM-Nordpool: Generert API-URL:", apiUrl); // Skriv ut API URL til konsollen
    this.sendSocketNotification("GET_NORDPOOL_PRICES", { apiUrl: apiUrl });
  },  

  socketNotificationReceived: function (notification, payload) {
    if (notification === "NORDPOOL_PRICES") {
      this.prices = payload;
      this.updateDom();
    }
  }
});
