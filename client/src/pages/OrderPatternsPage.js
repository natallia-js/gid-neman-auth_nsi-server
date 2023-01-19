import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Tabs, Typography, Row, Col } from 'antd';
import { OrderPatternsTree } from '../components/OrderPattern/OrderPatternsTree';
import { CreateOrderPattern } from '../components/OrderPattern/CreateOrderPattern';
import { CreateOrderPatternConnections } from '../components/OrderPattern/CreateOrderPatternConnections';
import { ServerAPI, ORDER_PATTERN_FIELDS, ORDER_PATTERN_ELEMENT_REFS_FIELDS, ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS } from '../constants';
import { useHttp } from '../hooks/http.hook';
import getAppServiceObjFromDBServiceObj from '../mappers/getAppServiceObjFromDBServiceObj';
import getAppOrderPatternElRefObjFromDBOrderPatternElRefObj from '../mappers/getAppOrderPatternElRefObjFromDBOrderPatternElRefObj';
import getAppOrderPatternObjFromDBOrderPatternObj from '../mappers/getAppOrderPatternObjFromDBOrderPatternObj';
import Loader from '../components/Loader';
import { OrderPatternsNodeType } from '../components/OrderPattern/constants';
import { PAGES_IDS, CurrentPageContext } from '../context/CurrentPageContext';
import { MESSAGE_TYPES, useCustomMessage } from '../hooks/customMessage.hook';
import { useStations } from '../serverRequests/stations';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

const PageTabs = {
  VIEW_ORDER_PATTERS: 1,
  CREATE_ORDER_PATTERN: 2,
  CHILD_PATTERNS: 3,
  CREATE_ORDER_PATTERN_CONNECTIONS: 4,
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

  // Массив объектов станций
  const [stations, setStations] = useState(null);

  // Массив объектов участков ДНЦ
  const [dncSectors, setDNCSectors] = useState(null);

  // Массив объектов участков ЭЦД
  const [ecdsectors, setECDSectors] = useState(null);

  // Массив возможных смысловых значений элементов шаблонов распоряжений
  const [orderPatternElRefs, setOrderPatternElRefs] = useState(null);

  //
  const [existingOrderAffiliationTree, setExistingOrderAffiliationTree] = useState([]);

  // Ошибка загрузки информации
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  const [lastChangedOrderPattern, setLastChangedOrderPattern] = useState(null);
  const [lastChangedOrdersCategoryTitle, setLastChangedOrdersCategoryTitle] = useState(null);

  // Получаем доступ к контекстным данным текущей страницы
  const currPage = useContext(CurrentPageContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  const { getShortStationsData } = useStations();


  useEffect(() => {
    currPage.changePageId(PAGES_IDS.ORDER_PATTERNS);
  }, [currPage]);


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
   const fetchData = useCallback(async () => {
    setDataLoaded(false);
    try {
      // Делаем запрос на сервер с целью получения информации по созданным шаблонам распоряжений
      let res = await request(ServerAPI.GET_ORDER_PATTERNS_LIST, 'POST', { getChildPatterns: true });
      let tableData = res.map((orderPattern) => getAppOrderPatternObjFromDBOrderPatternObj(orderPattern));
      setOrderPatterns(tableData);

      // Делаем запрос на сервер с целью получения информации по службам
      res = await request(ServerAPI.GET_SERVICES_DATA, 'POST', {});
      tableData = res.map((service) => getAppServiceObjFromDBServiceObj(service));
      setServices(tableData);

      // Делаем запрос на сервер с целью получения списков возможных смысловых значений
      // элементов шаблонов распоряжений
      res = await request(ServerAPI.GET_ORDER_PATTERNS_ELEMENTS_REFS, 'POST', {});
      tableData = res.map((ref) => getAppOrderPatternElRefObjFromDBOrderPatternElRefObj(ref));
      setOrderPatternElRefs(tableData);

      // Делаем запрос на сервер с целью получения информациия по станциям
      res = await getShortStationsData({ mapStationToLabelValue: false });
      setStations(res);

      // Делаем запрос на сервер с целью получения информациия по участкам ДНЦ

      // Делаем запрос на сервер с целью получения информациия по участкам ЭЦД

      setLoadDataErr(null);

    } catch (e) {
      setServices(null);
      setOrderPatterns(null);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [request]);


  /**
   * При рендере компонента подгружает необходимую информацию
   */
  useEffect(() => {
    fetchData();
  }, []);


  const NodeTypes = {
    SERVICE: 'service',
    ORDER_TYPE: 'orderType',
    ORDER_CATEGORY: 'orderCategory',
    ORDER_PATTERN: 'orderPattern',
  };

  const getTreeNodeKey = (nodeType, orderPattern) => {
    switch (nodeType) {
      case NodeTypes.SERVICE:
        return orderPattern[ORDER_PATTERN_FIELDS.SERVICE];
      case NodeTypes.ORDER_TYPE:
        return `${orderPattern[ORDER_PATTERN_FIELDS.SERVICE]}${orderPattern[ORDER_PATTERN_FIELDS.TYPE]}`;
      case NodeTypes.ORDER_CATEGORY:
        return `${orderPattern[ORDER_PATTERN_FIELDS.SERVICE]}${orderPattern[ORDER_PATTERN_FIELDS.TYPE]}${orderPattern[ORDER_PATTERN_FIELDS.CATEGORY]}`;
      case NodeTypes.ORDER_PATTERN:
        return orderPattern[ORDER_PATTERN_FIELDS.KEY];
      default:
        return null;
    }
  }

  /**
   *
   */
  useEffect(() => {
    if (!orderPatterns || !orderPatterns.length) {
      setExistingOrderAffiliationTree([]);
      return;
    }

    const treeData = [];

    const getOrderPatternLeaf = (orderPattern) => {
      return {
        title: orderPattern[ORDER_PATTERN_FIELDS.TITLE],
        key: getTreeNodeKey(NodeTypes.ORDER_PATTERN, orderPattern),
        pattern: orderPattern[ORDER_PATTERN_FIELDS.ELEMENTS],
        type: OrderPatternsNodeType.ORDER_PATTERN,
        specialTrainCategories: orderPattern[ORDER_PATTERN_FIELDS.SPECIAL_TRAIN_CATEGORIES],
        childPatterns: orderPattern[ORDER_PATTERN_FIELDS.CHILD_PATTERNS],
        additionalInfo: {
          service: orderPattern[ORDER_PATTERN_FIELDS.SERVICE],
          orderType: orderPattern[ORDER_PATTERN_FIELDS.TYPE],
          orderCategory: orderPattern[ORDER_PATTERN_FIELDS.CATEGORY],
        },
        positionInPatternsCategory: orderPattern[ORDER_PATTERN_FIELDS.POSITION_IN_PATTERNS_CATEGORY],
        workPoligon: orderPattern[ORDER_PATTERN_FIELDS.WORK_POLIGON],
      };
    };

    const getOrderPatternCategoryNode = (orderPattern) => {
      return {
        title: orderPattern[ORDER_PATTERN_FIELDS.CATEGORY],
        key: getTreeNodeKey(NodeTypes.ORDER_CATEGORY, orderPattern),
        type: OrderPatternsNodeType.ORDER_CATEGORY,
        additionalInfo: {
          service: orderPattern[ORDER_PATTERN_FIELDS.SERVICE],
          orderType: orderPattern[ORDER_PATTERN_FIELDS.TYPE],
        },
        children: [getOrderPatternLeaf(orderPattern)],
      };
    };

    const getOrderPatternTypeNode = (orderPattern) => {
      return {
        title: orderPattern[ORDER_PATTERN_FIELDS.TYPE],
        key: getTreeNodeKey(NodeTypes.ORDER_TYPE, orderPattern),
        type: OrderPatternsNodeType.ORDER_TYPE,
        children: [getOrderPatternCategoryNode(orderPattern)],
      };
    };

    orderPatterns.forEach((orderPattern) => {
      const theSameServiceElement = treeData.find((service) => service.title === orderPattern[ORDER_PATTERN_FIELDS.SERVICE]);
      // Существует ли в дереве узел с наименованием службы?
      if (!theSameServiceElement) {
        treeData.push({
          title: orderPattern[ORDER_PATTERN_FIELDS.SERVICE],
          key: getTreeNodeKey(NodeTypes.SERVICE, orderPattern),
          type: OrderPatternsNodeType.SERVICE,
          children: [getOrderPatternTypeNode(orderPattern)],
        });
      } else {
        const theSameTypeElement = theSameServiceElement.children.find((type) => type.title === orderPattern[ORDER_PATTERN_FIELDS.TYPE]);
        if (!theSameTypeElement) {
          theSameServiceElement.children.push(getOrderPatternTypeNode(orderPattern));
        } else {
          // Категории распоряжений сортируются по алфавиту в рамках соответствующего типа распоряжений
          const theSameCategoryElement = theSameTypeElement.children.find((category) => category.title === orderPattern[ORDER_PATTERN_FIELDS.CATEGORY]);
          if (!theSameCategoryElement) {
            const categoryNode = getOrderPatternCategoryNode(orderPattern);
            const insertPos = theSameTypeElement.children.findIndex((category) => category.title > categoryNode.title);
            if (insertPos === -1)
              theSameTypeElement.children.push(categoryNode);
            else
              theSameTypeElement.children.splice(insertPos, 0, categoryNode);
          } else {
            const orderPatternLeaf = getOrderPatternLeaf(orderPattern);

            // Шаблоны в дереве должны сортироваться в рамках соответствующей категории распоряжений.
            // Сортировка производится по положительным значениям поля positionInPatternsCategory.
            // Если значение поля positionInPatternsCategory отрицательное, то такой шаблон оказывается в конце списка.
            // Шаблоны с отрицательными значениями positionInPatternsCategory не сортируются.
            if (orderPatternLeaf.positionInPatternsCategory === -1) {
              theSameCategoryElement.children.push(orderPatternLeaf);
            } else {
              const firstElementWithGreaterPositionIndex = theSameCategoryElement.children.findIndex((el) => el.positionInPatternsCategory > orderPatternLeaf.positionInPatternsCategory);
              if (firstElementWithGreaterPositionIndex === -1) {
                // нужно проверить, не содержится ли в конце списка элемент с positionInPatternsCategory = -1;
                // если содержится, то поместить новый элемент можно перед первым в списке элементом с positionInPatternsCategory = -1
                const firstElementWithNegativePositionIndex = theSameCategoryElement.children.findIndex((el) => el.positionInPatternsCategory < 0);
                if (firstElementWithNegativePositionIndex === -1)
                  theSameCategoryElement.children.push(orderPatternLeaf);
                else
                  theSameCategoryElement.children.splice(firstElementWithNegativePositionIndex, 0, orderPatternLeaf);
              }
              else {
                theSameCategoryElement.children.splice(firstElementWithGreaterPositionIndex, 0, orderPatternLeaf);
              }
            }
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
    setLastChangedOrdersCategoryTitle({ prevTitle: title, newTitle });
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
    setLastChangedOrderPattern({
      edit: true,
      pattern: orderPattern,
    });
  };


  /**
   *
   */
  const handleDeleteOrderPattern = (orderPatternId) => {
    setOrderPatterns((value) => value.filter((pattern) => pattern[ORDER_PATTERN_FIELDS.KEY] !== orderPatternId));
    setLastChangedOrderPattern({
      delete: true,
      orderPatternId,
    });
  };


  /**
   *
   * @param {*} key
   * @param {*} tree
   * @returns
   */
  const getNodeTitleByNodeKey = (key, tree) => {
    const stack = [...tree];

    while (stack.length) {
      const curr = stack.pop();

      if (curr.key === key) {
        return curr.title;
      }

      if (curr.children) {
        stack.push(...curr.children);
      }
    }
  };


  const getPatternNodeByKey = (key, tree) => {
    const stack = [...tree];

    while (stack.length) {
      const curr = stack.pop();

      if (curr.key === key) {
        return curr;
      }

      if (curr.children) {
        stack.push(...curr.children);
      }
    }
  };


  /**
   * Для заданного значения ключа узла дерева шаблонов распоряжений возвращает все шаблоны распоряжений,
   * относящиеся к той же самой категории распоряжений, причем порядок следования возвращаемых шаблонов -
   * такой же, как и в дереве шаблонов.
   */
  const getTheSameCategoryOrderPatternsInTree = (nodeKey) => {
    const _node = orderPatterns.find((pattern) => pattern[ORDER_PATTERN_FIELDS.KEY] === nodeKey);
    return existingOrderAffiliationTree
      .find((node) => node.key === getTreeNodeKey(NodeTypes.SERVICE, _node)).children
      .find((node) => node.key === getTreeNodeKey(NodeTypes.ORDER_TYPE, _node)).children
      .find((node) => node.key === getTreeNodeKey(NodeTypes.ORDER_CATEGORY, _node)).children;
  };


  const patternBelongsToDesiredTreeBranch = (pattern, treeNode) =>
    pattern[ORDER_PATTERN_FIELDS.SERVICE] === treeNode.additionalInfo.service &&
    pattern[ORDER_PATTERN_FIELDS.TYPE] === treeNode.additionalInfo.orderType &&
    pattern[ORDER_PATTERN_FIELDS.CATEGORY] === treeNode.additionalInfo.orderCategory;


  /**
   *
   * @param {*} orderPattern - любой шаблон распоряжения, принадлежащий ветке дерева (категории распоряжений),
   * в которой необходимо произвести изменения
   * @param {*} dataToSendToServer - массив двумерных массивов: первый элемент - id распоряжения, второй - новое
   * значение positionInPatternsCategory этого распоряжения в дереве распоряжений
   */
  const updateOrderPatternsRelativeCategoryPositions = async (treeNode, dataToSendToServer) => {
    try {
      await request(ServerAPI.MOD_POSITIONS_IN_PATTERNS_CATEGORY, 'POST', { data: dataToSendToServer });
      setOrderPatterns((value) => value.map((pattern) => {
        // Не та ветка дерева
        if (!patternBelongsToDesiredTreeBranch(pattern, treeNode))
          return pattern;
        // Для листьев нужной ветки ищем информацию о новом значении positionInPatternsCategory (эта информация
        // может отсутствовать для ряда листьев, если для них ее не меняли)
        const treeLeafNewPositionInfo = dataToSendToServer.find((el) => el[0] === pattern[ORDER_PATTERN_FIELDS.KEY]);
        if (treeLeafNewPositionInfo) {
          return {
            ...pattern,
            [ORDER_PATTERN_FIELDS.POSITION_IN_PATTERNS_CATEGORY]: treeLeafNewPositionInfo[1],
          }
        }
        return pattern;
      }));
    }
    catch (e) {
      message(MESSAGE_TYPES.ERROR, 'Ошибка перемещения листьев дерева: ' + e.message);
    }
  };


  const handleDropTreeNode = async (droppedNode, droppedOnNode) => {
    // Проверка того, что есть что перемещать + перемещение идет не самого себя
    if (!droppedNode || !droppedOnNode || droppedNode.key === droppedOnNode.key) {
      return;
    }
    // Проверка того, что оба узла - листья
    const positionInPatternsCategoryExists = (pos) => pos || pos === 0;
    if (!positionInPatternsCategoryExists(droppedNode.positionInPatternsCategory) ||
        !positionInPatternsCategoryExists(droppedOnNode.positionInPatternsCategory)) {
      return;
    }
    // Проверка того, что листья принадлежат одной ветви (одной категории распоряжений)
    if (
      droppedNode.additionalInfo.service !== droppedOnNode.additionalInfo.service ||
      droppedNode.additionalInfo.orderType !== droppedOnNode.additionalInfo.orderType ||
      droppedNode.additionalInfo.orderCategory !== droppedOnNode.additionalInfo.orderCategory
    ) {
      return;
    }
    // Теперь можно перемещать. Для этого достаточно лишь изменить значение positionInPatternsCategory у
    // узла droppedNode, положив его равным значению этого же поля узла droppedOnNode, а у всех узлов,
    // следующих за droppedOnNode, включая его самого, увеличить значение на 1.
    // Если же значение positionInPatternsCategory у droppedOnNode отрицательное, то алгоритм другой. А именно:
    // вначале всем узлам с отрицательным значением positionInPatternsCategory, начиная с первого в массиве
    // узла и заканчивая элементом массива, соответствующим droppedOnNode, присваиваем положительное значение
    // positionInPatternsCategory путем увеличения на 1 последнего неотрицательного значения positionInPatternsCategory.
    // Далее запускаем обычный алгоритм (описанный выше).

    let moveToPosition = droppedOnNode.positionInPatternsCategory;
    if (moveToPosition < 0) {
      const theSameCategoryPatternsInTree = getTheSameCategoryOrderPatternsInTree(droppedOnNode.key);
      let lastPositivePos = -1;
      for (let pattern of theSameCategoryPatternsInTree) {
        if (pattern.key !== droppedOnNode.key) {
          if (pattern.positionInPatternsCategory >= 0)
            lastPositivePos = pattern.positionInPatternsCategory;
          else {
            const p = orderPatterns.find((pat) => pat[ORDER_PATTERN_FIELDS.KEY] === pattern.key);
            p[ORDER_PATTERN_FIELDS.POSITION_IN_PATTERNS_CATEGORY] = lastPositivePos + 1;
            lastPositivePos += 1;
          }
        } else {
          const p = orderPatterns.find((pat) => pat[ORDER_PATTERN_FIELDS.KEY] === pattern.key);
          p[ORDER_PATTERN_FIELDS.POSITION_IN_PATTERNS_CATEGORY] = lastPositivePos + 1;
          moveToPosition = p[ORDER_PATTERN_FIELDS.POSITION_IN_PATTERNS_CATEGORY];
          break;
        }
      }
    }
    const dataToSendToServer = orderPatterns.filter((pattern) =>
      // Нужная ветка дерева и те узлы, которым необходимо изменить значение positionInPatternsCategory
      patternBelongsToDesiredTreeBranch(pattern, droppedNode) &&
      (
        pattern[ORDER_PATTERN_FIELDS.KEY] === droppedNode.key ||
        pattern[ORDER_PATTERN_FIELDS.POSITION_IN_PATTERNS_CATEGORY] >= moveToPosition
      )
    ).map((pattern) => {
      if (pattern[ORDER_PATTERN_FIELDS.KEY] === droppedNode.key)
        return [pattern[ORDER_PATTERN_FIELDS.KEY], moveToPosition];
      return [pattern[ORDER_PATTERN_FIELDS.KEY], pattern[ORDER_PATTERN_FIELDS.POSITION_IN_PATTERNS_CATEGORY] + 1];
    });

    await updateOrderPatternsRelativeCategoryPositions(droppedNode, dataToSendToServer);
  };


  /**
   *
   */
  const handleNewOrderPatternElRef = (typeId, newRec) => {
    if (orderPatternElRefs) {
      setOrderPatternElRefs((value) => value.map((el) => {
        if (String(el[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY]) === String(typeId)) {
          return {
            ...el,
            [ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]: [
              ...el[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS],
              newRec,
            ],
          };
        }
        return el;
      }));
    }
  };


  const handleDelOrderPatternElRef = (typeId, refId) => {
    if (orderPatternElRefs) {
      setOrderPatternElRefs((value) => value.map((el) => {
        if (String(el[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY]) === String(typeId)) {
          return {
            ...el,
            [ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]: el[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]
              .filter((r) => String(r[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]) !== String(refId)),
          };
        }
        return el;
      }));
    }
  };


  const handleModOrderPatternElRef = (typeId, modRec) => {
    if (orderPatternElRefs) {
      setOrderPatternElRefs((value) => value.map((el) => {
        if (String(el[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY]) === String(typeId)) {
          return {
            ...el,
            [ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]: el[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]
              .map((r) => {
                if (String(r[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]) !==
                  String(modRec[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]))
                  return r;
                return {
                  ...r,
                  ...modRec,
                };
              }),
          };
        }
        return el;
      }));
    }
  };


  /**
   * Позволяет зафиксировать позицию шаблона распоряжения в дереве шаблонов:
   * отрицительное значение positionInPatternsCategory узла дерева делает положительным.
   * Кроме того, положительное значение получают все узлы, которые предшествуют этому узлу
   * в дереве и имеют отрицательное значение positionInPatternsCategory.
   */
  const handleFixOrderPatternTreePosition = async (orderPatternNodeToFix) => {
    // Вначале ищем в дереве шаблонов нужную нам ветвь категорий шаблонов распоряжений - а точнее,
    // все шаблоны распоряжений этой ветви
    const theSameCategoryPatternsInTree = getTheSameCategoryOrderPatternsInTree(orderPatternNodeToFix.key);
    let lastPositivePos = -1;
    const dataToSendToServer = [];
    for (let patternNode of theSameCategoryPatternsInTree) {
      if (patternNode.positionInPatternsCategory >= 0) {
        lastPositivePos = patternNode.positionInPatternsCategory;
        continue;
      }
      lastPositivePos += 1;
      dataToSendToServer.push([patternNode.key, lastPositivePos]);
      if (patternNode.key === orderPatternNodeToFix.key)
        break;
    }
    await updateOrderPatternsRelativeCategoryPositions(orderPatternNodeToFix, dataToSendToServer);
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
              orderPatternElRefs={orderPatternElRefs}
              onEditOrderCategoryTitle={handleEditOrderCategoryTitle}
              onEditOrderPattern={handleEditOrderPattern}
              onDeleteOrderPattern={handleDeleteOrderPattern}
              getNodeTitleByNodeKey={getNodeTitleByNodeKey}
              onDropTreeNode={handleDropTreeNode}
              onFixOrderPatternTreePosition={handleFixOrderPatternTreePosition}
              onNewOrderPatternElRef={handleNewOrderPatternElRef}
              onDelOrderPatternElRef={handleDelOrderPatternElRef}
              onModOrderPatternElRef={handleModOrderPatternElRef}
            />
          </TabPane>
          <TabPane tab="Создать шаблон" key={PageTabs.CREATE_ORDER_PATTERN}>
            <CreateOrderPattern
              orderPatternElRefs={orderPatternElRefs}
              services={services}
              existingOrderAffiliationTree={existingOrderAffiliationTree}
              onCreateOrderPattern={handleCreateOrderPattern}
              onNewOrderPatternElRef={handleNewOrderPatternElRef}
              onDelOrderPatternElRef={handleDelOrderPatternElRef}
              onModOrderPatternElRef={handleModOrderPatternElRef}
            />
          </TabPane>
          <TabPane tab="Связи между шаблонами" key={PageTabs.CREATE_ORDER_PATTERN_CONNECTIONS}>
            <CreateOrderPatternConnections
              existingOrderAffiliationTree={existingOrderAffiliationTree}
              getNodeTitleByNodeKey={getNodeTitleByNodeKey}
              getPatternNodeByKey={getPatternNodeByKey}
              lastChangedOrdersCategoryTitle={lastChangedOrdersCategoryTitle}
              lastChangedOrderPattern={lastChangedOrderPattern}
              onEditOrderPattern={handleEditOrderPattern}
            />
          </TabPane>
        </Tabs>
      </div>
    }
    </>
  );
};
