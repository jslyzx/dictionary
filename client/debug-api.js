import axios from 'axios'

async function debugAPIResponse() {
  try {
    console.log('=== 调试API响应格式 ===')
    
    // 直接调用API查看原始响应
    const response = await axios.get('/api/word-plans')
    console.log('完整响应:', response)
    console.log('响应数据:', response.data)
    console.log('响应数据类型:', typeof response.data)
    
    if (response.data) {
      console.log('响应数据的data字段:', response.data.data)
      console.log('响应数据的data字段类型:', typeof response.data.data)
      console.log('是否为数组:', Array.isArray(response.data.data))
    }
    
  } catch (error) {
    console.error('API调用失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      console.error('错误状态:', error.response.status)
    }
  }
}

// 运行调试
debugAPIResponse()