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
import { ServicesPage } from './pages/ServicesPage';
import { PostsPage } from './pages/PostsPage';
import { OrderPatternsPage } from './pages/OrderPatternsPage';
import { AdminsLogsPage } from './pages/AdminsLogsPage';
import { DY58UsersLogsPage } from './pages/DY58UsersLogsPage';
import { ServerErrorsLogsPage } from './pages/ServerErrorsLogsPage';

import { GetDataCredentials } from './constants';


/**
 * "Маршрутизатор": определяет страницы, которые может посещать пользователь.
 * Перечень страниц определяется тем, прошел пользователь аутентификацию в системе либо нет,
 * а также ролю пользователя
 *
 * @param {boolean} isAuthenticated - true (пользователь успешно прошел аутентификацию) /
 *                                    false (пользователь не аутентифицирован)
 * @param {Array} hasUserCredential - callback-функция, позволяющая определить, есть ли у пользователя заданное полномочие
 */
export const useRoutes = (isAuthenticated, hasUserCredential) => {
  if (isAuthenticated) {console.log('authenticated OK')
    return (
      <Switch>
        <Route path="/apps" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_APPS_ACTION) ? <AppsPage /> : <Redirect to="/roles" />}
        </Route>
        <Route path="/roles" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_ROLES_ACTION) ? <RolesPage /> : <Redirect to="/services" />}
        </Route>
        <Route path="/services" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_SERVICES_ACTION) ? <ServicesPage /> : <Redirect to="/posts" />}
        </Route>
        <Route path="/posts" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_POSTS_ACTION) ? <PostsPage /> : <Redirect to="/users" />}
        </Route>
        <Route path="/users" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_USERS_ACTION) ? <UsersPage /> : <Redirect to="/stations" />}
        </Route>
        <Route path="/stations" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_STATIONS_ACTION) ? <StationsPage /> : <Redirect to="/blocks" />}
        </Route>
        <Route path="/blocks" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_BLOCKS_ACTION) ? <BlocksPage /> : <Redirect to="/dncSectors" />}
        </Route>
        <Route path="/dncSectors" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_DNCSECTORS_ACTION) ? <DNCSectorsPage /> : <Redirect to="/ecdSectors" />}
        </Route>
        <Route path="/orderPatterns" exact>
          <OrderPatternsPage />
        </Route>
        <Route path="/ecdSectors" exact>
          {hasUserCredential(GetDataCredentials.GET_ALL_ECDSECTORS_ACTION) ? <ECDSectorsPage /> : <Redirect to="/help" />}
        </Route>
        <Route path="/adminsLogs" exact>
          {hasUserCredential(GetDataCredentials.GET_ADMINS_LOGS_ACTION) ? <AdminsLogsPage /> : <Redirect to="/help" />}
        </Route>
        <Route path="/dy58UsersLogs" exact>
          {hasUserCredential(GetDataCredentials.GET_DY58_USERS_LOGS_ACTION) ? <DY58UsersLogsPage /> : <Redirect to="/help" />}
        </Route>
        <Route path="/serverErrorsLogs" exact>
          {hasUserCredential(GetDataCredentials.GET_SERVER_ERRORS_LOGS_ACTION) ? <ServerErrorsLogsPage /> : <Redirect to="/help" />}
        </Route>
        <Route path="/help" exact>
          <HelpPage />
        </Route>
        <Redirect to="/apps" />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" exact>
        <AuthPage />
      </Route>
      <Redirect to="/" />
    </Switch>
  );
};
