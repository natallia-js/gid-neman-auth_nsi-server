import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Tabs, Typography, Tree } from 'antd';
import { CreateOrderPattern } from '../components/OrderPattern/CreateOrderPattern';
import { ServerAPI, SERVICE_FIELDS } from '../constants';
import { useHttp } from '../hooks/http.hook';
import { AuthContext } from '../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../hooks/customMessage.hook';
import getAppServiceObjFromDBServiceObj from '../mappers/getAppServiceObjFromDBServiceObj';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

const PageTabs = {
  VIEW_ORDER_PATTERS: 1,
  CREATE_ORDER_PATTERN: 2,
};


/**
 * Возвращает компонент, представляющий собой страницу работы с шаблонами распоряжений.
 */
export const OrderPatternsPage = () => {
  // Флаг окончания загрузки информации с сервера
  const [dataLoaded, setDataLoaded] = useState(false);

  // Массив объектов служб
  const [services, setServices] = useState(null);

  // Ошибка загрузки информации
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
   const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по службам
      let res = await request(ServerAPI.GET_SERVICES_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const tableData = res.map((service) => getAppServiceObjFromDBServiceObj(service));
      setServices(tableData);

      setLoadDataErr(null);

    } catch (e) {
      setServices(null);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [auth.token, request]);


  /**
   * При рендере компонента подгружает необходимую информацию
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  return (
    <>
    {
      loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <div className="all-margin-05">
        <Title level={2} className="center top-margin-05">Шаблоны распоряжений</Title>
        <Tabs defaultActiveKey={PageTabs.VIEW_ORDER_PATTERS}>
          <TabPane tab="Шаблоны по категориям" key={PageTabs.VIEW_ORDER_PATTERS}>
            Content of Tab Pane 1
          </TabPane>
          <TabPane tab="Создать шаблон" key={PageTabs.CREATE_ORDER_PATTERN}>
            <CreateOrderPattern services={services} existingOrderAffiliationTree={
              [
                {
                  name: 'Э',
                  orderTypes: [
                    {
                      name: 'распоряжение',
                      orderCategories: [
                        'aaaaaa',
                        ',,,,,,',
                      ],
                    },
                  ],
                },
                {
                  name: 'Д',
                  orderTypes: [
                    {
                      name: 'заявка',
                      orderCategories: [
                        'зззззз',
                        '111111',
                      ],
                    },
                  ],
                },
              ]
            } />
          </TabPane>
        </Tabs>
      </div>
    }
    </>
  );
};
