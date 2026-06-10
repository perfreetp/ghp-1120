<template>
  <div>
    <div class="page-header">
      <h2>楼层管理</h2>
      <div class="flex gap-12">
        <el-select v-model="selectedFloor" placeholder="选择楼层" style="width: 200px">
          <el-option v-for="f in floorList" :key="f.id" :label="f.name" :value="f.number" />
        </el-select>
        <el-radio-group v-model="compareType">
          <el-radio-button label="mom">环比</el-radio-button>
          <el-radio-button label="yoy">同比</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="stat-grid">
      <div v-for="item in compareData" :key="item.period" class="stat-card electric">
        <div class="stat-label">{{ item.period }}</div>
        <div class="stat-value">{{ formatNumber(item.current) }}<span class="stat-unit">kWh</span></div>
        <div class="flex-between" style="margin-top: 8px; font-size: 12px;">
          <span class="text-muted">{{ compareType === 'mom' ? '环比' : '同比去年' }}</span>
          <span :class="getCompareClass(compareType === 'mom' ? item.mom : item.yoy)">
            <el-icon style="vertical-align: middle;"><component :is="(compareType === 'mom' ? item.mom : item.yoy) >= 0 ? 'Top' : 'Bottom'" /></el-icon>
            {{ Math.abs(compareType === 'mom' ? item.mom : item.yoy) }}%
          </span>
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 20px;">
      <div class="card mb-0">
        <div class="card-title">
          <span>房间能耗曲线</span>
          <el-select v-model="curveType" size="small" style="width: 120px">
            <el-option label="用电" value="electric" />
            <el-option label="用水" value="water" />
            <el-option label="空调" value="ac" />
            <el-option label="照明" value="light" />
          </el-select>
        </div>
        <div ref="roomCurveRef" class="chart-container"></div>
      </div>

      <div class="card mb-0">
        <div class="card-title">
          <span>能耗对比分析</span>
          <el-tag size="small" type="info">{{ compareType === 'mom' ? '环比分析' : '同比分析' }}</el-tag>
        </div>
        <div ref="compareChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="card" style="margin-top: 20px;">
      <div class="card-title">
        <span>设备开关状态</span>
        <div class="flex gap-8">
          <el-tag v-for="t in ['all', 'electric', 'water', 'ac', 'light']" :key="t"
            :type="deviceFilter === t ? 'primary' : 'info'"
            effect="plain"
            size="small"
            class="cursor-pointer"
            @click="deviceFilter = t as any">
            {{ t === 'all' ? '全部' : typeLabels[t as EnergyType] }}
          </el-tag>
        </div>
      </div>
      <el-table :data="filteredDevices" size="default" stripe>
        <el-table-column prop="id" label="设备编号" width="110" />
        <el-table-column prop="name" label="设备名称" min-width="160" />
        <el-table-column prop="type" label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small" :class="`tag-${row.type}`" effect="light">{{ typeLabels[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="floor" label="楼层" width="80" align="center" />
        <el-table-column prop="room" label="位置" min-width="140" />
        <el-table-column prop="power" label="功率(kW)" width="110" align="right">
          <template #default="{ row }">{{ row.power.toFixed(1) }}</template>
        </el-table-column>
        <el-table-column prop="runHours" label="累计运行(h)" width="130" align="right">
          <template #default="{ row }">{{ row.runHours.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'on' ? 'success' : 'info'" size="small" effect="dark" round>
              <el-icon style="margin-right: 3px; vertical-align: middle;"><component :is="row.status === 'on' ? 'VideoPlay' : 'VideoPause'" /></el-icon>
              {{ row.status === 'on' ? '运行中' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdate" label="最后更新" width="170">
          <template #default="{ row }">{{ formatTime(row.lastUpdate) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <el-button :type="row.status === 'on' ? 'danger' : 'success'" size="small" link>
              {{ row.status === 'on' ? '关闭' : '开启' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card">
      <div class="card-title">
        <span>同比环比数据</span>
      </div>
      <div class="grid-4">
        <div v-for="c in compareData" :key="c.period" class="p-16 bg-gray-50 rounded-6">
          <div class="text-14 text-muted mb-8">{{ c.period }}</div>
          <div class="flex-between mb-8">
            <span class="text-20 font-semibold">{{ formatNumber(c.current) }} kWh</span>
            <span class="text-sm" :class="getCompareClass(c.yoy)">
              同比 {{ c.yoy >= 0 ? '+' : '' }}{{ c.yoy }}%
            </span>
          </div>
          <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all"
              :style="getBarStyle(c)"></div>
          </div>
          <div class="flex-between mt-8 text-sm text-muted">
            <span>环比: {{ formatNumber(c.lastMonth) }} kWh</span>
            <span :class="getCompareClass(c.mom)">{{ c.mom >= 0 ? '+' : '' }}{{ c.mom }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { EnergyType, CompareData } from '@/types'
import { energyService, archiveService } from '@/services'
import { useECharts } from '@/composables/useECharts'

const selectedFloor = ref<number | undefined>(undefined)
const compareType = ref('mom')
const curveType = ref<EnergyType>('electric')
const deviceFilter = ref<'all' | EnergyType>('all')

const typeLabels: Record<EnergyType, string> = {
  electric: '用电', water: '用水', ac: '空调', light: '照明'
}

const roomCurveData = ref<Awaited<ReturnType<typeof energyService.getRoomCurves>>>([])
const deviceList = ref<Awaited<ReturnType<typeof energyService.getDeviceStatus>>>([])
const compareData = ref<Awaited<ReturnType<typeof energyService.getCompareData>>>([])
const floorList = ref<Awaited<ReturnType<typeof archiveService.getFloors>>>([])

const filteredDevices = computed(() => {
  if (deviceFilter.value === 'all') return deviceList.value
  return deviceList.value.filter(d => d.type === deviceFilter.value)
})

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

function formatTime(s: string): string {
  return new Date(s).toLocaleString('zh-CN')
}

function getCompareClass(v: number): string {
  return v >= 0 ? 'text-danger' : 'text-success'
}

function getBarStyle(c: CompareData) {
  const maxVal = Math.max(...compareData.value.map(x => x.current))
  const width = Math.min(100, (c.current / maxVal) * 100)
  return { width: width + '%', background: '#409EFF' }
}

const roomCurveOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, textStyle: { fontSize: 12 } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: roomCurveData.value[0]?.time || [], axisLabel: { fontSize: 11 } },
  yAxis: { type: 'value', name: curveType.value === 'water' ? '吨' : 'kWh' },
  color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#722ED1'],
  series: roomCurveData.value.map(r => ({
    name: r.roomName,
    type: 'line',
    smooth: true,
    data: r[curveType.value],
    symbol: 'none',
    lineStyle: { width: 2 }
  }))
}))

const { chartRef: roomCurveRef, updateOption: updateRoomCurve } = useECharts(() => roomCurveOption.value)

const compareOption = computed(() => {
  const periods = compareData.value.map(c => c.period)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['本期', compareType.value === 'mom' ? '上期' : '去年同期', '差异%'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: periods },
    yAxis: [
      { type: 'value', name: 'kWh' },
      { type: 'value', name: '百分比(%)', axisLabel: { formatter: '{value}%' } }
    ],
    series: [
      { name: '本期', type: 'bar', data: compareData.value.map(c => c.current), itemStyle: { color: '#409EFF', borderRadius: [4,4,0,0] }, barWidth: '20%' },
      { name: compareType.value === 'mom' ? '上期' : '去年同期', type: 'bar', data: compareData.value.map(c => compareType.value === 'mom' ? c.lastMonth : c.lastYear), itemStyle: { color: '#909399', borderRadius: [4,4,0,0] }, barWidth: '20%' },
      {
        name: '差异%', type: 'line', yAxisIndex: 1, data: compareData.value.map(c => compareType.value === 'mom' ? c.mom : c.yoy),
        itemStyle: { color: '#E6A23C' }, lineStyle: { width: 2.5 }, symbol: 'circle', symbolSize: 8
      }
    ]
  }
})

const { chartRef: compareChartRef, updateOption: updateCompare } = useECharts(() => compareOption.value)

watch([roomCurveData, curveType, compareData, compareType], () => {
  updateRoomCurve?.()
  updateCompare?.()
}, { deep: true })

watch(selectedFloor, async (newFloor) => {
  if (newFloor === undefined) return
  const [r, d] = await Promise.all([
    energyService.getRoomCurves(newFloor),
    energyService.getDeviceStatus({ floor: newFloor })
  ])
  roomCurveData.value = r
  deviceList.value = d
  updateRoomCurve?.()
})

onMounted(async () => {
  const [f, c] = await Promise.all([
    archiveService.getFloors(),
    energyService.getCompareData()
  ])
  floorList.value = f
  compareData.value = c
  if (f.length > 0) {
    selectedFloor.value = f[0].number
    const [r, d] = await Promise.all([
      energyService.getRoomCurves(selectedFloor.value),
      energyService.getDeviceStatus({ floor: selectedFloor.value })
    ])
    roomCurveData.value = r
    deviceList.value = d
  }
})
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.p-16 { padding: 16px; }
.bg-gray-50 { background: #fafafa; }
.rounded-6 { border-radius: 6px; }
.mb-8 { margin-bottom: 8px; }
.mt-8 { margin-top: 8px; }
.text-14 { font-size: 14px; }
.text-20 { font-size: 20px; }
.font-semibold { font-weight: 600; }
.bg-gray-200 { background: #e4e7ed; }
.rounded-full { border-radius: 9999px; }
.overflow-hidden { overflow: hidden; }
.transition-all { transition: all 0.3s; }
.h-2 { height: 8px; }
.h-full { height: 100%; }
.w-full { width: 100%; }
</style>
