// this is how our project handles routing. this will be helpful to navigate to other pages with the navbar component.
// this is the logic behind navbar, how it actually works
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MoodCalendar from '../views/MoodCalendar.vue'
import AddPlaylist from '../views/AddPlaylist.vue';

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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
  path: '/mood-calendar',
  name: 'moodcalendar',
  component: MoodCalendar,
},
{
  path: '/add-playlist',
  name: 'addplaylist',
  component: AddPlaylist,
},
    {
      path: '/contact',
      name: 'contact',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/ContactView.vue'),
    }
],
})

export default router
