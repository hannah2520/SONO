import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/sono/'),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
    {
      path: '/discover',
      name: 'musicrecommendation',
      component: () => import('../views/MusicRecommendation.vue'),
    },
    { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue') },
    {
      path: '/callback',
      name: 'spotify-callback',
      component: () => import('../views/SpotifyCallback.vue'),
    },
    {
      path: '/mood-calendar',
      name: 'mood-calendar',
      component: () => import('../views/MoodCalendar.vue'),
    },
    {
      path: '/add-playlist',
      name: 'add-playlist',
      component: () => import('../views/AddPlaylist.vue'),
    },
    {
      path: '/chatbot',
      name: 'chatbot',
      component: () => import('../views/ChatbotView.vue'),
    },
  ],
})

export default router
