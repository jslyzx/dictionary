<template>
  <div class="home-container">
    <div class="welcome-section">
      <h1>欢迎使用英语词典系统</h1>
      <p>这是一个功能强大的英语词典管理和查询系统</p>
      <div class="feature-cards">
        <div class="feature-card">
          <h3>字典管理</h3>
          <p>创建、编辑和管理您的词典集合</p>
          <router-link to="/dictionaries" class="btn">开始使用</router-link>
        </div>
        <div class="feature-card">
          <h3>单词管理</h3>
          <p>添加、编辑和删除单词条目</p>
          <router-link to="/words" class="btn">开始使用</router-link>
        </div>
        <div class="feature-card">
          <h3>单词查询</h3>
          <p>快速搜索和查看单词详细信息</p>
          <router-link to="/word-search" class="btn">开始使用</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  padding: 40px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.welcome-section h1 {
  color: #1890ff;
  margin-bottom: 16px;
  font-size: 32px;
}

.welcome-section p {
  color: #666;
  margin-bottom: 40px;
  font-size: 18px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.feature-card {
  background-color: #f9f9f9;
  padding: 32px;
  border-radius: 8px;
  transition: all 0.3s;
  border: 1px solid #e8e8e8;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #1890ff;
}

.feature-card h3 {
  color: #333;
  margin-bottom: 12px;
  font-size: 20px;
}

.feature-card p {
  color: #666;
  margin-bottom: 24px;
  font-size: 14px;
}

.btn {
  display: inline-block;
  padding: 8px 24px;
  background-color: #1890ff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 14px;
}

.btn:hover {
  background-color: #40a9ff;
}
</style>