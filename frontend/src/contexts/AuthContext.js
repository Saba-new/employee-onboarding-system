import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      
      if (error || !authUser) {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      // Get employee details
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (employee) {
        setUser({
          id: employee.id,
          email: employee.email,
          role: employee.role,
          firstName: employee.first_name || employee.full_name?.split(' ')[0] || 'User',
          lastName: employee.last_name || employee.full_name?.split(' ')[1] || ''
        });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    localStorage.setItem('token', data.session.access_token);
    
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('id', data.user.id)
      .single();

    setUser({
      id: employee.id,
      email: employee.email,
      role: employee.role,
      firstName: employee.first_name || employee.full_name?.split(' ')[0] || 'User',
      lastName: employee.last_name || employee.full_name?.split(' ')[1] || ''
    });

    return employee;
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    setUser(null);
  }

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
