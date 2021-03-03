import { createContext } from 'react';


/**
 * "Заглушка"
 */
function noop() {}


/**
 * Объект контекста авторизации пользователя
 */
export const AuthContext = createContext({
  token: null,
  userId: null,
  credentials: null,
  login: noop,
  logout: noop,
  isAuthenticated: false
});
