import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/story-book',
      name: 'story-book',
      component: () => import('../views/StoryBook/StoryBook.vue'),
      children: [
        {
          path: 'button',
          name: 'story-book:button',
          component: () => import('../views/StoryBook/StoryBookButton/StoryBookButton.vue')
        }
      ]
    }
  ]
})

export default router
