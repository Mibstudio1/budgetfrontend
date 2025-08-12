// Test APIs with real data from database
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10358'

async function testAPIsWithRealData() {
  console.log('🧪 Testing APIs with real data...\n')
  
  // Step 1: Login to get token
  console.log('1️⃣ Login to get token...')
  let token = null
  try {
    const loginResponse = await fetch(`${BACKEND_URL}/api/authen/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin1',
        password: '2npAYA_G617Noqn'
      }),
    })
    
    const loginData = await loginResponse.json()
    if (loginData.success && loginData.result?.profile?.token) {
      token = loginData.result.profile.token
      console.log('✅ Login successful, token received')
    } else {
      console.log('❌ Login failed')
      return
    }
  } catch (error) {
    console.log('❌ Login error:', error.message)
    return
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
  
  // Step 2: Get existing projects to get real project IDs
  console.log('\n2️⃣ Getting existing projects...')
  let projectIds = []
  try {
    const projectsResponse = await fetch(`${BACKEND_URL}/api/project/all-projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectName: "",
        type: "",
        status: ""
      }),
    })
    
    const projectsData = await projectsResponse.json()
    if (projectsData.success && projectsData.result?.projects) {
      projectIds = projectsData.result.projects.map(p => p.id)
      console.log(`✅ Found ${projectIds.length} projects:`, projectIds)
    } else {
      console.log('❌ No projects found')
      return
    }
  } catch (error) {
    console.log('❌ Error getting projects:', error.message)
    return
  }
  
  if (projectIds.length === 0) {
    console.log('❌ No project IDs available for testing')
    return
  }
  
  const testProjectId = projectIds[0] // Use first project for testing

  // Step 3: Test Create Project payload (backend expects projectGroup/projectStatus/createdBy)
  console.log('\n3️⃣ Testing Create Project...')
  try {
    const createProjectResponse = await fetch(`${BACKEND_URL}/api/project/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectName: 'API Test Project',
        description: 'Created via script',
        projectGroup: 'Software Dev',
        projectStatus: 'กำลังทำ',
        createdBy: 'script'
      })
    })
    const createProjectData = await createProjectResponse.json()
    console.log('✅ Create Project Response:', {
      status: createProjectResponse.status,
      success: createProjectData.success,
      message: createProjectData.message
    })
  } catch (error) {
    console.log('❌ Create Project failed:', error.message)
  }
  
  // Step 4: Test Sales Entry with real project ID
  console.log('\n4️⃣ Testing Sales Entry with real project ID...')
  try {
    const createSalesResponse = await fetch(`${BACKEND_URL}/api/sales-entry/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: "2024-10-05T10:00:00Z",
        projectId: testProjectId, // Use real project ID
        description: "Test Sales Entry",
        totalPrice: 50000,
        type: "service",
        createdBy: "admin1"
      }),
    })
    
    const createSalesData = await createSalesResponse.json()
    console.log('✅ Create Sales Response:', {
      status: createSalesResponse.status,
      success: createSalesData.success,
      message: createSalesData.message
    })
  } catch (error) {
    console.log('❌ Create Sales failed:', error.message)
  }
  
  // Step 5: Test Expense Entry with real project ID
  console.log('\n5️⃣ Testing Expense Entry with real project ID...')
  try {
    const createExpenseResponse = await fetch(`${BACKEND_URL}/api/expense-entry/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: "2024-10-05T10:00:00Z",
        expenseItem: "outsource",
        cost: 10000,
        projectId: testProjectId, // Use real project ID
        isPaid: true,
        createdBy: "admin1",
        category: "development"
      }),
    })
    
    const createExpenseData = await createExpenseResponse.json()
    console.log('✅ Create Expense Response:', {
      status: createExpenseResponse.status,
      success: createExpenseData.success,
      message: createExpenseData.message
    })
  } catch (error) {
    console.log('❌ Create Expense failed:', error.message)
  }
  
  // Step 5: Test Revenue Target
  console.log('\n5️⃣ Testing Revenue Target...')
  try {
    const revenueResponse = await fetch(`${BACKEND_URL}/api/revenue-target/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: "2024-10-05",
        target: 100000,
        createdBy: "admin1"
      }),
    })
    
    const revenueData = await revenueResponse.json()
    console.log('✅ Revenue Target Response:', {
      status: revenueResponse.status,
      success: revenueData.success,
      message: revenueData.message
    })
  } catch (error) {
    console.log('❌ Revenue Target failed:', error.message)
  }
  
  // Step 6: Test Get Sales with real project
  console.log('\n6️⃣ Testing Get Sales with real project...')
  try {
    const getSalesResponse = await fetch(`${BACKEND_URL}/api/sales-entry/recently`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectName: "",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        type: ""
      }),
    })
    
    const getSalesData = await getSalesResponse.json()
    console.log('✅ Get Sales Response:', {
      status: getSalesResponse.status,
      success: getSalesData.success,
      hasRecords: !!getSalesData.result?.records,
      recordCount: getSalesData.result?.records?.length || 0
    })
  } catch (error) {
    console.log('❌ Get Sales failed:', error.message)
  }
  
  // Step 7: Test Get Expenses with real project
  console.log('\n7️⃣ Testing Get Expenses with real project...')
  try {
    const getExpensesResponse = await fetch(`${BACKEND_URL}/api/expense-entry/recently`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        search: "",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        category: "",
        status: ""
      }),
    })
    
    const getExpensesData = await getExpensesResponse.json()
    console.log('✅ Get Expenses Response:', {
      status: getExpensesResponse.status,
      success: getExpensesData.success,
      hasRecords: !!getExpensesData.result?.records,
      recordCount: getExpensesData.result?.records?.length || 0
    })
  } catch (error) {
    console.log('❌ Get Expenses failed:', error.message)
  }
  
  // Step 8: Test Dashboard APIs
  console.log('\n8️⃣ Testing Dashboard APIs...')
  try {
    const dashboardResponse = await fetch(`${BACKEND_URL}/api/dashboard/all-projects`, {
      method: 'GET',
      headers,
    })
    
    const dashboardData = await dashboardResponse.json()
    console.log('✅ Dashboard Response:', {
      status: dashboardResponse.status,
      success: dashboardData.success,
      projectCount: dashboardData.result?.projects?.length || 0,
      totalProject: dashboardData.result?.totalProject,
      totalActiveProject: dashboardData.result?.totalActiveProject,
      totalProfit: dashboardData.result?.totalProfit
    })
  } catch (error) {
    console.log('❌ Dashboard failed:', error.message)
  }
  
  // Step 9: Test Report APIs
  console.log('\n9️⃣ Testing Report APIs...')
  try {
    const reportResponse = await fetch(`${BACKEND_URL}/api/report/cost-profit`, {
      method: 'GET',
      headers,
    })
    
    const reportData = await reportResponse.json()
    console.log('✅ Cost Profit Report Response:', {
      status: reportResponse.status,
      success: reportData.success,
      projectCount: reportData.result?.projects?.length || 0
    })
  } catch (error) {
    console.log('❌ Report failed:', error.message)
  }
  
  console.log('\n✅ API testing completed!')
}

testAPIsWithRealData() 