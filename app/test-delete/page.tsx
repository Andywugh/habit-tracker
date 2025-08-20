'use client'

import React, { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Trash2 } from 'lucide-react'

export default function TestDeletePage() {
  const [testResult, setTestResult] = useState<string>('')

  // 模拟删除函数
  const mockDeleteHabit = async (id: string) => {
    console.log('模拟删除习惯，ID:', id)
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { error: null }
  }

  // 测试删除功能
  const testDeleteFunction = async () => {
    console.log('开始测试删除功能...')
    setTestResult('测试开始...')
    
    try {
      // 创建自定义确认对话框
      const confirmDelete = () => {
        return new Promise<boolean>((resolve) => {
          const modal = document.createElement('div')
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
              <p class="text-gray-600 mb-6">确定要删除"测试习惯"吗？这将同时删除所有相关记录，此操作无法撤销。</p>
              <div class="flex justify-end space-x-3">
                <button id="cancel-btn" class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  取消
                </button>
                <button id="confirm-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  删除
                </button>
              </div>
            </div>
          `
          
          document.body.appendChild(modal)
          
          const cancelBtn = modal.querySelector('#cancel-btn')
          const confirmBtn = modal.querySelector('#confirm-btn')
          
          const cleanup = () => {
            document.body.removeChild(modal)
          }
          
          cancelBtn?.addEventListener('click', () => {
            cleanup()
            resolve(false)
          })
          
          confirmBtn?.addEventListener('click', () => {
            cleanup()
            resolve(true)
          })
          
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              cleanup()
              resolve(false)
            }
          })
        })
      }
      
      console.log('显示确认对话框...')
      setTestResult('显示确认对话框...')
      
      const confirmResult = await confirmDelete()
      console.log('用户确认结果:', confirmResult)
      
      if (confirmResult) {
        setTestResult('用户确认删除，调用API...')
        console.log('开始调用删除API...')
        
        const result = await mockDeleteHabit('test-habit-id')
        console.log('API返回结果:', result)
        
        if (result.error) {
          setTestResult(`删除失败: ${result.error}`)
        } else {
          setTestResult('删除成功！')
          console.log('删除成功')
        }
      } else {
        setTestResult('用户取消删除')
        console.log('用户取消删除')
      }
    } catch (error) {
      console.error('测试过程中发生错误:', error)
      setTestResult(`测试失败: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">删除功能测试页面</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">测试删除功能</h2>
            <p className="text-gray-600 mb-4">
              这个页面用于测试自定义确认对话框和删除功能是否正常工作。
            </p>
            
            <Button
              onClick={testDeleteFunction}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>测试删除功能</span>
            </Button>
            
            {testResult && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">测试结果:</h3>
                <p className="text-blue-800">{testResult}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">调试说明</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 打开浏览器开发者工具的控制台查看详细日志</p>
              <p>• 点击"测试删除功能"按钮会显示自定义确认对话框</p>
              <p>• 确认删除后会模拟API调用过程</p>
              <p>• 所有步骤都会在控制台输出详细日志</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}