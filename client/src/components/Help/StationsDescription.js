import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const StationsDescription = () => {
  return (
    <>
      <Title level={3} id="stations-description">Станции</Title>
      <p className="help-paragraph">
        Таблица станций включает информацию обо всех станциях, необходимых для работы ГИД Неман.
        В "развороте" каждой строки таблицы для станции указывается перечень ее путей и рабочих мест.
        Кнопка "Синхронизировать с ПЭНСИ" позволяет запросить данные по станциям у ПЭНСИ и применить
        запрошенные данные к текущей таблице станций. Результаты синхронизации данных отображаются под
        таблицей станций по завершении процесса синхронизации.
      </p>
    </>
  );
};

export default StationsDescription;
