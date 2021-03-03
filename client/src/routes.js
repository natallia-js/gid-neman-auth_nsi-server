import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { HelpPage } from './pages/HelpPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { AppsPage } from './pages/AppsPage';


/**
 * "Маршрутизатор": определяет страницы, которые может посещать пользователь.
 * Перечень страниц определяется тем, прошел пользователь аутентификацию в системе либо нет.
 *
 * @param {boolean} isAuthenticated - true (пользователь прошел аутентификацию) /
 *                                    false (пользователь не прошел аутентификацию)
 */
export const useRoutes = (isAuthenticated) => {
  if (isAuthenticated) {
    return (
      <Switch>
        <Route path="/apps" exact>
          <AppsPage />
        </Route>
        <Route path="/roles" exact>
          <RolesPage />
        </Route>
        <Route path="/users" exact>
          <UsersPage />
        </Route>
        <Route path="/help" exact>
          <HelpPage />
        </Route>
        <Redirect to="/apps" />
      </Switch>
    )
  }

  return (
    <Switch>
      <Route path="/" exact>
        <AuthPage />
      </Route>
      <Redirect to="/" />
    </Switch>
  )
}
