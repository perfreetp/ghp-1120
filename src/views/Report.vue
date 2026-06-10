<template>
  <div>
    <div class="page-header">
      <h2>报表中心</h2>
      <div class="flex gap-8">
        <el-date-picker v-model="reportMonth" type="month" placeholder="选择月份" value-format="YYYY-MM" size="default" />
        <el-dropdown @command="handleExport">
          <el-button type="primary">
            <el-icon><Download /></el-icon> 导出报表
            <el-icon style="margin-left: 4px"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="tenant:excel">租户分摊 (Excel)</el-dropdown-item>
              <el-dropdown-item command="tenant:pdf">租户分摊 (PDF)</el-dropdown-item>
              <el-dropdown-item command="dept:excel">部门对账 (Excel)</el-dropdown-item>
              <el-dropdown-item command="dept:pdf">部门对账 (PDF)</el-dropdown-item>
              <el-dropdown-item command="suggestion:excel">节能建议 (Excel)</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="租户分摊" name="tenant">
        <div class="card mb-0">
          <div class="card-title">
            <span>租户能耗分摊明细 - {{ reportMonth || '本月' }}</span>
            <div class="flex gap-8">
              <el-tag type="info">租户总数: {{ tenantList.length }}</el-tag>
              <el-tag type="warning">总费用: ¥{{ formatMoney(totalTenantCost) }}</el-tag>
            </div>
          </div>
          <el-table :data="tenantList" size="default" border stripe show-summary :summary-method="getSummaries">
            <el-table-column prop="tenantId" label="租户编号" width="100" fixed="left" />
            <el-table-column prop="tenantName" label="租户名称" min-width="160" fixed="left" />
            <el-table-column prop="floor" label="楼层" width="80" align="center" />
            <el-table-column prop="area" label="面积(㎡)" width="100" align="right" />
            <el-table-group title="能耗量">
              <el-table-column prop="electric" label="用电(kWh)" width="110" align="right">
                <template #default="{ row }">{{ formatNumber(row.electric) }}</template>
              </el-table-column>
              <el-table-column prop="water" label="用水(吨)" width="100" align="right">
                <template #default="{ row }">{{ formatNumber(row.water) }}</template>
              </el-table-column>
              <el-table-column prop="ac" label="空调(kWh)" width="110" align="right">
                <template #default="{ row }">{{ formatNumber(row.ac) }}</template>
              </el-table-column>
              <el-table-column prop="light" label="照明(kWh)" width="110" align="right">
                <template #default="{ row }">{{ formatNumber(row.light) }}</template>
              </el-table-column>
            </el-table-group>
            <el-table-group title="分摊费用(元)">
              <el-table-column prop="shareElectric" label="电费" width="110" align="right">
                <template #default="{ row }">{{ formatMoney(row.shareElectric) }}</template>
              </el-table-column>
              <el-table-column prop="shareWater" label="水费" width="100" align="right">
                <template #default="{ row }">{{ formatMoney(row.shareWater) }}</template>
              </el-table-column>
              <el-table-column prop="shareAc" label="空调费" width="110" align="right">
                <template #default="{ row }">{{ formatMoney(row.shareAc) }}</template>
              </el-table-column>
              <el-table-column prop="shareLight" label="照明费" width="110" align="right">
                <template #default="{ row }">{{ formatMoney(row.shareLight) }}</template>
              </el-table-column>
            </el-table-group>
            <el-table-column prop="totalCost" label="合计费用" width="130" align="right" fixed="right">
              <template #default="{ row }">
                <span class="text-primary font-semibold">¥{{ formatMoney(row.totalCost) }}</span>
              </template>
              <template #summary>
                <span class="text-danger font-semibold">¥{{ formatMoney(totalTenantCost) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="grid-2" style="margin-top: 20px;">
          <div class="card mb-0">
            <div class="card-title"><span>费用构成占比</span></div>
            <div ref="tenantPieRef" class="chart-container"></div>
          </div>
          <div class="card mb-0">
            <div class="card-title"><span>TOP10 租户能耗费用</span></div>
            <div ref="tenantBarRef" class="chart-container"></div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="部门对账" name="dept">
        <div class="card mb-0">
          <div class="card-title">
            <span>部门能耗对账明细 - {{ reportMonth || '本月' }}</span>
            <div class="flex gap-8">
              <el-tag type="success">预算执行率: {{ budgetExecuteRate }}%</el-tag>
            </div>
          </div>
          <el-table :data="deptList" size="default" border stripe show-summary :summary-method="getDeptSummaries">
            <el-table-column prop="deptId" label="部门编号" width="100" fixed="left" />
            <el-table-column prop="deptName" label="部门名称" min-width="140" fixed="left" />
            <el-table-column prop="manager" label="负责人" width="100" />
            <el-table-column label="预算(元)" width="120" align="right">
              <template #default="{ row }">¥{{ formatMoney(row.budget) }}</template>
            </el-table-column>
            <el-table-column label="实际(元)" width="120" align="right">
              <template #default="{ row }">
                <span :class="row.variance < 0 ? 'text-danger' : 'text-success'">¥{{ formatMoney(row.actual) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="差异(元)" width="120" align="right">
              <template #default="{ row }">
                <span :class="row.variance < 0 ? 'text-danger' : 'text-success'">
                  {{ row.variance >= 0 ? '+' : '' }}¥{{ formatMoney(row.variance) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="差异率" width="110" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.abs(Math.round(row.varianceRate))"
                  :color="row.varianceRate < 0 ? '#F56C6C' : '#67C23A'"
                  :stroke-width="12"
                  :format="() => (row.varianceRate >= 0 ? '+' : '') + row.varianceRate + '%'"
                />
              </template>
            </el-table-column>
            <el-table-group title="能耗分项">
              <el-table-column prop="electric" label="用电(kWh)" width="110" align="right">
                <template #default="{ row }">{{ formatNumber(row.electric) }}</template>
              </el-table-column>
              <el-table-column prop="water" label="用水(吨)" width="100" align="right">
                <template #default="{ row }">{{ formatNumber(row.water) }}</template>
              </el-table-column>
              <el-table-column prop="ac" label="空调(kWh)" width="110" align="right">
                <template #default="{ row }">{{ formatNumber(row.ac) }}</template>
              </el-table-column>
              <el-table-column prop="light" label="照明(kWh)" width="110" align="right">
                <template #default="{ row }">{{ formatNumber(row.light) }}</template>
              </el-table-column>
            </el-table-group>
          </el-table>
        </div>

        <div class="card" style="margin-top: 20px;">
          <div class="card-title"><span>预算执行对比</span></div>
          <div ref="deptChartRef" class="chart-container-lg"></div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="节能建议" name="suggestion">
        <div class="stat-grid" style="margin-bottom: 20px;">
          <div class="stat-card light">
            <div class="stat-label">建议总数</div>
            <div class="stat-value">{{ suggestionList.length }}<span class="stat-unit">项</span></div>
            <div class="stat-icon" style="background: rgba(250,173,20,0.1); color: #faad14;">
              <el-icon :size="28"><Idea /></el-icon>
            </div>
          </div>
          <div class="stat-card electric">
            <div class="stat-label">年节电量估算</div>
            <div class="stat-value">{{ formatNumber(totalSaving) }}<span class="stat-unit">度</span></div>
            <div class="stat-icon" style="background: rgba(64,158,255,0.1); color: #409EFF;">
              <el-icon :size="28"><Lightning /></el-icon>
            </div>
          </div>
          <div class="stat-card water">
            <div class="stat-label">投资总额</div>
            <div class="stat-value">¥{{ formatMoney(totalInvestment) }}<span class="stat-unit">万</span></div>
            <div class="stat-icon" style="background: rgba(19,194,194,0.1); color: #13c2c2;">
              <el-icon :size="28"><Wallet /></el-icon>
            </div>
          </div>
          <div class="stat-card ac">
            <div class="stat-label">平均投资回收期</div>
            <div class="stat-value">{{ avgPayback }}<span class="stat-unit">年</span></div>
            <div class="stat-icon" style="background: rgba(114,46,209,0.1); color: #722ed1;">
              <el-icon :size="28"><Timer /></el-icon>
            </div>
          </div>
        </div>

        <div class="card mb-0">
          <div class="card-title">
            <span>节能建议清单</span>
            <el-button type="primary" size="default" @click="openSuggestionDialog()">
              <el-icon><Plus /></el-icon> 新增建议
            </el-button>
          </div>
          <el-table :data="suggestionList" size="default" stripe>
            <el-table-column width="50" align="center">
              <template #default="{ $index }">
                <el-tag type="primary" effect="dark" round>{{ $index + 1 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="类别" width="110">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="建议项目" min-width="160" />
            <el-table-column prop="description" label="说明" min-width="240" show-overflow-tooltip />
            <el-table-column label="节能潜力(kWh/年)" width="140" align="right">
              <template #default="{ row }">
                <span class="text-success font-semibold">{{ formatNumber(row.savingPotential) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="投资(万元)" width="110" align="right">
              <template #default="{ row }">{{ (row.investment / 10000).toFixed(1) }}</template>
            </el-table-column>
            <el-table-column label="回收期(年)" width="100" align="center">
              <template #default="{ row }">
                <span :class="row.paybackPeriod <= 2 ? 'text-success' : row.paybackPeriod <= 3 ? 'text-warning' : 'text-danger'">{{ row.paybackPeriod }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'" size="small" effect="dark">
                  {{ priorityLabel[row.priority] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTagMap[row.status]" size="small">{{ statusLabelMap[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" link @click="openSuggestionDialog(row)">编辑</el-button>
                <el-button size="small" link type="primary" v-if="row.status === 'pending'" @click="approveSuggestion(row)">审批</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="suggestionDialog.visible" :title="suggestionDialog.isEdit ? '编辑' : '新增' + '节能建议'" width="640px">
      <el-form :model="suggestionDialog.form" label-width="110px">
        <el-form-item label="类别">
          <el-select v-model="suggestionDialog.form.category" style="width: 100%">
            <el-option label="照明系统" value="照明系统" />
            <el-option label="空调系统" value="空调系统" />
            <el-option label="用水管理" value="用水管理" />
            <el-option label="智能控制" value="智能控制" />
            <el-option label="能源管理" value="能源管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="建议项目">
          <el-input v-model="suggestionDialog.form.title" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="suggestionDialog.form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="节能潜力(kWh)">
          <el-input-number v-model="suggestionDialog.form.savingPotential" :min="0" :max="10000000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="投资(元)">
          <el-input-number v-model="suggestionDialog.form.investment" :min="0" :max="100000000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="回收期(年)">
          <el-input-number v-model="suggestionDialog.form.paybackPeriod" :min="0.1" :max="20" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="suggestionDialog.form.priority">
            <el-radio-button label="high">高</el-radio-button>
            <el-radio-button label="medium">中</el-radio-button>
            <el-radio-button label="low">低</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="suggestionDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveSuggestion">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { TenantShare, DeptReconciliation, EnergySuggestion } from '@/types'
import { reportService } from '@/services'
import { useECharts } from '@/composables/useECharts'

const activeTab = ref('tenant')
const reportMonth = ref<string>('')

const tenantList = ref<TenantShare[]>([])
const deptList = ref<DeptReconciliation[]>([])
const suggestionList = ref<EnergySuggestion[]>([])

const priorityLabel = { high: '高', medium: '中', low: '低' }
const statusLabelMap = { pending: '待审批', approved: '已批准', implemented: '已实施' }
const statusTagMap: Record<string, any> = { pending: 'warning', approved: 'primary', implemented: 'success' }

const totalTenantCost = computed(() => tenantList.value.reduce((s, x) => s + x.totalCost, 0))
const totalSaving = computed(() => suggestionList.value.reduce((s, x) => s + x.savingPotential, 0))
const totalInvestment = computed(() => Math.round(suggestionList.value.reduce((s, x) => s + x.investment, 0) / 10000))
const avgPayback = computed(() => {
  if (suggestionList.value.length === 0) return 0
  return (suggestionList.value.reduce((s, x) => s + x.paybackPeriod, 0) / suggestionList.value.length).toFixed(1)
})
const budgetExecuteRate = computed(() => {
  const total = deptList.value.reduce((s, x) => s + x.budget, 0)
  const actual = deptList.value.reduce((s, x) => s + x.actual, 0)
  return total > 0 ? Math.round((actual / total) * 100) : 0
})

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}
function formatMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getSummaries(param: { columns: any[]; data: any[] }) {
  const { columns, data } = param
  const sums: any[] = []
  columns.forEach((col, idx) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (['shareElectric', 'shareWater', 'shareAc', 'shareLight', 'totalCost', 'electric', 'water', 'ac', 'light'].includes(col.property)) {
      sums[idx] = data.reduce((s: number, r: any) => s + (Number(r[col.property]) || 0), 0)
      if (col.property === 'totalCost') sums[idx] = '¥' + formatMoney(sums[idx])
      else if (col.property.startsWith('share')) sums[idx] = formatMoney(sums[idx])
      else sums[idx] = formatNumber(sums[idx])
    } else if (col.property === 'area') {
      sums[idx] = formatNumber(data.reduce((s: number, r: any) => s + Number(r.area || 0), 0))
    } else sums[idx] = ''
  })
  return sums
}

function getDeptSummaries(param: { columns: any[]; data: any[] }) {
  const { columns, data } = param
  const sums: any[] = []
  columns.forEach((col, idx) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (['budget', 'actual', 'variance'].includes(col.property)) {
      const val = data.reduce((s: number, r: any) => s + Number(r[col.property] || 0), 0)
      sums[idx] = (col.property !== 'variance' ? '' : (val >= 0 ? '+' : '')) + '¥' + formatMoney(val)
    } else if (['electric', 'water', 'ac', 'light'].includes(col.property)) {
      sums[idx] = formatNumber(data.reduce((s: number, r: any) => s + Number(r[col.property] || 0), 0))
    } else sums[idx] = ''
  })
  return sums
}

function handleExport(cmd: string) {
  const [type, format] = cmd.split(':') as any
  reportService.exportReport(type, format).then(r => ElMessage.success(r))
}

const tenantPieOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
  legend: { orient: 'vertical', right: '5%', top: 'center' },
  series: [{
    type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { formatter: '{d}%' },
    data: [
      { name: '电费', value: tenantList.value.reduce((s, x) => s + x.shareElectric, 0), itemStyle: { color: '#409EFF' } },
      { name: '水费', value: tenantList.value.reduce((s, x) => s + x.shareWater, 0), itemStyle: { color: '#13c2c2' } },
      { name: '空调费', value: tenantList.value.reduce((s, x) => s + x.shareAc, 0), itemStyle: { color: '#722ed1' } },
      { name: '照明费', value: tenantList.value.reduce((s, x) => s + x.shareLight, 0), itemStyle: { color: '#faad14' } }
    ]
  }]
}))
const { chartRef: tenantPieRef, updateOption: updateTenantPie } = useECharts(() => tenantPieOption.value)

const tenantBarOption = computed(() => {
  const top = [...tenantList.value].sort((a, b) => b.totalCost - a.totalCost).slice(0, 10)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', name: '元' },
    yAxis: { type: 'category', data: top.map(t => t.tenantName).reverse(), axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar', data: top.map(t => t.totalCost).reverse(),
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [
          { offset: 0, color: '#409EFF' }, { offset: 1, color: '#79bbff' }
        ]}
      },
      label: { show: true, position: 'right', formatter: p => '¥' + formatMoney(p.value as number) }
    }]
  }
})
const { chartRef: tenantBarRef, updateOption: updateTenantBar } = useECharts(() => tenantBarOption.value)

const deptOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, data: ['预算', '实际', '差异率%'] },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
  xAxis: { type: 'category', data: deptList.value.map(d => d.deptName) },
  yAxis: [
    { type: 'value', name: '金额(元)' },
    { type: 'value', name: '差异率(%)' }
  ],
  series: [
    { name: '预算', type: 'bar', data: deptList.value.map(d => d.budget), itemStyle: { color: '#909399', borderRadius: [4,4,0,0] }, barWidth: '22%' },
    { name: '实际', type: 'bar', data: deptList.value.map(d => d.actual), itemStyle: { color: '#409EFF', borderRadius: [4,4,0,0] }, barWidth: '22%' },
    {
      name: '差异率%', type: 'line', yAxisIndex: 1, data: deptList.value.map(d => d.varianceRate),
      itemStyle: { color: d => (d.value as number) < 0 ? '#F56C6C' : '#67C23A' },
      lineStyle: { width: 3 }, symbolSize: 10
    }
  ]
}))
const { chartRef: deptChartRef, updateOption: updateDept } = useECharts(() => deptOption.value)

watch([tenantList, deptList], () => {
  updateTenantPie?.()
  updateTenantBar?.()
  updateDept?.()
}, { deep: true })

const suggestionDialog = ref({
  visible: false,
  isEdit: false,
  form: {
    id: '', category: '', title: '', description: '',
    savingPotential: 0, investment: 0, paybackPeriod: 1,
    priority: 'medium' as EnergySuggestion['priority'],
    status: 'pending' as EnergySuggestion['status']
  } as EnergySuggestion
})

function openSuggestionDialog(row?: EnergySuggestion) {
  suggestionDialog.value.isEdit = !!row
  suggestionDialog.value.form = row ? { ...row } : {
    id: '', category: '照明系统', title: '', description: '',
    savingPotential: 0, investment: 0, paybackPeriod: 1,
    priority: 'medium', status: 'pending'
  }
  suggestionDialog.value.visible = true
}

async function saveSuggestion() {
  const f = suggestionDialog.value.form
  if (!f.category || !f.title) { ElMessage.warning('请填写完整信息'); return }
  if (!suggestionDialog.value.isEdit) f.id = 'S' + Date.now()
  await reportService.saveSuggestion(f)
  if (!suggestionDialog.value.isEdit) suggestionList.value.push(f)
  else Object.assign(suggestionList.value.find(x => x.id === f.id)!, f)
  suggestionDialog.value.visible = false
  ElMessage.success('保存成功')
}

function approveSuggestion(row: EnergySuggestion) {
  row.status = 'approved'
  reportService.saveSuggestion(row)
  ElMessage.success('已批准')
}

onMounted(async () => {
  const [t, d, s] = await Promise.all([
    reportService.getTenantShares(),
    reportService.getDeptReconciliation(),
    reportService.getEnergySuggestions()
  ])
  tenantList.value = t
  deptList.value = d
  suggestionList.value = s
})
</script>
