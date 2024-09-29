const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  async socketNotificationReceived(notification, payload) {
    if (notification === "GET_NORDPOOL_PRICES") {
      const { apiUrl, region, currency } = payload;
      try {
        // Henter priser fra Nord Pool API
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Henter ut priser for ønsket region og konverterer til ønsket valuta
        const prices = data.data.Rows.map((row) => {
          const time = row.StartTime.split("T")[1].split(":")[0]; // Henter time-stempelet
          const priceObj = row.Columns.find((col) => col.Name === region);
          const price = priceObj ? parseFloat(priceObj.Value.replace(",", ".")) : null;

          return { hour: `${time}:00`, price: price ? price : "N/A" };
        }).filter((price) => price.price !== null); // Filtrerer ut tomme verdier

        // Sender tilbake data til frontend
        this.sendSocketNotification("NORDPOOL_PRICES", prices);
      } catch (error) {
        console.error("Feil ved henting av Nord Pool-priser:", error);
      }
    }
  },
});
