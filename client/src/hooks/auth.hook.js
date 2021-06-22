import { useState, useCallback, useEffect } from 'react';
import {
  LOCALSTORAGE_NAME,
  CURR_APP_ABBREV_NAME,
} from '../constants';


/**
 * Пользовательский хук для авторизации пользователя в системе
 */
export const useAuth = () => {
  // Токен, сгенерированный для пользователя сервером после успешной аутентификации
  const [token, setToken] = useState(null);
  // Уникальный идентификатор пользователя
  const [userId, setUserId] = useState(null);
  // Информация о пользователе (имя, отчество, фамилия, служба, должность)
  const [userInfo, setUserInfo] = useState(null);
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
  const login = useCallback((jwtToken, id, userInfo, roles, credentials) => {
    if (!jwtToken || !id || !roles || !credentials ||
      // Имея список полномочий пользователя в приложениях ГИД Неман, ищем среди них текущее приложение
      !credentials.find((app) => app.appAbbrev === CURR_APP_ABBREV_NAME)) {
      setAuthError('Данный пользователь не имеет прав на работу с текущим приложением');
      return;
    }

    setToken(jwtToken);
    setUserId(id);
    setUserInfo(userInfo);
    setUserRoles(roles);
    setUserCredentials(credentials);

    const localStorageData = JSON.parse(localStorage.getItem(LOCALSTORAGE_NAME));

    localStorage.setItem(LOCALSTORAGE_NAME, JSON.stringify({
      ...localStorageData,
      userId: id,
      token: jwtToken,
      userInfo,
      userRoles: roles,
      userCredentials: credentials,
    }));
  }, []);


  /**
   * Позволяет очистить объект ошибки аутентификации.
   */
  const clearAuthError = useCallback(() => setAuthError(null), []);


  /**
   * Позволяет проверить, имеет ли пользователь заданное полномочие.
   *
   * @param {string} cred
   */
  const hasUserCredential = useCallback((cred) => {
    return Boolean(userCredentials && userCredentials.find((app) => app.creds && app.creds.indexOf(cred) >= 0));
  }, [userCredentials]);


  /**
   * Функция выхода пользователя из системы.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUserInfo(null);
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
      login(data.token, data.userId, data.userInfo, data.userRoles, data.userCredentials);
    }

    setReady(true);
  }, [login]);


  return {
    login,
    logout,
    token,
    userId,
    userInfo,
    userRoles,
    userCredentials,
    ready,
    authError,
    clearAuthError,
    hasUserCredential,
  };
};
