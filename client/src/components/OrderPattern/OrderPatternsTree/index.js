import React, { useContext, useState } from 'react';
import { Tree, Row, Col, Popconfirm, Button, Space, Typography, Input } from 'antd';
import { ORDER_PATTERN_FIELDS, ORDER_PATTERN_ELEMENT_FIELDS, InterfaceDesign, ServerAPI } from '../../../constants';
import { EditOrderPattern } from '../EditOrderPattern';
import { OrderPatternPreview } from '../OrderPatternPreview';
import { DownSquareTwoTone } from '@ant-design/icons';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { EditOrderPatternElement } from '../EditOrderPatternElement';
import objectId from '../../../generators/objectId.generator';
import { OrderPatternsNodeType } from '../constants';
import getAppOrderPatternObjFromDBOrderPatternObj from '../../../mappers/getAppOrderPatternObjFromDBOrderPatternObj';

const { Text, Title } = Typography;


/**
 * Компонент дерева созданных шаблонов распоряжений с возможностью его редактирования.
 */
export const OrderPatternsTree = (props) => {
  const {
    existingOrderAffiliationTree,
    onEditOrderCategoryTitle,
    onEditOrderPattern,
    onDeleteOrderPattern
  } = props;

  // Выбранный пользователем шаблон распоряжения в дереве шаблонов
  const [selectedPattern, setSelectedPattern] = useState(null);

  // Выбранный пользователем шаблон распоряжения (selectedPattern), но именно на нем отражаются
  // сделанные пользователем правки, пока не сохраненные на сервере
  const [editedPattern, setEditedPattern] = useState(null);

  // true - было редактирование шаблона со стороны пользователя, false - не было
  const [patternEdited, setPatternEdited] = useState(false);

  // Текущая позиция курсора в редактируемом шаблоне распоряжения
  const [insertOrderElementPos, setInsertOrderElementPos] = useState(0);

  // Выбранная пользователем категория шаблонов распоряжений (объект, содержащий информацию
  // о наименовании категории и ее принадлежности службе и типу распоряжений)
  const [selectedOrderCategory, setSelectedOrderCategory] = useState(null);

  // Наименование текущей категории распоряжений, содержащее правки со стороны пользователя
  const [editedOrderCategory, setEditedOrderCategory] = useState(null);

  // Количество записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState(0);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  const [selectedTreeKeys, setSelectedTreeKeys] = useState([]);


  /**
   * Обработка события выбора узла в дереве шаблонов.
   *
   * @param {array} selectedKeys - массив id выделенных узлов (в нашем случае массив из 1 элемента)
   * @param {Object} info - информация о выделенных узлах
   */
  const onSelect = (selectedKeys, info) => {
    setSelectedTreeKeys(selectedKeys);

    if (!selectedKeys || !selectedKeys.length) {
      if (selectedOrderCategory) {
        setSelectedOrderCategory(null);
      }
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
        if (selectedOrderCategory) {
          setSelectedOrderCategory(null);
        }
      } else {
        if (selectedPattern) {
          setSelectedPattern(null);
        }
        if (info.node.type === OrderPatternsNodeType.ORDER_CATEGORY) {
          setSelectedOrderCategory({
            ...info.node.additionalInfo,
            category: info.node.title,
          });
        } else if (selectedOrderCategory) {
          setSelectedOrderCategory(null);
        }
      }
    }
    if (editedPattern) {
      setEditedPattern(null);
    }
    if (patternEdited) {
      setPatternEdited(false);
    }
    if (editedOrderCategory) {
      setEditedOrderCategory(null);
    }
    setInsertOrderElementPos(0);
  };


  /**
   * Вводит текущий выбранный шаблон распоряжения в режим редактирования.
   */
  const startEditOrderPattern = () => {
    if (!selectedPattern || !selectedPattern[ORDER_PATTERN_FIELDS.KEY]) {
      return;
    }
    setEditedPattern({
      [ORDER_PATTERN_FIELDS.TITLE]: selectedPattern[ORDER_PATTERN_FIELDS.TITLE],
      [ORDER_PATTERN_FIELDS.ELEMENTS]: [...selectedPattern[ORDER_PATTERN_FIELDS.ELEMENTS]],
    });
    if (patternEdited) {
      setPatternEdited(false);
    }
    setInsertOrderElementPos(selectedPattern[ORDER_PATTERN_FIELDS.ELEMENTS].length);
  };


  // ----------- Методы редактирования шаблона распоряжения -----------------


  /**
   * Позволяет вставить курсор перед заданным элементом шаблона.
   */
  const setCursorBeforeElement = (elementId) => {
    const elementIndex = editedPattern[ORDER_PATTERN_FIELDS.ELEMENTS].findIndex((element) =>
      element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId);
    if (elementIndex === -1) {
      return;
    }
    setInsertOrderElementPos(elementIndex !== 0 ? elementIndex : -1);
  };


  /**
   * Позволяет вставить курсор после заданного элемента шаблона.
   */
  const setCursorAfterElement = (elementId) => {
    const elementIndex = editedPattern[ORDER_PATTERN_FIELDS.ELEMENTS].findIndex((element) =>
      element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId);
    if (elementIndex === -1) {
      return;
    }
    setInsertOrderElementPos(elementIndex + 1);
  };


  /**
   * Добавляет заданный элемент в редактируемый шаблон распоряжения на текущую позицию
   * (т.е. позицию, на которой находится курсор).
   */
   const addNewPatternElement = (selectedPatternElement) => {
    if (!selectedPatternElement) {
      return;
    }
    const newElement = {
      [ORDER_PATTERN_ELEMENT_FIELDS.KEY]: objectId(),
      [ORDER_PATTERN_ELEMENT_FIELDS.TYPE]: selectedPatternElement[ORDER_PATTERN_ELEMENT_FIELDS.TYPE],
      [ORDER_PATTERN_ELEMENT_FIELDS.REF]: selectedPatternElement[ORDER_PATTERN_ELEMENT_FIELDS.REF],
      [ORDER_PATTERN_ELEMENT_FIELDS.VALUE]: selectedPatternElement[ORDER_PATTERN_ELEMENT_FIELDS.VALUE],
      [ORDER_PATTERN_ELEMENT_FIELDS.SIZE]: selectedPatternElement[ORDER_PATTERN_ELEMENT_FIELDS.SIZE],
    };
    setEditedPattern((value) => {
      return {
        ...value,
        [ORDER_PATTERN_FIELDS.ELEMENTS]: [
          ...value[ORDER_PATTERN_FIELDS.ELEMENTS].slice(0, insertOrderElementPos < 0 ? 0 : insertOrderElementPos),
          newElement,
          ...value[ORDER_PATTERN_FIELDS.ELEMENTS].slice(insertOrderElementPos < 0 ? 0 : insertOrderElementPos)
        ],
      };
    });
    if (insertOrderElementPos !== -1) {
      setInsertOrderElementPos((value) => value + 1);
    } else {
      setInsertOrderElementPos(1);
    }
    if (!patternEdited) {
      setPatternEdited(true);
    }
  };


  /**
   * Позволяет удалить элемент шаблона с id = elementId.
   */
  const delPatternElement = (elementId) => {
    const elementIndex = editedPattern[ORDER_PATTERN_FIELDS.ELEMENTS].findIndex((element) =>
      element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId);
    if (elementIndex === -1) {
      return;
    }
    if (elementIndex < insertOrderElementPos) {
      setInsertOrderElementPos((value) => value - 1);
    }
    setEditedPattern((value) => {
      return {
        ...value,
        [ORDER_PATTERN_FIELDS.ELEMENTS]: value[ORDER_PATTERN_FIELDS.ELEMENTS].filter((el) =>
          el[ORDER_PATTERN_ELEMENT_FIELDS.KEY] !== elementId),
      };
    });
    if (!patternEdited) {
      setPatternEdited(true);
    }
  };


  /**
   * Позволяет отредактировать элемент шаблона с id = elementId путем замены его
   * на элемент editedElement.
   */
   const editPatternElement = (elementId, editedElement) => {
    const elementIndex = editedPattern[ORDER_PATTERN_FIELDS.ELEMENTS].findIndex((element) =>
      element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId);
    if (elementIndex === -1) {
      return;
    }
    setEditedPattern((value) => {
      return {
        ...value,
        [ORDER_PATTERN_FIELDS.ELEMENTS]: value[ORDER_PATTERN_FIELDS.ELEMENTS].map((el) => {
          if (el[ORDER_PATTERN_ELEMENT_FIELDS.KEY] !== elementId) {
            return el;
          }
          return {
            [ORDER_PATTERN_ELEMENT_FIELDS.KEY]: elementId,
            ...editedElement,
          };
        }),
      }
    });
    if (!patternEdited) {
      setPatternEdited(true);
    }
  };

  // ----------------------------------------------------------------


  /**
   * Позволяет редактировать наименование шаблона распоряжения.
   */
  const handleEditOrderPatternTitle = (e) => {
    if (!editedPattern) {
      return;
    }
    setEditedPattern((value) => {
      return {
        ...value,
        [ORDER_PATTERN_FIELDS.TITLE]: e.target.value,
      };
    });
    if (!patternEdited) {
      setPatternEdited(true);
    }
  };


  /**
   * Запоминает правки в текущем наименовании категории шаблонов распоряжений.
   */
  const handleEditOrderCategory = (e) => {
    setEditedOrderCategory(e.target.value);
  };


  /**
   * Отправляет правки, сделанные пользователем в отношении шаблона распоряжений, на сервер.
   */
  const editOrderPattern = async () => {
    if (!editedPattern) {
      return;
    }

    setRecsBeingProcessed((value) => value + 1);

    try {
      const res = await request(ServerAPI.MOD_ORDER_PATTERN_DATA, 'POST',
        {
          id: selectedPattern[ORDER_PATTERN_FIELDS.KEY],
          title: editedPattern[ORDER_PATTERN_FIELDS.TITLE],
          elements: editedPattern[ORDER_PATTERN_FIELDS.ELEMENTS],
        },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const editedAndTransformedPattern = getAppOrderPatternObjFromDBOrderPatternObj(res.orderPattern);
      onEditOrderPattern(editedAndTransformedPattern);

      setSelectedPattern((value) => {
        return {
          ...value,
          [ORDER_PATTERN_FIELDS.TITLE]: editedAndTransformedPattern[ORDER_PATTERN_FIELDS.TITLE],
          [ORDER_PATTERN_FIELDS.ELEMENTS]: editedAndTransformedPattern[ORDER_PATTERN_FIELDS.ELEMENTS],
        };
      })
      setEditedPattern(null);
      setPatternEdited(false);
      setInsertOrderElementPos(0);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value - 1);
  };


  /**
   * Отменяет редактирование текущего шаблона распоряжения.
   */
  const cancelEditOrderPattern = () => {
    setEditedPattern(null);
    setPatternEdited(false);
    setInsertOrderElementPos(0);
  };


  /**
   * Отправляет запрос об удалении шаблона распоряжений на сервер.
   */
  const deleteOrderPattern = async () => {
    if (!selectedPattern || !selectedPattern[ORDER_PATTERN_FIELDS.KEY]) {
      return;
    }

    setRecsBeingProcessed((value) => value + 1);

    try {
      const res = await request(ServerAPI.DEL_ORDER_PATTERN_DATA, 'POST', { id: selectedPattern[ORDER_PATTERN_FIELDS.KEY] }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      onDeleteOrderPattern(selectedPattern[ORDER_PATTERN_FIELDS.KEY]);

      setSelectedPattern(null);
      setEditedPattern(null);
      setPatternEdited(false);
      setInsertOrderElementPos(0);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value - 1);
  };


  /**
   * Отправляет на сервер запрос о редактировании наименования категории шаблонов распоряжений.
   */
  const editOrderCategoryTitle = async () => {
    if (!editedOrderCategory) {
      return;
    }

    setRecsBeingProcessed((value) => value + 1);

    try {
      const res = await request(ServerAPI.MOD_ORDER_CATEGORY_TITLE, 'POST',
        {
          service: selectedOrderCategory.service,
          orderType: selectedOrderCategory.orderType,
          title: selectedOrderCategory.category,
          newTitle: editedOrderCategory,
        },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      onEditOrderCategoryTitle({
        service: selectedOrderCategory.service,
        orderType: selectedOrderCategory.orderType,
        title: selectedOrderCategory.category,
        newTitle: res.newTitle,
      });

      setSelectedOrderCategory((value) => {
        return {
          ...value,
          category: res.newTitle,
        };
      });
      setEditedOrderCategory(null);
      setSelectedTreeKeys([`${selectedOrderCategory.service}${selectedOrderCategory.orderType}${res.newTitle}`]);

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
        <Tree
          switcherIcon={<DownSquareTwoTone style={{ fontSize: InterfaceDesign.EXPANDED_ICON_SIZE }} />}
          showLine={true}
          treeData={existingOrderAffiliationTree}
          onSelect={onSelect}
          selectedKeys={selectedTreeKeys}
        />
      </Col>
      <Col span={15}>
        { recsBeingProcessed > 0 && <Text type="warning">На сервер отправлено {recsBeingProcessed} запросов. Ожидаю ответ...</Text> }
        {
          selectedOrderCategory &&
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Title level={4} className="center">Вы можете отредактировать наименование категории распоряжений</Title>
            <span>Наименование категории распоряжений</span>
            <Input
              size="small"
              value={editedOrderCategory || selectedOrderCategory.category}
              onChange={handleEditOrderCategory}
            />
            {
              editedOrderCategory && (editedOrderCategory !== selectedOrderCategory.category) &&
              <Button
                type="primary"
                size="small"
                style={{
                  marginBottom: 16,
                }}
                onClick={editOrderCategoryTitle}
              >
                Сохранить
              </Button>
            }
          </Space>
        }
        {
          selectedPattern && selectedPattern[ORDER_PATTERN_FIELDS.ELEMENTS] &&
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Row>
              <Col span={24} className="order-pattern-border order-pattern-block">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <OrderPatternPreview orderPattern={selectedPattern[ORDER_PATTERN_FIELDS.ELEMENTS]} />
                  <Space>
                    {
                      !editedPattern &&
                      <Button
                        type="primary"
                        size="small"
                        style={{
                          marginBottom: 16,
                        }}
                        onClick={startEditOrderPattern}
                      >
                        Редактировать
                      </Button>
                    }
                    <Popconfirm
                      title="Удалить шаблон?"
                      onConfirm={deleteOrderPattern}
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
                        Удалить шаблон
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              </Col>
            </Row>
            <Row>
              {
                editedPattern && editedPattern[ORDER_PATTERN_FIELDS.ELEMENTS] &&
                <Col span={24} className="order-pattern-border order-pattern-block">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Title level={4} className="center">Редактирование распоряжения</Title>
                    <Text strong>Наименование распоряжения</Text>
                    <Input
                      size="small"
                      value={editedPattern[ORDER_PATTERN_FIELDS.TITLE]}
                      onChange={handleEditOrderPatternTitle}
                    />
                    <EditOrderPattern
                      orderPattern={editedPattern[ORDER_PATTERN_FIELDS.ELEMENTS]}
                      insertOrderElementPos={insertOrderElementPos}
                      setCursorBeforeElementCallback={setCursorBeforeElement}
                      setCursorAfterElementCallback={setCursorAfterElement}
                      delPatternElementCallback={delPatternElement}
                      editPatternElementCallback={editPatternElement}
                    />
                    <Text strong>Определите элементы шаблона</Text>
                    <EditOrderPatternElement
                      submitOrderPatternElementCallback={addNewPatternElement}
                      okButtonText="Добавить в шаблон"
                    />
                    {
                      patternEdited &&
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          style={{
                            marginBottom: 16,
                          }}
                          onClick={editOrderPattern}
                        >
                          Сохранить изменения
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          style={{
                            marginBottom: 16,
                          }}
                          onClick={cancelEditOrderPattern}
                        >
                          Отменить все изменения
                        </Button>
                      </Space>
                    }
                  </Space>
                </Col>
              }
            </Row>
          </Space>
        }
      </Col>
    </Row>
  );
};
