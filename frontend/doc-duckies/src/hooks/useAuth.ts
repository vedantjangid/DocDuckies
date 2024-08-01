import { useState } from 'react'
import { loginUser } from '@/lib/api'

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  const login = async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password)
      if (data.success) {
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(true)

        console.error("Login error:", data.error)
      }
    } catch (error) {
      console.error("Error logging in:", error)
    }
  }

  const logout = () => {
    setIsLoggedIn(false)
  }

  return { isLoggedIn, login, logout }
}