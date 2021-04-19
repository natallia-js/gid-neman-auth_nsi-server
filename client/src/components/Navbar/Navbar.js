import React, { useContext } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

import { MAIN_ADMIN_ROLE_NAME } from '../../constants';

import './Navbar.css';


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
    <nav>
      <div className="nav-wrapper blue-grey darken-1 navbar">
        <span className="brand-logo truncate">Аккаунты ГИД НЕМАН</span>
        <ul id="nav-mobile" className="right hide-on-med-and-down">
          {
            auth.userRoles && auth.userRoles.includes(MAIN_ADMIN_ROLE_NAME) &&
            <li><NavLink to="/apps">Приложения</NavLink></li>
          }
          {
            auth.userRoles && auth.userRoles.includes(MAIN_ADMIN_ROLE_NAME) &&
            <li><NavLink to="/roles">Роли</NavLink></li>
          }
          <li><NavLink to="/users">Пользователи</NavLink></li>
          <li><NavLink to="/stations">Станции</NavLink></li>
          <li><NavLink to="/blocks">Перегоны</NavLink></li>
          <li><NavLink to="/dncSectors">Участки ДНЦ</NavLink></li>
          <li><NavLink to="/ecdSectors">Участки ЭЦД</NavLink></li>
          <li><NavLink to="/help">Помощь</NavLink></li>
          <li><a href="/" onClick={logoutHandler}>Выйти</a></li>
        </ul>
      </div>
    </nav>
  )
}
