import HealthCheck from './pages/HealthCheck'
import './App.css'

function App() {
  return (
    <div className="App">
      <nav className="navbar">
        <div className="container">
          <h1>Fullstack App</h1>
        </div>
      </nav>

      <main>
        <HealthCheck />
      </main>
    </div>
  )
}

export default App
