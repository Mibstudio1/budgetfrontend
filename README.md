# Budget Management System - Frontend

## การเปลี่ยนแปลงล่าสุด

### ✅ ลบ Mock Data และเปลี่ยนไปใช้ API จริงแล้ว
- ลบไฟล์ `lib/mockup-data.ts`
- ลบไฟล์ `lib/services/mockupService.ts`
- ลบไฟล์ `lib/data-summary.ts`
- ลบไฟล์ `lib/data-verification.ts`
- ลบไฟล์ `lib/MOCK_DATA_COMPLETE.md`
- ลบไฟล์ `MOCKUP_DATA_README.md`
- ลบไฟล์ `PROJECT_OVERVIEW_IMPROVEMENTS.md`

### ✅ อัปเดต Service ทั้งหมดให้ใช้ API จริง
- `projectService.ts` - ใช้ API `/api/project/*`
- `budgetService.ts` - ใช้ API `/api/budget/*`
- `expenseService.ts` - ใช้ API `/api/expense-entry/*`
- `salesService.ts` - ใช้ API `/api/sales-entry/*`
- `dashboardService.ts` - ใช้ API `/api/dashboard/*`
- `revenueService.ts` - ใช้ API `/api/revenue-target/*`
- `reportService.ts` - ใช้ API `/api/report/*`
- `optionsService.ts` - ใช้ API `/api/options/*`
- `userService.ts` - ใช้ API `/api/user/*`

### ✅ อัปเดตหน้า Dashboard ให้ใช้ API จริง
- เปลี่ยนจาก mock data เป็นการเรียก API `/api/dashboard/monthly-detail`
- เพิ่ม loading state และ error handling
- อัปเดต UI ให้แสดงข้อมูลจาก API

## โครงสร้างโปรเจค

```
fontend/
├── app/                    # Next.js App Router
│   ├── page.tsx           # หน้าหลัก
│   ├── dashboard/         # หน้า Dashboard
│   ├── projects/          # หน้าโครงการ
│   ├── reports/           # หน้ารายงาน
│   ├── data-entry/        # หน้าการป้อนข้อมูล
│   ├── expense-entry/     # หน้าป้อนข้อมูลค่าใช้จ่าย
│   ├── sales-entry/       # หน้าป้อนข้อมูลยอดขาย
│   ├── budget-management/ # หน้าจัดการงบประมาณ
│   ├── monthly-targets/   # หน้าเป้าหมายรายเดือน
│   ├── outstanding-expenses/ # หน้าค่าใช้จ่ายค้างจ่าย
│   ├── cost-profit-report/ # หน้ารายงานต้นทุน-กำไร
│   ├── budget-report/     # หน้ารายงานงบประมาณ
│   ├── budget-allocation/ # หน้าแบ่งสรรงบประมาณ
│   ├── login/             # หน้าเข้าสู่ระบบ
│   ├── register/          # หน้าลงทะเบียน
│   └── admin/             # หน้าผู้ดูแลระบบ
├── components/            # React Components
│   ├── ui/               # UI Components (shadcn/ui)
│   ├── navbar.tsx        # Navigation Bar
│   ├── auth-context.tsx  # Authentication Context
│   └── protected-route.tsx # Protected Route Component
├── lib/                  # Utility Libraries
│   ├── services/         # API Services
│   ├── backend-api.ts    # Backend API Client
│   ├── auth-utils.ts     # Authentication Utilities
│   └── token-manager.ts  # Token Management
├── hooks/                # Custom React Hooks
├── public/               # Static Assets
└── styles/               # Global Styles
```

## การติดตั้งและรัน

### Prerequisites
- Node.js 18+ 
- npm หรือ yarn
- Backend API server (NestJS)

### การติดตั้ง
```bash
# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env.local
cp .env.example .env.local

# แก้ไข .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:10358
```

### การรัน
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/authen/login` - เข้าสู่ระบบ
- `POST /api/authen/register` - ลงทะเบียน

### Projects
- `POST /api/project/all-projects` - ดึงข้อมูลโครงการทั้งหมด
- `POST /api/project/create` - สร้างโครงการใหม่
- `PATCH /api/project/update` - อัปเดตโครงการ
- `DELETE /api/project/delete` - ลบโครงการ

### Budgets
- `GET /api/budget/get-budget` - ดึงข้อมูลงบประมาณ
- `POST /api/budget/create` - สร้างงบประมาณใหม่
- `PATCH /api/budget/update` - อัปเดตงบประมาณ
- `DELETE /api/budget/delete` - ลบงบประมาณ

### Expenses
- `POST /api/expense-entry/recently` - ดึงข้อมูลค่าใช้จ่ายล่าสุด
- `POST /api/expense-entry/create` - สร้างค่าใช้จ่ายใหม่
- `PATCH /api/expense-entry/update` - อัปเดตค่าใช้จ่าย
- `DELETE /api/expense-entry/delete` - ลบค่าใช้จ่าย

### Sales
- `POST /api/sales-entry/recently` - ดึงข้อมูลยอดขายล่าสุด
- `POST /api/sales-entry/create` - สร้างยอดขายใหม่
- `PATCH /api/sales-entry/update` - อัปเดตยอดขาย
- `DELETE /api/sales-entry/delete` - ลบยอดขาย

### Dashboard
- `GET /api/dashboard/all-projects` - ดึงข้อมูลโครงการสำหรับ dashboard
- `GET /api/dashboard/monthly-detail` - ดึงข้อมูลรายเดือน

### Reports
- `GET /api/report/cost-profit` - รายงานต้นทุน-กำไร
- `POST /api/report/outstanding-expense` - รายงานค่าใช้จ่ายค้างจ่าย

### Options
- `GET /api/options/project-group` - ตัวเลือกกลุ่มโครงการ
- `GET /api/options/project-status` - ตัวเลือกสถานะโครงการ
- `GET /api/options/expense-items` - ตัวเลือกรายการค่าใช้จ่าย

### Users
- `GET /api/user/get-user` - ดึงข้อมูลผู้ใช้
- `PATCH /api/user/update` - อัปเดตข้อมูลผู้ใช้
- `DELETE /api/user/delete` - ลบผู้ใช้

## เทคโนโลยีที่ใช้

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context + useState
- **Authentication**: JWT Token
- **HTTP Client**: Fetch API
- **Icons**: Lucide React

## การพัฒนา

### การเพิ่ม Feature ใหม่
1. สร้าง API endpoint ใน backend
2. อัปเดต service ใน `lib/services/`
3. สร้างหรืออัปเดตหน้าใน `app/`
4. เพิ่ม routing ใน `app/layout.tsx`

### การแก้ไข UI
- ใช้ shadcn/ui components ใน `components/ui/`
- ใช้ Tailwind CSS สำหรับ styling
- ใช้ Lucide React สำหรับ icons

### การจัดการ State
- ใช้ React Context สำหรับ global state (auth, theme)
- ใช้ useState สำหรับ local state
- ใช้ useEffect สำหรับ side effects

## การ Deploy

### Vercel (แนะนำ)
```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## การทดสอบ

```bash
# Run tests
npm test

# Run e2e tests
npm run test:e2e

# Run linting
npm run lint
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **API Connection Error**: ตรวจสอบ `NEXT_PUBLIC_BACKEND_URL` ใน `.env.local`
2. **Authentication Error**: ตรวจสอบ JWT token และ session
3. **CORS Error**: ตรวจสอบ CORS settings ใน backend

### การ Debug
- ใช้ browser developer tools
- ตรวจสอบ Network tab สำหรับ API calls
- ใช้ console.log สำหรับ debugging
- ตรวจสอบ error logs ใน terminal

## License

MIT License
# budgetfrontend
