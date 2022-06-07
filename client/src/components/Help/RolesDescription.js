import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const RolesDescription = () => {
  return (
    <>
      <Title level={3} id="roles-description">Роли</Title>
      <p className="help-paragraph">
        Роль - совокупность полномочий пользователей ГИД Неман.
        Аббревиатура роли - произвольная строка (строка GID_NEMAN_ADMIN - аббревиатура роли Главного Администратора ГИД Неман).
        Для определения полномочий роли необходимо "развернуть" соответствующую строку таблицы и выбрать полномочия из групп
        полномочий.
      </p>
    </>
  );
};

export default RolesDescription;
