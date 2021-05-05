import React, { useContext } from 'react';
import { Typography, Row, Col } from 'antd';
import { ServerAPI, DNCSECTOR_FIELDS, ADJACENT_DNCSECTOR_FIELDS } from '../../constants';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import SavableSelectMultiple from '../SavableSelectMultiple';

const { Title } = Typography;


/**
 * Компонент блока с информацией об участках ДНЦ, смежных с данным участком ДНЦ.
 * Позволяет редактировать информацию о смежных участках ДНЦ.
 */
const AdjacentDNCSectorsBlock = (props) => {
  const {
    dncSector, // объект текущего участка ДНЦ
    allDNCSectors, // массив объектов всех участков ДНЦ
    setTableDataCallback, // функция, позволяющая внести изменения в массив объектов участков ДНЦ (изменить состояние)
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

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
   * Отправляет на сервер запрос по изменению списка смежных участков текущего участка ДНЦ.
   */
  const handleModAdjacentDNCSectList = async (newAdjacentDNCSectList) => {
    const currDNCSectorKey = dncSector[DNCSECTOR_FIELDS.KEY];

    try {
      // Делаем запрос на сервер с целью редактирования информации о смежных участках ДНЦ
      const res = await request(ServerAPI.MOD_ADJACENTDNCSECTORS_DATA, 'POST',
        { sectorId: currDNCSectorKey, adjacentSectIds: newAdjacentDNCSectList },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Формируем массив id участков ДНЦ, связь смежности с которыми была удалена для текущего участка ДНЦ
      const deletedAdjSectorsIds = dncSector[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS]
        .filter((adjSectInfo) => !newAdjacentDNCSectList.includes(adjSectInfo[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]))
        .map((adjSectInfo) => adjSectInfo[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]);

      // Меняем локальное состояние (вносим изменения в массив объектов участков ДНЦ)
      setTableDataCallback((value) => value.map((sector) => {
        // Для того участка, для которого пользователь непосредственно изменил список смежных участков, полностью
        // переписываем массив смежных участков
        if (sector[DNCSECTOR_FIELDS.KEY] === currDNCSectorKey) {
          return {
            ...sector,
            [DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS]: newAdjacentDNCSectList.map((id) => {
              return {
                [ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]: id,
              };
            }),
          };
        }
        // Для участка, который пользователь в результате редактирования списка смежных участков
        // объявил смежным к текущему участку ДНЦ, добавляем текущий участок ДНЦ в список смежных
        // (если его еще там нет)
        if (newAdjacentDNCSectList.includes(sector[DNCSECTOR_FIELDS.KEY])) {
          const adjSectIds = sector[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS]
            .map((sector) => sector[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]);
          if (!adjSectIds.includes(currDNCSectorKey)) {
            return {
              ...sector,
              [DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS]: [
                ...sector[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS],
                {
                  [ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]: currDNCSectorKey,
                },
              ],
            };
          }
        } else if (deletedAdjSectorsIds.includes(sector[DNCSECTOR_FIELDS.KEY])) {
          // Если же участок ДНЦ в результате действий пользователя перестал быть смежным к текущему
          // участку ДНЦ, то из списка смежных к нему участков удаляем текущий участок ДНЦ
          return {
            ...sector,
            [DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS]:
              sector[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].filter((sector) =>
                sector[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID] !== currDNCSectorKey),
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
        <Title level={4}>Смежные участки ДНЦ</Title>
        <SavableSelectMultiple
          placeholder="Выберите смежные участки ДНЦ"
          options={
            (!allDNCSectors || !allDNCSectors.length) ?
            [] :
            // Из общего списка исключаем текущий участок
            allDNCSectors
              .filter((sector) => sector[DNCSECTOR_FIELDS.KEY] !== dncSector[DNCSECTOR_FIELDS.KEY])
              .map((sector) => {
                return {
                  value: sector[DNCSECTOR_FIELDS.NAME],
                };
              })
          }
          selectedItems={
            !dncSector[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS] ? [] :
              dncSector[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].map((sector) =>
                getDNCSectorNameById(sector[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID])
          )}
          saveChangesCallback={(selectedVals) => {
            const dncSectIds = allDNCSectors
              .filter((sector) => selectedVals.includes(sector[DNCSECTOR_FIELDS.NAME]))
              .map((sector) => sector[DNCSECTOR_FIELDS.KEY]);
            handleModAdjacentDNCSectList(dncSectIds);
          }}
        />
      </Col>
    </Row>
  );
};


export default AdjacentDNCSectorsBlock;
