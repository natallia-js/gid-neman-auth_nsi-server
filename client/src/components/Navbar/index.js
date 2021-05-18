import React, { useContext } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { GetDataCredentials } from '../../constants';
import { Layout, Menu } from 'antd';

const { Header } = Layout;


/**
 * Компонент меню навигации по сайту
 */
export const Navbar = () => {
  const history = useHistory();
  const auth = useContext(AuthContext);

  /**
   * Обработка запроса пользователя на выход из системы
   *
   * @param {object} event
   */
  const logoutHandler = (event) => {
    event.preventDefault();
    auth.logout();
    history.push('/');
  }


  // Компонент блока основного меню
  return (
    <Header>
      <div className="logo" />
      <Menu theme="dark" mode="horizontal" selectedKeys={[]}>
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_APPS_ACTION) &&
          <Menu.Item key="1"><NavLink to="/apps">Приложения</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_ROLES_ACTION) &&
          <Menu.Item key="2"><NavLink to="/roles">Роли</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_SERVICES_ACTION) &&
          <Menu.Item key="3"><NavLink to="/services">Службы</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_POSTS_ACTION) &&
          <Menu.Item key="4"><NavLink to="/posts">Должности</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_USERS_ACTION) &&
          <Menu.Item key="5"><NavLink to="/users">Пользователи</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_STATIONS_ACTION) &&
          <Menu.Item key="6"><NavLink to="/stations">Станции</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_BLOCKS_ACTION) &&
          <Menu.Item key="7"><NavLink to="/blocks">Перегоны</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_DNCSECTORS_ACTION) &&
          <Menu.Item key="8"><NavLink to="/dncSectors">Участки ДНЦ</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_ECDSECTORS_ACTION) &&
          <Menu.Item key="9"><NavLink to="/ecdSectors">Участки ЭЦД</NavLink></Menu.Item>
        }
        <Menu.Item key="10"><NavLink to="/help">Помощь</NavLink></Menu.Item>
        <Menu.Item key="11"><a href="/" onClick={logoutHandler}>Выйти</a></Menu.Item>
      </Menu>
    </Header>
  );
};
