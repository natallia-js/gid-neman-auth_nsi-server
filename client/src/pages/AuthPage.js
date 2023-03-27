import React, { useContext } from 'react';
import { useHttp } from '../hooks/http.hook';
import { MESSAGE_TYPES, useCustomMessage } from '../hooks/customMessage.hook';
import { AuthContext } from '../context/AuthContext';
import { ServerAPI } from '../constants';
import { Form, Input, Button, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import './AuthPage.scss';

const { Title } = Typography;


/**
 * Возвращает компонент, представляющий собой страницу авторизации пользователя.
 */
export const AuthPage = () => {
  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Объявляем пользовательские хуки:
  // - для вывода всплывающих сообщений
  const message = useCustomMessage();
  // - для общения с сервером
  const { loading, request } = useHttp();


  /**
   * Обрабатываем запрос на вход пользователя в систему.
   */
  const loginHandler = async (loginData) => {
    try {
      // Отправляем запрос на вход в систему на сервер
      const responseData = await request(ServerAPI.LOGIN, 'POST', loginData); console.log(responseData)

      // Входим в систему
      auth.login({
        jwtToken: responseData.token,
        id: responseData.userId,
        userInfo: responseData.userInfo,
        roles: responseData.roles,
        credentials: responseData.credentials,
      });

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  }


  /**
   * Обрабатывает событие нажатия на кнопку входа в систему.
   */
  const onFinish = (values) => {

    loginHandler(values);
  };


  // Возвращаем страницу авторизации пользователя
  return (
    <div className="auth-block">
      <div className="auth-form">
        <Title level={2}>Администрирование аккаунтов и НСИ ГИД НЕМАН</Title>
        <Form
          name="normal_login"
          className="login-form"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="Login администратора"
            name="login"
            rules={[
              {
                required: true,
                message: 'Пожалуйста, введите login администратора!',
              },
              {
                validator: async (_, login) => {
                  if (login && !login.match(/^[A-Za-z0-9_]+$/)) {
                    return Promise.reject(new Error('В login администратора допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Введите login администратора"
            />
          </Form.Item>
          <Form.Item
            label="Пароль администратора"
            name="password"
            rules={[
              {
                required: true,
                message: 'Пожалуйста, введите пароль администратора!',
              },
              {
                validator: async (_, password) => {
                  if (password && !password.match(/^[A-Za-z0-9_]+$/)) {
                    return Promise.reject(new Error('В пароле допустимы только символы латинского алфавита, цифры и знак нижнего подчеркивания'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="Пароль администратора"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              disabled={loading}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
