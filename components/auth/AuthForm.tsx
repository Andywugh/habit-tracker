import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'sonner'

interface AuthFormProps {
  mode?: 'login' | 'register'
  onModeChange?: (mode: 'login' | 'register') => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  mode = 'login', 
  onModeChange 
}) => {
  const { signIn, signUp, resendConfirmation } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [showResendOption, setShowResendOption] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符'
    }

    if (mode === 'register') {
      if (!formData.name) {
        newErrors.name = '请输入姓名'
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getErrorMessage = (error: any, isLogin: boolean) => {
    const message = error?.message || ''
    
    // 登录错误处理
    if (isLogin) {
      if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
        return { userMessage: '请先验证您的邮箱地址后再登录', showResend: true }
      }
      if (message.includes('Invalid login credentials')) {
        return { userMessage: '邮箱或密码错误，请检查后重试', showResend: false }
      }
      if (message.includes('Too many requests')) {
        return { userMessage: '登录尝试次数过多，请稍后再试', showResend: false }
      }
      if (message.includes('User not found')) {
        return { userMessage: '该邮箱尚未注册，请先注册账户', showResend: false }
      }
    } else {
      // 注册错误处理
      if (message.includes('User already registered')) {
        return { userMessage: '该邮箱已被注册，请直接登录', showResend: false }
      }
      if (message.includes('Password should be at least')) {
        return { userMessage: '密码长度至少需要6个字符', showResend: false }
      }
      if (message.includes('Invalid email')) {
        return { userMessage: '请输入有效的邮箱地址', showResend: false }
      }
      if (message.includes('Signup is disabled')) {
        return { userMessage: '当前不允许注册新用户', showResend: false }
      }
    }
    
    return { userMessage: message || '操作失败，请重试', showResend: false }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({ submit: '' })
    setShowResendOption(false)
    
    try {
      let result
      if (mode === 'login') {
        result = await signIn(formData.email, formData.password)
        if (result.error) {
          const { userMessage, showResend } = getErrorMessage(result.error, true)
          setErrors({ submit: userMessage })
          setShowResendOption(showResend)
          toast.error(userMessage)
        } else {
          toast.success('登录成功！')
        }
      } else {
        result = await signUp(formData.email, formData.password, formData.name)
        if (result.error) {
          const { userMessage } = getErrorMessage(result.error, false)
          setErrors({ submit: userMessage })
          toast.error(userMessage)
        } else {
          // 注册成功的反馈
          toast.success('注册成功！请检查您的邮箱并点击验证链接以完成账户激活。')
          setErrors({ submit: '' })
          // 清空表单
          setFormData({
            email: '',
            password: '',
            name: '',
            confirmPassword: ''
          })
          // 切换到登录模式
          setTimeout(() => {
            onModeChange?.('login')
            toast.info('请验证邮箱后返回登录')
          }, 2000)
        }
      }
    } catch (error) {
      const errorMessage = '网络连接失败，请检查网络后重试'
      setErrors({ submit: errorMessage })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error('请先输入邮箱地址')
      return
    }

    setResendingEmail(true)
    try {
      const result = await resendConfirmation(formData.email)
      if (result.error) {
        toast.error('重新发送验证邮件失败：' + result.error.message)
      } else {
        toast.success('验证邮件已重新发送，请检查您的邮箱')
        setShowResendOption(false)
      }
    } catch (error) {
      toast.error('重新发送验证邮件失败，请重试')
    } finally {
      setResendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {mode === 'login' ? '登录账户' : '创建账户'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <Input
                label="姓名"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder="请输入您的姓名"
                disabled={loading}
              />
              )}
              
              <Input
                label="邮箱地址"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                placeholder="请输入邮箱地址"
                disabled={loading}
              />
              
              <Input
                label="密码"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password}
                placeholder="请输入密码"
                disabled={loading}
              />
              
              {mode === 'register' && (
                <Input
                  label="确认密码"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  placeholder="请再次输入密码"
                  disabled={loading}
                />
              )}
              
              {errors.submit && (
                <div className="text-red-600 text-sm text-center">
                  {errors.submit}
                  {showResendOption && mode === 'login' && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendingEmail || loading}
                        className="text-emerald-600 hover:text-emerald-500 underline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {resendingEmail ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            发送中...
                          </>
                        ) : (
                          '重新发送验证邮件'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mode === 'login' ? '登录中...' : '注册中...'}
                  </>
                ) : (
                  mode === 'login' ? '登录' : '注册'
                )}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-emerald-600 hover:text-emerald-500"
                onClick={() => onModeChange?.(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? '没有账户？立即注册' : '已有账户？立即登录'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}