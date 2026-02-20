# Showa Grocery Management - Admin Panel

This is the admin panel for the Showa Grocery Management system, built with Next.js 15 and Tailwind CSS.

## Features

### 🏠 Dashboard
- Overview of key metrics (employees, roles, backups)
- Quick actions for common tasks
- System status information

### 👥 Employee Management
- View all employees with search functionality
- Create, edit, and delete employee accounts
- Assign roles and permissions
- Toggle active/inactive status
- View employee details (name, username, phone, role)

### 🔒 Role Management
- Create and manage user roles
- Define granular permissions for each role
- Permissions include:
  - Inventory (view, add, edit, delete, transfer)
  - Purchases (view, add, edit, delete)
  - Orders (view, create, edit, cancel)
  - Billing (view, create, payment)
  - Reports (view, export)
  - Users (view, manage)
  - Settings (view, edit)
- View all roles with permission counts
- Cannot delete admin role or roles in use

### 💾 Backup & Restore
- Create database backups
- Custom backup location support
- View all available backups with details (size, date)
- Restore from any backup
- Auto-creates safety backup before restore
- Delete old backups

### 📊 Reports & Analytics
- **Sales Report**: View all orders with filters by date range
- **User Activity**: Track employee performance and login history
- **Inventory Report**: Current stock levels and status
- Export reports to CSV
- Summary statistics for each report type

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure the backend server is running on the **same machine** at port 24034:
```bash
cd ../backend
npm start
```

3. Start the admin panel:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3000` and will connect to backend at `http://localhost:24034`

## Default Login

- **Username**: admin
- **Password**: admin123

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **API Client**: Axios
- **Backend**: Connects to localhost:24034

## Project Structure

```
admin/
├── app/
│   ├── dashboard/
│   │   ├── layout.jsx          # Dashboard layout with sidebar
│   │   ├── page.jsx             # Dashboard home
│   │   ├── employees/
│   │   │   └── page.jsx         # Employee management
│   │   ├── roles/
│   │   │   └── page.jsx         # Role management
│   │   ├── backup/
│   │   │   └── page.jsx         # Backup & restore
│   │   └── reports/
│   │       └── page.jsx         # Reports & analytics
│   ├── login/
│   │   └── page.jsx             # Login page
│   ├── layout.js                # Root layout
│   ├── page.jsx                 # Home (redirects to login)
│   └── globals.css              # Global styles
├── util/
│   ├── api.js                   # Axios instance (localhost connection)
│   └── apiService.js            # API service methods
└── public/
```

## API Integration

The admin panel connects to the backend API running on the same machine at `http://localhost:24034`. It uses:

- Direct localhost connection for fast communication
- localStorage for JWT token management
- Axios for HTTP requests
- JWT token authentication

### Backend Endpoints Used

- `POST /api/auth/login` - Login
- `GET /api/users` - List employees
- `POST /api/users` - Create employee
- `PUT /api/users/:id` - Update employee
- `DELETE /api/users/:id` - Delete employee
- `GET /api/roles` - List roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/backup` - List backups
- `POST /api/backup/create` - Create backup
- `POST /api/backup/restore` - Restore backup
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/users` - User activity report
- `GET /api/reports/inventory` - Inventory report

## Development Notes

- All pages use `'use client'` directive for client-side rendering
- Backend must be running on localhost:24034
- SSR-safe: All browser APIs are checked for `window` existence
- Responsive design for desktop and mobile views
- Admin-only access enforced on all routes

## Building for Production

```bash
npm run build
npm start
```

## License

Proprietary - Showa Grocery Management System

