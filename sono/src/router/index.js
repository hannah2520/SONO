// this is how our project handles routing. this will be helpful to navigate to other pages with the navbar component.
// this is the logic behind navbar, how it actually works
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },

    {
      path: '/discover',
      name: 'musicrecommendation',
      component: () => import('../views/MusicRecommendation.vue'),
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/ContactView.vue'),
    },
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
  ],
})

export default router
