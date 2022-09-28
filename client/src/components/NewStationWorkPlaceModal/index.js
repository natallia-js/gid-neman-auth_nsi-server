import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { STATION_WORK_PLACE_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом рабочем месте станции.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewStationWorkPlaceOk,
 *   handleAddNewStationWorkPlaceCancel,
 *   stationWorkPlaceFieldsErrs,
 *   clearAddStationWorkPlaceMessages,
 *   recsBeingAdded,
 */
const NewStationWorkPlaceModal = ({
  isModalVisible,
  handleAddNewStationWorkPlaceOk,
  handleAddNewStationWorkPlaceCancel,
  stationWorkPlaceFieldsErrs,
  clearAddStationWorkPlaceMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredWorkPlaceErrMess, setRequiredWorkPlaceErrMess] = useState(null);
  const [requiredWorkPlaceTypeErrMess, setRequiredWorkPlaceTypeErrMess] = useState(null);

  /**
   * Чистим поля ввода информации о новом рабочем месте.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddStationWorkPlaceMessages();
    setRequiredWorkPlaceErrMess(null);
    setRequiredWorkPlaceTypeErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    if (requiredWorkPlaceErrMess || requiredWorkPlaceTypeErrMess)
      return;
    resetAll();
    handleAddNewStationWorkPlaceOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewStationWorkPlaceCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новом рабочем месте на станции"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size="small"
        form={form}
        name="new-station-work-place-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Наименование"
          name={STATION_WORK_PLACE_FIELDS.NAME}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredWorkPlaceErrMess('Пожалуйста, введите наименование рабочего места!');
                } else {
                  setRequiredWorkPlaceErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(stationWorkPlaceFieldsErrs && stationWorkPlaceFieldsErrs[STATION_WORK_PLACE_FIELDS.NAME]) || requiredWorkPlaceErrMess ? ERR_VALIDATE_STATUS : null}
          help={(stationWorkPlaceFieldsErrs && stationWorkPlaceFieldsErrs[STATION_WORK_PLACE_FIELDS.NAME]) || requiredWorkPlaceErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите наименование"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Тип"
          name={STATION_WORK_PLACE_FIELDS.TYPE}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredWorkPlaceTypeErrMess('Пожалуйста, введите тип рабочего места!');
                } else {
                  setRequiredWorkPlaceTypeErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(stationWorkPlaceFieldsErrs && stationWorkPlaceFieldsErrs[STATION_WORK_PLACE_FIELDS.TYPE]) || requiredWorkPlaceTypeErrMess ? ERR_VALIDATE_STATUS : null}
          help={(stationWorkPlaceFieldsErrs && stationWorkPlaceFieldsErrs[STATION_WORK_PLACE_FIELDS.TYPE]) || requiredWorkPlaceTypeErrMess}
        >
          <Input
            autoComplete="off"
            placeholder="Определите тип рабочего места"
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


export default NewStationWorkPlaceModal;
