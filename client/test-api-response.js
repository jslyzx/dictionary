// 测试 API 响应格式
import { request } from './src/services/apiClient'

async function testApiResponse() {
  try {
    console.log('测试 /api/word-plans 响应格式...')
    
    // 测试 wordPlans API
    const response = await request({
      method: 'GET',
      url: '/api/word-plans'
    })
    
    console.log('完整的响应对象:', JSON.stringify(response, null, 2))
    console.log('响应类型:', typeof response)
    console.log('是否为数组:', Array.isArray(response))
    
    if (response && typeof response === 'object') {
      console.log('响应对象的键:', Object.keys(response))
      if (response.data) {
        console.log('response.data 类型:', typeof response.data)
        console.log('response.data 是否为数组:', Array.isArray(response.data))
        console.log('response.data 长度:', response.data?.length)
      }
    }
    
  } catch (error) {
    console.error('API 调用失败:', error)
  }
}

testApiResponse()