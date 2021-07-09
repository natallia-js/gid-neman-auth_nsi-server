import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Tabs, Typography, Row, Col } from 'antd';
import { OrderPatternsTree } from '../components/OrderPattern/OrderPatternsTree';
import { CreateOrderPattern } from '../components/OrderPattern/CreateOrderPattern';
import { CreateOrderPatternConnections } from '../components/OrderPattern/CreateOrderPatternConnections';
import { ServerAPI, ORDER_PATTERN_FIELDS } from '../constants';
import { useHttp } from '../hooks/http.hook';
import { AuthContext } from '../context/AuthContext';
import getAppServiceObjFromDBServiceObj from '../mappers/getAppServiceObjFromDBServiceObj';
import getAppOrderPatternObjFromDBOrderPatternObj from '../mappers/getAppOrderPatternObjFromDBOrderPatternObj';
import Loader from '../components/Loader';
import { OrderPatternsNodeType } from '../components/OrderPattern/constants';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

const PageTabs = {
  VIEW_ORDER_PATTERS: 1,
  CREATE_ORDER_PATTERN: 2,
  CREATE_ORDER_PATTERN_CONNECTIONS: 3,
};


/**
 * Возвращает компонент, представляющий собой страницу работы с шаблонами распоряжений.
 */
export const OrderPatternsPage = () => {
  // Флаг окончания загрузки информации с сервера
  const [dataLoaded, setDataLoaded] = useState(false);

  // Массив объектов с информацией о шаблонах распоряжений
  const [orderPatterns, setOrderPatterns] = useState(null);

  // Массив объектов служб
  const [services, setServices] = useState(null);

  //
  const [existingOrderAffiliationTree, setExistingOrderAffiliationTree] = useState([]);

  // Ошибка загрузки информации
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
   const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по созданным шаблонам распоряжений
      let res = await request(ServerAPI.GET_ORDER_PATTERNS_LIST, 'POST', null, {
        Authorization: `Bearer ${auth.token}`
      });

      let tableData = res.map((orderPattern) => getAppOrderPatternObjFromDBOrderPatternObj(orderPattern));
      setOrderPatterns(tableData);

      // Делаем запрос на сервер с целью получения информации по службам
      res = await request(ServerAPI.GET_SERVICES_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      tableData = res.map((service) => getAppServiceObjFromDBServiceObj(service));
      setServices(tableData);

      setLoadDataErr(null);

    } catch (e) {
      setServices(null);
      setOrderPatterns(null);
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


  /**
   *
   */
  useEffect(() => {
    if (!orderPatterns || !orderPatterns.length) {
      setExistingOrderAffiliationTree([]);
      return;
    }

    const treeData = [];

    orderPatterns.forEach((orderPattern) => {
      const theSameServiceElement = treeData.find((service) => service.title === orderPattern[ORDER_PATTERN_FIELDS.SERVICE]);
      // Существует ли в дереве узел с наименованием службы?
      if (!theSameServiceElement) {
        treeData.push({
          title: orderPattern[ORDER_PATTERN_FIELDS.SERVICE],
          key: orderPattern[ORDER_PATTERN_FIELDS.SERVICE],
          type: OrderPatternsNodeType.SERVICE,
          children: [{
            title: orderPattern[ORDER_PATTERN_FIELDS.TYPE],
            key: `${orderPattern[ORDER_PATTERN_FIELDS.SERVICE]}${orderPattern[ORDER_PATTERN_FIELDS.TYPE]}`,
            type: OrderPatternsNodeType.ORDER_TYPE,
            children: [{
              title: orderPattern[ORDER_PATTERN_FIELDS.CATEGORY],
              key: `${orderPattern[ORDER_PATTERN_FIELDS.SERVICE]}${orderPattern[ORDER_PATTERN_FIELDS.TYPE]}${orderPattern[ORDER_PATTERN_FIELDS.CATEGORY]}`,
              type: OrderPatternsNodeType.ORDER_CATEGORY,
              additionalInfo: {
                service: orderPattern[ORDER_PATTERN_FIELDS.SERVICE],
                orderType: orderPattern[ORDER_PATTERN_FIELDS.TYPE],
              },
              children: [{
                title: orderPattern[ORDER_PATTERN_FIELDS.TITLE],
                key: orderPattern[ORDER_PATTERN_FIELDS.KEY],
                pattern: orderPattern[ORDER_PATTERN_FIELDS.ELEMENTS],
                type: OrderPatternsNodeType.ORDER_PATTERN,
              }],
            }],
          }],
        });
      } else {
        const theSameTypeElement = theSameServiceElement.children.find((type) => type.title === orderPattern[ORDER_PATTERN_FIELDS.TYPE]);
        if (!theSameTypeElement) {
          theSameServiceElement.children.push({
            title: orderPattern[ORDER_PATTERN_FIELDS.TYPE],
            key: `${orderPattern[ORDER_PATTERN_FIELDS.SERVICE]}${orderPattern[ORDER_PATTERN_FIELDS.TYPE]}`,
            type: OrderPatternsNodeType.ORDER_TYPE,
            children: [{
              title: orderPattern[ORDER_PATTERN_FIELDS.CATEGORY],
              key: `${orderPattern[ORDER_PATTERN_FIELDS.SERVICE]}${orderPattern[ORDER_PATTERN_FIELDS.TYPE]}${orderPattern[ORDER_PATTERN_FIELDS.CATEGORY]}`,
              type: OrderPatternsNodeType.ORDER_CATEGORY,
              additionalInfo: {
                service: orderPattern[ORDER_PATTERN_FIELDS.SERVICE],
                orderType: orderPattern[ORDER_PATTERN_FIELDS.TYPE],
              },
              children: [{
                title: orderPattern[ORDER_PATTERN_FIELDS.TITLE],
                key: orderPattern[ORDER_PATTERN_FIELDS.KEY],
                pattern: orderPattern[ORDER_PATTERN_FIELDS.ELEMENTS],
                type: OrderPatternsNodeType.ORDER_PATTERN,
              }],
            }],
          });
        } else {
          const theSameCategoryElement = theSameTypeElement.children.find((category) => category.title === orderPattern[ORDER_PATTERN_FIELDS.CATEGORY]);
          if (!theSameCategoryElement) {
            theSameTypeElement.children.push({
              title: orderPattern[ORDER_PATTERN_FIELDS.CATEGORY],
              key: `${orderPattern[ORDER_PATTERN_FIELDS.SERVICE]}${orderPattern[ORDER_PATTERN_FIELDS.TYPE]}${orderPattern[ORDER_PATTERN_FIELDS.CATEGORY]}`,
              type: OrderPatternsNodeType.ORDER_CATEGORY,
              additionalInfo: {
                service: orderPattern[ORDER_PATTERN_FIELDS.SERVICE],
                orderType: orderPattern[ORDER_PATTERN_FIELDS.TYPE],
              },
              children: [{
                title: orderPattern[ORDER_PATTERN_FIELDS.TITLE],
                key: orderPattern[ORDER_PATTERN_FIELDS.KEY],
                pattern: orderPattern[ORDER_PATTERN_FIELDS.ELEMENTS],
                type: OrderPatternsNodeType.ORDER_PATTERN,
              }],
            });
          } else {
            theSameCategoryElement.children.push({
              title: orderPattern[ORDER_PATTERN_FIELDS.TITLE],
              key: orderPattern[ORDER_PATTERN_FIELDS.KEY],
              pattern: orderPattern[ORDER_PATTERN_FIELDS.ELEMENTS],
              type: OrderPatternsNodeType.ORDER_PATTERN,
            });
          }
        }
      }
    });
    setExistingOrderAffiliationTree(treeData);
  }, [orderPatterns]);


  /**
   *
   */
  const handleCreateOrderPattern = (orderPattern) => {
    if (!orderPattern) {
      return;
    }
    setOrderPatterns((value) => [
      ...value,
      getAppOrderPatternObjFromDBOrderPatternObj(orderPattern),
    ]);
  };


  /**
   *
   */
  const handleEditOrderCategoryTitle = ({ service, orderType, title, newTitle }) => {
    setOrderPatterns((value) => value.map((pattern) => {
      if ((pattern[ORDER_PATTERN_FIELDS.SERVICE] === service) &&
          (pattern[ORDER_PATTERN_FIELDS.TYPE] === orderType) &&
          (pattern[ORDER_PATTERN_FIELDS.CATEGORY] === title)) {
        return {
          ...pattern,
          [ORDER_PATTERN_FIELDS.CATEGORY]: newTitle,
        };
      }
      return pattern;
    }));
  };


  /**
   *
   */
  const handleEditOrderPattern = (orderPattern) => {
    if (!orderPattern) {
      return;
    }
    setOrderPatterns((value) => value.map((pattern) => {
      if (pattern[ORDER_PATTERN_FIELDS.KEY] !== orderPattern[ORDER_PATTERN_FIELDS.KEY]) {
        return pattern;
      }
      return {
        ...pattern,
        ...orderPattern,
      };
    }));
  };


  /**
   *
   */
  const handleDeleteOrderPattern = (orderPatternId) => {
    setOrderPatterns((value) => value.filter((pattern) => pattern[ORDER_PATTERN_FIELDS.KEY] !== orderPatternId));
  };


  if (!dataLoaded) {
    return (
      <Row align="middle">
        <Col span={24}>
          <Loader />
        </Col>
      </Row>
    );
  }


  return (
    <>
    {
      loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <div className="all-margin-05">
        <Title level={2} className="center top-margin-05">Шаблоны распоряжений</Title>
        <Tabs defaultActiveKey={PageTabs.VIEW_ORDER_PATTERS}>
          <TabPane tab="Шаблоны по категориям" key={PageTabs.VIEW_ORDER_PATTERS}>
            <OrderPatternsTree
              existingOrderAffiliationTree={existingOrderAffiliationTree}
              onEditOrderCategoryTitle={handleEditOrderCategoryTitle}
              onEditOrderPattern={handleEditOrderPattern}
              onDeleteOrderPattern={handleDeleteOrderPattern}
            />
          </TabPane>
          <TabPane tab="Создать шаблон" key={PageTabs.CREATE_ORDER_PATTERN}>
            <CreateOrderPattern
              services={services}
              existingOrderAffiliationTree={existingOrderAffiliationTree}
              onCreateOrderPattern={handleCreateOrderPattern}
            />
          </TabPane>
          <TabPane tab="Создать связи между шаблонами" key={PageTabs.CREATE_ORDER_PATTERN_CONNECTIONS}>
            <CreateOrderPatternConnections
              existingOrderAffiliationTree={existingOrderAffiliationTree}
            />
          </TabPane>
        </Tabs>
      </div>
    }
    </>
  );
};
