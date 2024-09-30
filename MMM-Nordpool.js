Module.register("MMM-Nordpool", {
  defaults: {
    apiUrl: "https://www.nordpoolgroup.com/api/marketdata/page/10?currency=,EUR,EUR,EUR",
    updateInterval: 60 * 60 * 1000, // Oppdatering hver time
    displayCurrency: "NOK", // Endre til ønsket valuta
    region: "Tr.heim" // Velg ønsket region (eks. "Oslo", "Kr.sand", "Bergen", osv.)
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
      // Bygg en enkel HTML-tabell med pris og tidspunkt
      let table = "<table class='nordpool-prices'><tr><th>Tidspunkt</th><th>Pris (" + this.config.displayCurrency + ")</th></tr>";
      this.prices.forEach(price => {
        table += `<tr><td>${price.hour}</td><td>${price.price}</td></tr>`;
      });
      table += "</table>";
      wrapper.innerHTML = table;
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
    if (notification === "NORDPOOL_PRICES") {
      this.prices = payload;
      this.updateDom();
    }
  }
});
