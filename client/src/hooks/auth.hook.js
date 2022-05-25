import { useState, useCallback, useEffect } from 'react';
import { CURR_APP_ABBREV_NAME, ServerAPI } from '../constants';
import { useHttp } from '../hooks/http.hook';


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
  // Для запросов к серверу
  const { request } = useHttp();


  /**
   * Функция входа пользователя в систему (должна вызываться после отправки запроса на сервер).
   */
  const login = useCallback(({ jwtToken, id, userInfo, roles, credentials }) => {
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
  }, []);


  /**
   * Данный код выполняется при перезагрузке страницы (именно перезагрузка,
   * а не рендеринг компонентов).
   */
  useEffect(() => {
    // Отправляем серверу запрос на вход в систему через сессию
    request(ServerAPI.WHO_AM_I, 'POST', {})
      .then((responseData) => {
        if (responseData) {
          login({
            jwtToken: responseData.token,
            id: responseData.userId,
            userInfo: responseData.userInfo,
            roles: responseData.roles,
            credentials: responseData.credentials,
          });
        }
      })
      .catch(() => {
        // ничего не делаем при неудачной попытке аутентифицироваться автоматически через сессию,
        // пользователю будет просто предложено снова войти в систему
      })
      .finally(() => {
        setReady(true);
      });
  }, [login, request]);


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
