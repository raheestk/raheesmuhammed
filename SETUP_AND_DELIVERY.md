# DOZANDA FUEL TRADING LLC - Delivery Notes

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite (local file)
- Exports: Excel (`xlsx`) + PDF (`jsPDF`)
- Uploads: Local folders using Multer

## Login Credentials
- Username: `admin`
- Password: `admin123`

## Setup Instructions
1. Install Node.js (LTS) from [https://nodejs.org](https://nodejs.org).
2. Start backend:
   - `cd "d:\DOZANDA FUEL TRADING HR DEPARTMENT\backend"`
   - `npm install`
   - `npm start`
3. Start frontend:
   - `cd "d:\DOZANDA FUEL TRADING HR DEPARTMENT\frontend"`
   - `npm install`
   - `npm run dev`
4. Open `http://localhost:3000`.

## Folder Structure
- `backend/server.js` - API entry
- `backend/database.js` - schema + seed data
- `backend/routes/auth.js` - login
- `backend/routes/employees.js` - employee CRUD + files + validation
- `backend/routes/company.js` - company CRUD + files
- `backend/routes/vehicles.js` - vehicle CRUD + files + validation
- `backend/routes/dashboard.js` - dashboard stats
- `backend/uploads/employees/`
- `backend/uploads/company/`
- `backend/uploads/vehicles/`
- `frontend/src/pages/` - `Login`, `Dashboard`, `Employees`, `CompanyDocs`, `Vehicles`
- `frontend/src/components/Layout.jsx` - sidebar layout

## Sample Data
Auto-seeded when DB is empty:
- 1 Employee record
- 1 Company document record
- 1 Vehicle record

## Delivered Features
- Secure admin login (JWT)
- Dashboard summary cards
- Employee module with required fields + passport/visa/insurance/medical
- Company details module with document categories
- Vehicle details module with photo/doc uploads
- Dynamic custom headings/fields in all modules
- Local file uploads in organized folders
- Record create, edit, view, delete
- Search/filter/sort in all modules
- Excel and PDF exports
- Basic date/phone/required-field validation
