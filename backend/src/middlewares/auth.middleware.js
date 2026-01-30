const supabase = require('../config/supabase');
const { AppError } = require('../utils/errorHandler');

async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', user.id)
      .single();

    if (employeeError || !employee) {
      throw new AppError('Employee record not found', 404);
    }

    req.user = {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      firstName: employee.first_name,
      lastName: employee.last_name
    };

    next();

  } catch (error) {
    next(error);
  }
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      req.user = null;
      return next();
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', user.id)
      .single();

    if (employeeError || !employee) {
      req.user = null;
      return next();
    }

    req.user = {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      firstName: employee.first_name,
      lastName: employee.last_name
    };

    next();

  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = {
  verifyAuth,
  optionalAuth
};
