# NIMO

NIMO is a medical management system designed to help patients submit medical examination forms digitally and allow medical organizations to review, process, and generate examination reports.

## Overview
The NIMO application allows users to easily submit applications for medical examinations through a digital platform. It provides an organized environment for medical examiners to record examination results and generate structured PDF reports, which can be securely saved in the database for future reference.

By digitizing the examination process, NIMO reduces the need to manually track multiple patients and physical documents. This helps medical organizations manage records efficiently while allowing patients to receive their medical results faster.

The system is primarily designed for individuals planning to go abroad who require official medical checkups and documentation as part of their application process.

## Features
- Application creation and automatic assignment to medical organization with status tracking.
- Creating results with a pre defined form and saving it in database.
- Payment made easier with in built payment management system.

## Tech Stack
- Frontend: Next.JS
- Backend: Next.JS
- Database: MongoDB Atlas
- Other tools: Google cloud console, Tailwind CSS.

## Project Structure

The NIMO project is organized as follows:

### /app
Contains the main application logic and UI.

- `/api` – Backend API routes for handling requests from the frontend.
- `/auth` – Handles authentication-related functionality (login, signup, forbidden).
- `/component` – Reusable React components.
- `/dashboard` – Pages and components for the main pages of the users.
- `/payment` – Handles payment-related functionality for medical services.
- `/registration` – Logic for patient or organization registration pointing towards the component.
- `/reports` – Logic for generating and displaying medical reports.
- `/verify` – Handles verification processes for creation of result generated through the app itself.
- `favicon.ico` – Site favicon.
- `globals.css` – Global CSS styles.
- `layout.tsx` – Layout wrapper used across pages.
- `page.tsx` – Entry point for the main page.
- `providers.tsx` – Context providers and global state management.

### /lib
Contains helper libraries and services used throughout the app.

- `/services`
  - `hybridAllocation.ts` – Algorithm for hybrid allocation of users to medical organizations.
- `auth.ts` – Authentication service functions.
- `mongodb.ts` – Database connection and MongoDB-related functions.
- `pdfGenerator.ts` – Generation of PDF reports through HTML, CSS.

### /models
Database schema models.

### /node_modules
Installed npm dependencies (auto-generated).

### /public
Contains uploaded pictures of the user's passport or previous medical reports

### /scripts
Custom scripts used in development or build processes.

### /types
TypeScript type definitions for strong typing across the application.

### Root files
- `.env.local` – Environment variables (database connection strings, API keys, etc.).
- `.gitignore` – Specifies which files/folders to ignore in Git.
- `eslint.config.js` – ESLint configuration.
- `middleware.ts` – Middleware functions for the app.
- `next-env.d.ts` – TypeScript definitions for Next.js.
- `next.config.ts` – Next.js configuration file.
- `package.json` & `package-lock.json` – Project dependencies and scripts.


## Setup & Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/nimo.git
cd nimo
npm install
```
2. Environment variables
Create a .env.local file and add the following secrets
MONGODB_URI- mongodb atlas connection string
MONGODB_DB- Cluster0 
GOOGLE_CLIENT_ID- google console cloud ID
GOOGLE_CLIENT_SECRET- google console cloud secret key
NEXTAUTH_URL- localhost:3000
NEXTAUTH_SECRET- random secret string
NEXT_PUBLIC_APP_URL- vercel deployment url

## Usage
Logging in with the role of foreign employee allows the user to create applications and fill their details and display the status of their application.
Logging in as medical organization allows the user to view the multiple applications and fill their result details in a pdf format and save it in database.
Logging in as an admin allows you to view everything and change certain important aspects of documents and applications.

# THE ADMIN OPTION IN REGISTRATION CAN BE ACCESED BY CLICKING ON THE * BESIDES ACCOUNT TYPE 3 TIMES.

## Conclusion
NIMO simplifies medical examination form handling by digitizing the submission, review, and documentation process, improving efficiency for both patients and medical organizations.