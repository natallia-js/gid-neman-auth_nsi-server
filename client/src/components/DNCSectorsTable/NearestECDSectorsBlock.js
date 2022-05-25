import React from 'react';
import { Typography, Row, Col } from 'antd';
import {
  ServerAPI,
  DNCSECTOR_FIELDS,
  NEAREST_SECTOR_FIELDS,
  ECDSECTOR_FIELDS,
} from '../../constants';
import { useHttp } from '../../hooks/http.hook';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import SavableSelectMultiple from '../SavableSelectMultiple';

const { Title } = Typography;


/**
 * Компонент блока с информацией об участках ЭЦД, ближайших к данному участку ДНЦ.
 * Позволяет редактировать информацию о ближайших участках ЭЦД.
 */
const NearestECDSectorsBlock = (props) => {
  const {
    dncSector, // объект текущего участка ДНЦ
    allECDSectors, // массив объектов всех участков ЭЦД
    setTableDataCallback, // функция, позволяющая внести изменения в массив объектов участков ДНЦ (изменить состояние)
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  /**
   * По заданному id участка ЭЦД возвращает его название.
   */
   const getECDSectorNameById = (id) => {
    if (!allECDSectors || !allECDSectors.length) {
      return null;
    }
    const index = allECDSectors.findIndex((sector) => sector[ECDSECTOR_FIELDS.KEY] === id);
    if (index > -1) {
      return allECDSectors[index][ECDSECTOR_FIELDS.NAME];
    }
    return null;
  };


  /**
   * Отправляет на сервер запрос по изменению списка ближайших участков ЭЦД текущего участка ДНЦ.
   */
  const handleModNearestECDSectList = async (newNearestECDSectList) => {
    const currDNCSectorKey = dncSector[DNCSECTOR_FIELDS.KEY];

    try {
      // Делаем запрос на сервер с целью редактирования информации о ближайших участках ЭЦД
      const res = await request(ServerAPI.MOD_NEARESTECDFORDNCSECTORS_DATA, 'POST',
        { sectorId: currDNCSectorKey, nearestECDSectIds: newNearestECDSectList });
      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Меняем локальное состояние (вносим изменения в массив объектов участков ДНЦ)
      setTableDataCallback((value) => value.map((sector) => {
        // Для того участка, для которого пользователь непосредственно изменил список ближайших участков, полностью
        // переписываем массив ближайших участков
        if (sector[DNCSECTOR_FIELDS.KEY] === currDNCSectorKey) {
          return {
            ...sector,
            [DNCSECTOR_FIELDS.NEAREST_ECDSECTORS]: newNearestECDSectList.map((id) => {
              return {
                [NEAREST_SECTOR_FIELDS.SECTOR_ID]: id,
              };
            }),
          };
        }
        // Остальные участки оставляем как есть
        return sector;
      }));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  return (
    <Row>
      <Col span={24}>
        <Title level={4}>Ближайшие участки ЭЦД</Title>
        <SavableSelectMultiple
          placeholder="Выберите ближайшие участки ЭЦД"
          options={
            (!allECDSectors || !allECDSectors.length) ?
            [] :
            allECDSectors.map((ecdSector) => {
              return {
                value: ecdSector[ECDSECTOR_FIELDS.NAME],
              };
            })
          }
          selectedItems={
            !dncSector[DNCSECTOR_FIELDS.NEAREST_ECDSECTORS] ? [] :
              dncSector[DNCSECTOR_FIELDS.NEAREST_ECDSECTORS].map((sector) =>
                getECDSectorNameById(sector[NEAREST_SECTOR_FIELDS.SECTOR_ID])
          )}
          saveChangesCallback={(selectedVals) => {
            const ecdSectIds = allECDSectors
              .filter((sector) => selectedVals.includes(sector[ECDSECTOR_FIELDS.NAME]))
              .map((sector) => sector[ECDSECTOR_FIELDS.KEY]);
            handleModNearestECDSectList(ecdSectIds);
          }}
        />
      </Col>
    </Row>
  );
};

 export default NearestECDSectorsBlock;
