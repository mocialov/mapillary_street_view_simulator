# Mapillary Street View Driving Simulator

A web-based application that simulates driving along routes using street-level imagery from Mapillary. Built with React and TypeScript, this interactive app lets you enter two addresses and experience a virtual drive with real crowdsourced street view images.

🌐 **Live Demo**: [https://mocialov.github.io/mapillary_street_view_simulator](https://mocialov.github.io/mapillary_street_view_simulator)

## 🌟 Features

- **Route Planning**: Enter origin and destination addresses
- **Street View Imagery**: Uses Mapillary's crowdsourced street-level photos
- **Interactive Controls**: Play/pause, navigate forward/backward through images
- **Mini Map**: Real-time location tracking on an interactive map
- **Keyboard Controls**: Arrow keys for navigation, spacebar to play/pause

## 🛠️ Tech Stack

- **React** with TypeScript
- **Mapillary API** for street-level imagery (free, crowdsourced)
- **OSRM** for routing between locations (free, open-source)
- **Nominatim** for geocoding addresses (free, OpenStreetMap)
- **Leaflet** for interactive maps

## 📦 Setup & Installation

### Prerequisites

- Node.js 16+ and npm
- Mapillary API token ([Get one here](https://www.mapillary.com/dashboard/developers))

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mocialov/mapillary_street_view_simulator.git
   cd mapillary_street_view_simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Add your Mapillary API token to `.env`:**
   ```
   REACT_APP_MAPILLARY_TOKEN=your_token_here
   ```

5. **Start the development server:**
   ```bash
   npm start
   ```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment to GitHub Pages

### Automatic Deployment (Recommended)

This repository includes a GitHub Actions workflow for automatic deployment:

1. **Add your API token as a GitHub Secret:**
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `REACT_APP_MAPILLARY_TOKEN`
   - Value: Your Mapillary API token

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: Select "GitHub Actions"

3. **Push to master branch:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin master
   ```

The app will deploy automatically! Access it at: `https://yourusername.github.io/mapillary_street_view_simulator`

### Manual Deployment

```bash
npm run deploy
```

## 📝 How It Works

1. User enters origin and destination addresses
2. Addresses are geocoded using OpenStreetMap Nominatim
3. Route is calculated using OSRM (Open Source Routing Machine)
4. App fetches Mapillary images along the route
5. Images are displayed in sequence to simulate driving

## ⚠️ Important Notes

- **Image Availability**: Mapillary uses crowdsourced imagery, so coverage varies by location. Urban areas and major roads typically have better coverage.
- **Rate Limiting**: The Mapillary API has rate limits. For best results, try routes in well-traveled areas.
- **Image Quality**: Mapillary images are from various contributors and may vary in quality and resolution.

## 🎥 Demo Video

Original Python version demo:
[![Google Street View Simulator Video](http://img.youtube.com/vi/77FeNIHuC20/0.jpg)](http://www.youtube.com/watch?v=77FeNIHuC20)

## 📄 Legacy Python Version

The original Python version that generates video timelapses is still available in `StreetViewAPI.py`. See the file for usage instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes!
