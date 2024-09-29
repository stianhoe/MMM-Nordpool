const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  async socketNotificationReceived(notification, payload) {
    if (notification === "GET_NORDPOOL_PRICES") {
      try {
        console.log("MMM-Nordpool: Starter å hente priser fra API...");
        const response = await fetch(payload.apiUrl);
        console.log("MMM-Nordpool: API-respons mottatt.");
        const data = await response.json();
        console.log("MMM-Nordpool: Data fra API-et:", data);

        const prices = this.processPrices(data, payload.region);
        console.log("MMM-Nordpool: Behandlede priser som sendes til frontend:", prices);
        this.sendSocketNotification("NORDPOOL_PRICES", prices);
      } catch (error) {
        console.error("MMM-Nordpool: Feil ved henting av priser:", error);
        this.sendSocketNotification("NORDPOOL_PRICES", { error: "Feil ved henting av priser" });
      }
    }
  },

  processPrices(data, region) {
    try {
      if (!data || !data.data || !data.data.Rows) {
        console.error("MMM-Nordpool: Ugyldig data mottatt fra API.");
        return { error: "Ugyldig data fra API-et" };
      }

      const rows = data.data.Rows;
      console.log("MMM-Nordpool: Antall rader mottatt fra API:", rows.length);

      const prices = rows.map((row) => {
        const time = row.StartTime.split("T")[1].split(":")[0];
        const priceObj = row.Columns.find((col) => col.Name === region);
        const price = priceObj ? parseFloat(priceObj.Value.replace(",", ".")) : null;

        return { hour: `${time}:00`, price: price ? price : "N/A" };
      }).filter((price) => price.price !== null);

      return prices;
    } catch (e) {
      console.error("MMM-Nordpool: Feil ved prosessering av priser:", e);
      return { error: "Feil ved prosessering av data" };
    }
  }
});
