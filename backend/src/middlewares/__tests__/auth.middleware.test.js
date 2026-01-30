const { verifyAuth } = require('../auth.middleware');
const supabase = require('../../config/supabase');
const { AppError } = require('../../utils/errorHandler');

jest.mock('../../config/supabase', () => ({
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyAuth', () => {
    test('should reject request without Authorization header', async () => {
      await verifyAuth(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('No authentication token provided');
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    test('should reject request with invalid Authorization format', async () => {
      req.headers.authorization = 'InvalidFormat token123';
      
      await verifyAuth(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('No authentication token provided');
    });

    test('should reject empty token', async () => {
      req.headers.authorization = 'Bearer ';
      
      await verifyAuth(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Invalid token format');
    });

    test('should reject invalid token from Supabase', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });
      
      await verifyAuth(req, res, next);
      
      expect(supabase.auth.getUser).toHaveBeenCalledWith('invalid-token');
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Invalid or expired token');
    });

    test('should reject when employee record not found', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });
      
      await verifyAuth(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Employee record not found');
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    test('should accept valid token and attach user to request', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockEmployee = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'employee'
      };
      
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });
      
      await verifyAuth(req, res, next);
      
      expect(req.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('should handle admin role correctly', async () => {
      req.headers.authorization = 'Bearer admin-token';
      
      const mockUser = { id: 'admin-123' };
      const mockEmployee = {
        id: 'admin-123',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      };
      
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEmployee,
              error: null
            })
          })
        })
      });
      
      await verifyAuth(req, res, next);
      
      expect(req.user.role).toBe('admin');
    });
  });
});
