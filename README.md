# DOZANDA FUEL TRADING LLC - HR & Asset Management Web Application

## Overview
This is a full-stack web application designed specifically for **DOZANDA FUEL TRADING LLC**'s HR and Asset Management needs.

### Key Features
1. **Employee Details Management**: Track info, passports, visas, insurance, and medical status.
2. **Company Documents Management**: Categorize and secure trade licenses, VAT details, and audit reports.
3. **Vehicle Details Management**: Track fleet vehicles, insurances, drivers, and photos.

**Special Features Implemented:**
- **Custom Headings (Dynamic Fields)**: You can add limitless custom key-value pairs (like "Blood Group", "Emergency Contact Relation") to any record seamlessly via the "Add Custom Heading" button on every module.
- **Local File Uploads**: PDF/Images are uploaded and saved to `backend/uploads/` via Multer.
- **Data Export**: 1-click export of data to **Excel (.xlsx)** or **PDF**.
- **Modern Premium UI**: Fully customized Vanilla CSS to provide a clean, modern glass-morphism feel without bloat.
- **Local Database**: Zero-cloud SQLite setup.

## Prerequisites
To run this application on your machine, you must have **Node.js** installed.
1. Download Node.js from [https://nodejs.org](https://nodejs.org) (Recommend LTS version).
2. Install it. Ensure that you check the box to add Node.js/npm to your system `PATH`.

## Setup Instructions

### 1. Backend Setup
1. Open your terminal or `cmd`.
2. Navigate to the backend folder:
   ```bash
   cd "d:\DOZANDA FUEL TRADING HR DEPARTMENT\backend"
   ```
3. Install the required Node modules:
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   *The backend will run on `http://localhost:5000` and automatically create the SQLite database (`database.sqlite`) and the default admin user.*

### 2. Frontend Setup
1. Open a **new** terminal or command prompt window.
2. Navigate to the frontend folder:
   ```bash
   cd "d:\DOZANDA FUEL TRADING HR DEPARTMENT\frontend"
   ```
3. Install the frontend dependencies:
   ```bash
   npm install
   ```
4. Start the React frontend application:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000`. Open this URL in your web browser.*

## Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

## Directory Structure
- `backend/database.sqlite`: The local SQLite database file containing all your records.
- `backend/uploads/employees/`: Local storage for passport/visa scans.
- `backend/uploads/company/`: Local storage for legal documents.
- `backend/uploads/vehicles/`: Local storage for vehicle photos/insurances.
