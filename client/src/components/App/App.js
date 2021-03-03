import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom'
import { useRoutes } from '../../routes';
import { useAuth } from '../../hooks/auth.hook';
import { AuthContext } from '../../context/AuthContext';
import { Loader } from '../Loader/Loader';
import { Navbar } from '../Navbar/Navbar';

import 'materialize-css';


/**
 * Компонент приложения "Лицевой счет диспетчера".
 */
export default function App() {
  // Работа с приложением предполагает аутентификацию пользователя
  const { token, login, logout, userId, ready } = useAuth();

  // Флаг (true/false) аутентифицированности пользователя
  const isAuthenticated = !!token;

  // Маршруты, по которым могут передвигаться пользователи, определяются
  // флагом isAuthenticated
  const routes = useRoutes(isAuthenticated);

  // Если процесс аутентификации пользователя еще не завершен, отображаем компонент
  // ожидания загрузки
  if (!ready) {
    return <Loader />
  }

  return (
    <AuthContext.Provider value={{
      token, login, logout, userId, isAuthenticated
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
