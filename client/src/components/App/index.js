import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom'
import { useRoutes } from '../../routes';
import { useAuth } from '../../hooks/auth.hook';
import { AuthContext } from '../../context/AuthContext';
import Loader from '../Loader';
import { Navbar } from '../Navbar';
import { Layout } from 'antd';

import 'antd/dist/antd.css';
import '../../assets/styles/modals.scss';
import '../../assets/styles/tables.scss';
import '../../assets/styles/text.scss';
import '../../assets/styles/lists.scss';
import '../../assets/styles/blocks.scss';

const { Content, Footer } = Layout;


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
    clearAuthError,
    hasUserCredential,
  } = useAuth();

  // Флаг (true/false) аутентифицированности пользователя
  const isAuthenticated = !!token && !!userRoles && !!userCredentials;

  // Маршруты, по которым может передвигаться пользователь, определяются
  // флагом isAuthenticated и ролью пользователя
  const routes = useRoutes(isAuthenticated, hasUserCredential);

  // Если процесс аутентификации пользователя еще не завершен, отображаем компонент
  // ожидания загрузки
  if (!ready) {
    return <Loader />
  }

  return (
    <AuthContext.Provider value={{
      login, logout, isAuthenticated, token, userId, userService, userRoles,
      userCredentials, authError, clearAuthError, hasUserCredential,
    }}>
      <Router>
        <Layout>
          {isAuthenticated && <Navbar />}
          <Content>
            {routes}
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Утилита администрирования аккаунтов и НСИ ГИД НЕМАН ©2021 КТЦ БелЖД
          </Footer>
        </Layout>
      </Router>
    </AuthContext.Provider>
  )
}
