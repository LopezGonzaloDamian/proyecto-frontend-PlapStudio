import { BrowserRouter } from 'react-router-dom'
import RoutesApp from './routes/routes'
import ThemeToggle from './components/common/ThemeToggle'

function App() {
  return (
    <BrowserRouter>
      <RoutesApp />
      <ThemeToggle />
    </BrowserRouter>
  )
}

export default App
