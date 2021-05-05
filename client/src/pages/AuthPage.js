import React, { useContext, useEffect, useRef } from 'react';
import { useHttp } from '../hooks/http.hook';
import { useMessage } from '../hooks/message.hook';
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
  // для вывода всплывающих сообщений
  const message = useMessage();
  // для общения с сервером
  const { loading, request, error, clearError } = useHttp();

  // Ref для кнопки подтверждения ввода
  const submitBtn = useRef(null);


  /**
   * Данный код выполнится после обновления ошибки error
   * (ошибка будет выведена во всплывающем окне)
   */
  useEffect(() => {
    // Выводим сообщение об ошибке
    message(error);

    // Удаляем ошибку
    clearError();
  }, [error, message, clearError]);


  /**
   * Данный код выполнится после обновления ошибки authError
   * (ошибка будет выведена во всплывающем окне)
   */
  useEffect(() => {
    if (auth.authError) {
      // Выводим сообщение об ошибке
      message(auth.authError);

      // Удаляем ошибку
      auth.clearAuthError();
    }
  }, [message, auth]);


  /**
   * Обрабатываем запрос на вход пользователя в систему.
   */
  const loginHandler = async (loginData) => {
    try {
      // Отправляем запрос на вход в систему на сервер
      const data = await request(ServerAPI.LOGIN, 'POST', { ...loginData });

      // Входим в систему
      auth.login(data.token, data.userId, data.userInfo.service, data.roles, data.credentials);

    } catch (e) {
      // здесь ничего делать не нужно, т.к. ошибки перехватываются в http.hook и AuthContext
      // и устанавливаются во внутренних состояниях error и authError соответственно.
      // На изменение данных состояний мы реагируем выше.
    }
  }


  /**
   * Обрабатываем нажатие кнопки Enter на поле ввода аутентификационных данных:
   * нажатие данной кнопки приводит к вызову функции входа пользователя в систему
   *
   * @param {object} event
   */
  const keyPressOnInputHandler = async (event) => {
    if (event.key === 'Enter') {
      submitBtn.current.click();
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
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Введите login администратора"
              onKeyUp={keyPressOnInputHandler}
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
            ]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="Пароль администратора"
              onKeyUp={keyPressOnInputHandler}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              ref={submitBtn}
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
