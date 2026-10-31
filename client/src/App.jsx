import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import Home from './pages/public/Home'
import About from './pages/public/About'
import Services from './pages/public/Services'
import Contact from './pages/public/Contact'
import AuthPage from './pages/public/AuthPage'
import AuthProvider from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import Requests from './pages/dashboard/Requests'
import PickupForm from './pages/dashboard/PickupForm'
import RequestDetails from './pages/dashboard/RequestDetails'
import Profile from './pages/dashboard/Profile'
import NotFound from './pages/public/NotFound'
import './App.css'
import './public.css'
import './application.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider><Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="how-it-works" element={<Navigate to="/#how-it-works" replace />} />
          <Route path="services" element={<Services />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<AuthPage key="login" mode="login" />} />
          <Route path="register" element={<AuthPage key="register" mode="register" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<ProtectedRoute role="user" />}>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="requests" element={<Requests />} />
            <Route path="requests/new" element={<PickupForm />} />
            <Route path="requests/:id" element={<RequestDetails />} />
            <Route path="requests/:id/edit" element={<PickupForm />} />
            <Route path="tracking" element={<Requests scope="active" tracking />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute role="collector" />}>
          <Route path="collector" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="available" element={<Requests key="available" scope="available" />} />
            <Route path="requests" element={<Requests key="collections" scope="active" />} />
            <Route path="requests/:id" element={<RequestDetails />} />
            <Route path="history" element={<Requests key="history" scope="history" />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes></AuthProvider>
    </BrowserRouter>
  )
}
