import React, { useContext, useEffect, useState } from 'react';
import { useHttp } from '../hooks/http.hook';
import { useMessage } from '../hooks/message.hook';
import { AuthContext } from '../context/AuthContext';

import './AuthPage.css';

const APP_ABBREVIATION = 'GidNemanAuthUtil';
const ADMIN_CRED = 'ADMIN';


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

  // Параметры, необходимые для входа в систему (используем переменную состояния form)
  const [form, setForm] = useState({
    login: '',
    password: ''
  });


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
   * Для того чтобы input'ы стали активными при переходе на страницу авторизации
   */
  useEffect(() => {
    if (window.M) {
      window.M.updateTextFields();
    }
  }, []);


  /**
   * Обрабатываем изменение в одном из текстовых полей ввода
   * (обновляем значение переменной состояния form)
   *
   * @param {object} event
   */
  const changeHandler = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  }


  /**
   * Обрабатываем запрос на вход пользователя в систему
   */
  const loginHandler = async () => {
    try {
      // Отправляем запрос на вход в систему на сервер
      const data = await request('/api/auth/login', 'POST', { ...form });

      // Получили от сервера список полномочий пользователя в каждой из систем ГИД Неман.
      // Смотрим, есть ли у данного пользователя права на работу с данным приложением.
      let found = false;
      if (data.token && data.userId && data.credentials) {
        for (let cred of data.credentials) {
          if (cred && (cred.appAbbrev === APP_ABBREVIATION) && cred.creds) {
            for (let c of cred.creds) {
              if (c === ADMIN_CRED) {
                found = true;
                break;
              }
            }
          }
          if (found) {
            break;
          }
        }
      }

      if (found) {
        // Сохраняем аутентификационные данные клиента
        auth.login(data.token, data.userId, data.credentials);
      } else {
        message('Данный пользователь не имеет права на работу с текущим приложением');
      }
    } catch (e) {
      // здесь ничего делать не нужно, т.к. ошибки перехватываются в http.hook и устанавливаются
      // во внутреннем состоянии error, на изменение которого мы выше реагируем
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
      loginHandler();
    }
  }


  // Возвращаем страницу авторизации пользователя
  return (
    <div className="row">
      <div className="col s6 offset-s3">
        <h2>Администрирование аккаунтов ГИД НЕМАН</h2>
        <div className="card blue-grey darken-1">
          <div className="card-content white-text">
            <span className="card-title">Авторизация</span>
            <div>

              <div className="input-field">
                <input
                  placeholder="Введите имя администратора"
                  id="login"
                  type="text"
                  name="login"
                  className="input"
                  onChange={changeHandler}
                  onKeyUp={keyPressOnInputHandler}
                />
                <label htmlFor="login">Имя администратора</label>
              </div>

              <div className="input-field">
                <input
                  placeholder="Введите пароль администратора"
                  id="password"
                  type="password"
                  name="password"
                  className="input"
                  onChange={changeHandler}
                  onKeyUp={keyPressOnInputHandler}
                />
                <label htmlFor="password">Пароль</label>
              </div>

            </div>
          </div>
          <div className="card-action">
            <button
              className="btn yellow darken-4 enterBtn"
              onClick={loginHandler}
              disabled={loading}
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
