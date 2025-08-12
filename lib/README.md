# Simple Dashboard System

## Overview
ระบบ dashboard แบบง่ายที่ใช้ API เส้นเดียวกับหน้าจัดการโปรเจค ไม่มี cache ซับซ้อน ข้อมูลจะอัพเดททันทีเสมอ

## Features
- ✅ ใช้ API เส้นเดียวกับหน้าจัดการโปรเจค
- ✅ ไม่มี cache ซับซ้อน - ข้อมูลสดใหม่เสมอ
- ✅ Auto refresh ทุก 10 วินาที
- ✅ Manual refresh button
- ✅ Error handling แบบง่าย

## Usage

### 1. ใช้ useSimpleDashboard Hook

```typescript
import { useSimpleDashboard } from '@/lib/hooks/useSimpleDashboard'

function DashboardPage() {
  const { 
    projects, 
    dashboardStats, 
    loading, 
    error, 
    refresh 
  } = useSimpleDashboard(10000) // refresh ทุก 10 วินาที

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <button onClick={refresh}>Refresh Now</button>
      <div>โครงการทั้งหมด: {dashboardStats.totalProjects}</div>
      <div>กำลังทำ: {dashboardStats.activeProjects}</div>
      {/* แสดงรายการโครงการ */}
      {projects.map(project => (
        <div key={project.id}>{project.projectName} - {project.status}</div>
      ))}
    </div>
  )
}
```

### 2. ใช้ SimpleDashboard Component

```typescript
import SimpleDashboard from '@/lib/components/SimpleDashboard'

function App() {
  return (
    <div>
      <SimpleDashboard />
    </div>
  )
}
```

### 2. ใช้ Project Service

```typescript
import { projectService } from '@/lib/services/projectService'

// อัพเดท status โปรเจค - จะ auto invalidate cache
await projectService.updateProjectStatus('project-id', 'เสร็จสิ้น')

// อัพเดทโปรเจค - จะ auto invalidate cache
await projectService.updateProject({
  projectId: 'project-id',
  projectStatus: 'กำลังทำ',
  description: 'Updated description'
})
```

### 3. Manual Cache Management

```typescript
import { cacheManager, invalidateProjectRelatedCaches } from '@/lib/utils/cacheManager'

// Invalidate specific cache
cacheManager.invalidate('dashboard')

// Invalidate project related caches
invalidateProjectRelatedCaches()
```

## How It Works

### Cache Flow
1. **Data Request**: Component requests dashboard data
2. **Cache Check**: System checks if cached data is still valid (< 30 seconds)
3. **Return Cached**: If valid, return cached data immediately
4. **Fetch Fresh**: If invalid, fetch fresh data from API
5. **Update Cache**: Store new data in cache with timestamp

### Auto Invalidation
1. **Project Update**: When project is updated via projectService
2. **Cache Invalidation**: System automatically invalidates related caches
3. **Component Refresh**: Components listening to cache changes auto-refresh
4. **Fresh Data**: Users see updated data immediately

### Auto Refresh Triggers
- **Window Focus**: When user returns to the tab
- **Visibility Change**: When tab becomes visible
- **Interval**: Every 60 seconds (configurable)
- **Manual**: When user clicks refresh button

## Cache Keys
```typescript
CACHE_KEYS = {
  DASHBOARD: 'dashboard',
  PROJECTS: 'projects', 
  SALES: 'sales',
  EXPENSES: 'expenses',
  REVENUE_TARGETS: 'revenue_targets'
}
```

## Best Practices

### 1. Use Hooks in Components
```typescript
// ✅ Good - ใช้ hook ใน component
const { dashboardData, loading } = useDashboard()

// ❌ Avoid - เรียก service โดยตรง
const data = await dashboardService.getComprehensiveDashboard()
```

### 2. Handle Loading States
```typescript
// ✅ Good - จัดการ loading state
if (loading) return <Spinner />
if (error) return <ErrorMessage error={error} />
return <DashboardContent data={dashboardData} />
```

### 3. Use Refresh Wisely
```typescript
// ✅ Good - ให้ user control การ refresh
<button onClick={refresh} disabled={loading}>
  {loading ? 'Refreshing...' : 'Refresh'}
</button>

// ❌ Avoid - refresh บ่อยเกินไป
useEffect(() => {
  const interval = setInterval(refresh, 1000) // ทุกวินาที - เยอะเกินไป!
}, [])
```

## Troubleshooting

### ข้อมูลไม่อัพเดท
1. ตรวจสอบว่าใช้ `projectService` ในการอัพเดทข้อมูล
2. ตรวจสอบ console สำหรับ error messages
3. ลอง manual refresh ด้วย `refresh()` function

### Performance Issues
1. ลด `refreshInterval` หากไม่จำเป็น
2. ปิด `autoRefresh` สำหรับหน้าที่ไม่ต้องการ real-time data
3. ใช้ `useProjectSummaries` แทน `useDashboard` หากต้องการเฉพาะข้อมูลโปรเจค

### Memory Leaks
- Hooks จะ cleanup listeners อัตโนมัติเมื่อ component unmount
- ไม่ต้องกังวลเรื่อง memory leaks

## API Reference

### useDashboard(options)
- `autoRefresh?: boolean` - เปิด/ปิด auto refresh (default: true)
- `refreshInterval?: number` - interval ในการ refresh (default: 60000ms)

Returns:
- `dashboardData: DashboardData | null`
- `projectSummaries: ProjectSummary[]`
- `loading: boolean`
- `error: string | null`
- `refresh: () => Promise<void>`
- `refetch: (forceRefresh?: boolean) => Promise<void>`

### useProjectDashboard(options)
Enhanced version with optimistic updates:
- `autoRefresh?: boolean` - เปิด/ปิด auto refresh (default: true)
- `refreshInterval?: number` - interval ในการ refresh (default: 30000ms)
- `enableEventListeners?: boolean` - เปิด/ปิด event listeners (default: true)

Returns:
- `dashboardData: DashboardData | null`
- `projectSummaries: ProjectSummary[]`
- `loading: boolean`
- `error: string | null`
- `lastRefresh: number`
- `refresh: () => Promise<void>`
- `updateProjectStatus: (projectId: string, newStatus: string) => Promise<void>`
- `refetch: (forceRefresh?: boolean) => Promise<void>`

### useBudget()
For budget management:

Returns:
- `budgets: Budget[]`
- `availableProjects: AvailableProject[]`
- `loading: boolean`
- `error: string | null`
- `createBudget: (data) => Promise<void>`
- `updateBudget: (id: string, data) => Promise<void>`
- `deleteBudget: (id: string) => Promise<void>`
- `refresh: () => Promise<void>`

## Fixed Issues

### ✅ Sales Entry Issues
- **404 Errors**: Added missing update/delete endpoints
- **Status Updates**: Fixed sale status update functionality
- **Cache Invalidation**: Auto refresh dashboard when sales data changes

### ✅ Expense Entry Issues  
- **Payment Status**: Fixed expense payment status updates
- **Cache Sync**: Dashboard updates when expense status changes
- **CRUD Operations**: Added full CRUD support for expenses

### ✅ Budget Management Issues
- **Project Selection**: Added endpoint to get available projects
- **Project Dropdown**: Fixed project selection dropdown functionality
- **Budget Updates**: Improved budget update and delete operations

### ✅ Cross-Page Data Sync
- **Real-time Updates**: All pages now sync data changes automatically
- **Event-Driven**: Uses event bus for cross-component communication
- **Cache Management**: Smart cache invalidation across all services