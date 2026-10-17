import { createContext, useContext } from 'react'
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)
export const dashboardPath = user => user?.role === 'collector' ? '/collector' : '/dashboard'
