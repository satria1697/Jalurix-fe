import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../components/layout/AppShell.vue'),
      children: [
        { path: '', redirect: '/requests' },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('../features/customers/views/CustomerList.vue')
        },
        {
          path: 'customers/new',
          name: 'customer-new',
          component: () => import('../features/customers/views/CustomerForm.vue')
        },
        {
          path: 'customers/:id/edit',
          name: 'customer-edit',
          component: () => import('../features/customers/views/CustomerForm.vue')
        },
        {
          path: 'customers/:id',
          name: 'customer-detail',
          component: () => import('../features/customers/views/CustomerDetail.vue')
        },
        {
          path: 'requests',
          name: 'requests',
          component: () => import('../features/requests/views/RequestList.vue')
        },
        {
          path: 'requests/new',
          name: 'request-new',
          component: () => import('../features/requests/views/RequestForm.vue')
        },
        {
          path: 'requests/:id/edit',
          name: 'request-edit',
          component: () => import('../features/requests/views/RequestForm.vue')
        },
        {
          path: 'requests/:id',
          name: 'request-detail',
          component: () => import('../features/requests/views/RequestDetail.vue')
        },
        {
          path: 'quotations',
          name: 'quotations',
          component: () => import('../features/quotations/views/QuotationList.vue')
        },
        {
          path: 'requests/:requestId/quotations',
          name: 'quotation-list',
          component: () => import('../features/quotations/views/QuotationList.vue')
        },
        {
          path: 'requests/:requestId/quotations/new',
          name: 'quotation-new',
          component: () => import('../features/quotations/views/QuotationForm.vue')
        },
        {
          path: 'requests/:requestId/quotations/:quoteId/edit',
          name: 'quotation-edit',
          component: () => import('../features/quotations/views/QuotationForm.vue')
        },
        {
          path: 'requests/:requestId/quotations/:quoteId',
          name: 'quotation-detail',
          component: () => import('../features/quotations/views/QuotationDetail.vue')
        },
        { path: ':pathMatch(.*)*', component: () => import('../views/NotFound.vue') }
      ]
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
