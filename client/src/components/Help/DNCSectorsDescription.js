import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const DNCSectorsDescription = () => {
  return (
    <>
      <Title level={3} id="dnc-sectors-description">Участки ДНЦ</Title>
      <p className="help-paragraph">
        Таблица участков ДНЦ включает информацию обо всех участках ДНЦ Белорусской железной дороги.
        В "развороте" каждой строки таблицы для участка ДНЦ указывается: перечень смежных с ним участков ДНЦ,
        перечень ближайших к нему участков ЭЦД, перечень входящих в состав участка ДНЦ поездных участков с
        соответствующими списками станций и перегонов.
        Кнопка "Синхронизировать с ПЭНСИ" позволяет запросить данные по участкам ДНЦ у ПЭНСИ и применить
        запрошенные данные к текущей таблице участков ДНЦ. Результаты синхронизации данных отображаются под
        таблицей участков ДНЦ по завершении процесса синхронизации.
      </p>
    </>
  );
};

export default DNCSectorsDescription;