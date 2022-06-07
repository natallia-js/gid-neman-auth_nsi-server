import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const PostsDescription = () => {
  return (
    <>
      <Title level={3} id="posts-description">Должности</Title>
      <p className="help-paragraph">
        В таблицу должностей помещается информация о тех должностях, которые имеют пользователи ГИД Неман.
      </p>
    </>
  );
};

export default PostsDescription;
