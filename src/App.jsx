import AdminPanel from './features/admin/AdminPanel'
import CreateWizard from './features/create/CreateWizard'
import GroupPage from './features/group/GroupPage'
import ProductSearchPage from './features/search/ProductSearchPage'
import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router'
import NotFound from './features/NotFound'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CreateWizard />} />
          <Route path="/g/:slug" element={<GroupPage />} />
          <Route path="/g/:slug/buscar" element={<ProductSearchPage />} />
          <Route path="/g/:slug/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
