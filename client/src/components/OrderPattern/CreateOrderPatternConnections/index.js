import React, { useContext, useEffect, useState } from 'react';
import { Tree, Row, Col, Input, Space, Typography, Radio, Button } from 'antd';
import { ORDER_PATTERN_FIELDS, InterfaceDesign, ServerAPI } from '../../../constants';
import { DownSquareTwoTone } from '@ant-design/icons';
import { OrderPatternSetConnectionsPreview } from '../OrderPatternSetConnectionsPreview';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { OrderPatternsNodeType } from '../constants';
import { useSearchTree } from '../../../hooks/searchTree.hook';

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
    lastChangedOrderPattern,
  } = props;

  // true => выбрать базовый шаблон, false - выбрать дочерний шаблон
  const [selectBasePattern, setSelectBasePattern] = useState(PatternToChoose.BASE);

  // Выбранный пользователем базовый шаблон распоряжения в дереве шаблонов
  const [selectedBasePattern, setSelectedBasePattern] = useState(null);

  // Выбранный пользователем дочерний шаблон распоряжения в дереве шаблонов
  const [selectedChildPattern, setSelectedChildPattern] = useState(null);

  const [selectedBasePatternElement, setSelectedBasePatternElement] = useState(null);
  const [selectedChildPatternElement, setSelectedChildPatternElement] = useState(null);

  const [nullSelectedElements, setNullSelectedElements] = useState(false);



  // Пользовательский хук для получения информации от сервера
  //const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  //const auth = useContext(AuthContext);

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


  useEffect(() => {
    if (!lastChangedOrderPattern) {
      return;
    }
    if (lastChangedOrderPattern.delete) {
      if (selectedBasePattern[ORDER_PATTERN_FIELDS.KEY] === lastChangedOrderPattern.orderPatternId) {
        setSelectedBasePattern(null);
        setSelectBasePattern(PatternToChoose.BASE);
      }
      if (selectedChildPattern[ORDER_PATTERN_FIELDS.KEY] === lastChangedOrderPattern.orderPatternId) {
        setSelectedChildPattern(null);
        setSelectBasePattern(PatternToChoose.CHILD);
      }
    } else if (lastChangedOrderPattern.edit) {
      const editedPatternKey = lastChangedOrderPattern.pattern[ORDER_PATTERN_FIELDS.KEY];
      const changePatternFunc = (value) => {
        return {
          ...value,
          [ORDER_PATTERN_FIELDS.TITLE]: lastChangedOrderPattern.pattern[ORDER_PATTERN_FIELDS.TITLE],
          [ORDER_PATTERN_FIELDS.ELEMENTS]: lastChangedOrderPattern.pattern[ORDER_PATTERN_FIELDS.ELEMENTS],
        };
      };
      if (selectedBasePattern[ORDER_PATTERN_FIELDS.KEY] === editedPatternKey) {
        setSelectedBasePattern(changePatternFunc);
      }
      if (selectedChildPattern[ORDER_PATTERN_FIELDS.KEY] === editedPatternKey) {
        setSelectedChildPattern(changePatternFunc);
      }
    }
  }, [lastChangedOrderPattern]);


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
      const selectedPattern = {
        [ORDER_PATTERN_FIELDS.KEY]: selectedKeys[0],
        [ORDER_PATTERN_FIELDS.TITLE]: getNodeTitleByNodeKey(selectedKeys[0], existingOrderAffiliationTree),
        [ORDER_PATTERN_FIELDS.ELEMENTS]: info.node.pattern,
      };
      if (selectBasePattern) {
        setSelectedBasePattern(selectedPattern);
        setSelectBasePattern(PatternToChoose.CHILD);
      } else {
        setSelectedChildPattern(selectedPattern);
      }
    }
  };


  const handleSelectPatternElement = (element, baseElement) => {
    if (baseElement) {
      setSelectedBasePatternElement(element);
    } else {
      setSelectedChildPatternElement(element);
    }
  };


  const handleSelectCorrespondingElements = () => {
    setNullSelectedElements((value) => !value);
    setSelectedBasePatternElement(null);
    setSelectedChildPatternElement(null);
  };


  useEffect(() => {
    if (nullSelectedElements) {
      setNullSelectedElements((value) => !value);
    }
  }, [nullSelectedElements]);


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
          <Title level={4}>Дочерние шаблоны</Title>
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
                Вы можете изменить выбор в отношении как элемента базового шаблона, так и элемента дочернего шаблона либо
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
                    selectPatternElementCallback={(element) => handleSelectPatternElement(element, true)}
                    basePattern={true}
                    allowChoosePatternElement={selectedBasePattern && selectedChildPattern}
                    nullSelectedElement={nullSelectedElements}
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
                    selectPatternElementCallback={(element) => handleSelectPatternElement(element, false)}
                    basePattern={false}
                    allowChoosePatternElement={selectedBasePattern && selectedChildPattern && selectedBasePatternElement}
                    nullSelectedElement={nullSelectedElements}
                  />
                }
                </Col>
              </Row>
            </Space>
          </Radio.Group>
          <Title level={4}>Таблица связи элементов шаблонов</Title>
        </Space>
      </Col>
    </Row>
  );
};
