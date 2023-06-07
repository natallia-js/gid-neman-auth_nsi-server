import React, { useState } from 'react';
import { Checkbox, Modal, Form, Input, Button, Typography } from 'antd';
import { ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS } from '../../constants';
import SpecifyWorkPoligons from '../SpecifyWorkPoligons';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом смысловом значении элемента шаблона распоряжения.
 */
const NewOrderPatternElementRefModal = ({
  isModalVisible,
  handleAddNewRecOk,
  handleAddNewRecCancel,
  handleError,
  recFieldsErrs,
  clearAddRecMessages,
  recsBeingAdded,
  stations,
  dncSectors,
  ecdSectors,
}) => {
  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredRefNameErrMess, setRequiredRefNameErrMess] = useState(null);


  /**
   * Чистим поля ввода информации о новом смысловом значении.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddRecMessages();
    setRequiredRefNameErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    if (requiredRefNameErrMess)
      return;
    resetAll();
    handleAddNewRecOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewRecCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  const handleChangeWorkPoligons = (value) => {
    form.setFieldsValue({ [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON]: value });
  };

  const handleWorkPoligonError = (errorMessage) => {
    handleError(errorMessage);
  };


  return (
    <Modal
      title="Введите информацию о новом смысловом значении"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-order-pattern-ref-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Наименование"
          name={ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredRefNameErrMess('Пожалуйста, введите наименование смыслового значения!');
                } else {
                  setRequiredRefNameErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(recFieldsErrs && recFieldsErrs[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME]) || requiredRefNameErrMess ? ERR_VALIDATE_STATUS : null}
          help={(recFieldsErrs && recFieldsErrs[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME]) || requiredRefNameErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите наименование"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label={<Text strong>Рабочий полигон</Text>}
          name={ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON}
          validateStatus={(recFieldsErrs && recFieldsErrs[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON]) ? ERR_VALIDATE_STATUS : null}
          help={(recFieldsErrs && recFieldsErrs[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON])}
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
          name={ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID}
          valuePropName="checked"
          validateStatus={(recFieldsErrs && recFieldsErrs[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID]) ? ERR_VALIDATE_STATUS : null}
          help={(recFieldsErrs && recFieldsErrs[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID])}
        >
          <Checkbox>
            Дополнительная информация о месте действия для ГИД
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <div className="new-item-modal-btns-block">
            <Button htmlType="button" onClick={onReset} className="new-item-modal-btn" type="primary">
              Очистить поля
            </Button>
            <Button htmlType="submit" className="new-item-modal-btn" type="primary">
              Добавить запись
            </Button>
            <Button htmlType="button" onClick={onCancel} className="new-item-modal-btn" type="primary">
              Отмена
            </Button>
          </div>
        </Form.Item>

        { recsBeingAdded > 0 && <Text type="warning">На сервер отправлено {recsBeingAdded} новых записей. Ожидаю ответ...</Text> }
      </Form>
    </Modal>
  );
};


export default NewOrderPatternElementRefModal;
