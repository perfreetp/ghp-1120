<template>
  <div>
    <div class="page-header">
      <h2>工单管理</h2>
      <div class="flex gap-8">
        <el-tag type="danger" effect="dark" v-if="filteredStats.urgent">紧急工单: {{ filteredStats.urgent }}</el-tag>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 新建工单
        </el-button>
      </div>
    </div>

    <div class="stat-grid">
      <div v-for="(s, key) in statCards" :key="key" class="stat-card" :class="s.type">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value">{{ filteredStats[key] || 0 }}<span class="stat-unit">单</span></div>
        <div class="stat-icon" :style="{ background: s.bg, color: s.color }">
          <el-icon :size="28"><component :is="s.icon" /></el-icon>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 20px;">
      <div class="card-title">
        <span>工单列表</span>
        <div class="flex gap-12">
          <el-select v-model="filter.status" placeholder="状态" clearable style="width: 140px">
            <el-option v-for="(v, k) in statusLabels" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="filter.priority" placeholder="优先级" clearable style="width: 140px">
            <el-option v-for="(v, k) in priorityLabels" :key="k" :label="v" :value="k" />
          </el-select>
          <el-select v-model="filter.assignee" placeholder="处理人" clearable filterable style="width: 160px">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-input v-model="filter.keyword" placeholder="搜索标题/位置" clearable style="width: 200px" />
          <el-button type="primary" @click="loadOrders">
            <el-icon><Search /></el-icon> 查询
          </el-button>
        </div>
      </div>

      <el-steps :active="activeStepIndex" simple size="small" finish-status="success" align-center style="margin-bottom: 16px">
        <el-step v-for="(v, k) in statusLabels" :key="k" :title="`${v}(${filteredStats[k] || 0})`" />
      </el-steps>

      <el-table :data="pagedOrderList" size="default" stripe @row-dblclick="openDetail">
        <el-table-column prop="id" label="工单编号" width="140" fixed="left" />
        <el-table-column prop="alarmId" label="关联告警" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.alarmId" type="danger" effect="light" size="small">{{ row.alarmId }}</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.type]" size="small" effect="light">{{ typeLabels[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="priorityTagMap[row.priority]" size="small" effect="dark" round>
              {{ priorityLabels[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="location" label="位置" min-width="140" show-overflow-tooltip />
        <el-table-column label="处理人/电话" width="160">
          <template #default="{ row }">
            <div v-if="row.assignee">
              <div>{{ row.assignee }}</div>
              <div class="text-sm text-muted">{{ row.assigneePhone }}</div>
            </div>
            <span v-else class="text-muted">待派单</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status]" size="small" effect="plain">{{ statusLabels[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="流转" width="180">
          <template #default="{ row }">
            <el-timeline style="padding: 0; margin: 0;">
              <el-timeline-item v-if="row.assignTime" :timestamp="formatShortTime(row.assignTime)" size="small" type="primary">派单</el-timeline-item>
              <el-timeline-item v-if="row.processTime" :timestamp="formatShortTime(row.processTime)" size="small" type="warning">处理</el-timeline-item>
              <el-timeline-item v-if="row.completeTime" :timestamp="formatShortTime(row.completeTime)" size="small" type="success">完成</el-timeline-item>
              <el-timeline-item v-if="row.verifyTime" :timestamp="formatShortTime(row.verifyTime)" size="small" type="info">验收</el-timeline-item>
            </el-timeline>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link @click="openDetail(row)">详情</el-button>
            <el-button size="small" link type="primary" v-if="row.status === 'pending'" @click="openAssignDialog(row)">派单</el-button>
            <el-button size="small" link type="warning" v-if="row.status === 'assigned'" @click="startProcess(row)">开始处理</el-button>
            <el-button size="small" link type="success" v-if="row.status === 'processing'" @click="openCompleteDialog(row)">完工</el-button>
            <el-button size="small" link v-if="row.status === 'completed'" @click="verifyOrder(row)">验收</el-button>
            <el-button size="small" link type="info" v-if="row.status === 'verified'" @click="closeOrder(row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex-center mt-20">
        <el-pagination
          v-model:current-page="page.page"
          v-model:page-size="page.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="工单详情" width="680px">
      <div v-if="currentOrder" class="detail-content">
        <div class="flex-between mb-16">
          <div class="flex gap-8 items-center">
            <el-tag size="large">{{ currentOrder.id }}</el-tag>
            <el-tag :type="priorityTagMap[currentOrder.priority]" effect="dark">{{ priorityLabels[currentOrder.priority] }}</el-tag>
            <el-tag :type="statusTagMap[currentOrder.status]">{{ statusLabels[currentOrder.status] }}</el-tag>
          </div>
          <el-tag :type="typeTagMap[currentOrder.type]" effect="light">{{ typeLabels[currentOrder.type] }}</el-tag>
        </div>

        <div class="grid-2 gap-16 mb-16">
          <div>
            <div class="text-muted text-sm mb-4">标题</div>
            <div class="font-semibold text-16">{{ currentOrder.title }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">位置</div>
            <div>{{ currentOrder.location }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">创建人</div>
            <div>{{ currentOrder.creator }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">创建时间</div>
            <div>{{ formatTime(currentOrder.createTime) }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">关联告警编号</div>
            <el-tag v-if="currentOrder.alarmId" type="danger" effect="light">{{ currentOrder.alarmId }}</el-tag>
            <span v-else class="text-muted">-</span>
          </div>
          <div v-if="currentOrder.assignee">
            <div class="text-muted text-sm mb-4">处理人</div>
            <div>{{ currentOrder.assignee }} ({{ currentOrder.assigneePhone }})</div>
          </div>
        </div>

        <el-divider />
        <div class="mb-16">
          <div class="text-muted text-sm mb-4">问题描述</div>
          <div class="p-12 bg-gray-50 rounded-6">{{ currentOrder.description }}</div>
        </div>

        <el-divider v-if="currentOrder.processNote || currentOrder.result" />
        <div v-if="currentOrder.processNote" class="mb-16">
          <div class="text-muted text-sm mb-4">处理备注</div>
          <div class="p-12 bg-blue-50 rounded-6">{{ currentOrder.processNote }}</div>
        </div>
        <div v-if="currentOrder.result" class="mb-16">
          <div class="text-muted text-sm mb-4">处理结果</div>
          <div class="p-12 bg-green-50 rounded-6 text-success">{{ currentOrder.result }}</div>
        </div>

        <el-divider />
        <div>
          <div class="text-muted text-sm mb-12">工单流转</div>
          <el-steps :active="getStepIndex(currentOrder.status)" finish-status="success" align-center>
            <el-step title="创建" :description="formatShortTime(currentOrder.createTime)" />
            <el-step title="派单" :description="currentOrder.assignTime ? formatShortTime(currentOrder.assignTime) : '—'" />
            <el-step title="处理" :description="currentOrder.processTime ? formatShortTime(currentOrder.processTime) : '—'" />
            <el-step title="完成" :description="currentOrder.completeTime ? formatShortTime(currentOrder.completeTime) : '—'" />
            <el-step title="验收" :description="currentOrder.verifyTime ? formatShortTime(currentOrder.verifyTime) : '—'" />
            <el-step title="关闭" :description="currentOrder.closeTime ? formatShortTime(currentOrder.closeTime) : '—'" />
          </el-steps>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="createVisible" title="新建工单" width="560px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="标题"><el-input v-model="createForm.title" placeholder="请输入工单标题" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="createForm.type" style="width: 100%">
            <el-option v-for="(v, k) in typeLabels" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="createForm.priority">
            <el-radio-button v-for="(v, k) in priorityLabels" :key="k" :label="k as any">{{ v }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="位置"><el-input v-model="createForm.location" placeholder="如：6F-10F 办公区" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="createForm.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate">创建工单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assignVisible" title="派单" width="520px">
      <el-form :model="assignForm" label-width="90px">
        <el-form-item label="处理人">
          <el-select v-model="assignForm.assignee" placeholder="请选择维修人员" style="width: 100%">
            <el-option
              v-for="s in availableStaff"
              :key="s.id"
              :label="`${s.name} (${s.status === 'available' ? '空闲' : s.status === 'busy' ? '忙碌' : '休息'}) - ${s.specialty.join('、')}`"
              :value="s.name"
              :disabled="s.status !== 'available'"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="assignForm.assigneePhone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认派单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeVisible" title="完工确认" width="520px">
      <el-form :model="completeForm" label-width="90px">
        <el-form-item label="处理结果">
          <el-input v-model="completeForm.result" type="textarea" :rows="4" placeholder="请详细描述处理过程和结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="success" @click="confirmComplete">确认完工</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { WorkOrder, WorkOrderStatus, WorkOrderPriority, AlarmType, MaintenanceStaff } from '@/types'
import { workOrderService } from '@/services'

const filter = reactive({
  status: '' as WorkOrderStatus | '',
  priority: '' as WorkOrderPriority | '',
  assignee: '',
  keyword: ''
})
const page = reactive({ page: 1, size: 20, total: 0 })
const orderList = ref<WorkOrder[]>([])
const staffList = ref<MaintenanceStaff[]>([])
const orderStats = reactive<Record<string, number>>({})

const pagedOrderList = computed(() => {
  const start = (page.page - 1) * page.size
  return orderList.value.slice(start, start + page.size)
})

const statCards: Record<string, any> = {
  pending: { label: '待派单', type: 'electric', icon: 'Clock', bg: 'rgba(230,162,60,0.1)', color: '#E6A23C' },
  assigned: { label: '已派单', type: 'light', icon: 'User', bg: 'rgba(64,158,255,0.1)', color: '#409EFF' },
  processing: { label: '处理中', type: 'ac', icon: 'Loading', bg: 'rgba(114,46,209,0.1)', color: '#722ed1' },
  completed: { label: '已完成', type: 'water', icon: 'CircleCheck', bg: 'rgba(103,194,58,0.1)', color: '#67C23A' }
}

const typeLabels: Record<AlarmType, string> = {
  exceed: '能耗超额', longRun: '长期开启', offline: '设备离线', missing: '数据缺失'
}
const typeTagMap: Record<AlarmType, any> = {
  exceed: 'danger', longRun: 'warning', offline: 'info', missing: ''
}
const priorityLabels = { urgent: '紧急', high: '高', medium: '中', low: '低' }
const priorityTagMap: Record<WorkOrderPriority, any> = { urgent: 'danger', high: 'warning', medium: 'primary', low: 'info' }
const statusLabels: Record<WorkOrderStatus, string> = {
  pending: '待派单', assigned: '已派单', processing: '处理中',
  completed: '已完成', verified: '已验收', closed: '已关闭'
}
const statusTagMap: Record<WorkOrderStatus, any> = {
  pending: 'danger', assigned: 'warning', processing: 'primary',
  completed: 'success', verified: '', closed: 'info'
}

const filteredStats = computed(() => {
  const list = orderList.value
  const result: Record<string, number> = {
    pending: 0, assigned: 0, processing: 0, completed: 0, verified: 0, closed: 0
  }
  list.forEach(o => {
    if (result[o.status] !== undefined) result[o.status]++
  })
  result.total = list.length
  result.urgent = list.filter(o => o.priority === 'urgent' && !['closed', 'verified'].includes(o.status)).length
  return result
})

const activeStepIndex = computed(() => {
  const list: WorkOrderStatus[] = ['pending', 'assigned', 'processing', 'completed', 'verified', 'closed']
  const counts = list.map(k => filteredStats.value[k] || 0)
  let total = counts.reduce((s, x) => s + x, 0)
  if (total === 0) return 0
  let acc = 0
  for (let i = 0; i < counts.length; i++) {
    acc += counts[i]
    if (acc / total >= 0.5) return i + 1
  }
  return counts.length
})

function getStepIndex(s: WorkOrderStatus): number {
  const order: WorkOrderStatus[] = ['pending', 'assigned', 'processing', 'completed', 'verified', 'closed']
  return order.indexOf(s) + 1
}
function formatTime(s: string): string { return new Date(s).toLocaleString('zh-CN') }
function formatShortTime(s: string): string {
  return s ? new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
}

const detailVisible = ref(false)
const currentOrder = ref<WorkOrder | null>(null)
function openDetail(row?: WorkOrder) {
  if (row) currentOrder.value = row
  detailVisible.value = true
}

const createVisible = ref(false)
const createForm = reactive({
  title: '', type: 'exceed' as AlarmType, priority: 'medium' as WorkOrderPriority,
  location: '', description: ''
})
function openCreateDialog() {
  Object.assign(createForm, { title: '', type: 'exceed', priority: 'medium', location: '', description: '' })
  createVisible.value = true
}

function matchesFilter(order: WorkOrder, filterObj: typeof filter): boolean {
  if (filterObj.status && order.status !== filterObj.status) return false
  if (filterObj.priority && order.priority !== filterObj.priority) return false
  if (filterObj.assignee && order.assignee !== filterObj.assignee) return false
  if (filterObj.keyword) {
    const kw = filterObj.keyword.toLowerCase()
    if (!order.title.toLowerCase().includes(kw) && !order.location.toLowerCase().includes(kw)) return false
  }
  return true
}

async function confirmCreate() {
  if (!createForm.title || !createForm.location) { ElMessage.warning('请填写完整信息'); return }
  const newOrder = await workOrderService.createWorkOrder(createForm as any)
  createVisible.value = false
  ElMessage.success('工单创建成功')
  if (matchesFilter(newOrder, filter)) {
    orderList.value.unshift(newOrder)
    page.total = orderList.value.length
    page.page = 1
  } else {
    ElMessage.info('新工单不匹配当前筛选条件，已在全量数据中创建')
    await nextTick()
    await loadOrders()
  }
}

const assignVisible = ref(false)
const assignForm = reactive({ assignee: '', assigneePhone: '' })
function openAssignDialog(row: WorkOrder) {
  currentOrder.value = row
  assignForm.assignee = row.assignee || ''
  assignForm.assigneePhone = row.assigneePhone || ''
  assignVisible.value = true
}
const availableStaff = computed(() => staffList.value)
watch(() => assignForm.assignee, (n) => {
  const s = staffList.value.find(x => x.name === n)
  if (s) assignForm.assigneePhone = s.phone
})
async function confirmAssign() {
  if (!assignForm.assignee) { ElMessage.warning('请选择处理人'); return }
  if (!currentOrder.value) return
  await workOrderService.assignWorkOrder(currentOrder.value.id, assignForm.assignee, assignForm.assigneePhone)
  assignVisible.value = false
  ElMessage.success('派单成功')
  await nextTick()
  await loadOrders()
}

async function startProcess(row: WorkOrder) {
  const note = (await ElMessageBox.prompt('请输入处理说明', '开始处理', { inputPlaceholder: '如：已前往现场排查' })).value
  await workOrderService.startWorkOrder(row.id, note)
  ElMessage.success('已开始处理')
  await nextTick()
  await loadOrders()
}

const completeVisible = ref(false)
const completeForm = reactive({ result: '' })
function openCompleteDialog(row: WorkOrder) {
  currentOrder.value = row
  completeForm.result = ''
  completeVisible.value = true
}
async function confirmComplete() {
  if (!completeForm.result) { ElMessage.warning('请填写处理结果'); return }
  if (!currentOrder.value) return
  await workOrderService.completeWorkOrder(currentOrder.value.id, completeForm.result)
  completeVisible.value = false
  ElMessage.success('完工提交成功')
  await nextTick()
  await loadOrders()
}

async function verifyOrder(row: WorkOrder) {
  await ElMessageBox.confirm(`确认验收该工单？验收后可关闭。`, '提示', { type: 'info' })
  await workOrderService.verifyWorkOrder(row.id)
  ElMessage.success('验收通过')
  await nextTick()
  await loadOrders()
}

async function closeOrder(row: WorkOrder) {
  await ElMessageBox.confirm(`确认关闭工单"${row.title}"？`, '提示', { type: 'warning' })
  await workOrderService.closeWorkOrder(row.id)
  ElMessage.success('工单已关闭')
  await nextTick()
  await loadOrders()
}

async function loadOrders() {
  const f = { ...filter }
  if (!f.status) delete (f as any).status
  if (!f.priority) delete (f as any).priority
  if (!f.assignee) delete (f as any).assignee
  if (!f.keyword) delete (f as any).keyword
  const list = await workOrderService.getWorkOrders(f as any)
  orderList.value = list
  page.total = list.length
}

watch(
  () => [filter.status, filter.priority, filter.assignee, filter.keyword],
  () => {
    page.page = 1
    loadOrders()
  }
)

async function loadStats() {
  const st = await workOrderService.getStats()
  Object.keys(st).forEach(k => { orderStats[k] = (st as any)[k] })
  Object.keys(orderStats).forEach(k => { if (!(k in st)) delete orderStats[k] })
}

onMounted(async () => {
  const [o, s] = await Promise.all([
    workOrderService.getWorkOrders(),
    workOrderService.getStaffs()
  ])
  orderList.value = o
  page.total = o.length
  staffList.value = s
  await loadStats()
})
</script>

<style scoped>
.mb-4 { margin-bottom: 4px; }
.mb-12 { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.mt-20 { margin-top: 20px; }
.p-12 { padding: 12px; }
.bg-gray-50 { background: #fafafa; }
.bg-blue-50 { background: rgba(64,158,255,0.08); }
.bg-green-50 { background: rgba(103,194,58,0.08); }
.rounded-6 { border-radius: 6px; }
.text-16 { font-size: 16px; }
.font-semibold { font-weight: 600; }
.gap-16 { gap: 16px; }
.gap-8 { gap: 8px; }
.items-center { align-items: center; }
.flex-center { display: flex; justify-content: center; align-items: center; }
</style>
