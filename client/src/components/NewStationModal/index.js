import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { STATION_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новой станции.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewStationOk,
 *   handleAddNewStationCancel,
 *   stationFieldsErrs,
 *   clearAddStationMessages,
 *   recsBeingAdded,
 */
const NewStationModal = ({
  isModalVisible,
  handleAddNewStationOk,
  handleAddNewStationCancel,
  stationFieldsErrs,
  clearAddStationMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredCodeErrMess, setRequiredCodeErrMess] = useState(null);
  const [requiredNameErrMess, setRequiredNameErrMess] = useState(null);


  /**
   * Чистим поля ввода информации о новой станции.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddStationMessages();
    setRequiredCodeErrMess(null);
    setRequiredNameErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    if (requiredCodeErrMess || requiredNameErrMess)
      return;
    resetAll();
    handleAddNewStationOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewStationCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новой станции"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size="small"
        form={form}
        name="new-station-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="ЕСР-код"
          name={STATION_FIELDS.ESR_CODE}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredCodeErrMess('Пожалуйста, введите ЕСР-код станции!');
                } else {
                  setRequiredCodeErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(stationFieldsErrs && stationFieldsErrs[STATION_FIELDS.ESR_CODE]) || requiredCodeErrMess ? ERR_VALIDATE_STATUS : null}
          help={(stationFieldsErrs && stationFieldsErrs[STATION_FIELDS.ESR_CODE]) || requiredCodeErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите ЕСР-код станции"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Наименование"
          name={STATION_FIELDS.NAME}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredNameErrMess('Пожалуйста, введите наименование станции!');
                } else {
                  setRequiredNameErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(stationFieldsErrs && stationFieldsErrs[STATION_FIELDS.NAME]) || requiredNameErrMess ? ERR_VALIDATE_STATUS : null}
          help={(stationFieldsErrs && stationFieldsErrs[STATION_FIELDS.NAME]) || requiredNameErrMess}
        >
          <Input
            autoComplete="off"
            placeholder="Введите наименование станции"
            allowClear
          />
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


export default NewStationModal;
