<template>
  <div class="layout-container">
    <header class="layout-header">
      <div class="layout-logo">
        <el-icon :size="24" color="#409EFF"><DataAnalysis /></el-icon>
        <span>楼宇能耗运营台</span>
      </div>
      <nav class="layout-menu">
        <div
          v-for="item in menuItems"
          :key="item.path"
          class="layout-menu-item"
          :class="{ active: store.currentRoute === item.path }"
          @click="handleNavigate(item.path)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
          <el-badge v-if="item.path === '/alarm' && store.alarmCount > 0" :value="store.alarmCount" class="ml-2" />
        </div>
      </nav>
      <div class="layout-user">
        <el-button type="primary" link @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-dropdown>
          <span class="flex-center gap-8 cursor-pointer">
            <el-avatar :size="32" style="background: #409EFF;">
              {{ store.user.name.slice(-2) }}
            </el-avatar>
            <span>{{ store.user.name }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item><el-icon><User /></el-icon>个人中心</el-dropdown-item>
              <el-dropdown-item><el-icon><Setting /></el-icon>系统设置</el-dropdown-item>
              <el-dropdown-item divided><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    <div class="layout-body">
      <main class="layout-content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/overview', title: '总览', icon: 'DataAnalysis' },
  { path: '/floor', title: '楼层', icon: 'OfficeBuilding' },
  { path: '/strategy', title: '策略', icon: 'Setting' },
  { path: '/alarm', title: '告警', icon: 'Bell' },
  { path: '/report', title: '报表', icon: 'Document' },
  { path: '/workorder', title: '工单', icon: 'Tickets' },
  { path: '/archive', title: '档案', icon: 'Folder' }
]

function handleNavigate(path: string) {
  if (store.currentRoute !== path) {
    router.push(path)
  }
}

function refreshData() {
  store.loadAlarmStats()
  ElMessage.success('数据已刷新')
}

watch(() => route.path, (path) => {
  store.setRoute(path)
}, { immediate: true })

onMounted(() => {
  store.loadAlarmStats()
  setInterval(() => {
    store.loadAlarmStats()
  }, 60000)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.ml-2 {
  margin-left: 4px;
}
</style>
