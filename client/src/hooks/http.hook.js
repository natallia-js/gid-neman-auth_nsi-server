import { useState, useCallback } from 'react';


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


  /**
   *
   */
  const request = useCallback(async (url, method = 'GET', body = null, headers = {}) => {
    setLoading(true);

    try {
      if (body) {
        body = JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, { method, body, headers });
      const data = await response.json();

      if (!response.ok) {
        throw new HttpError(data.message || 'Что-то пошло не так', data.errors);
      }

      setLoading(false);

      return data;
    } catch (e) {
      setLoading(false);
      setError(e.message);
      throw e;
    }
  }, []);


  /**
   *
   */
  const clearError = useCallback(() => setError(null), []);


  return { loading, request, error, clearError };
}
