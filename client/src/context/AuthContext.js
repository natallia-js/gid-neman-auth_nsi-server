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
  userService: null, // принадлежность службе
  userRoles: null,
  userCredentials: null,
  authError: null,
  login: noop,
  logout: noop,
  clearAuthError: noop,
  isAuthenticated: false
});
