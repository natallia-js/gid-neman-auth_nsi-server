import React, { useState, useContext, useEffect } from 'react';
import { Typography, Row, Col, Button, Popconfirm, Form, Select, Input, DatePicker, TimePicker, Space } from 'antd';
import { OrderPatternPreview } from '../OrderPatternPreview';
import { EditOrderPattern } from '../EditOrderPattern';
import { EditOrderPatternElement } from '../EditOrderPatternElement';
import { ServerAPI, SERVICE_FIELDS } from '../../../constants';
import {
  OrderPatternElementType,
  OrderTypes,
  NewOrderFields,
  DateFormat,
  TimeFormat,
  DateTimeFormat,
  ElementSizesCorrespondence,
} from '../constants';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { EnterOutlined } from '@ant-design/icons';
import NewOrEditOrderCategoryModal from '../NewOrEditOrderCategoryModal';
import { OrderCategoryChooser } from '../OrderCategoryChooser';

const { Text } = Typography;
const { Option } = Select;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Возвращает компонент, представляющий собой страницу создания шаблона распоряжения.
 *
 * services - массив всех служб
 * existingOrderAffiliationTree - массив, представляющий собой дерево принадлежности созданных распоряжений
 * (уровни дерева: служба -> тип распоряжения -> категория распоряжения)
 */
export const CreateOrderPattern = (props) => {
  const { services, existingOrderAffiliationTree } = props;

  // Массив элементов создаваемого шаблона
  const [orderPattern, setOrderPattern] = useState([]);

  // Текущая позиция, на которую будет вставлен созданный элемент шаблона
  const [insertOrderElementPos, setInsertOrderElementPos] = useState(0);

  // ?????????????????????????
  const [nextPatternElementID, setNextPatternElementID] = useState(1);

  // Для создания значений полей нового распоряжения
  const [form] = Form.useForm();

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  //
  const [requiredServiceErrMess, setRequiredServiceErrMess] = useState(null);

  //
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedOrderType, setSelectedOrderType] = useState(null);
  const [selectedOrderCategory, setSelectedOrderCategory] = useState(null);

  // Видимо либо нет модальное окно добавления новой / редактирования существующей записи о категории распоряжения
  const [isOrderCategoryModalVisible, setOrderCategoryModalVisible] = useState(false);

  // Ошибки добавления / редактирования информации о категории распоряжения
  const [orderCategoryFieldsErrs, setOrderCategoryFieldsErrs] = useState(null);

  // количество запущенных процессов добавления / редактирования информации о категории распоряжения на сервере
  const [orderCategoryRecsBeingProcessed, setOrderCategoryRecsBeingProcessed] = useState(0);

  // true - add, false - edit, undefined - nothing
  const [addOrderCategory, setAddOrderCategory] = useState(undefined);

  const [currentOrderCategoriesList, setCurrentOrderCategoriesList] = useState([]);


  /**
   *
   */
  const getOrderPatternElementView = (element) => {
    switch (element.type) {
      case OrderPatternElementType.TEXT:
        return <span>{element.value}</span>;
      case OrderPatternElementType.INPUT:
        return <Input style={{ width: ElementSizesCorrespondence[element.size] }} size="small" />;
      case OrderPatternElementType.SELECT:
        return <Select style={{ width: ElementSizesCorrespondence[element.size] }} size="small" />;
      case OrderPatternElementType.DATE:
        return <DatePicker format={DateFormat} size="small" />;
      case OrderPatternElementType.TIME:
        return <TimePicker format={TimeFormat} size="small" />;
      case OrderPatternElementType.DATETIME:
        return <DatePicker showTime format={DateTimeFormat} size="small" />;
      case OrderPatternElementType.LINEBREAK:
        return <EnterOutlined />;
      default:
        return null;
    }
  };


  /**
   *
   */
  const addNewPatternElement = (selectedPatternElement) => {
    if (!selectedPatternElement) {
      return;
    }
    const newElement = {
      id: nextPatternElementID,
      type: selectedPatternElement.type,
      ref: selectedPatternElement.ref,
      value: selectedPatternElement.value,
      size: selectedPatternElement.size,
      element: getOrderPatternElementView(selectedPatternElement),
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
    setNextPatternElementID((value) => value + 1);
  };


  /**
   *
   */
  const editPatternElement = (elementId, editedElement) => {
    const elementIndex = orderPattern.findIndex((element) => element.id === elementId);
    if (elementIndex === -1) {
      return;
    }
    setOrderPattern((value) => value.map((el) => {
      if (el.id !== elementId) {
        return el;
      }
      return {
        id: elementId,
        element: getOrderPatternElementView(editedElement),
        ...editedElement,
      };
    }));
  };


  /**
   *
   */
  const delPatternElement = (elementId) => {
    const elementIndex = orderPattern.findIndex((element) => element.id === elementId);
    if (elementIndex === -1) {
      return;
    }
    if (elementIndex < insertOrderElementPos) {
      setInsertOrderElementPos((value) => value - 1);
    }
    setOrderPattern((value) => value.filter((el) => el.id !== elementId));
  };


  /**
   *
   */
  const setCursorBeforeElement = (elementId) => {
    const elementIndex = orderPattern.findIndex((element) => element.id === elementId);
    if (elementIndex === -1) {
      return;
    }
    setInsertOrderElementPos(elementIndex !== 0 ? elementIndex : -1);
  };


  /**
   *
   */
  const setCursorAfterElement = (elementId) => {
    const elementIndex = orderPattern.findIndex((element) => element.id === elementId);
    if (elementIndex === -1) {
      return;
    }
    setInsertOrderElementPos(elementIndex + 1);
  };


  /**
   *
   */
  const clearPattern = () => {
    setOrderPattern([]);
    setInsertOrderElementPos(0);
    setNextPatternElementID(1);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    // Чистим все сообщения
    //clearAddUserMessages();
    //handleAddNewUserOk({ ...values });
    console.log(values)
  };


  /**
   * При выборе (из предложенного списка) наименования службы либо наименования типа распоряжения
   * запоминаем выбранную информацию (для смены информации в списке категорий распоряжений).
   */
  const onValuesChange = (changedValues) => {
    if (changedValues[NewOrderFields.SERVICE]) {
      setSelectedService(changedValues[NewOrderFields.SERVICE]);
    } else if (changedValues[NewOrderFields.TYPE]) {
      setSelectedOrderType(changedValues[NewOrderFields.TYPE]);
    } else if (changedValues[NewOrderFields.CATEGORY]) {
      setSelectedOrderCategory(changedValues[NewOrderFields.CATEGORY]);
    }
  };


  /**
   *
   */
  useEffect(() => {
    const currentServiceInfo = existingOrderAffiliationTree.find((service) => service.name === selectedService);
    if (!currentServiceInfo || !currentServiceInfo.orderTypes) {
      setCurrentOrderCategoriesList([]);
    } else {
      const orderTypeInfo = currentServiceInfo.orderTypes.find((orderType) => orderType.name === selectedOrderType);
      if (!orderTypeInfo || !orderTypeInfo.orderCategories) {
        setCurrentOrderCategoriesList([]);
      } else {
        setCurrentOrderCategoriesList(orderTypeInfo.orderCategories || []);
      }
    }
    setSelectedOrderCategory(null);
    form.setFieldsValue({ [NewOrderFields.CATEGORY]: null });
  }, [selectedService, existingOrderAffiliationTree, selectedOrderType, form]);


  // --------------------------------------------------------------
  // Для работы с диалоговым окном добавления / редактирования информации о категории распоряжения

  const showAddOrEditOrderCategoryModal = () => {
    setOrderCategoryModalVisible(true);
  };

  const handleAddOrEditOrderCategoryOk = (orderCategory) => {
    //handleAddNewStation(station);
  };

  const handleAddOrEditOrderCategoryCancel = () => {
    setAddOrderCategory(undefined);
    setOrderCategoryModalVisible(false);
  };

  // --------------------------------------------------------------


  /**
   * Чистит все сообщения добавления / редактирования категории распоряжения (ошибки и успех).
   */
   const clearAddOrEditOrderCategoryMessages = () => {
    setOrderCategoryFieldsErrs(null);
  };


  /**
   *
   */
  useEffect(() => {
    if (typeof addOrderCategory === 'boolean') {
      showAddOrEditOrderCategoryModal();
    }
  }, [addOrderCategory]);


  /**
   *
   */
  const handleChangeOrderCategory = (value) => {
    console.log('value',value);
  };


  return (
    <Row justify="space-around">
      <NewOrEditOrderCategoryModal
        isModalVisible={isOrderCategoryModalVisible}
        orderCategoryName={addOrderCategory === true ? null : addOrderCategory === false ? selectedOrderCategory : undefined}
        handleOk={handleAddOrEditOrderCategoryOk}
        handleCancel={handleAddOrEditOrderCategoryCancel}
        fieldsErrs={orderCategoryFieldsErrs}
        clearMessages={clearAddOrEditOrderCategoryMessages}
        recsBeingProcessed={recsBeingAdded}
      />

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
            label={<Text strong>Служба</Text>}
            name={NewOrderFields.SERVICE}
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
            validateStatus={requiredServiceErrMess ? ERR_VALIDATE_STATUS : null}
            help={requiredServiceErrMess}
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
            label={<Text strong>Тип распоряжения</Text>}
            name={NewOrderFields.TYPE}
            rules={[
              {
                required: true,
                message: 'Пожалуйста, выберите тип распоряжения!',
              },
            ]}
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
                  <Text strong>Категория распоряжения</Text>
                  <OrderCategoryChooser
                    orderCategoriesList={currentOrderCategoriesList}
                    onChangeValue={handleChangeOrderCategory}
                  />
                </Space>
              </div>
            </Col>
          </Row>

          <Form.Item
            label={<Text strong>Наименование распоряжения</Text>}
            name={NewOrderFields.TITLE}
            rules={[
              {
                required: true,
                message: 'Пожалуйста, введите наименование распоряжения!',
              },
            ]}
          >
            <Input
              autoComplete="off"
            />
          </Form.Item>
        </Form>

        <Row>
          <Col className="order-pattern-border order-pattern-block">
            <Space direction="vertical" size={12}>
              <Text strong>Определите элементы шаблона</Text>
              <EditOrderPatternElement
                submitOrderPatternElementCallback={addNewPatternElement}
                okButtonText="Добавить в шаблон"
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
                  setCursorBeforeElementCallback={setCursorBeforeElement}
                  setCursorAfterElementCallback={setCursorAfterElement}
                  delPatternElementCallback={delPatternElement}
                  editPatternElementCallback={editPatternElement}
                />
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
