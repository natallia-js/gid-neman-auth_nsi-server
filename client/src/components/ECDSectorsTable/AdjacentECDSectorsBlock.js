import React, { useContext } from 'react';
import { Typography, Row, Col } from 'antd';
import { ServerAPI, ECDSECTOR_FIELDS, ADJACENT_ECDSECTOR_FIELDS } from '../../constants';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import SavableSelectMultiple from '../SavableSelectMultiple';

const { Title } = Typography;


/**
 * Компонент блока с информацией об участках ЭЦД, смежных с данным участком ЭЦД.
 * Позволяет редактировать информацию о смежных участках ЭЦД.
 */
const AdjacentECDSectorsBlock = (props) => {
  const {
    ecdSector, // объект текущего участка ЭЦД
    allECDSectors, // массив объектов всех участков ЭЦД
    setTableDataCallback, // функция, позволяющая внести изменения в массив объектов участков ЭЦД (изменить состояние)
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

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
   * Отправляет на сервер запрос по изменению списка смежных участков текущего участка ЭЦД.
   */
  const handleModAdjacentECDSectList = async (newAdjacentECDSectList) => {
    const currECDSectorKey = ecdSector[ECDSECTOR_FIELDS.KEY];

    try {
      // Делаем запрос на сервер с целью редактирования информации о смежных участках ЭЦД
      const res = await request(ServerAPI.MOD_ADJACENTECDSECTORS_DATA, 'POST',
        { sectorId: currECDSectorKey, adjacentSectIds: newAdjacentECDSectList },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Формируем массив id участков ЭЦД, связь смежности с которыми была удалена для текущего участка ЭЦД
      const deletedAdjSectorsIds = ecdSector[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS]
        .filter((adjSectInfo) => !newAdjacentECDSectList.includes(adjSectInfo[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]))
        .map((adjSectInfo) => adjSectInfo[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]);

      // Меняем локальное состояние (вносим изменения в массив объектов участков ЭЦД)
      setTableDataCallback((value) => value.map((sector) => {
        // Для того участка, для которого пользователь непосредственно изменил список смежных участков, полностью
        // переписываем массив смежных участков
        if (sector[ECDSECTOR_FIELDS.KEY] === currECDSectorKey) {
          return {
            ...sector,
            [ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS]: newAdjacentECDSectList.map((id) => {
              return {
                [ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]: id,
              };
            }),
          };
        }
        // Для участка, который пользователь в результате редактирования списка смежных участков
        // объявил смежным к текущему участку ЭЦД, добавляем текущий участок ЭЦД в список смежных
        // (если его еще там нет)
        if (newAdjacentECDSectList.includes(sector[ECDSECTOR_FIELDS.KEY])) {
          const adjSectIds = sector[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS]
            .map((sector) => sector[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]);
          if (!adjSectIds.includes(currECDSectorKey)) {
            return {
              ...sector,
              [ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS]: [
                ...sector[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS],
                {
                  [ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]: currECDSectorKey,
                },
              ],
            };
          }
        } else if (deletedAdjSectorsIds.includes(sector[ECDSECTOR_FIELDS.KEY])) {
          // Если же участок ЭЦД в результате действий пользователя перестал быть смежным к текущему
          // участку ЭЦД, то из списка смежных к нему участков удаляем текущий участок ЭЦД
          return {
            ...sector,
            [ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS]:
              sector[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].filter((sector) =>
                sector[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID] !== currECDSectorKey),
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
        <Title level={4}>Смежные участки ЭЦД</Title>
        <SavableSelectMultiple
          placeholder="Выберите смежные участки ЭЦД"
          options={
            (!allECDSectors || !allECDSectors.length) ?
            [] :
            // Из общего списка исключаем текущий участок
            allECDSectors
              .filter((sector) => sector[ECDSECTOR_FIELDS.KEY] !== ecdSector[ECDSECTOR_FIELDS.KEY])
              .map((sector) => {
                return {
                  value: sector[ECDSECTOR_FIELDS.NAME],
                };
              })
          }
          selectedItems={
            !ecdSector[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS] ? [] :
              ecdSector[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].map((sector) =>
                getECDSectorNameById(sector[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID])
          )}
          saveChangesCallback={(selectedVals) => {
            const ecdSectIds = allECDSectors
              .filter((sector) => selectedVals.includes(sector[ECDSECTOR_FIELDS.NAME]))
              .map((sector) => sector[ECDSECTOR_FIELDS.KEY]);
            handleModAdjacentECDSectList(ecdSectIds);
          }}
        />
      </Col>
    </Row>
  );
};


export default AdjacentECDSectorsBlock;
