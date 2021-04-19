import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { HelpPage } from './pages/HelpPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { AppsPage } from './pages/AppsPage';
import { BlocksPage } from './pages/BlocksPage';
import { StationsPage } from './pages/StationsPage';
import { DNCSectorsPage } from './pages/DNCSectorsPage';
import { ECDSectorsPage } from './pages/ECDSectorsPage';

import {
  MAIN_ADMIN_ROLE_NAME,
  SUB_ADMIN_ROLE_NAME
} from './constants';


/**
 * "Маршрутизатор": определяет страницы, которые может посещать пользователь.
 * Перечень страниц определяется тем, прошел пользователь аутентификацию в системе либо нет,
 * а также ролю пользователя
 *
 * @param {boolean} isAuthenticated - true (пользователь прошел аутентификацию) /
 *                                    false (пользователь не прошел аутентификацию)
 * @param {Array} userRoles - массив аббревиатур ролей пользователя
 */
export const useRoutes = (isAuthenticated, userRoles) => {
  if (isAuthenticated) {
    if (userRoles && userRoles.includes(MAIN_ADMIN_ROLE_NAME)) {
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
          <Route path="/stations" exact>
            <StationsPage />
          </Route>
          <Route path="/blocks" exact>
            <BlocksPage />
          </Route>
          <Route path="/dncSectors" exact>
            <DNCSectorsPage />
          </Route>
          <Route path="/ecdSectors" exact>
            <ECDSectorsPage />
          </Route>
          <Redirect to="/apps" />
        </Switch>
      )
    }
    if (userRoles && userRoles.includes(SUB_ADMIN_ROLE_NAME)) {
      return (
        <Switch>
          <Route path="/users" exact>
            <UsersPage />
          </Route>
          <Route path="/help" exact>
            <HelpPage />
          </Route>
          <Route path="/stations" exact>
            <StationsPage />
          </Route>
          <Route path="/blocks" exact>
            <BlocksPage />
          </Route>
          <Route path="/dncSectors" exact>
            <DNCSectorsPage />
          </Route>
          <Route path="/ecdSectors" exact>
            <ECDSectorsPage />
          </Route>
          <Redirect to="/users" />
        </Switch>
      )
    }
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
