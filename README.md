# Travel Agent

A modern travel planning application built with React 19 and Vite, featuring a mobile-first responsive design for creating and managing travel itineraries.

## Tech Stack

- **React 19** - Latest React with hooks and StrictMode
- **Vite 7** - Fast build tool with Hot Module Replacement (HMR)
- **React Router DOM 7** - Client-side routing
- **CSS** - Custom responsive styling with mobile-first approach
- **ESLint** - Code linting with React-specific rules

## Project Structure

```
src/
├── main.jsx              # Application entry point
├── App.jsx               # Root component with routing
├── components/           # Reusable components
│   ├── Header.jsx
│   └── Header.css
└── pages/                # Route pages
    ├── Home.jsx
    ├── Home.css
    ├── Planning.jsx
    ├── Planning.css
    ├── Results.jsx
    └── Results.css
```

## Development

### Prerequisites
- Node.js (latest LTS recommended)
- npm

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser to the local development URL (typically http://localhost:5173)

### Available Scripts

- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Build optimized production bundle
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build locally

## Features

- **Mobile-First Design** - Responsive layouts optimized for mobile devices with progressive enhancement for larger screens
- **Fast Refresh** - Instant updates during development via @vitejs/plugin-react with Babel
- **Modern Routing** - Declarative routing with React Router DOM
- **Code Quality** - ESLint configuration with React Hooks and React Refresh rules

## ESLint Configuration

The project uses flat config format (`eslint.config.js`) with:
- React Hooks plugin for enforcing hooks rules
- React Refresh plugin for HMR compatibility
- Custom rule allowing unused variables starting with uppercase or underscore
- Automatic exclusion of `dist/` directory
