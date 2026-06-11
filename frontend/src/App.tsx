import { BrowserRouter, Routes, Route } from 'react-router-dom'

// TODO (Phase 2): Import and wire up all pages
// import LoginPage from './pages/LoginPage'
// import HomePage from './pages/HomePage'
// import ContentDetailPage from './pages/ContentDetailPage'

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>🎬 Smart Media Recommender</h1>
        <p>Frontend scaffold — implement UI in Phase 2.</p>
      </div>
    </BrowserRouter>
  )
}

export default App
