import { useState, useCallback, useEffect } from 'react';

export const storageName = 'gid-neman-user';


/**
 * Пользовательский хук для авторизации пользователя в системе
 */
export const useAuth = () => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [ready, setReady] = useState(false);


  /**
   * Функция входа пользователя в систему
   */
  const login = useCallback((jwtToken, id, credentials) => {
    setToken(jwtToken);
    setUserId(id);
    setCredentials(credentials);

    const localStorageData = JSON.parse(localStorage.getItem(storageName));

    localStorage.setItem(storageName, JSON.stringify({
      ...localStorageData,
      userId: id,
      token: jwtToken,
      credentials
    }));
  }, []);


  /**
   * Функция выхода пользователя из системы
   */
  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setCredentials(null);

    localStorage.removeItem(storageName);
  }, []);


  /**
   * Данный код выполняется при перезагрузке страницы (именно перезагрузка,
   * а не рендеринг компонентов)
   */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(storageName));

    if (data && data.token) {
      login(data.token, data.userId, data.credentials);
    }

    setReady(true);
  }, [login]);


  return { login, logout, token, userId, credentials, ready };
}
