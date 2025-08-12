const BACKEND_URL = 'http://localhost:10358'

async function testProjectCreation() {
  console.log('🧪 Testing Project Creation with Related Data...\n')

  // Step 0: Login to get token
  console.log('0️⃣ Logging in...')
  try {
    const loginResponse = await fetch(`${BACKEND_URL}/api/authen/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: "example",
        password: "2npAYA_G617Noqw_"
      }),
    })
    
    const loginData = await loginResponse.json()
    console.log('✅ Login response:', loginData)
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginData.message}`)
    }
    
    const token = loginData.result?.profile?.token || loginData.profile?.token
    if (!token) {
      throw new Error('No token received from login')
    }
    
    console.log('✅ Token received:', token.substring(0, 20) + '...')
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    // Step 1: Create test project
    console.log('\n1️⃣ Creating test project...')
    const createProjectResponse = await fetch(`${BACKEND_URL}/api/project/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectName: `Test Project - ${Date.now()}`,
        description: 'Test project for data relationships',
        projectGroup: 'Software Dev',
        projectStatus: 'กำลังทำ',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        createdBy: 'example'
      }),
    })
    
    const createProjectData = await createProjectResponse.json()
    console.log('✅ Project created:', createProjectData)
    
    if (!createProjectResponse.ok) {
      throw new Error(`Failed to create project: ${createProjectData.message}`)
    }
    
    // Step 2: Get the project ID (we need to fetch it since backend doesn't return it)
    console.log('\n2️⃣ Fetching projects to get project ID...')
    const getProjectsResponse = await fetch(`${BACKEND_URL}/api/project/all-projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectName: "",
        type: "",
        status: ""
      }),
    })
    
    const projectsData = await getProjectsResponse.json()
    console.log('✅ Projects fetched:', projectsData)
    
    if (!getProjectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsData.message}`)
    }
    
    const projects = projectsData.result?.projects || []
    const testProject = projects[0] // Get the most recent project
    
    if (!testProject) {
      throw new Error('No projects found')
    }
    
    console.log('✅ Test project found:', testProject)
    
    // Step 3: Create budget for the project
    console.log('\n3️⃣ Creating budget for the project...')
    const createBudgetResponse = await fetch(`${BACKEND_URL}/api/budget/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectId: testProject.id,
        description: "Test budget for the project",
        budget: 100000,
        createdBy: "example"
      }),
    })
    
    const createBudgetData = await createBudgetResponse.json()
    console.log('✅ Budget created:', createBudgetData)
    
    // Step 4: Create sales entry for the project
    console.log('\n4️⃣ Creating sales entry for the project...')
    const createSalesResponse = await fetch(`${BACKEND_URL}/api/sales-entry/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        projectId: testProject.id,
        description: "Test sales entry",
        totalPrice: 50000,
        type: "Software Dev",
        createdBy: "example"
      }),
    })
    
    const createSalesData = await createSalesResponse.json()
    console.log('✅ Sales entry created:', createSalesData)
    
    // Step 5: Create expense entry for the project
    console.log('\n5️⃣ Creating expense entry for the project...')
    const createExpenseResponse = await fetch(`${BACKEND_URL}/api/expense-entry/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        expenseItem: "Test expense",
        cost: 20000,
        projectId: testProject.id,
        isPaid: false,
        createdBy: "example",
        category: "อื่นๆ"
      }),
    })
    
    const createExpenseData = await createExpenseResponse.json()
    console.log('✅ Expense entry created:', createExpenseData)
    
    // Step 5.5: Create revenue target for the project
    console.log('\n5️⃣.5️⃣ Creating revenue target for the project...')
    const createRevenueTargetResponse = await fetch(`${BACKEND_URL}/api/revenue-target/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        target: 80000, // 80% of budget
        createdBy: "example"
      }),
    })
    
    const createRevenueTargetData = await createRevenueTargetResponse.json()
    console.log('✅ Revenue target created:', createRevenueTargetData)
    
    // Step 6: Fetch projects again to see the relationships
    console.log('\n6️⃣ Fetching projects with relationships...')
    const getProjectsWithRelationsResponse = await fetch(`${BACKEND_URL}/api/project/all-projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectName: "",
        type: "",
        status: ""
      }),
    })
    
    const projectsWithRelationsData = await getProjectsWithRelationsResponse.json()
    console.log('✅ Projects with relationships:', JSON.stringify(projectsWithRelationsData, null, 2))
    
    const projectsWithRelations = projectsWithRelationsData.result?.projects || []
    const testProjectWithRelations = projectsWithRelations.find(p => p.id === testProject.id)
    
    if (testProjectWithRelations) {
      console.log('\n📊 Project Data Analysis:')
      console.log('Project Name:', testProjectWithRelations.projectName)
      console.log('Project ID:', testProjectWithRelations.id)
      console.log('Full Project Data:', JSON.stringify(testProjectWithRelations, null, 2))
      console.log('Budget Records:', testProjectWithRelations.BG_Budget?.length || 0)
      console.log('Sales Records:', testProjectWithRelations.salesEntry?.length || 0)
      console.log('Expense Records:', testProjectWithRelations.expenseEntries?.length || 0)
      
      if (testProjectWithRelations.BG_Budget?.length > 0) {
        console.log('Budget Amount:', testProjectWithRelations.BG_Budget[0].budget)
      }
      
      if (testProjectWithRelations.salesEntry?.length > 0) {
        console.log('Total Sales:', testProjectWithRelations.salesEntry.reduce((sum, sale) => sum + Number(sale.totalPrice), 0))
      }
      
      if (testProjectWithRelations.expenseEntries?.length > 0) {
        console.log('Total Expenses:', testProjectWithRelations.expenseEntries.reduce((sum, exp) => sum + Number(exp.cost), 0))
      }
    } else {
      console.log('❌ Test project not found in relations data')
    }
    
    console.log('\n✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testProjectCreation()
