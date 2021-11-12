import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { ECD_STRUCTURAL_DIVISION_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом структурном подразделении ЭЦД.
 */
const NewECDStructuralDivisionModal = ({
  isModalVisible,
  handleAddNewDivisionOk,
  handleAddNewDivisionCancel,
  divisionFieldsErrs,
  clearAddDivisionMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  // Для ошибки о необходимости ввести наименование структурного подразделения
  const [requiredDivisionErrMess, setRequiredDivisionErrMess] = useState(null);

  /**
   * Чистим поля ввода информации о новом подразделении.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddDivisionMessages();
    setRequiredDivisionErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    resetAll();
    handleAddNewDivisionOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewDivisionCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите новую информацию о структурном подразделении ЭЦД"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size="small"
        form={form}
        name="new-ecd-structural-division-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Наименование"
          name={ECD_STRUCTURAL_DIVISION_FIELDS.NAME}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredDivisionErrMess('Пожалуйста, введите наименование структурного подразделения!');
                } else {
                  setRequiredDivisionErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(divisionFieldsErrs && divisionFieldsErrs[ECD_STRUCTURAL_DIVISION_FIELDS.NAME]) || requiredDivisionErrMess ? ERR_VALIDATE_STATUS : null}
          help={(divisionFieldsErrs && divisionFieldsErrs[ECD_STRUCTURAL_DIVISION_FIELDS.NAME]) || requiredDivisionErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите наименование"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Должность"
          name={ECD_STRUCTURAL_DIVISION_FIELDS.POST}
          validateStatus={(divisionFieldsErrs && divisionFieldsErrs[ECD_STRUCTURAL_DIVISION_FIELDS.POST]) ? ERR_VALIDATE_STATUS : null}
          help={divisionFieldsErrs ? divisionFieldsErrs[ECD_STRUCTURAL_DIVISION_FIELDS.POST] : null}
        >
          <Input
            autoComplete="off"
            placeholder="Введите должность"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="ФИО работника"
          name={ECD_STRUCTURAL_DIVISION_FIELDS.FIO}
          validateStatus={(divisionFieldsErrs && divisionFieldsErrs[ECD_STRUCTURAL_DIVISION_FIELDS.FIO]) ? ERR_VALIDATE_STATUS : null}
          help={divisionFieldsErrs ? divisionFieldsErrs[ECD_STRUCTURAL_DIVISION_FIELDS.FIO] : null}
        >
          <Input
            autoComplete="off"
            placeholder="Введите ФИО"
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


export default NewECDStructuralDivisionModal;
