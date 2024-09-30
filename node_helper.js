const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  async socketNotificationReceived(notification, payload) {
    if (notification === "GET_NORDPOOL_PRICES") {
      try {
        console.log("MMM-Nordpool: Generert API-URL er:", payload.apiUrl); // Skriv ut URL-en til konsollen
        const response = await fetch(payload.apiUrl);
        const data = await response.json();
        const prices = this.processPrices(data);
        this.sendSocketNotification("NORDPOOL_PRICES", prices);
      } catch (error) {
        console.error("MMM-Nordpool: Feil ved henting av priser:", error);
        this.sendSocketNotification("NORDPOOL_PRICES", { error: "Feil ved henting av priser" });
      }
    }
  },

  processPrices(data) {
    try {
      return data.map((item) => ({
        time: item.time_start.split("T")[1].substring(0, 5), // Henter time:minute fra "time_start"
        price: item.NOK_per_kWh.toFixed(4) // Pris formatert til 4 desimaler
      }));
    } catch (e) {
      console.error("MMM-Nordpool: Feil ved prosessering av priser:", e);
      return { error: "Feil ved prosessering av data" };
    }
  }  
});
