import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/dictionaries',
    name: 'Dictionaries',
    component: () => import('../views/DictionariesView.vue')
  },
  {
    path: '/words',
    name: 'Words',
    component: () => import('../views/WordsView.vue')
  },
  {
    path: '/word-search',
    name: 'WordSearch',
    component: () => import('../views/WordSearchView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router