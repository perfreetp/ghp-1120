<template>
  <div>
    <div class="page-header">
      <h2>告警中心</h2>
      <div class="flex gap-8">
        <el-tag :type="stats.critical > 0 ? 'danger' : 'info'" effect="dark" size="large">
          紧急告警: {{ stats.critical }}
        </el-tag>
      </div>
    </div>

    <div class="stat-grid">
      <div v-for="(s, key) in statCards" :key="key" class="stat-card" :class="s.type">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value">{{ stats[key as keyof typeof stats] }}<span class="stat-unit">条</span></div>
        <div class="stat-icon" :style="{ background: s.bg, color: s.color }">
          <el-icon :size="28"><component :is="s.icon" /></el-icon>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 20px;">
      <div class="card-title">
        <span>告警列表</span>
        <div class="flex gap-12">
          <el-select v-model="filter.type" placeholder="告警类型" clearable style="width: 140px">
            <el-option label="能耗超额" value="exceed" />
            <el-option label="长期开启" value="longRun" />
            <el-option label="传感器离线" value="offline" />
            <el-option label="抄表缺失" value="missing" />
          </el-select>
          <el-select v-model="filter.status" placeholder="处理状态" clearable style="width: 140px">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
          <el-select v-model="filter.level" placeholder="告警等级" clearable style="width: 140px">
            <el-option label="紧急" value="critical" />
            <el-option label="重要" value="major" />
            <el-option label="次要" value="minor" />
            <el-option label="提示" value="warning" />
          </el-select>
          <el-input v-model="filter.keyword" placeholder="搜索标题/位置/设备" clearable style="width: 220px" @keyup.enter="loadAlarms" />
          <el-button type="primary" @click="loadAlarms">
            <el-icon><Search /></el-icon> 查询
          </el-button>
        </div>
      </div>
      <el-table :data="alarmList" size="default" stripe @row-dblclick="openDetail">
        <el-table-column width="50" align="center">
          <template #default="{ row }">
            <el-icon :color="levelColors[row.level]" :size="18">
              <component :is="row.status === 'closed' ? 'CircleCheckFilled' : 'BellFilled'" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="编号" width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.type]" size="small" effect="light">
              {{ typeLabelMap[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="levelTagMap[row.level]" size="small" effect="dark" round>
              {{ levelLabelMap[row.level] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="location" label="位置" min-width="140" show-overflow-tooltip />
        <el-table-column prop="device" label="设备" min-width="140" show-overflow-tooltip />
        <el-table-column label="数值" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.value !== undefined">
              <span class="text-danger font-semibold">{{ row.value }}</span>
              <span class="text-muted text-sm"> / {{ row.threshold }}</span>
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="告警时间" width="170">
          <template #default="{ row }">{{ formatTime(row.time) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status]" size="small" effect="plain">
              {{ statusLabelMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="100" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" size="small" link type="primary" @click="handleAlarm(row)">处理</el-button>
            <el-button v-if="row.status === 'processing'" size="small" link type="success" @click="resolveAlarm(row)">解决</el-button>
            <el-button v-if="row.status === 'resolved'" size="small" link @click="closeAlarm(row)">关闭</el-button>
            <el-button size="small" link type="warning" @click="createWorkOrder(row)">派工单</el-button>
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

    <el-dialog v-model="detailVisible" title="告警详情" width="640px">
      <div v-if="currentAlarm" class="detail-content">
        <div class="grid-2 gap-20">
          <div>
            <div class="text-muted text-sm mb-4">告警编号</div>
            <div class="font-semibold">{{ currentAlarm.id }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">告警等级</div>
            <el-tag :type="levelTagMap[currentAlarm.level]" effect="dark">{{ levelLabelMap[currentAlarm.level] }}</el-tag>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">告警类型</div>
            <el-tag :type="typeTagMap[currentAlarm.type]" effect="light">{{ typeLabelMap[currentAlarm.type] }}</el-tag>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">发生时间</div>
            <div>{{ formatTime(currentAlarm.time) }}</div>
          </div>
          <div class="col-span-2">
            <div class="text-muted text-sm mb-4">告警标题</div>
            <div class="text-16 font-semibold">{{ currentAlarm.title }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">位置</div>
            <div>{{ currentAlarm.location }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">关联设备</div>
            <div>{{ currentAlarm.device || '-' }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">当前值 / 阈值</div>
            <div v-if="currentAlarm.value !== undefined">
              <span class="text-danger font-semibold">{{ currentAlarm.value }}</span>
              <span class="mx-4 text-muted">/</span>
              <span>{{ currentAlarm.threshold }}</span>
            </div>
            <div v-else class="text-muted">-</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">处理状态</div>
            <el-tag :type="statusTagMap[currentAlarm.status]" effect="plain">{{ statusLabelMap[currentAlarm.status] }}</el-tag>
          </div>
        </div>
        <el-divider />
        <div>
          <div class="text-muted text-sm mb-4">告警描述</div>
          <div class="p-12 bg-gray-50 rounded-6">{{ currentAlarm.description }}</div>
        </div>
        <el-divider v-if="currentAlarm.handler" />
        <div v-if="currentAlarm.handler" class="grid-2 gap-20">
          <div>
            <div class="text-muted text-sm mb-4">处理人</div>
            <div>{{ currentAlarm.handler }}</div>
          </div>
          <div>
            <div class="text-muted text-sm mb-4">处理时间</div>
            <div>{{ currentAlarm.handleTime ? formatTime(currentAlarm.handleTime) : '-' }}</div>
          </div>
          <div class="col-span-2">
            <div class="text-muted text-sm mb-4">处理备注</div>
            <div class="p-12 bg-blue-50 rounded-6">{{ currentAlarm.handleNote || '暂无备注' }}</div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="handleVisible" title="处理告警" width="480px">
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="处理人">
          <el-input v-model="handleForm.handler" placeholder="请输入处理人姓名" />
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleForm.note" type="textarea" :rows="3" placeholder="请输入处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resolveVisible" title="标记解决" width="480px">
      <el-form :model="resolveForm" label-width="80px">
        <el-form-item label="解决说明">
          <el-input v-model="resolveForm.note" type="textarea" :rows="3" placeholder="请输入解决说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resolveVisible = false">取消</el-button>
        <el-button type="success" @click="confirmResolve">确认解决</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Alarm, AlarmType, AlarmStatus } from '@/types'
import { alarmService } from '@/services'

const router = useRouter()

const filter = reactive({ type: '' as AlarmType | '', status: '' as AlarmStatus | '', level: '' as Alarm['level'] | '', keyword: '' })
const page = reactive({ page: 1, size: 20, total: 0 })
const alarmList = ref<Alarm[]>([])
const stats = reactive({ pending: 0, processing: 0, resolved: 0, closed: 0, critical: 0 })

const statCards = {
  pending: { label: '待处理', type: 'electric', icon: 'Clock', bg: 'rgba(230,162,60,0.1)', color: '#E6A23C' },
  processing: { label: '处理中', type: 'ac', icon: 'Loading', bg: 'rgba(64,158,255,0.1)', color: '#409EFF' },
  resolved: { label: '已解决', type: 'light', icon: 'CircleCheck', bg: 'rgba(103,194,58,0.1)', color: '#67C23A' },
  closed: { label: '已关闭', type: 'water', icon: 'FolderRemove', bg: 'rgba(144,147,153,0.1)', color: '#909399' }
}

const typeLabelMap: Record<AlarmType, string> = {
  exceed: '能耗超额', longRun: '长期开启', offline: '传感器离线', missing: '抄表缺失'
}
const typeTagMap: Record<AlarmType, any> = {
  exceed: 'danger', longRun: 'warning', offline: 'info', missing: ''
}
const levelLabelMap = { critical: '紧急', major: '重要', minor: '次要', warning: '提示' }
const levelTagMap: Record<Alarm['level'], any> = { critical: 'danger', major: 'warning', minor: 'primary', warning: 'info' }
const levelColors: Record<Alarm['level'], string> = { critical: '#F56C6C', major: '#E6A23C', minor: '#409EFF', warning: '#909399' }
const statusLabelMap: Record<AlarmStatus, string> = {
  pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭'
}
const statusTagMap: Record<AlarmStatus, any> = {
  pending: 'danger', processing: 'warning', resolved: 'success', closed: 'info'
}

function formatTime(s: string): string {
  return new Date(s).toLocaleString('zh-CN')
}

const detailVisible = ref(false)
const currentAlarm = ref<Alarm | null>(null)
function openDetail(row: Alarm) {
  currentAlarm.value = row
  detailVisible.value = true
}

const handleVisible = ref(false)
const handleForm = reactive({ handler: '', note: '' })
function handleAlarm(row: Alarm) {
  currentAlarm.value = row
  handleForm.handler = ''
  handleForm.note = ''
  handleVisible.value = true
}
async function confirmHandle() {
  if (!handleForm.handler) { ElMessage.warning('请输入处理人'); return }
  if (!currentAlarm.value) return
  await alarmService.handleAlarm(currentAlarm.value.id, handleForm.note, handleForm.handler)
  ElMessage.success('已提交处理')
  handleVisible.value = false
  loadAlarms()
}

const resolveVisible = ref(false)
const resolveForm = reactive({ note: '' })
function resolveAlarm(row: Alarm) {
  currentAlarm.value = row
  resolveForm.note = ''
  resolveVisible.value = true
}
async function confirmResolve() {
  if (!resolveForm.note) { ElMessage.warning('请输入解决说明'); return }
  if (!currentAlarm.value) return
  await alarmService.resolveAlarm(currentAlarm.value.id, resolveForm.note)
  ElMessage.success('已标记解决')
  resolveVisible.value = false
  loadAlarms()
}

async function closeAlarm(row: Alarm) {
  await ElMessageBox.confirm(`确认关闭此告警？关闭后将不再提醒。`, '提示', { type: 'warning' })
  await alarmService.closeAlarm(row.id)
  ElMessage.success('已关闭')
  loadAlarms()
}

function createWorkOrder(row: Alarm) {
  ElMessage.success(`已从告警 ${row.id} 创建工单，跳转到工单页面`)
  router.push('/workorder')
}

async function loadAlarms() {
  const f = { ...filter }
  if (!f.type) delete (f as any).type
  if (!f.status) delete (f as any).status
  if (!f.level) delete (f as any).level
  if (!f.keyword) delete (f as any).keyword
  const list = await alarmService.getAlarms(f as any)
  const all = list.length
  page.total = all
  const start = (page.page - 1) * page.size
  alarmList.value = list.slice(start, start + page.size)
}

onMounted(async () => {
  Object.assign(stats, await alarmService.getStats())
  await loadAlarms()
})
</script>

<style scoped>
.mb-4 { margin-bottom: 4px; }
.mt-20 { margin-top: 20px; }
.col-span-2 { grid-column: span 2; }
.gap-20 { gap: 20px; }
.p-12 { padding: 12px; }
.bg-gray-50 { background: #fafafa; }
.bg-blue-50 { background: rgba(64,158,255,0.08); }
.rounded-6 { border-radius: 6px; }
.text-16 { font-size: 16px; }
.font-semibold { font-weight: 600; }
.mx-4 { margin-left: 4px; margin-right: 4px; }
</style>
