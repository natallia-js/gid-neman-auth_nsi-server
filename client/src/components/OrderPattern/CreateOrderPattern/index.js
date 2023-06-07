import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Button, Popconfirm, Form, Select, Input, Space } from 'antd';
import { OrderPatternPreview } from '../OrderPatternPreview';
import { EditOrderPattern } from '../EditOrderPattern';
import { EditOrderPatternElement } from '../EditOrderPatternElement';
import { OrderTypes, SPECIAL_TRAIN_CATEGORIES } from '../constants';
import { useHttp } from '../../../hooks/http.hook';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { OrderCategoryChooser } from '../OrderCategoryChooser';
import objectId from '../../../generators/objectId.generator';
import {
  ORDER_PATTERN_FIELDS,
  ORDER_PATTERN_ELEMENT_FIELDS,
  ServerAPI,
  SERVICE_FIELDS,
} from '../../../constants';
import SpecifyWorkPoligons from '../../SpecifyWorkPoligons';

const { Text } = Typography;
const { Option } = Select;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Возвращает компонент, представляющий собой страницу создания шаблона документа.
 *
 * orderPatternElRefs - массив возможных смысловых значений элементов шаблонов документов
 * services - массив всех служб
 * existingOrderAffiliationTree - массив, представляющий собой дерево принадлежности созданных документов
 *   (уровни дерева: служба -> тип документа -> категория документа)
 * onCreateOrderPattern - callback для передачи "наверх" сформированного и успешно сохраненного в БД шаблона документа
 */
export const CreateOrderPattern = (props) => {
  const {
    orderPatternElRefs,
    services,
    existingOrderAffiliationTree,
    onCreateOrderPattern,
    onNewOrderPatternElRef,
    onDelOrderPatternElRef,
    onModOrderPatternElRef,
    stations,
    dncSectors,
    ecdSectors,
  } = props;

  // Массив элементов создаваемого шаблона
  const [orderPattern, setOrderPattern] = useState([]);

  // Текущая позиция, на которую будет вставлен созданный элемент шаблона
  const [insertOrderElementPos, setInsertOrderElementPos] = useState(0);

  // Список категорий документов, соответстввующий текущей выбранной пользователем службе и типу документа
  const [currentOrderCategoriesList, setCurrentOrderCategoriesList] = useState([]);

  // Для создания значений полей нового документа
  const [form] = Form.useForm();

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Выбранная пользователем служба
  const [selectedService, setSelectedService] = useState(null);
  // Сообщение об ошибке, связанное с отсутствием заданного наименования службы
  const [requiredServiceErrMess, setRequiredServiceErrMess] = useState(null);

  // Выбранный пользователем тип документа
  const [selectedOrderType, setSelectedOrderType] = useState(null);
  // Сообщение об ошибке, связанное с отсутствием заданного типа документа
  const [requiredOrderTypeErrMess, setRequiredOrderTypeErrMess] = useState(null);

  // Категория документа, определенная пользователем
  const [orderCategory, setOrderCategory] = useState(null);
  // Сообщение об ошибке, связанное с отсутствием заданной категории документа
  const [missingOrderCategoryErr, setMissingOrderCategoryErr] = useState(null);

  // Сообщение об ошибке, связанное с отсутствием заданного наименования документа
  const [requiredOrderTitleErrMess, setRequiredOrderTitleErrMess] = useState(null);

  // Количество шаблонов, переданное серверу с целью сохранения в базе
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // Ошибки, выявленные серверной частью в информационных полях, в процессе обработки
  // запроса о создании нового шаблона документа
  const [orderPatternFieldsErrs, setOrderPatternFieldsErrs] = useState(null);


  /**
   * Добавляет заданный элемент в создаваемый шаблон документа на текущую позицию
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
    setOrderPattern((value) =>
      [
        ...value.slice(0, insertOrderElementPos < 0 ? 0 : insertOrderElementPos),
        newElement,
        ...value.slice(insertOrderElementPos < 0 ? 0 : insertOrderElementPos)
      ]
    );
    if (insertOrderElementPos !== -1) {
      setInsertOrderElementPos((value) => value + 1);
    } else {
      setInsertOrderElementPos(1);
    }
  };


  /**
   * Позволяет отредактировать элемент шаблона с id = elementId путем замены его
   * на элемент editedElement.
   */
  const editPatternElement = (elementId, editedElement) => {
    const elementIndex = orderPattern.findIndex((element) => element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId);
    if (elementIndex === -1) {
      return;
    }
    setOrderPattern((value) => value.map((el) => {
      if (el[ORDER_PATTERN_ELEMENT_FIELDS.KEY] !== elementId) {
        return el;
      }
      return {
        [ORDER_PATTERN_ELEMENT_FIELDS.KEY]: elementId,
        ...editedElement,
      };
    }));
  };


  /**
   * Позволяет удалить элемент шаблона с id = elementId.
   */
  const delPatternElement = (elementId) => {
    const elementIndex = orderPattern.findIndex((element) => element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId);
    if (elementIndex === -1) {
      return;
    }
    if (elementIndex < insertOrderElementPos) {
      setInsertOrderElementPos((value) => value - 1);
    }
    setOrderPattern((value) => value.filter((el) => el[ORDER_PATTERN_ELEMENT_FIELDS.KEY] !== elementId));
  };


  /**
   * Позволяет вставить курсор перед заданным элементом шаблона.
   */
  const setCursorBeforeElement = (elementId) => {
    const elementIndex = orderPattern.findIndex((element) => element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId);
    if (elementIndex === -1) {
      return;
    }
    setInsertOrderElementPos(elementIndex !== 0 ? elementIndex : -1);
  };


  /**
   * Позволяет вставить курсор после заданного элемента шаблона.
   */
  const setCursorAfterElement = (elementId) => {
    const elementIndex = orderPattern.findIndex((element) => element[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId);
    if (elementIndex === -1) {
      return;
    }
    setInsertOrderElementPos(elementIndex + 1);
  };


  /**
   * Позволяет выполнить очистку создаваемого шаблона документа путем удаления
   * из него всех созданных элементов.
   */
  const clearPattern = () => {
    setOrderPattern([]);
    setInsertOrderElementPos(0);
  };


  /**
   * При выборе (из предложенного списка) наименования службы либо наименования типа документа
   * запоминаем выбранную информацию (для смены информации в списке категорий документов).
   */
  const onValuesChange = (changedValues) => {
    if (changedValues.hasOwnProperty(ORDER_PATTERN_FIELDS.SERVICE)) {
      setSelectedService(changedValues[ORDER_PATTERN_FIELDS.SERVICE]);
    } else if (changedValues.hasOwnProperty(ORDER_PATTERN_FIELDS.TYPE)) {
      setSelectedOrderType(changedValues[ORDER_PATTERN_FIELDS.TYPE]);
    }
  };


  /**
   * Меняем текущий список категорий документов при смене текущей службы и/или типа документа.
   */
  useEffect(() => {
    const currentServiceInfo = existingOrderAffiliationTree.find((service) => service.title === selectedService);
    if (!currentServiceInfo || !currentServiceInfo.children) {
      setCurrentOrderCategoriesList([]);
    } else {
      const orderTypeInfo = currentServiceInfo.children.find((orderType) => orderType.title === selectedOrderType);
      if (!orderTypeInfo || !orderTypeInfo.children) {
        setCurrentOrderCategoriesList([]);
      } else {
        setCurrentOrderCategoriesList(orderTypeInfo.children.map((category) => category.title) || []);
      }
    }
  }, [selectedService, existingOrderAffiliationTree, selectedOrderType, form]);


  /**
   * Реакция на смену определяемой пользователем категории документов.
   */
  const handleChangeOrderCategory = (value) => {
    setOrderCategory(value);
    if (missingOrderCategoryErr && value && value.length) {
      setMissingOrderCategoryErr(null);
    }
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода и начала создания нового документа.
   *
   * @param {object} values
   */
  const onFinish = async (values) => {
    // Чистим все сообщения об ошибках
    setOrderPatternFieldsErrs(null);

    if (!orderCategory || !orderCategory.length) {
      setMissingOrderCategoryErr('Пожалуйста, определите категорию документа!');
      return;
    }

    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о шаблоне документа
      const res = await request(ServerAPI.ADD_ORDER_PATTERN_DATA, 'POST',
        {
          ...values,
          [ORDER_PATTERN_FIELDS.CATEGORY]: orderCategory,
          [ORDER_PATTERN_FIELDS.ELEMENTS]: orderPattern,
          isPersonalPattern: false,
        }
      );
      message(MESSAGE_TYPES.SUCCESS, res.message);
      onCreateOrderPattern(res.orderPattern);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setOrderPatternFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  };


  const handleChangeWorkPoligons = (value) => {
    form.setFieldsValue({ [ORDER_PATTERN_FIELDS.WORK_POLIGONS]: value });
  };

  const handleWorkPoligonError = (errorMessage) => {
    message(MESSAGE_TYPES.ERROR, errorMessage);
  };


  return (
    <Row justify="space-around">
      <Col span={8}>
        <Form
          layout="vertical"
          size='small'
          form={form}
          name="new-order-pattern-form"
          onFinish={onFinish}
          onValuesChange={onValuesChange}
        >
          <Form.Item>
            <Row>
              <Col span={24} style={{ textAlign: 'right' }}>
                <Button htmlType="submit" type="primary">
                  Создать шаблон
                </Button>
              </Col>
            </Row>
          </Form.Item>

          { recsBeingAdded > 0 && <Text type="warning">На сервер отправлено {recsBeingAdded} новых записей. Ожидаю ответ...</Text> }

          <Form.Item
            label={<Text strong>Рабочие полигоны</Text>}
            name={ORDER_PATTERN_FIELDS.WORK_POLIGONS}
            validateStatus={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.WORK_POLIGONS]) ? ERR_VALIDATE_STATUS : null}
            help={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.WORK_POLIGONS])}
          >
            <SpecifyWorkPoligons
              onChange={handleChangeWorkPoligons}
              onError={handleWorkPoligonError}
              availableStationWorkPoligons={stations}
              availableDNCSectorWorkPoligons={dncSectors}
              availableECDSectorWorkPoligons={ecdSectors}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Служба</Text>}
            name={ORDER_PATTERN_FIELDS.SERVICE}
            rules={[
              {
                required: true,
                validator: async (_, value) => {
                  if (!value || value.length < 1) {
                    setRequiredServiceErrMess('Пожалуйста, выберите службу!');
                  } else {
                    setRequiredServiceErrMess(null);
                  }
                },
              },
            ]}
            validateStatus={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.SERVICE]) || requiredServiceErrMess ? ERR_VALIDATE_STATUS : null}
            help={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.SERVICE]) || requiredServiceErrMess}
          >
            <Select>
            {
              services &&
              services.map(service =>
                <Option
                  key={service[SERVICE_FIELDS.ABBREV]}
                  value={service[SERVICE_FIELDS.ABBREV]}
                >
                  {service[SERVICE_FIELDS.ABBREV]}
                </Option>
              )
            }
            </Select>
          </Form.Item>

          <Form.Item
            label={<Text strong>Тип документа</Text>}
            name={ORDER_PATTERN_FIELDS.TYPE}
            rules={[
              {
                required: true,
                validator: async (_, value) => {
                  if (!value || value.length < 1) {
                    setRequiredOrderTypeErrMess('Пожалуйста, выберите тип документа!');
                  } else {
                    setRequiredOrderTypeErrMess(null);
                  }
                },
              },
            ]}
            validateStatus={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.TYPE]) || requiredOrderTypeErrMess ? ERR_VALIDATE_STATUS : null}
            help={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.TYPE]) || requiredOrderTypeErrMess}
          >
            <Select>
            {
              Object.values(OrderTypes).map((type) =>
                <Option key={type} value={type}>
                  {type}
                </Option>
              )
            }
            </Select>
          </Form.Item>

          <Row>
            <Col span={24}>
              <div className="order-pattern-border order-pattern-block">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Text strong>Категория документа</Text>
                  <OrderCategoryChooser
                    orderCategoriesList={currentOrderCategoriesList}
                    onChangeValue={handleChangeOrderCategory}
                  />
                  {missingOrderCategoryErr && <Text type="danger">{missingOrderCategoryErr}</Text>}
                  {
                    orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.CATEGORY] &&
                    <Text type="danger">{orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.CATEGORY]}</Text>
                  }
                </Space>
              </div>
            </Col>
          </Row>

          <Form.Item
            label={<Text strong>Наименование документа</Text>}
            name={ORDER_PATTERN_FIELDS.TITLE}
            rules={[
              {
                required: true,
                validator: async (_, value) => {
                  if (!value || value.length < 1) {
                    setRequiredOrderTitleErrMess('Пожалуйста, выберите наименование документа!');
                  } else {
                    setRequiredOrderTitleErrMess(null);
                  }
                },
              },
            ]}
            validateStatus={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.TITLE]) || requiredOrderTitleErrMess ? ERR_VALIDATE_STATUS : null}
            help={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.TITLE]) || requiredOrderTitleErrMess}
          >
            <Input
              autoComplete="off"
              allowClear
            />
          </Form.Item>

          <Form.Item
            label={<Text strong>Особые отметки</Text>}
            name={ORDER_PATTERN_FIELDS.SPECIAL_TRAIN_CATEGORIES}
            validateStatus={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.SPECIAL_TRAIN_CATEGORIES]) ? ERR_VALIDATE_STATUS : null}
            help={(orderPatternFieldsErrs && orderPatternFieldsErrs[ORDER_PATTERN_FIELDS.SPECIAL_TRAIN_CATEGORIES])}
          >
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="Выберите особые отметки документа"
            >
              {
                SPECIAL_TRAIN_CATEGORIES.map(category =>
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                )
              }
            </Select>
          </Form.Item>
        </Form>

        <Row>
          <Col className="order-pattern-border order-pattern-block">
            <Space direction="vertical" size={12}>
              <Text strong>Определите элементы шаблона</Text>
              <EditOrderPatternElement
                orderPatternElRefs={orderPatternElRefs}
                submitOrderPatternElementCallback={addNewPatternElement}
                okButtonText="Добавить в шаблон"
                onNewOrderPatternElRef={onNewOrderPatternElRef}
                onDelOrderPatternElRef={onDelOrderPatternElRef}
                onModOrderPatternElRef={onModOrderPatternElRef}
                stations={stations}
                dncSectors={dncSectors}
                ecdSectors={ecdSectors}
              />
            </Space>
          </Col>
        </Row>
      </Col>

      <Col span={15}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Row>
            <Col span={24} className="order-pattern-border order-pattern-block">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <EditOrderPattern
                  orderPattern={orderPattern}
                  insertOrderElementPos={insertOrderElementPos}
                  orderPatternElRefs={orderPatternElRefs}
                  setCursorBeforeElementCallback={setCursorBeforeElement}
                  setCursorAfterElementCallback={setCursorAfterElement}
                  delPatternElementCallback={delPatternElement}
                  editPatternElementCallback={editPatternElement}
                  onNewOrderPatternElRef={onNewOrderPatternElRef}
                  onDelOrderPatternElRef={onDelOrderPatternElRef}
                  onModOrderPatternElRef={onModOrderPatternElRef}
                />
                {
                  (orderPattern && orderPattern.length) ?
                  <Popconfirm
                    title="Очистить шаблон?"
                    onConfirm={clearPattern}
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
                      Очистить шаблон
                    </Button>
                  </Popconfirm>
                  : <></>
                }
              </Space>
            </Col>
          </Row>
          <Row>
            <Col span={24} className="order-pattern-border order-pattern-block">
              <OrderPatternPreview orderPattern={orderPattern} />
            </Col>
          </Row>
        </Space>
      </Col>
    </Row>
  );
};
