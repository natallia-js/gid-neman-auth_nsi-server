import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ServicesDescription = () => {
  return (
    <>
      <Title level={3} id="services-description">Службы</Title>
      <p className="help-paragraph">
        В таблицу служб помещается информация о тех железнодорожных службах, работники которых являются пользователями ГИД Неман.
      </p>
    </>
  );
};

export default ServicesDescription;
