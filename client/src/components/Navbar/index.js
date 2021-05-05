import React, { useContext } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { MAIN_ADMIN_ROLE_NAME } from '../../constants';
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
          auth.userRoles && auth.userRoles.includes(MAIN_ADMIN_ROLE_NAME) &&
          <Menu.Item key="1"><NavLink to="/apps">Приложения</NavLink></Menu.Item>
        }
        {
          auth.userRoles && auth.userRoles.includes(MAIN_ADMIN_ROLE_NAME) &&
          <Menu.Item key="2"><NavLink to="/roles">Роли</NavLink></Menu.Item>
        }
        <Menu.Item key="3"><NavLink to="/users">Пользователи</NavLink></Menu.Item>
        <Menu.Item key="4"><NavLink to="/stations">Станции</NavLink></Menu.Item>
        <Menu.Item key="5"><NavLink to="/blocks">Перегоны</NavLink></Menu.Item>
        <Menu.Item key="6"><NavLink to="/dncSectors">Участки ДНЦ</NavLink></Menu.Item>
        <Menu.Item key="7"><NavLink to="/ecdSectors">Участки ЭЦД</NavLink></Menu.Item>
        <Menu.Item key="8"><NavLink to="/help">Помощь</NavLink></Menu.Item>
        <Menu.Item key="9"><a href="/" onClick={logoutHandler}>Выйти</a></Menu.Item>
      </Menu>
    </Header>
  );
};
