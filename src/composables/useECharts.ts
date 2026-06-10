import { ref, shallowRef, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

export function useECharts(optionFn: () => any) {
  const chartRef = ref<HTMLDivElement | null>(null)
  const chartInstance = shallowRef<echarts.ECharts | null>(null)
  let mounted = false

  function init() {
    if (chartRef.value && !chartInstance.value) {
      chartInstance.value = echarts.init(chartRef.value)
      chartInstance.value.setOption(optionFn())
      chartInstance.value.resize()
    }
  }

  function ensureInit() {
    if (!chartInstance.value && chartRef.value && mounted) {
      init()
    }
  }

  function resize() {
    ensureInit()
    chartInstance.value?.resize()
  }

  function updateOption() {
    ensureInit()
    if (!chartInstance.value) {
      nextTick(() => {
        init()
        chartInstance.value?.setOption(optionFn(), true)
        chartInstance.value?.resize()
      })
      return
    }
    chartInstance.value.setOption(optionFn(), true)
  }

  onMounted(async () => {
    mounted = true
    init()
    if (!chartInstance.value) {
      await nextTick()
      init()
    }
    if (!chartInstance.value) {
      setTimeout(() => init(), 50)
    }
    window.addEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    chartInstance.value?.dispose()
    chartInstance.value = null
  })

  return {
    chartRef,
    chartInstance,
    updateOption,
    resize
  }
}
