import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
    // Verificăm dacă utilizatorul are un token salvat
    const token = localStorage.getItem('token');

    // Dacă nu are token, îl trimitem la pagina de Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Dacă are token, randează componentele copil (rutele pe care vrem să le protejăm)
    // Outlet este ca un "placeholder" pentru acele rute.
    return <Outlet />;
};

export default ProtectedRoute;