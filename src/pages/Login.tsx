import React, { useState } from 'react'
import { AuthForm } from '../components/auth/AuthForm'

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
      <div className="relative z-10">
        <AuthForm mode={mode} onModeChange={setMode} />
      </div>
    </div>
  )
}

export default Login