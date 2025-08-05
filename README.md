# Interactive Globe Visualization

This project is a web-based application that provides an interactive 3D globe experience.

## Features

- **Interactive 3D Globe**: A fully interactive 3D globe built with `react-globe.gl`.
- **Country Highlighting**: Hover over a country to highlight it, and click to select it and fly the camera to its location.
- **Search Functionality**: A real-time search bar allows users to quickly find and navigate to any country on the globe.
- **Data Visualization**: Displays animated points on the globe representing countries that meet a specific data threshold (e.g., countries with a population over 50 million).
- **Slick User Interface**: The UI is designed using Material-UI for a professional, responsive, and easy-to-use experience.
- **Data Panels**: Displays detailed information about the currently selected country in a clean, unobtrusive panel.

## Technologies Used

- **React**: The core JavaScript library for building the user interface.
- **react-globe.gl**: A powerful React component for creating interactive 3D globes.
- **Material-UI (MUI)**: A popular React UI framework for a sleek and consistent design.
- **@turf/turf**: A geospatial library used for calculating country centroids.
- **GeoJSON**: The data format for rendering country polygons.

## Installation

To get a local copy up and running, follow these simple steps.

1.  **Clone the repository**:

    ```sh
    git clone <repo-url>
    cd globe
    ```

2.  **Install dependencies**:

    ```sh
    pnpm install
    ```

3.  **Run the development server**:
    ```sh
    pnpm dev
    ```

The application will be available at `http://localhost:3000`.

## Data Source

The GeoJSON data for the country polygons is sourced from the Natural Earth project. The data file used is `custom-110-metre.geojson`.

## Contributing

Contributions are welcome. Just make sure you open a PR

## License

Distributed under the MIT License.
