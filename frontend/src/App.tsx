import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import DealList from './pages/DealList'
import DealDetail from './pages/DealDetail'
import Tutorial from './pages/Tutorial'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/deals" element={<DealList />} />
        <Route path="/deals/:id" element={<DealDetail />} />
        <Route path="/tutorial" element={<Tutorial />} />
      </Routes>
    </Layout>
  )
}
