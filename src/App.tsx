import { BrowserRouter } from 'react-router-dom'
import RoutesApp from './routes/routes'
import ThemeToggle from './components/common/ThemeToggle'
import AgendifyChatbot from './chatbot/AgendifyChatbot'

function App() {
  return (
    <BrowserRouter>
      <RoutesApp />
      <AgendifyChatbot />
      <ThemeToggle />
    </BrowserRouter>
  )
}

export default App
