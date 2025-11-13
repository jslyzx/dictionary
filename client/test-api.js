import { getWordPlans } from './services/wordPlans'

async function testWordPlansAPI() {
  try {
    console.log('测试单词计划API...')
    const plans = await getWordPlans()
    console.log('API响应结果:', plans)
    console.log('结果类型:', typeof plans)
    console.log('是否为数组:', Array.isArray(plans))
    console.log('数组长度:', plans?.length)
    
    if (plans && plans.length > 0) {
      console.log('第一个计划:', plans[0])
    }
  } catch (error) {
    console.error('API测试失败:', error)
  }
}

// 运行测试
testWordPlansAPI()