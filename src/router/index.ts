import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/overview'
  },
  {
    path: '/overview',
    name: 'Overview',
    component: () => import('@/views/Overview.vue'),
    meta: { title: '总览', icon: 'DataAnalysis' }
  },
  {
    path: '/floor',
    name: 'Floor',
    component: () => import('@/views/Floor.vue'),
    meta: { title: '楼层', icon: 'OfficeBuilding' }
  },
  {
    path: '/strategy',
    name: 'Strategy',
    component: () => import('@/views/Strategy.vue'),
    meta: { title: '策略', icon: 'Setting' }
  },
  {
    path: '/alarm',
    name: 'Alarm',
    component: () => import('@/views/Alarm.vue'),
    meta: { title: '告警', icon: 'Bell' }
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/views/Report.vue'),
    meta: { title: '报表', icon: 'Document' }
  },
  {
    path: '/workorder',
    name: 'WorkOrder',
    component: () => import('@/views/WorkOrder.vue'),
    meta: { title: '工单', icon: 'Tickets' }
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('@/views/Archive.vue'),
    meta: { title: '档案', icon: 'Folder' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '楼宇能耗运营台'} - 楼宇能耗运营台`
  next()
})

export default router
