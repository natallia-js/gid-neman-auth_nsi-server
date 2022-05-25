import React from 'react';
import { Typography, Row, Col } from 'antd';
import {
  ServerAPI,
  ECDSECTOR_FIELDS,
  NEAREST_SECTOR_FIELDS,
  DNCSECTOR_FIELDS,
} from '../../constants';
import { useHttp } from '../../hooks/http.hook';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import SavableSelectMultiple from '../SavableSelectMultiple';

const { Title } = Typography;


/**
 * Компонент блока с информацией об участках ДНЦ, ближайших к данному участку ЭЦД.
 * Позволяет редактировать информацию о ближайших участках ДНЦ.
 */
const NearestDNCSectorsBlock = (props) => {
  const {
    ecdSector, // объект текущего участка ЭЦД
    allDNCSectors, // массив объектов всех участков ДНЦ
    setTableDataCallback, // функция, позволяющая внести изменения в массив объектов участков ЭЦД (изменить состояние)
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  /**
   * По заданному id участка ДНЦ возвращает его название.
   */
   const getDNCSectorNameById = (id) => {
    if (!allDNCSectors || !allDNCSectors.length) {
      return null;
    }
    const index = allDNCSectors.findIndex((sector) => sector[DNCSECTOR_FIELDS.KEY] === id);
    if (index > -1) {
      return allDNCSectors[index][DNCSECTOR_FIELDS.NAME];
    }
    return null;
  };


  /**
   * Отправляет на сервер запрос по изменению списка ближайших участков ДНЦ текущего участка ЭЦД.
   */
  const handleModNearestDNCSectList = async (newNearestDNCSectList) => {
    const currECDSectorKey = ecdSector[ECDSECTOR_FIELDS.KEY];

    try {
      // Делаем запрос на сервер с целью редактирования информации о ближайших участках ДНЦ
      const res = await request(ServerAPI.MOD_NEARESTDNCFORECDSECTORS_DATA, 'POST',
        { sectorId: currECDSectorKey, nearestDNCSectIds: newNearestDNCSectList }
      );
      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Меняем локальное состояние (вносим изменения в массив объектов участков ЭЦД)
      setTableDataCallback((value) => value.map((sector) => {
        // Для того участка, для которого пользователь непосредственно изменил список ближайших участков, полностью
        // переписываем массив ближайших участков
        if (sector[ECDSECTOR_FIELDS.KEY] === currECDSectorKey) {
          return {
            ...sector,
            [ECDSECTOR_FIELDS.NEAREST_DNCSECTORS]: newNearestDNCSectList.map((id) => {
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
        <Title level={4}>Ближайшие участки ДНЦ</Title>
        <SavableSelectMultiple
          placeholder="Выберите ближайшие участки ДНЦ"
          options={
            (!allDNCSectors || !allDNCSectors.length) ?
            [] :
            allDNCSectors.map((dncSector) => {
              return {
                value: dncSector[DNCSECTOR_FIELDS.NAME],
              };
            })
          }
          selectedItems={
            !ecdSector[ECDSECTOR_FIELDS.NEAREST_DNCSECTORS] ? [] :
              ecdSector[ECDSECTOR_FIELDS.NEAREST_DNCSECTORS].map((sector) =>
                getDNCSectorNameById(sector[NEAREST_SECTOR_FIELDS.SECTOR_ID])
          )}
          saveChangesCallback={(selectedVals) => {
            const dncSectIds = allDNCSectors
              .filter((sector) => selectedVals.includes(sector[DNCSECTOR_FIELDS.NAME]))
              .map((sector) => sector[DNCSECTOR_FIELDS.KEY]);
            handleModNearestDNCSectList(dncSectIds);
          }}
        />
      </Col>
    </Row>
  );
};

 export default NearestDNCSectorsBlock;
