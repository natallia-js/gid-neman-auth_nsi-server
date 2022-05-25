import React, { useState } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { Form, Button, Input, Row, Col } from 'antd';
import { ServerAPI, USER_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';

const ERR_VALIDATE_STATUS = 'error';


const ChangePasswordBlock = ({
  userId,
}) => {
  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для редактирования пароля пользователя
  const [newPwdForm] = Form.useForm();

  // Ошибка редактирования пароля пользователя
  const [passwordError, setPasswordError] = useState(null);

  const message = useCustomMessage();


  /**
   * Редактирует пароль пользователя в БД.
   *
   * @param {number} userId
   * @param {string} newPassword
   */
   const handleChangePassword = async ({ userId, newPassword }) => {
    try {
      const res = await request(ServerAPI.MOD_USER, 'POST', { userId, password: newPassword });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setPasswordError(null);
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      if (e.errors && e.errors[0]) {
        setPasswordError(e.errors[0].msg);
      }
    }
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   */
   const onFinish = (values) => {
    handleChangePassword({ userId, newPassword: values[USER_FIELDS.PASSWORD] });
  };


  return (
    <Form
      layout="horizontal"
      size='small'
      form={newPwdForm}
      name="new-password-form"
      onFinish={onFinish}
    >
      <Row wrap={false}>
        <Col span={6}>
          <Form.Item
            label="Новый пароль"
            name={USER_FIELDS.PASSWORD}
            validateStatus={passwordError ? ERR_VALIDATE_STATUS : null}
            help={passwordError}
          >
            <Input
              autoComplete="off"
              placeholder="Новый пароль пользователя"
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Изменить
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )
};


export default ChangePasswordBlock;
