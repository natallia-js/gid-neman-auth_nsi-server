import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const LogsDescription = () => {
  return (
    <>
      <Title level={3} id="logs-description">Логи</Title>
      <p className="help-paragraph">
        Серверная часть ГИД Неман ведет логирование:
      </p>
      <ol className="help-list">
        <li>ошибок, произошедших на сервере;</li>
        <li>действий сервера;</li>
        <li>действий администраторов;</li>
        <li>действий пользователей ДУ-58.</li>
      </ol>
      <p className="help-text">
        Пункт меню "Логи" содержит соответствующие подпункты.
      </p>
      <p className="help-paragraph">
        Ошибки, произошедшие на сервере - как ошибки, возникшие при выполнении пользовательского запроса, так и
        ошибки, возникшие в результате периодических действий сервера.
      </p>
      <p className="help-paragraph">
        Действия сервера - действия, связанные с фиксацией подключаемых и отключаемых пользователей, а также
        с периодической "чисткой" базы данных.
      </p>
      <p className="help-paragraph">
        Действия администраторов - действия как Главного Администратора ГИД Неман, так и дополнительных администраторов
        в системе "Администрирование аккаунтов и НСИ ГИД Неман".
      </p>
      <p className="help-paragraph">
        Действия пользователей ДУ-58 - все действия пользователей системы ДУ-58, которые могут повлиять на целостность данных.
      </p>
    </>
  );
};

export default LogsDescription;