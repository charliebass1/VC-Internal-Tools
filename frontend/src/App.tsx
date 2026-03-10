import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DealList from './pages/DealList'
import DealDetail from './pages/DealDetail'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DealList />} />
        <Route path="/deals/:id" element={<DealDetail />} />
      </Routes>
    </Layout>
  )
}
