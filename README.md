
# MMM-Nordpool

MMM-Nordpool is a Magic Mirror module for displaying hourly electricity prices using data from the **"Hva koster strømmen?"** API, a Norwegian service that provides real-time electricity prices for various Nordic regions.

## Features
- Fetches and displays hourly electricity prices for the configured region using the **Hva koster strømmen** API.
- Displays prices in the desired currency (default: NOK).
- Updates prices automatically every hour.
- Highlights the current and past hours for better visualization.
- Supports fetching both today's and tomorrow's prices after 13:00.

## Installation
1. Clone this repository into the `modules` folder of your Magic Mirror:
   ```bash
   git clone https://github.com/stianhoe/MMM-Nordpool.git
   ```

2. Navigate into the module directory:
   ```bash
   cd MMM-Nordpool
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration
Add the following configuration block to the `config.js` file of your Magic Mirror setup:

```js
{
  module: "MMM-Nordpool",
  position: "top_right",
  config: {
    displayCurrency: "NOK", // Set the display currency, e.g., "NOK", "EUR"
    region: "NO3",          // Choose your region, e.g., "NO1", "NO2", "SE1", etc.
    updateInterval: 3600000 // Time between updates in milliseconds (default: 1 hour)
  }
}
```

### Configuration Options
- **displayCurrency**: The currency for displaying prices (default: "NOK").
- **region**: The region code to fetch prices for (default: "NO3"). Options include `NO1`, `NO2`, `SE1`, etc.
- **updateInterval**: Time interval between data fetches in milliseconds (default: 3600000 or 1 hour).

## API Details
This module uses the API provided by [Hva koster strømmen?](https://www.hvakosterstrommen.no/) to retrieve electricity prices. The module constructs API URLs in the following format:

```
https://www.hvakosterstrommen.no/api/v1/prices/YYYY/MM-DD_REGION.json
```

### Example Request
For fetching prices for the `NO3` region on October 10, 2024:
```
https://www.hvakosterstrommen.no/api/v1/prices/2024/10-10_NO3.json
```

### Response Format
The API returns data in JSON format with fields for start time, end time, and electricity price in NOK per kWh:

```json
[
  {
    "time_start": "2024-10-10T00:00:00+02:00",
    "time_end": "2024-10-10T01:00:00+02:00",
    "NOK_per_kWh": 0.6123
  },
  {
    "time_start": "2024-10-10T01:00:00+02:00",
    "time_end": "2024-10-10T02:00:00+02:00",
    "NOK_per_kWh": 0.5784
  }
]
```

The module processes this data to create a bar chart that visualizes prices for each hour of the day.

## Dependencies
The module has the following dependencies:

- `node-fetch`: For making HTTP requests to the API.
- `chart.js`: For displaying the electricity prices as a chart.
- `chartjs-plugin-datalabels`: Plugin for managing data labels in charts.

Install these using:

```bash
npm install
```

## Styling
The module uses the `nordpool.css` stylesheet for styling. You can customize the table and chart appearance by modifying this file. The CSS includes styling for the table, graph wrapper, and colors used for the chart bars.

## License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Author
Created by **Stian Hoel**. For issues or feature requests, visit the [GitHub repository](https://github.com/stianhoe/MMM-Nordpool/issues).
