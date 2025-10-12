import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/Header';
import Home from './pages/Home';

// Lazy load heavy route components for code splitting
const Planning = lazy(() => import('./pages/Planning'));
const Results = lazy(() => import('./pages/Results'));

// Loading component for route transitions
function RouteLoading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      fontSize: '1.2rem',
      color: '#666'
    }}>
      Loading...
    </div>
  );
}

function App() {
  return (
    <Router>
      <Header />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
