import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const ECDSectorsDescription = () => {
  return (
    <>
      <Title level={3} id="ecd-sectors-description">Участки ЭЦД</Title>
      <p className="help-paragraph">
        Таблица участков ЭЦД включает информацию обо всех участках ЭЦД Белорусской железной дороги.
        В "развороте" каждой строки таблицы для участка ЭЦД указывается: перечень смежных с ним участков ЭЦД,
        перечень ближайших к нему участков ДНЦ, перечень входящих в состав участка ЭЦД поездных участков с
        соответствующими списками станций и перегонов, перечень структурных подразделений участка ЭЦД.
      </p>
    </>
  );
};

export default ECDSectorsDescription;
