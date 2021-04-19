import { useState, useCallback, useEffect } from 'react';
import {
  LOCALSTORAGE_NAME,
  MAIN_ADMIN_ROLE_NAME,
  SUB_ADMIN_ROLE_NAME } from '../constants';


/**
 * Пользовательский хук для авторизации пользователя в системе
 */
export const useAuth = () => {
  // Токен, сгенерированный для пользователя сервером после успешной аутентификации
  const [token, setToken] = useState(null);
  // Уникальный идентификатор пользователя
  const [userId, setUserId] = useState(null);
  // Принадлежность службе
  const [userService, setUserService] = useState(null);
  // Роли пользователя системы ГИД Неман
  const [userRoles, setUserRoles] = useState(null);
  // Полномочия пользователя во всех приложениях ГИД Неман
  const [userCredentials, setUserCredentials] = useState(null);
  // Ошибка аутентификации
  const [authError, setAuthError] = useState(null);
  // Завершен / не завершен процесс аутентификации пользователя
  const [ready, setReady] = useState(false);


  /**
   * Функция входа пользователя в систему
   */
  const login = useCallback((jwtToken, id, service, roles, credentials) => {
    // Имея список ролей ГИД Неман пользователя, ищем среди них роли администратора
    // ГИД Неман и подотчетного ему администратора.
    // Лишь имеющие эти роли пользователи могут работать с данным приложением.
    let found = false;
    if (jwtToken && id && roles) {
      for (let role of roles) {
        if ((role === MAIN_ADMIN_ROLE_NAME) || (role === SUB_ADMIN_ROLE_NAME)) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      setAuthError('Данный пользователь не имеет прав на работу с текущим приложением');
      return;
    }

    setToken(jwtToken);
    setUserId(id);
    setUserService(service);
    setUserRoles(roles);
    setUserCredentials(credentials);

    const localStorageData = JSON.parse(localStorage.getItem(LOCALSTORAGE_NAME));

    localStorage.setItem(LOCALSTORAGE_NAME, JSON.stringify({
      ...localStorageData,
      userId: id,
      token: jwtToken,
      userService: service,
      userRoles: roles,
      userCredentials: credentials,
    }));
  }, []);


  /**
   * Позволяет очистить объект ошибки аутентификации.
   */
  const clearAuthError = useCallback(() => setAuthError(null), []);


  /**
   * Функция выхода пользователя из системы.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUserService(null);
    setUserRoles(null);
    setUserCredentials(null);

    localStorage.removeItem(LOCALSTORAGE_NAME);
  }, []);


  /**
   * Данный код выполняется при перезагрузке страницы (именно перезагрузка,
   * а не рендеринг компонентов).
   */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(LOCALSTORAGE_NAME));

    if (data) {
      login(data.token, data.userId, data.userService, data.userRoles, data.userCredentials);
    }

    setReady(true);
  }, [login]);


  return {
    login,
    logout,
    token,
    userId,
    userService,
    userRoles,
    userCredentials,
    ready,
    authError,
    clearAuthError
  };
}
