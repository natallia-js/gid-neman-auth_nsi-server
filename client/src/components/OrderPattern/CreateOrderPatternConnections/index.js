import React, { useContext, useState } from 'react';
import { Tree, Row, Col, Input } from 'antd';
import { ORDER_PATTERN_FIELDS, InterfaceDesign, ServerAPI } from '../../../constants';
import { DownSquareTwoTone } from '@ant-design/icons';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { OrderPatternsNodeType } from '../constants';
import { useSearchTree } from '../../../hooks/searchTree.hook';

const { Search } = Input;


/**
 * Компонент, позволяющий создавать связи между шаблонами распоряжений.
 */
export const CreateOrderPatternConnections = (props) => {
  const {
    existingOrderAffiliationTree,
  } = props;

  // Выбранный пользователем шаблон распоряжения в дереве шаблонов
  const [selectedPattern, setSelectedPattern] = useState(null);

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
    loop
  } = useSearchTree(existingOrderAffiliationTree);


  /**
   * Обработка события выбора узла в дереве шаблонов.
   *
   * @param {array} selectedKeys - массив id выделенных узлов (в нашем случае массив из 1 элемента)
   * @param {Object} info - информация о выделенных узлах
   */
  const onSelect = (selectedKeys, info) => {
    if (!selectedKeys || !selectedKeys.length) {
      if (selectedPattern) {
        setSelectedPattern(null);
      }
    } else {
      if (info.node.type === OrderPatternsNodeType.ORDER_PATTERN) {
        setSelectedPattern({
          [ORDER_PATTERN_FIELDS.KEY]: selectedKeys[0],
          [ORDER_PATTERN_FIELDS.TITLE]: info.node.title,
          [ORDER_PATTERN_FIELDS.ELEMENTS]: info.node.pattern,
        });
      } else {
        if (selectedPattern) {
          setSelectedPattern(null);
        }
      }
    }
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
      </Col>
    </Row>
  );
};
