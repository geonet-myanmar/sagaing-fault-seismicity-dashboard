# Contributing to Sagaing Fault Seismicity Dashboard

Thank you for your interest in contributing to this project! This document provides guidelines for contributions.

## 🐛 Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in the [Issues](../../issues) section
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser and OS information

## 🔧 Development Setup

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sagaing-fault-dashboard.git
   cd sagaing-fault-dashboard
   ```
3. **Start a local server**:
   ```bash
   npx http-server -p 8080
   ```
4. **Open in browser**: Navigate to `http://localhost:8080`

## 📝 Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following the code style guidelines
3. Test your changes in multiple browsers
4. Commit with clear, descriptive messages:
   ```bash
   git commit -m "Add: description of feature"
   git commit -m "Fix: description of bug fix"
   git commit -m "Update: description of update"
   ```
5. Push to your fork and submit a Pull Request

## 💻 Code Style Guidelines

### HTML
- Use semantic HTML5 elements
- Indent with 4 spaces
- Use meaningful class names

### CSS
- Use CSS custom properties (variables) defined in `:root`
- Group related properties together
- Add comments for complex sections
- Follow mobile-first responsive design

### JavaScript
- Use ES6+ features (const, let, arrow functions, async/await)
- Add JSDoc comments for functions
- Use meaningful variable and function names
- Handle errors gracefully with try/catch

## 🗺️ Adding New Features

### Adding a New Basemap
1. Add the tile layer to the `basemaps` object in `app.js`
2. Add a button in the basemap-options section of `index.html`
3. The existing event listener will handle the switch automatically

### Adding New Data
1. Ensure data is in GeoJSON format
2. Add loading function similar to `loadEarthquakeData()`
3. Create appropriate visualization (markers, polygons, etc.)

## 📊 Data Guidelines

- Earthquake data should follow USGS GeoJSON format
- Maintain consistent coordinate system (WGS84 / EPSG:4326)
- Include required properties: mag, place, time

## 🙏 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Celebrate diverse perspectives

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
