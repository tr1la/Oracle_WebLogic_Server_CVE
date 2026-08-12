import { createContext, useContext, useState, useEffect } from 'react';
import { getUserById } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          const response = await getUserById(userId);
          const userData = response.data;
          console.log('User data from API:', userData);
          console.log('User data keys:', Object.keys(userData));
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
        localStorage.removeItem('userId');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toUpperCase() === 'ADMIN',
    loading
  };

  console.log('AuthContext value:', value);
  console.log('User object:', user);
  console.log('User role:', user?.role);
  console.log('Is admin check:', user?.role?.toUpperCase() === 'ADMIN');

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};