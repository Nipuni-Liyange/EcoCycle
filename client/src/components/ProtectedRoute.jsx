import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { dashboardPath, useAuth } from '../context/authContext'
import { LoadingState, ErrorState } from './app/Feedback'

export default function ProtectedRoute({ role }) {
  const { user, loading, error, refresh } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} retry={refresh} />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user.role !== role) return <Navigate to={dashboardPath(user)} replace />
  return <Outlet />
}
