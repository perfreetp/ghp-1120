<template>
  <div>
    <div class="page-header">
      <h2>能耗总览</h2>
      <div class="flex gap-12">
        <el-radio-group v-model="rangeType" size="default">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month" checked>本月</el-radio-button>
          <el-radio-button label="year">本年</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="default"
        />
      </div>
    </div>

    <div class="stat-grid">
      <div v-for="item in overviewData" :key="item.type" :class="['stat-card', item.type]">
        <div class="stat-label">{{ typeLabels[item.type] }}能耗</div>
        <div class="stat-value">
          {{ formatNumber(item.value) }}
          <span class="stat-unit">{{ item.unit }}</span>
        </div>
        <div :class="['stat-trend', item.trendType]">
          <el-icon><component :is="item.trendType === 'up' ? 'Top' : 'Bottom'" /></el-icon>
          {{ Math.abs(item.trend) }}% 较上月
        </div>
        <div class="stat-icon">
          <el-icon :size="28"><component :is="typeIcons[item.type]" /></el-icon>
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 20px;">
      <div class="card mb-0">
        <div class="card-title">
          <span>分区能耗占比</span>
          <el-tag type="info" size="small">本月累计</el-tag>
        </div>
        <div ref="zoneChartRef" class="chart-container"></div>
      </div>
      <div class="card mb-0">
        <div class="card-title">
          <span>峰谷时段用电</span>
          <div class="flex gap-8 text-sm">
            <span class="text-muted">总计:</span>
            <span class="text-primary font-semibold">{{ totalPeakElectric }} kWh</span>
          </div>
        </div>
        <div ref="peakChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 20px;">
      <div class="card mb-0">
        <div class="card-title">
          <span>费用估算</span>
          <el-tag type="warning" size="small">预算执行率: {{ budgetRate }}%</el-tag>
        </div>
        <el-table :data="costData" size="default">
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :class="`tag-${row.type}`" effect="light">{{ typeLabels[row.type] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="current" label="当前费用" width="130">
            <template #default="{ row }">¥{{ formatNumber(row.current * row.rate) }}</template>
          </el-table-column>
          <el-table-column prop="predicted" label="预计费用" width="130">
            <template #default="{ row }">¥{{ formatNumber(row.predicted * row.rate) }}</template>
          </el-table-column>
          <el-table-column prop="budget" label="预算" width="130">
            <template #default="{ row }">¥{{ formatNumber(row.budget) }}</template>
          </el-table-column>
          <el-table-column label="预算执行">
            <template #default="{ row }">
              <el-progress
                :percentage="Math.min(100, Math.round((row.current * row.rate / row.budget) * 100))"
                :color="getProgressColor(row.current * row.rate / row.budget)"
                :stroke-width="14"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="card mb-0">
        <div class="card-title">
          <span>异常能耗排行</span>
          <el-button type="primary" link size="small" @click="$router.push('/alarm')">查看全部</el-button>
        </div>
        <el-table :data="abnormalData" size="default" max-height="310">
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column prop="name" label="对象" min-width="140" />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag size="small" :class="`tag-${row.type}`" effect="light">{{ shortLabels[row.type] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" min-width="120" show-overflow-tooltip />
          <el-table-column label="超阈值" width="90" align="right">
            <template #default="{ row }">
              <span :class="row.level === 'high' ? 'text-danger' : row.level === 'medium' ? 'text-warning' : 'text-primary'">
                {{ row.percent }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="等级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.level === 'high' ? 'danger' : row.level === 'medium' ? 'warning' : 'info'" size="small">
                {{ levelLabels[row.level] }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="card" style="margin-top: 20px;">
      <div class="card-title">
        <span>24小时能耗趋势</span>
        <el-radio-group v-model="trendType" size="small">
          <el-radio-button label="electric">用电</el-radio-button>
          <el-radio-button label="water">用水</el-radio-button>
          <el-radio-button label="ac">空调</el-radio-button>
          <el-radio-button label="light">照明</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="trendChartRef" class="chart-container-lg"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { EnergyType } from '@/types'
import { energyService } from '@/services'
import { useECharts } from '@/composables/useECharts'
import { mockEnergyOverview, mockZoneEnergy, mockPeakValley, mockCostEstimate, mockAbnormalRank } from '@/mock'

const rangeType = ref('month')
const dateRange = ref<[Date, Date]>()
const trendType = ref<EnergyType>('electric')

const overviewData = ref(mockEnergyOverview)
const zoneData = ref(mockZoneEnergy)
const peakValleyData = ref(mockPeakValley)
const costData = ref(mockCostEstimate)
const abnormalData = ref(mockAbnormalRank)

function genDefaultTrend(type: EnergyType = 'electric') {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const base = type === 'electric' ? 4000 : type === 'water' ? 120 : type === 'ac' ? 2500 : 800
  const data = hours.map(() => Math.round(base * (0.5 + Math.random() * 1.2)))
  return { time: hours, data }
}
const trendHourly = ref<{ time: string[]; data: number[] }>(genDefaultTrend('electric'))

const typeLabels: Record<EnergyType, string> = {
  electric: '用电', water: '用水', ac: '空调', light: '照明'
}
const shortLabels: Record<EnergyType, string> = {
  electric: '电', water: '水', ac: '空调', light: '照明'
}
const typeIcons: Record<EnergyType, string> = {
  electric: 'Lightning', water: 'Watermelon', ac: 'Snowflake', light: 'Sunny'
}
const levelLabels = { high: '高', medium: '中', low: '低' }

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

const totalPeakElectric = computed(() => peakValleyData.value.reduce((s, x) => s + x.electric, 0))

const budgetRate = computed(() => {
  const totalCurrent = costData.value.reduce((s, x) => s + x.current * x.rate, 0)
  const totalBudget = costData.value.reduce((s, x) => s + x.budget, 0)
  return totalBudget > 0 ? Math.round((totalCurrent / totalBudget) * 100) : 0
})

function getProgressColor(ratio: number): string {
  if (ratio >= 0.9) return '#F56C6C'
  if (ratio >= 0.75) return '#E6A23C'
  return '#67C23A'
}

const zoneOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
  legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { fontSize: 12 } },
  series: [{
    type: 'pie',
    radius: ['45%', '72%'],
    center: ['35%', '50%'],
    avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{d}%', fontSize: 12 },
    data: zoneData.value.map(z => ({ name: z.name, value: z.total }))
  }]
}))

const { chartRef: zoneChartRef, updateOption: updateZone } = useECharts(() => zoneOption.value)

const peakOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => {
    const d = p[0]
    return `${d.name}<br/>用电量: ${d.value.toLocaleString()} kWh`
  }},
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: { type: 'category', data: peakValleyData.value.map(x => x.period), axisLabel: { fontSize: 11, rotate: 20 } },
  yAxis: { type: 'value', name: 'kWh', axisLabel: { fontSize: 11 } },
  series: [{
    type: 'bar',
    data: peakValleyData.value.map(x => ({
      value: x.electric,
      itemStyle: {
        color: x.type === 'peak' ? '#F56C6C' : x.type === 'flat' ? '#E6A23C' : '#67C23A',
        borderRadius: [4, 4, 0, 0]
      }
    })),
    barWidth: '50%',
    label: { show: true, position: 'top', fontSize: 11, formatter: (p: any) => (p.value / 1000).toFixed(1) + 'k' }
  }]
}))

const { chartRef: peakChartRef, updateOption: updatePeak } = useECharts(() => peakOption.value)

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['当前周', '上周同期'], top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: trendHourly.value.time, axisLabel: { fontSize: 11 } },
  yAxis: { type: 'value', name: typeLabels[trendType.value] + (trendType.value === 'water' ? '(吨)' : '(kWh)'), axisLabel: { fontSize: 11 } },
  series: [
    {
      name: '当前周',
      type: 'line',
      smooth: true,
      data: trendHourly.value.data,
      itemStyle: { color: '#409EFF' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: 'rgba(64, 158, 255, 0.4)' }, { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
      ]}},
      lineStyle: { width: 2.5 }
    },
    {
      name: '上周同期',
      type: 'line',
      smooth: true,
      data: trendHourly.value.data.map(v => Math.round(v * (0.85 + Math.random() * 0.3))),
      itemStyle: { color: '#909399' },
      lineStyle: { type: 'dashed', width: 2 }
    }
  ]
}))

const { chartRef: trendChartRef, updateOption: updateTrend } = useECharts(() => trendOption.value)

async function loadAll() {
  const [o1, o2, o3, o4, o5, o6] = await Promise.all([
    energyService.getOverview(),
    energyService.getZoneEnergy(),
    energyService.getPeakValley(),
    energyService.getCostEstimate(),
    energyService.getAbnormalRank(),
    loadTrend()
  ])
}

async function loadTrend() {
  const o = await energyService.getHourlyTrend(trendType.value)
  trendHourly.value = o
}

watch(trendType, () => { loadTrend() })

watch([zoneData, peakValleyData, trendHourly], () => {
  updateZone?.()
  updatePeak?.()
  updateTrend?.()
}, { deep: true })

onMounted(async () => {
  const [o1, o2, o3, o4, o5] = await Promise.all([
    energyService.getOverview(),
    energyService.getZoneEnergy(),
    energyService.getPeakValley(),
    energyService.getCostEstimate(),
    energyService.getAbnormalRank()
  ])
  overviewData.value = o1
  zoneData.value = o2
  peakValleyData.value = o3
  costData.value = o4
  abnormalData.value = o5
  await loadTrend()
})
</script>
