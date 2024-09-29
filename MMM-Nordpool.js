Module.register("MMM-NordPool", {
  defaults: {
    apiUrl: "https://www.nordpoolgroup.com/api/marketdata/page/10?currency=,EUR,EUR,EUR", // Bytt til ønsket API-endepunkt.
    updateInterval: 60 * 60 * 1000, // Oppdatering hver time.
    displayCurrency: "NOK", // Endre til ønsket valuta.
    region: "NO1" // Sett ønsket område (eks. NO1, NO2, SE3, osv.)
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
    if (!this.prices) {
      wrapper.innerHTML = "Laster strømpriser...";
    } else {
      wrapper.innerHTML = `
        <table class="nordpool-prices">
          <tr><th>Time</th><th>Pris (${this.config.displayCurrency})</th></tr>
          ${this.prices.map(price => `
            <tr><td>${price.hour}</td><td>${price.price.toFixed(2)}</td></tr>
          `).join("")}
        </table>`;
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
  }
});
