# ระบบ Authentication ใหม่

## การปรับปรุงระบบ Authentication

ระบบ authentication ได้รับการปรับปรุงให้มีความปลอดภัยและใช้งานง่ายขึ้น โดยมีการเปลี่ยนแปลงหลักดังนี้:

### 1. การเก็บ Token
- **เปลี่ยนจาก Cookies เป็น sessionStorage**: เพื่อให้ token ถูกเก็บไว้ใน browser session และหายเมื่อปิด tab/browser
- **การตรวจสอบ Token Validity**: เพิ่มการตรวจสอบ JWT payload และ expiration time
- **Session Timeout Management**: ระบบจะตรวจสอบ session timeout อัตโนมัติ

### 2. การตรวจสอบ Session
- **Automatic Session Check**: ตรวจสอบ session ทุก 1 นาที
- **Window Focus Detection**: ตรวจสอบเมื่อกลับมาที่แท็บ
- **URL Change Detection**: ตรวจสอบเมื่อมีการเปลี่ยนหน้า

### 3. Session Timeout Warning
- **Warning Dialog**: แสดง warning เมื่อ session ใกล้หมดเวลา (10 นาทีก่อนหมด)
- **Auto Logout**: ออกจากระบบอัตโนมัติเมื่อ session หมดเวลา
- **Manual Extend**: ผู้ใช้สามารถขยาย session ได้

### 4. การจัดการ Authentication Flow

#### การ Login
```typescript
const { login } = useAuth()
const success = await login(username, password)
if (success) {
  // Redirect to dashboard
}
```

#### การตรวจสอบ Authentication
```typescript
const { isAuthenticated, user } = useAuth()
if (isAuthenticated) {
  // User is logged in
}
```

#### การ Logout
```typescript
const { logout } = useAuth()
logout() // Clears token and redirects to login
```

### 5. Components ที่เกี่ยวข้อง

#### AuthProvider
- จัดการ authentication state
- ตรวจสอบ session timeout
- จัดการ login/logout

#### ProtectedRoute
- ป้องกันหน้าเว็บที่ต้อง login
- ตรวจสอบ role-based access
- Redirect ไป login ถ้าไม่ได้ login

#### SessionTimeoutWarning
- แสดง warning เมื่อ session ใกล้หมดเวลา
- ให้ผู้ใช้เลือกขยาย session หรือ logout

### 6. Utilities

#### TokenManager
```typescript
// เก็บ token
TokenManager.setToken(token, expiresIn)

// ดึง token
const token = TokenManager.getToken()

// ตรวจสอบ authentication
const isAuth = TokenManager.isAuthenticated()

// ลบ token
TokenManager.clearToken()
```

#### AuthUtils
```typescript
// ตรวจสอบ session validity
const isValid = AuthUtils.isSessionValid()

// ตรวจสอบ permission
const hasPermission = AuthUtils.hasPermission(userRole, requiredRole)

// ตรวจสอบ session info
const sessionInfo = AuthUtils.getSessionInfo()
```

### 7. การทำงานของระบบ

1. **เมื่อเปิดเว็บไซต์**:
   - ตรวจสอบ token ใน sessionStorage
   - ถ้ามี token และยังไม่หมดอายุ → login อัตโนมัติ
   - ถ้าไม่มี token หรือหมดอายุ → redirect ไป login

2. **เมื่อ login สำเร็จ**:
   - เก็บ token และ user data ใน sessionStorage
   - ตั้งค่า expiration time
   - Redirect ไปหน้า dashboard

3. **ระหว่างใช้งาน**:
   - ตรวจสอบ session timeout ทุก 1 นาที
   - แสดง warning เมื่อใกล้หมดเวลา
   - Auto logout เมื่อหมดเวลา

4. **เมื่อปิด tab/browser**:
   - sessionStorage จะถูกล้างอัตโนมัติ
   - เมื่อเปิดใหม่จะต้อง login ใหม่

### 8. Security Features

- **Token Validation**: ตรวจสอบ JWT format และ expiration
- **Session Timeout**: หมดอายุอัตโนมัติตามเวลาที่กำหนด
- **Role-based Access**: ตรวจสอบสิทธิ์ตาม role
- **Secure Storage**: ใช้ sessionStorage แทน cookies
- **Auto Logout**: ออกจากระบบอัตโนมัติเมื่อ session หมดเวลา
- **Tab-based Session**: session หายเมื่อปิด tab/browser

### 9. การทดสอบ

1. **Login และใช้งานปกติ**
2. **เปิดหน้าต่างใหม่** - ควรยังคง login อยู่ (ใน session เดียวกัน)
3. **ปิด tab แล้วเปิดใหม่** - ควรต้อง login ใหม่
4. **รอให้ session หมดเวลา** - ควร logout อัตโนมัติ
5. **กลับมาที่แท็บหลังจากหายไปนาน** - ควร logout ถ้า session หมดเวลา

### 10. การแก้ไขปัญหา

#### ถ้า login ไม่ทำงาน
- ตรวจสอบ backend API
- ตรวจสอบ token format
- ตรวจสอบ sessionStorage

#### ถ้า session หายบ่อย
- ตรวจสอบ expiration time
- ตรวจสอบ session timeout settings
- ตรวจสอบ browser sessionStorage

#### ถ้า redirect ไม่ทำงาน
- ตรวจสอบ middleware
- ตรวจสอบ ProtectedRoute component
- ตรวจสอบ router configuration

### 11. การเปลี่ยนแปลงจาก localStorage เป็น sessionStorage

**เหตุผลในการเปลี่ยนแปลง:**
- **ความปลอดภัย**: sessionStorage หายเมื่อปิด tab/browser
- **User Experience**: ผู้ใช้ต้อง login ใหม่เมื่อเปิด tab ใหม่
- **Security Best Practice**: ไม่เก็บ sensitive data ไว้ถาวร

**ผลกระทบ:**
- เมื่อปิด tab แล้วเปิดใหม่ จะต้อง login ใหม่
- session จะหายเมื่อปิด browser
- ปลอดภัยกว่าเพราะข้อมูลไม่ถูกเก็บไว้ถาวร
