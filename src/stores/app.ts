import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Alarm } from '@/types'
import { alarmService } from '@/services'

export const useAppStore = defineStore('app', () => {
  const currentRoute = ref('/overview')
  const alarmCount = ref(0)
  const criticalCount = ref(0)
  const user = ref({ name: '能管员 - 王主管', role: '能耗管理员' })

  function setRoute(route: string) {
    currentRoute.value = route
  }

  async function loadAlarmStats() {
    const stats = await alarmService.getStats()
    alarmCount.value = stats.pending + stats.processing
    criticalCount.value = stats.critical
  }

  return {
    currentRoute,
    alarmCount,
    criticalCount,
    user,
    setRoute,
    loadAlarmStats
  }
})
