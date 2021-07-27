import React, { useContext, useEffect, useState } from 'react';
import { Tree, Row, Col, Input, Space, Typography, Radio, Button, Select, Popconfirm } from 'antd';
import {
  ORDER_PATTERN_FIELDS,
  ORDER_PATTERN_ELEMENT_FIELDS,
  CHILD_ORDER_PATTERN_FIELDS,
  InterfaceDesign,
  ServerAPI
} from '../../../constants';
import { DownSquareTwoTone } from '@ant-design/icons';
import { OrderPatternSetConnectionsPreview } from '../OrderPatternSetConnectionsPreview';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { OrderPatternsNodeType } from '../constants';
import { useSearchTree } from '../../../hooks/searchTree.hook';
import OrderPatternsElementsConnectionsTable from '../OrderPatternsElementsConnectionsTable';
import getAppOrderPatternObjFromDBOrderPatternObj from '../../../mappers/getAppOrderPatternObjFromDBOrderPatternObj';

const { Search } = Input;
const { Text, Title } = Typography;

const PatternToChoose = {
  BASE: true,
  CHILD: false,
};


/**
 * Компонент, позволяющий создавать связи между шаблонами распоряжений.
 */
export const CreateOrderPatternConnections = (props) => {
  const {
    existingOrderAffiliationTree,
    getNodeTitleByNodeKey,
    getPatternNodeByKey,
    lastChangedOrderPattern,
    onEditOrderPattern,
  } = props;

  // true => выбрать базовый шаблон, false - выбрать дочерний шаблон
  const [selectBasePattern, setSelectBasePattern] = useState(PatternToChoose.BASE);

  // Выбранный пользователем базовый шаблон распоряжения в дереве шаблонов
  const [selectedBasePattern, setSelectedBasePattern] = useState(null);

  // Выбранный пользователем дочерний шаблон распоряжения в дереве шаблонов
  const [selectedChildPattern, setSelectedChildPattern] = useState(null);

  // element + notation
  const [selectedBasePatternElement, setSelectedBasePatternElement] = useState(null);

  // element + notation
  const [selectedChildPatternElement, setSelectedChildPatternElement] = useState(null);

  // true - отменить текущее выделение элементов шаблонов (базового и дочернего)
  const [nullSelectedElements, setNullSelectedElements] = useState(false);

  // Массив соответствия параметров текущего базового и дочернего шаблонов
  const [correspPatternElementsArray, setCorrespPatternElementsArray] = useState([]);

  // Наименование текущего дочернего шаблона, связанного с текущим базовым шаблоном,
  // отображаемое в списке наименований дочерних шаблонов, связанных с текущим базовым шаблоном
  const [selectedChildPatternTitle, setSelectedChildPatternTitle] = useState(null);

  // Количество запросов, отправленных на сервер, на которые не получен ответ
  const [recsBeingProcessed, setRecsBeingProcessed] = useState(0);

  // Массив id параметров базового шаблона, для которых необходимо получить условное обозначение
  const [baseElementIdsToGetNotation, setBaseElementIdsToGetNotation] = useState(null);

  // Массив id параметров дочернего шаблона, для которых необходимо получить условное обозначение
  const [childElementIdsToGetNotation, setChildElementIdsToGetNotation] = useState(null);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  const {
    expandedKeys,
    autoExpandParent,
    onExpand,
    onChangeSearchValue,
    loop,
  } = useSearchTree(existingOrderAffiliationTree);


  const onChangePatternType = (e) => {
    setSelectBasePattern(e.target.value);
  };


  /**
   * Реагируем на изменения (удаление, редактирование) в дереве шаблонов распоряжений
   */
  useEffect(() => {
    if (!lastChangedOrderPattern) {
      return;
    }
    if (lastChangedOrderPattern.delete) {
      let deletedSelectedPattern = false;
      if (selectedBasePattern &&
        selectedBasePattern[ORDER_PATTERN_FIELDS.KEY] === lastChangedOrderPattern.orderPatternId) {
        setSelectedBasePattern(null);
        setSelectBasePattern(PatternToChoose.BASE);
        deletedSelectedPattern = true;
      }
      if (selectedChildPattern &&
        selectedChildPattern[ORDER_PATTERN_FIELDS.KEY] === lastChangedOrderPattern.orderPatternId) {
        setSelectedChildPattern(null);
        setSelectBasePattern(PatternToChoose.CHILD);
        deletedSelectedPattern = true;
      }
      if (deletedSelectedPattern) {
        setSelectedBasePatternElement(null);
        setSelectedChildPatternElement(null);
        setNullSelectedElements(true);
        setCorrespPatternElementsArray([]);
      }
    } else if (lastChangedOrderPattern.edit) {
      const editedPatternKey = lastChangedOrderPattern.pattern[ORDER_PATTERN_FIELDS.KEY];
      let editedSelectedPattern = false;
      if (selectedBasePattern && selectedBasePattern[ORDER_PATTERN_FIELDS.KEY] === editedPatternKey) {
        setSelectedBasePattern(lastChangedOrderPattern.pattern);
        editedSelectedPattern = true;
      }
      if (selectedChildPattern && selectedChildPattern[ORDER_PATTERN_FIELDS.KEY] === editedPatternKey) {
        setSelectedChildPattern(lastChangedOrderPattern.pattern);
        editedSelectedPattern = true;
      }
      if (editedSelectedPattern) {
        setSelectedBasePatternElement(null);
        setSelectedChildPatternElement(null);
        setNullSelectedElements(true);
      }
    }
  }, [lastChangedOrderPattern]);


  const onBaseAndChildPatternElementsSelected = () => {
    // определяем дочерний шаблон, наименование которого необходимо отобразить в выпадающем списке
    // наименований дочерних шаблонов текущего базового шаблона
    const childPatternToSelect = selectedBasePattern[ORDER_PATTERN_FIELDS.CHILD_PATTERNS].find((pattern) =>
      pattern[CHILD_ORDER_PATTERN_FIELDS.CHILD_KEY] === selectedChildPattern[ORDER_PATTERN_FIELDS.KEY]
    );
    if (childPatternToSelect) {
      setSelectedChildPatternTitle(getNodeTitleByNodeKey(childPatternToSelect[CHILD_ORDER_PATTERN_FIELDS.CHILD_KEY], existingOrderAffiliationTree));
      // помимо наименования дочернего шаблона, необходимо также вывести корректную таблицу связей
      // параметров базового и дочернего шаблонов
      const arr = childPatternToSelect[CHILD_ORDER_PATTERN_FIELDS.MATCH_PATTERN_PARAMS];
      setCorrespPatternElementsArray(arr);
      setBaseElementIdsToGetNotation(arr.map((element) => element.baseParamId));
      setChildElementIdsToGetNotation(arr.map((element) => element.childParamId));

    } else {
      setSelectedChildPatternTitle(null);
      setCorrespPatternElementsArray([]);
    }
  };


  useEffect(() => {
    setSelectedBasePatternElement(null);
    setSelectedChildPatternElement(null);
    setNullSelectedElements(true);

    if (!selectedBasePattern) {
      setCorrespPatternElementsArray([]);
      setSelectedChildPatternTitle(null);
    } else if (selectedChildPattern) {
      onBaseAndChildPatternElementsSelected();
    }
  }, [selectedBasePattern]);


  useEffect(() => {
    setSelectedBasePatternElement(null);
    setSelectedChildPatternElement(null);
    setNullSelectedElements(true);

    if (!selectedChildPattern) {
      setCorrespPatternElementsArray([]);
      setSelectedChildPatternTitle(null);
    } else if (selectedBasePattern) {
      onBaseAndChildPatternElementsSelected();
    }
  }, [selectedChildPattern]);


  const getBaseElementsNotationsByIds = (notationsArr) => {
    setCorrespPatternElementsArray((value) => value.map((element) => {
      const notation = notationsArr.find((el) => el.id === element.baseParamId);
      if (!notation) {
        return element;
      }
      return {
        ...element,
        baseParamNotation: notation.notation,
      };
    }));
  };


  const getChildElementsNotationsByIds = (notationsArr) => {
    setCorrespPatternElementsArray((value) => value.map((element) => {
      const notation = notationsArr.find((el) => el.id === element.childParamId);
      if (!notation) {
        return element;
      }
      return {
        ...element,
        childParamNotation: notation.notation,
      };
    }));
  };


  /**
   * Обработка события выбора узла в дереве шаблонов.
   *
   * @param {array} selectedKeys - массив id выделенных узлов (в нашем случае массив из 1 элемента)
   * @param {Object} info - информация о выделенных узлах
   */
  const onSelect = (selectedKeys, info) => {
    if (!selectedKeys || !selectedKeys.length) {
      return;
    }
    if (info.node.type === OrderPatternsNodeType.ORDER_PATTERN) {
      // не можем допустить, чтобы базовый и дочерний шаблоны совпадали
      if (
          (selectBasePattern && selectedChildPattern && selectedChildPattern[ORDER_PATTERN_FIELDS.KEY] === selectedKeys[0]) ||
          (!selectBasePattern && selectedBasePattern && selectedBasePattern[ORDER_PATTERN_FIELDS.KEY] === selectedKeys[0])
      ) {
        message(MESSAGE_TYPES.ERROR, 'Базовый и дочерний шаблоны не могут совпадать');
        return;
      }
      const selectedPattern = {
        [ORDER_PATTERN_FIELDS.KEY]: selectedKeys[0],
        [ORDER_PATTERN_FIELDS.TITLE]: getNodeTitleByNodeKey(selectedKeys[0], existingOrderAffiliationTree),
        [ORDER_PATTERN_FIELDS.ELEMENTS]: info.node.pattern,
        [ORDER_PATTERN_FIELDS.CHILD_PATTERNS]: info.node.childPatterns,
      };
      if (selectBasePattern) {
        setSelectedBasePattern(selectedPattern);
        if (!selectedChildPattern) {
          setSelectBasePattern(PatternToChoose.CHILD);
        }
      } else {
        setSelectedChildPattern(selectedPattern);
      }
    }
  };


  const handleChangeChildPatternInList = (selectedValue, option) => {
    setSelectedChildPatternTitle(selectedValue);

    if (!selectedValue) {
      setSelectedChildPattern(null);
    } else {
      const node = getPatternNodeByKey(option.key, existingOrderAffiliationTree);
      setSelectedChildPattern({
        [ORDER_PATTERN_FIELDS.KEY]: option.key,
        [ORDER_PATTERN_FIELDS.TITLE]: selectedValue,
        [ORDER_PATTERN_FIELDS.ELEMENTS]: node.pattern,
        [ORDER_PATTERN_FIELDS.CHILD_PATTERNS]: node.childPatterns,
      });
    }
  };


  const handleSelectPatternElement = (element, notation, baseElement) => {
    if (baseElement) {
      setSelectedBasePatternElement({ element, notation });
    } else {
      setSelectedChildPatternElement({ element, notation });
    }
  };


  const handleSelectCorrespondingElements = () => {
    if (correspPatternElementsArray.find((conn) =>
      conn.baseParamId === selectedBasePatternElement.element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] &&
      conn.childParamId === selectedChildPatternElement.element[ORDER_PATTERN_ELEMENT_FIELDS.KEY])) {
      message(MESSAGE_TYPES.ERROR, 'Связь между указанными элементами уже установлена');
      return;
    }
    setCorrespPatternElementsArray((value) => {
      return [
        ...value,
        {
          baseParamId: selectedBasePatternElement.element[ORDER_PATTERN_ELEMENT_FIELDS.KEY],
          baseParamNotation: selectedBasePatternElement.notation,
          childParamId: selectedChildPatternElement.element[ORDER_PATTERN_ELEMENT_FIELDS.KEY],
          childParamNotation: selectedChildPatternElement.notation,
        },
      ];
    });
    setNullSelectedElements((value) => !value);
    setSelectedBasePatternElement(null);
    setSelectedChildPatternElement(null);
  };


  useEffect(() => {
    if (nullSelectedElements) {
      setNullSelectedElements((value) => !value);
    }
  }, [nullSelectedElements]);


  /**
   * Удаляет связь между указанными элементами базового и дочернего шаблонов распоряжений.
   */
  const onDelConnection = ({ baseParamId, childParamId }) => {
    setCorrespPatternElementsArray((value) => value.filter((record) =>
      record.baseParamId !== baseParamId || record.childParamId !== childParamId
    ));
  };


  /**
   * Отправляет на сервер изменения в связях параметров базового и дочернего шаблонов
   * с целью сохранения их в БД.
   */
  const handleSaveOrderPatternsConnections = async () => {
    setRecsBeingProcessed((value) => value + 1);

    try {
      const res = await request(ServerAPI.SET_CHILD_ORDER_PATTERN, 'POST',
        {
          basePatternId: selectedBasePattern[ORDER_PATTERN_FIELDS.KEY],
          childPatternId: selectedChildPattern[ORDER_PATTERN_FIELDS.KEY],
          patternsParamsMatchingTable: correspPatternElementsArray.map((conn) => {
            return {
              baseParamId: conn.baseParamId,
              childParamId: conn.childParamId,
            };
          }),
        },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const editedAndTransformedPattern = getAppOrderPatternObjFromDBOrderPatternObj(res.baseCandidate);
      onEditOrderPattern(editedAndTransformedPattern);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value - 1);
  };


  /**
   *
   */
  const handleDelConnection = async () => {
    setRecsBeingProcessed((value) => value + 1);

    try {
      const res = await request(ServerAPI.DEL_CHILD_ORDER_PATTERN, 'POST',
        {
          basePatternId: selectedBasePattern[ORDER_PATTERN_FIELDS.KEY],
          childPatternId: selectedChildPattern[ORDER_PATTERN_FIELDS.KEY],
        },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const editedAndTransformedPattern = getAppOrderPatternObjFromDBOrderPatternObj(res.baseCandidate);
      onEditOrderPattern(editedAndTransformedPattern);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value - 1);
  };


  return (
    !existingOrderAffiliationTree.length ?

    <div>Список шаблонов распоряжений пуст</div> :

    <Row justify="space-around">
      <Col span={8}>
        <Search
          style={{ marginBottom: 8 }}
          placeholder="Найти узел в дереве шаблонов"
          onChange={onChangeSearchValue}
        />
        <Tree
          switcherIcon={<DownSquareTwoTone style={{ fontSize: InterfaceDesign.EXPANDED_ICON_SIZE }} />}
          showLine={true}
          treeData={loop(existingOrderAffiliationTree)}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onSelect={onSelect}
          onExpand={onExpand}
        />
      </Col>
      <Col span={15}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {
            selectedBasePattern && selectedBasePattern[ORDER_PATTERN_FIELDS.CHILD_PATTERNS] &&
            selectedBasePattern[ORDER_PATTERN_FIELDS.CHILD_PATTERNS].length > 0 &&
            <>
              <Title level={4}>Текущие дочерние шаблоны</Title>
              <Select
                style={{ width: '100%' }}
                allowClear={true}
                onChange={handleChangeChildPatternInList}
                options={[
                  { key: null, value: null },
                  ...selectedBasePattern[ORDER_PATTERN_FIELDS.CHILD_PATTERNS].map((child) => {
                    return {
                      key: child[CHILD_ORDER_PATTERN_FIELDS.CHILD_KEY],
                      value: getNodeTitleByNodeKey(child[CHILD_ORDER_PATTERN_FIELDS.CHILD_KEY], existingOrderAffiliationTree),
                    };
                  })
                ]}
                value={selectedChildPatternTitle}
              />
            </>
          }
          {
            selectedChildPatternTitle &&
            <Popconfirm
              title="Удалить связь?"
              onConfirm={handleDelConnection}
              okText="Да"
              cancelText="Отмена"
            >
              <Button
                type="primary"
                size="small"
                style={{
                  marginBottom: 16,
                }}
              >
                Удалить связь с дочерним шаблоном
              </Button>
            </Popconfirm>
          }
          {
            selectedBasePattern && selectedChildPattern && !selectedBasePatternElement &&
            <Text type="warning">Выберите элемент базового шаблона</Text>
          }
          {
            selectedBasePattern && selectedChildPattern && selectedBasePatternElement && !selectedChildPatternElement &&
            <Text type="warning">
              Выберите элемент дочернего шаблона, соответствующий выбранному базовому элементу.
              Вы можете изменить выбор в отношении элемента базового шаблона.
            </Text>
          }
          {
            selectedBasePattern && selectedChildPattern && selectedBasePatternElement && selectedChildPatternElement &&
            <div>
              <Text type="warning">
                Вы можете изменить выбор в отношении как элемента базового шаблона, так и элемента дочернего шаблона либо:
              </Text>
              <Button
                type="primary"
                size="small"
                style={{
                  marginBottom: 16,
                }}
                onClick={handleSelectCorrespondingElements}
              >
                Подтвердить сделанный выбор
              </Button>
            </div>
          }
          <Radio.Group onChange={onChangePatternType} value={selectBasePattern} style={{ width: '100%' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Radio value={PatternToChoose.BASE} style={{ width: '100%', fontSize: 20, fontWeight: 500 }}>
                Базовый шаблон
              </Radio>
              {
                selectedBasePattern && <Title level={5}>{selectedBasePattern[ORDER_PATTERN_FIELDS.TITLE]}</Title>
              }
              <Row>
                <Col span={24} className="order-pattern-border order-pattern-block">
                {
                  selectedBasePattern && selectedBasePattern[ORDER_PATTERN_FIELDS.ELEMENTS] &&
                  <OrderPatternSetConnectionsPreview
                    orderPattern={selectedBasePattern[ORDER_PATTERN_FIELDS.ELEMENTS]}
                    selectPatternElementCallback={(element, notation) => handleSelectPatternElement(element, notation, true)}
                    basePattern={true}
                    allowChoosePatternElement={selectedBasePattern && selectedChildPattern}
                    nullSelectedElement={nullSelectedElements}
                    elementIdsToGetNotation={baseElementIdsToGetNotation}
                    getElementNotationsByIdsCallback={getBaseElementsNotationsByIds}
                  />
                }
                </Col>
              </Row>
              <Radio value={PatternToChoose.CHILD} style={{ width: '100%', fontSize: 20, fontWeight: 500 }}>
                Дочерний шаблон
              </Radio>
              {
                selectedChildPattern && <Title level={5}>{selectedChildPattern[ORDER_PATTERN_FIELDS.TITLE]}</Title>
              }
              <Row>
                <Col span={24} className="order-pattern-border order-pattern-block">
                {
                  selectedChildPattern && selectedChildPattern[ORDER_PATTERN_FIELDS.ELEMENTS] &&
                  <OrderPatternSetConnectionsPreview
                    orderPattern={selectedChildPattern[ORDER_PATTERN_FIELDS.ELEMENTS]}
                    selectPatternElementCallback={(element, notation) => handleSelectPatternElement(element, notation, false)}
                    basePattern={false}
                    allowChoosePatternElement={selectedBasePattern && selectedChildPattern && selectedBasePatternElement}
                    nullSelectedElement={nullSelectedElements}
                    elementIdsToGetNotation={childElementIdsToGetNotation}
                    getElementNotationsByIdsCallback={getChildElementsNotationsByIds}
                  />
                }
                </Col>
              </Row>
            </Space>
          </Radio.Group>
          <Title level={4}>Таблица связи элементов шаблонов</Title>
          <OrderPatternsElementsConnectionsTable
            connectionsArray={correspPatternElementsArray}
            onDelConnection={onDelConnection}
          />
          { selectedBasePattern && selectedChildPattern &&
            <Button
              type="primary"
              size="small"
              style={{
                marginBottom: 16,
              }}
              onClick={handleSaveOrderPatternsConnections}
            >
              Сохранить
            </Button>
          }
        </Space>
      </Col>
    </Row>
  );
};
