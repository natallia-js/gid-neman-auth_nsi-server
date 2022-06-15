import React, { useContext, useEffect } from 'react';
import { Row, Col, Menu, Typography } from 'antd';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';
import Notes from '../components/Help/Notes';
import ApplicationsCredentialsGroupsDescription from '../components/Help/ApplicationsCredentialsGroupsDescription';
import RolesDescription from '../components/Help/RolesDescription';
import ServicesDescription from '../components/Help/ServicesDescription';
import PostsDescription from '../components/Help/PostsDescription';
import UsersDescription from '../components/Help/UsersDescription';
import StationsDescription from '../components/Help/StationsDescription';
import BlocksDescription from '../components/Help/BlocksDescription';
import DNCSectorsDescription from '../components/Help/DNCSectorsDescription';
import ECDSectorsDescription from '../components/Help/ECDSectorsDescription';
import OrderPatternsDescription from '../components/Help/OrderPatternsDescription';
import LogsDescription from '../components/Help/LogsDescription';
import ToHelpStartBlock from '../components/Help/ToHelpStartBlock';

const { Title } = Typography;

/**
 * Возвращает компонент, представляющий собой страницу руководства пользователя.
 */
export const HelpPage = () => {
  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  const helpMenuItems = [
    { label: 'Примечание', key: 'item-0', url: '#help-notes' },
    { label: 'Группы полномочий', key: 'item-1', url: '#applications-description' },
    { label: 'Роли', key: 'item-2', url: '#roles-description' },
    { label: 'Службы', key: 'item-3', url: '#services-description' },
    { label: 'Должности', key: 'item-4', url: '#posts-description' },
    { label: 'Пользователи', key: 'item-5', url: '#users-description' },
    { label: 'Станции', key: 'item-6', url: '#stations-description' },
    { label: 'Перегоны', key: 'item-7', url: '#blocks-description' },
    { label: 'Участки ДНЦ', key: 'item-8', url: '#dnc-sectors-description' },
    { label: 'Участки ЭЦД', key: 'item-9', url: '#ecd-sectors-description' },
    { label: 'Шаблоны распоряжений', key: 'item-10', url: '#order-patterns-description' },
    { label: 'Логи', key: 'item-11', url: '#logs-description' },
  ];

  useEffect(() => {
    currPage.changePageId(PAGES_IDS.HELP);
  }, [currPage]);

  return (
    <Row>
      <Col span={3}>
        <Menu
          style={{
            width: '100%',
            height: '100%',
          }}
          mode="inline"
          items={helpMenuItems}
        >
          {
            helpMenuItems.map((item) =>
              <Menu.Item key={item.key}>
                <a href={item.url}>{item.label}</a>
              </Menu.Item>
            )
          }
        </Menu>
      </Col>
      <Col span={21} style={{ padding: '0 1rem' }}>
        <Title level={2} className="center top-margin-05" id="user-manual-start">Руководство пользователя</Title>
        <Notes />
        <ToHelpStartBlock />
        <ApplicationsCredentialsGroupsDescription />
        <ToHelpStartBlock />
        <RolesDescription />
        <ToHelpStartBlock />
        <ServicesDescription />
        <ToHelpStartBlock />
        <PostsDescription />
        <ToHelpStartBlock />
        <UsersDescription />
        <ToHelpStartBlock />
        <StationsDescription />
        <ToHelpStartBlock />
        <BlocksDescription />
        <ToHelpStartBlock />
        <DNCSectorsDescription />
        <ToHelpStartBlock />
        <ECDSectorsDescription />
        <ToHelpStartBlock />
        <OrderPatternsDescription />
        <ToHelpStartBlock />
        <LogsDescription />
        <ToHelpStartBlock />
      </Col>
    </Row>
  )
}
