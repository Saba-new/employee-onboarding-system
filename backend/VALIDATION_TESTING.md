# Backend Validation & Testing Documentation

## Validation Strategy

### 1. **Input Validation Middleware**
All API endpoints use validation middleware to check incoming data before processing.

**Location:** `backend/src/middlewares/validation.middleware.js`

**Validators:**
- `validateOnboardingRequest` - Validates employee onboarding submission
- `validateLoginRequest` - Validates login credentials
- `validateRegisterRequest` - Validates new employee registration
- `validateDocumentUpload` - Validates file uploads
- `validateRejectRequest` - Validates admin rejection remarks

### 2. **Validation Rules**

#### Onboarding Request:
```javascript
- first_name: 2-50 characters
- last_name: 2-50 characters
- email: Valid email format
- phone: Exactly 10 digits
- address: 10-500 characters
- date_of_birth: Valid date, age 18-100 years
```

#### Login:
```javascript
- email: Valid email format
- password: 6-100 characters
```

#### Document Upload:
```javascript
- documentType: Must be 'passport', 'aadhar', 'pan', or 'photo'
- file: Required, max 5MB
- file type: PDF, JPEG, PNG, DOC, DOCX only
```

#### Admin Rejection:
```javascript
- remarks: 10-500 characters (forces admin to provide meaningful feedback)
```

### 3. **Validation Utilities**
**Location:** `backend/src/utils/validation.js`

Reusable validation functions:
- `validateEmail(email)` - Email format check
- `validatePhone(phone)` - 10-digit phone validation
- `validateUUID(uuid)` - UUID format verification
- `validateRequiredFields(data, fields)` - Check missing fields
- `validateStringLength(value, fieldName, min, max)` - Length validation
- `validateFile(file, allowedTypes, maxSize)` - File validation

## Testing

### Test Framework: **Jest** + **Supertest**

**Installation:**
```bash
cd backend
npm install --save-dev jest supertest
```

**Run Tests:**
```bash
npm test                # Run all tests with coverage
npm run test:watch      # Watch mode for development
```

### Test Files

#### 1. Validation Utils Tests
**Location:** `backend/src/utils/__tests__/validation.test.js`

Tests all validation functions:
- Email format validation (valid/invalid cases)
- Phone number validation (10 digits only)
- UUID format validation
- Required fields checking
- String length validation

**Coverage:**
- ✅ Valid inputs acceptance
- ✅ Invalid inputs rejection
- ✅ Empty/null handling
- ✅ Edge cases (boundaries)
- ✅ Error message accuracy

#### 2. Auth Middleware Tests
**Location:** `backend/src/middlewares/__tests__/auth.middleware.test.js`

Tests JWT authentication:
- Missing Authorization header → 401
- Invalid token format → 401
- Expired token → 401
- Valid token → User attached to request
- Role verification (admin vs employee)

**Mocking Strategy:**
- Mocks Supabase client to avoid real database calls
- Tests middleware logic in isolation

### Example Test Output

```bash
npm test

PASS  src/utils/__tests__/validation.test.js
  Validation Utils
    validateEmail
      ✓ should accept valid email (3ms)
      ✓ should reject invalid email format (2ms)
      ✓ should reject empty email (1ms)
    validatePhone
      ✓ should accept valid 10-digit phone (1ms)
      ✓ should reject invalid phone format (1ms)
    ...

PASS  src/middlewares/__tests__/auth.middleware.test.js
  Auth Middleware
    verifyAuth
      ✓ should reject request without Authorization header (5ms)
      ✓ should accept valid token and attach user (4ms)
    ...

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Coverage:    85% statements, 78% branches
```

## How Validation Works in Your App

### Request Flow with Validation:

```
Client Request
    ↓
Express Router
    ↓
Validation Middleware (checks input)
    ↓ (if valid)
Auth Middleware (checks token)
    ↓ (if authenticated)
Controller (processes request)
    ↓
Service (business logic + DB validation)
    ↓
Database
```

### Example: Create Onboarding Request

**1. Client sends request:**
```javascript
POST /api/onboarding
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "address": "123 Main St",
  "date_of_birth": "1990-01-01"
}
```

**2. Validation Middleware checks:**
- All required fields present? ✓
- first_name 2-50 chars? ✓
- email valid format? ✓
- phone 10 digits? ✓
- address 10-500 chars? ✓
- age between 18-100? ✓

**3. If validation fails:**
```javascript
{
  "success": false,
  "message": "Phone number must be 10 digits",
  "statusCode": 400
}
```

**4. If validation passes:**
- Auth middleware checks JWT token
- Controller calls service
- Service checks business rules (no existing request)
- Creates record in database

## Business Logic Validation (Service Layer)

Beyond input validation, services enforce business rules:

**Example from `onboarding.service.js`:**

```javascript
// Check if employee already has pending request
const { data: existingPending } = await supabase
  .from('onboarding_requests')
  .select('id, status')
  .eq('employee_id', employeeId)
  .eq('status', 'pending')
  .single();

if (existingPending) {
  throw new AppError(
    'You already have a pending onboarding request',
    400
  );
}
```

**Other Business Rules:**
- Admin can only approve requests with all 4 documents uploaded
- Cannot approve/reject already processed requests
- Remarks required when rejecting (min 10 chars)
- Document type must match allowed types

## Security Validation

### 1. **Input Sanitization**
All strings are trimmed and validated before database insertion:
```javascript
first_name: requestData.first_name.trim()
email: requestData.email.toLowerCase().trim()
```

### 2. **File Upload Security**
- File type whitelist (no executables)
- Size limit enforcement (5MB)
- Unique filenames prevent overwrites
- Mime type verification

### 3. **SQL Injection Prevention**
- Using Supabase client (parameterized queries)
- UUID validation prevents malformed IDs
- No raw SQL strings

### 4. **Authentication Validation**
- Every protected route requires valid JWT
- Token verified with Supabase on each request
- Expired tokens automatically rejected

## Error Response Format

All validation errors return consistent format:

```javascript
{
  "success": false,
  "message": "Validation error message",
  "statusCode": 400
}
```

**Common Status Codes:**
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (unexpected error)

## Adding New Validation

### Step 1: Add validation function
**In `validation.middleware.js`:**
```javascript
function validateNewFeature(req, res, next) {
  try {
    const { field1, field2 } = req.body;
    
    validateRequiredFields(req.body, ['field1', 'field2']);
    validateStringLength(field1, 'Field 1', 5, 100);
    // ... more validation
    
    next();
  } catch (error) {
    next(error);
  }
}
```

### Step 2: Export it
**In `middlewares/index.js`:**
```javascript
module.exports = {
  // ... existing
  validateNewFeature
};
```

### Step 3: Use in route
**In route file:**
```javascript
router.post('/new-feature', 
  verifyAuth, 
  validateNewFeature,  // Add here
  controller
);
```

### Step 4: Write tests
**In `__tests__/validation.test.js`:**
```javascript
test('should accept valid input', () => {
  // Test valid case
});

test('should reject invalid input', () => {
  // Test error case
});
```

## Interview Questions on Validation & Testing

**Q: Why validate on both frontend and backend?**
**A:** Frontend validation improves UX (instant feedback), but users can bypass it via browser tools or direct API calls. Backend validation is the security layer - it's mandatory and cannot be bypassed.

**Q: What's the difference between validation middleware and business logic validation?**
**A:** 
- **Validation middleware**: Checks data format/type (is email valid? is phone 10 digits?)
- **Business logic validation**: Checks business rules (does employee already have a request? are all documents uploaded?)

**Q: Why use Jest for testing?**
**A:** Jest is popular, has built-in assertions, mocking, and coverage reports. Works great with Node.js and has excellent documentation.

**Q: What is test coverage and why does it matter?**
**A:** Coverage shows what percentage of code is executed during tests. High coverage (>80%) means most code paths are tested, reducing bugs in production.

**Q: How do you test code that calls external APIs (like Supabase)?**
**A:** Use **mocking** - replace real Supabase client with fake one that returns controlled responses. This makes tests fast, reliable, and doesn't require real database.

**Q: What happens if validation fails in middleware?**
**A:** Middleware calls `next(error)` which passes error to global error handler. Error handler formats response and sends it to client with appropriate status code.

## Best Practices

✅ **Always validate on backend** - Never trust client
✅ **Use middleware for reusable validation** - DRY principle
✅ **Write tests for validators** - Catch bugs early
✅ **Clear error messages** - Help users fix issues
✅ **Validate early** - Before hitting database
✅ **Sanitize input** - Trim whitespace, lowercase emails
✅ **Consistent error format** - Easy for frontend to parse

## Running Tests Before Deployment

**Pre-deployment checklist:**
```bash
# 1. Run all tests
npm test

# 2. Check coverage (should be >70%)
npm test -- --coverage

# 3. If tests pass, safe to deploy
git push origin main
```

Your project now has **production-grade validation and testing**! 🎉
