# Employee Onboarding System

Full-stack employee onboarding and document verification system with role-based access control.

## Tech Stack

**Backend:** Node.js, Express, Supabase (PostgreSQL + Auth + Storage), Multer  
**Frontend:** React 18, React Router, Axios

## Features

- Employee self-service onboarding submission
- Document upload with validation (PDF, images, DOC)
- Admin review and approval workflow
- Status history tracking
- JWT authentication
- Track all onboarding requests across organization

## Project Structure

```
Employee/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase & Multer configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic layer

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev  # Runs on http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm start    # Runs on http://localhost:3002
```

### Environment Setup

**backend/.env:**
```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
STORAGE_BUCKET=employee-documents
```

**frontend/.env:**
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```
   
   App will open at `http://localhost:3000` (or 3001 if backend is on 3000)

## Database Schema

### Tables

**employees**
- id (UUID, Primary Key)
- email (unique)
- password_hash
- first_name
- last_name
- role (employee/admin)
- created_at
- updated_at

**onboarding_requests**
- id (UUID, Primary Key)
- employee_id (Foreign Key → employees)
- first_name
- last_name
- email
- phone
- address
- date_of_birth
- status (pending/approved/rejected)
- remarks
- created_at
- updated_at

**documents**
- id (UUID, Primary Key)
- onboarding_request_id (Foreign Key → onboarding_requests)
- employee_id (Foreign Key → employees)
- document_type (resume/id_proof/address_proof/education/other)
- file_name
- file_path

## API Endpoints

**Auth:** `/api/auth/login`, `/api/auth/signup`  
**Employee:** `/api/onboarding/*`, `/api/documents/*`  
**Admin:** `/api/admin/onboarding/*`, `/api/admin/dashboard/*`

## Usage

**Employee:** Login → Create Request → Upload Documents → Track Status  
**Admin:** Login → View Pending → Review → Approve/Reject

## Test Accounts

- Employee: test.employee@example.com / password123
- Admin: admin@test.com / admin123456
   - Approve or reject the request

## Testing

### Test User Credentials

You'll need to create test users in Supabase Auth:

**Employee:**
- Email: employee@test.com
- Password: (set in Supabase Auth)

**Admin:**
- Email: admin@test.com
- Password: (set in Supabase Auth)
- Role: 'admin' (set in employees table)

### Test Flow

1. Login as employee → Create onboarding request → Upload documents
2. Login as admin → Review request → Approve/Reject
3. Login as employee → Check status update

## Environment Variables

### Backend (.env)
```
PORT=3000
SUPABASE_URL=https://iuglpghgwsqavuyywgsz.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SUPABASE_URL=https://iuglpghgwsqavuyywgsz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

## Development

### Backend
```bash
npm run dev    # Start with nodemon (auto-reload)
npm start      # Start normally
```

### Frontend
```bash
npm start      # Start React dev server
npm build      # Build for production
```

## Security Features

- Password hashing (via Supabase Auth)
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- File type validation
- Secure file storage with signed URLs

## Code Principles

This project follows **PSR-2 inspired coding principles**:

- Clean separation of concerns
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Consistent naming conventions
- Proper error handling
- Meaningful comments where needed

## Troubleshooting

### Backend won't start
- Check if port 3000 is available
- Verify Supabase credentials in .env
- Run `npm install` again

### Frontend won't connect to backend
- Ensure backend is running on port 3000
- Check REACT_APP_API_URL in frontend/.env
- Clear browser cache and localStorage

### Authentication issues
- Verify Supabase Auth is configured
- Check JWT token in localStorage
- Ensure user has correct role in employees table

## Future Enhancements

- Email notifications
- Document approval workflow
- Bulk operations for admins
- Advanced filtering and search
- Export reports (PDF/Excel)
- Two-factor authentication
- Audit logs

## License

This project is for educational/submission purposes.

## Contact

For any issues or questions, please contact the development team.
