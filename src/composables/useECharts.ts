import { ref, shallowRef, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'

export function useECharts(optionFn: () => any) {
  const chartRef = ref<HTMLDivElement | null>(null)
  const chartInstance = shallowRef<echarts.ECharts | null>(null)

  function init() {
    if (chartRef.value && !chartInstance.value) {
      chartInstance.value = echarts.init(chartRef.value)
      chartInstance.value.setOption(optionFn())
    }
  }

  function resize() {
    chartInstance.value?.resize()
  }

  function updateOption() {
    chartInstance.value?.setOption(optionFn(), true)
  }

  onMounted(() => {
    init()
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
