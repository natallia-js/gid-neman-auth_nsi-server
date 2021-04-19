import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom'
import { useRoutes } from '../../routes';
import { useAuth } from '../../hooks/auth.hook';
import { AuthContext } from '../../context/AuthContext';
import { Loader } from '../Loader/Loader';
import { Navbar } from '../Navbar/Navbar';

import 'materialize-css';


/**
 * Компонент приложения.
 */
export default function App() {
  // Работа с приложением предполагает аутентификацию пользователя
  const {
    login,
    logout,
    userId,
    token,
    ready,
    userService,
    userRoles,
    userCredentials,
    authError,
    clearAuthError } = useAuth();

  // Флаг (true/false) аутентифицированности пользователя
  const isAuthenticated = !!token;

  // Маршруты, по которым может передвигаться пользователь, определяются
  // флагом isAuthenticated и ролью пользователя
  const routes = useRoutes(isAuthenticated, userRoles);

  // Если процесс аутентификации пользователя еще не завершен, отображаем компонент
  // ожидания загрузки
  if (!ready) {
    return <Loader />
  }

  return (
    <AuthContext.Provider value={{
      login, logout, isAuthenticated, token, userId, userService, userRoles,
      userCredentials, authError, clearAuthError
    }}>
      <Router>
        {isAuthenticated && <Navbar />}
        <div>
          {routes}
        </div>
      </Router>
    </AuthContext.Provider>
  )
}
