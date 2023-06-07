import { useState, useCallback, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { CURR_APP_ABBREV_NAME } from '../constants';
import { AuthContext } from '../context/AuthContext';


class HttpError extends Error {
  constructor(message, additErrArr = null) {
    super(message);
    this.name = 'HttpError';
    this.errors = additErrArr;
  }
}


export { HttpError };


/**
 * Пользовательский хук для выполнения http-запросов на сервер
 */
export const useHttp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = useContext(AuthContext);
  const history = useHistory();

  /**
   *
   */
  const request = useCallback(async (url, method = 'GET', body = null, headers = {}) => {
    setLoading(true);

    try {
      if (body) {
        body = JSON.stringify({ ...body, applicationAbbreviation: CURR_APP_ABBREV_NAME });
        headers['Content-Type'] = 'application/json';
      }
      const response = await fetch(url, { method, body, headers, credentials: 'include' });
      const data = await response.json();

      if (!response.ok) {
        if (response?.status === 410) {
          // Если сервер на запрос пользователя выдает ошибку с кодом 410, то приложение должно
          // автоматически осуществить переход на страницу авторизации пользователя. Почему?
          // Потому что ошибка 410 генерируется сервером только в том случае, если в текущей
          // сессии не найдены данные по приложению (в нашем случае НСИ ГИД НЕМАН) и текущему пользователю.
          // Это означает, что сессия была удалена, и для продолжения работы приложения
          // необходимо заново войти в систему. Следовательно, нам необходимо осуществить локальный
          // выход из системы (с сервером сейчас бесполезно общаться) и перейти на страницу авторизации
          try {
            auth.logout();
            history.push('/');
          } catch {}
        }
        throw new HttpError(data.message || 'Что-то пошло не так', data.errors);
      }

      setLoading(false);

      return data;
    } catch (e) {
      setLoading(false);
      setError(e.message);
      throw e;
    }
  }, [auth, history]);


  /**
   *
   */
  const clearError = useCallback(() => setError(null), []);


  return { loading, request, error, clearError };
}
