import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { isAuthenticated, isAdmin, user }); // Debug log

  if (!isAdmin) {
    console.log('Access denied: Not an admin'); // Debug log
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 