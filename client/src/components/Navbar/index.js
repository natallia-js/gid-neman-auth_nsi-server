import React, { useContext } from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useHttp } from '../../hooks/http.hook';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import { PAGES_IDS, LOGS_IDS, CurrentPageContext } from '../../context/CurrentPageContext';
import { GetDataCredentials, ServerAPI, CURR_APP_ABBREV_NAME } from '../../constants';
import { Layout, Menu, Popover, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Loader from '../Loader';

const { Header } = Layout;
const { Text } = Typography;
const { SubMenu } = Menu;


/**
 * Компонент меню навигации по сайту
 */
export const Navbar = () => {
  const history = useHistory();
  const auth = useContext(AuthContext);
  const currPage = useContext(CurrentPageContext);
  const { loading, request } = useHttp();
  const message = useCustomMessage();

  /**
   * Обработка запроса пользователя на выход из системы
   *
   * @param {object} event
   */
  const logoutHandler = async (event) => {
    event.preventDefault();
    try {
      // Отправляем запрос на выход из системы на сервер
      await request(ServerAPI.LOGOUT, 'POST', { applicationAbbreviation: CURR_APP_ABBREV_NAME });
      auth.logout();
      history.push('/');
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  }

  const userInfo = (
    <div>
      <p>
        <Text strong>ФИО:</Text>
        {` ${auth.userInfo.surname} ${auth.userInfo.name.charAt(0)}. ${auth.userInfo.fatherName ? auth.userInfo.fatherName.charAt(0) + '.' : ''}`}
      </p>
      <p><Text strong>Служба:</Text> {auth.userInfo.service}</p>
      <p><Text strong>Должность:</Text> {auth.userInfo.post}</p>
      <p><Text strong>Роли:</Text></p>
      {auth.userRoles.map((role, index) => <p key={index}>{role}</p>)}
    </div>
  );


  // Компонент блока основного меню
  return (
    <Header>
      <Menu theme="dark" mode="horizontal" selectedKeys={[currPage.pageId]}>
        <Menu.Item key={PAGES_IDS.USER_INFO}>
          <Popover content={userInfo} title="Информация о пользователе">
            <UserOutlined />
          </Popover>
        </Menu.Item>
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_APPS_ACTION) &&
          <Menu.Item key={PAGES_IDS.APPLICATIONS}><NavLink to="/apps">Приложения</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_ROLES_ACTION) &&
          <Menu.Item key={PAGES_IDS.ROLES}><NavLink to="/roles">Роли</NavLink></Menu.Item>
        }
        <Menu.Item key={PAGES_IDS.SERVICES}><NavLink to="/services">Службы</NavLink></Menu.Item>
        <Menu.Item key={PAGES_IDS.POSTS}><NavLink to="/posts">Должности</NavLink></Menu.Item>
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_USERS_ACTION) &&
          <Menu.Item key={PAGES_IDS.USERS}><NavLink to="/users">Пользователи</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_STATIONS_ACTION) &&
          <Menu.Item key={PAGES_IDS.STATIONS}><NavLink to="/stations">Станции</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_BLOCKS_ACTION) &&
          <Menu.Item key={PAGES_IDS.BLOCKS}><NavLink to="/blocks">Перегоны</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_DNCSECTORS_ACTION) &&
          <Menu.Item key={PAGES_IDS.DNC_SECTORS}><NavLink to="/dncSectors">Участки ДНЦ</NavLink></Menu.Item>
        }
        {
          auth.hasUserCredential(GetDataCredentials.GET_ALL_ECDSECTORS_ACTION) &&
          <Menu.Item key={PAGES_IDS.ECD_SECTORS}><NavLink to="/ecdSectors">Участки ЭЦД</NavLink></Menu.Item>
        }
        <Menu.Item key={PAGES_IDS.ORDER_PATTERNS}><NavLink to="/orderPatterns">Шаблоны распоряжений</NavLink></Menu.Item>
        <SubMenu key={PAGES_IDS.LOGS} title="Логи">
          <Menu.Item key={LOGS_IDS.SERVER_ERRORS}><NavLink to="/serverErrorsLogs">серверных ошибок</NavLink></Menu.Item>
          <Menu.Item key={LOGS_IDS.SERVER_ACTIONS}><NavLink to="/serverLogs">действий сервера</NavLink></Menu.Item>
          <Menu.Item key={LOGS_IDS.ADMINS_ACTIONS}><NavLink to="/adminsLogs">действий администраторов</NavLink></Menu.Item>
          <Menu.Item key={LOGS_IDS.USERS_ACTIONS}><NavLink to="/dy58UsersLogs">действий пользователей ДУ-58</NavLink></Menu.Item>
        </SubMenu>
        <Menu.Item key={PAGES_IDS.HELP}><NavLink to="/help">Помощь</NavLink></Menu.Item>
        <Menu.Item key={PAGES_IDS.EXIT}>
          {loading ? <Loader /> : <a href="/" onClick={logoutHandler}>Выйти</a>}
        </Menu.Item>
      </Menu>
    </Header>
  );
};
