import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import Training from './Training'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/train" element={<Training />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
