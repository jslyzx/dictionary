<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <div class="logo">英语词典系统</div>
        <nav class="nav-menu">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/dictionaries" class="nav-item">字典管理</router-link>
          <router-link to="/words" class="nav-item">单词管理</router-link>
          <router-link to="/word-search" class="nav-item">单词查询</router-link>
        </nav>
      </div>
    </header>
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f0f2f5;
  color: #333;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
}

.nav-menu {
  display: flex;
  gap: 16px;
}

.nav-item {
  padding: 8px 16px;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: #1890ff;
  background-color: #e6f7ff;
}

.main-content {
  flex: 1;
  padding-top: 84px;
  padding-bottom: 24px;
  padding-left: 24px;
  padding-right: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
