import React, { useContext, useState } from 'react';
import { List, Button, Tooltip, Checkbox } from 'antd';
import { ServerAPI, ECDSECTOR_FIELDS, ADJACENT_ECDSECTOR_FIELDS } from '../../constants';
import { CaretLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';

import './styles.scss';


/**
 * Компонент блока с информацией об участках ЭЦД, смежных с данным участком ЭЦД.
 * Позволяет редактировать информацию о смежных участках ЭЦД.
 */
const AdjacentECDSectorsBlock = (props) => {
  const {
    currECDSectorRecord: record, // текущая запись об участке ЭЦД
    possibleAdjECDSectors, // источник данных об участках ЭЦД, которые не являются смежными с текущим участком
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ЭЦД
    getECDSectorNameByIdCallback, // функция, возвращающая наименование участка ЭЦД по его id
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Пары ключ-значение, где ключ - id участка, значение - массив id тех записей в списке
  // участков ЭЦД для связывания с текущим, которые выделены пользователем
  const [checkedPossibleAdjacentSectors, setCheckedPossibleAdjacentSectors] = useState(new Map());


  /**
   * Позволяет удалить связь смежности между участками с идентификаторами sectorId и adjSectorId.
   */
   const delAdjacentECDSector = async (sectorId, adjSectorId) => {
    try {
      // Делаем запрос на сервер с целью удаления информации о смежных участках ЭЦД
      const res = await request(ServerAPI.DEL_ADJACENTECDSECTORS_DATA, 'POST',
        { sectorID1: sectorId, sectorID2: adjSectorId },
        { Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние (необходимо обновить смежность для двух участков ЭЦД)
      setTableDataCallback(value => {
        let updatedValue = [...value]; // сюда поместим то, что вернем

        const sector1Index = updatedValue.findIndex(sector => sector[ECDSECTOR_FIELDS.KEY] === sectorId);
        const sector2Index = updatedValue.findIndex(sector => sector[ECDSECTOR_FIELDS.KEY] === adjSectorId);

        updatedValue[sector1Index][ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS] =
          updatedValue[sector1Index][ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].filter(el =>
            el[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID] !== adjSectorId);

        updatedValue[sector2Index][ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS] =
          updatedValue[sector2Index][ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].filter(el =>
            el[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID] !== sectorId);

        return updatedValue;
      });
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  /**
   * Для данного участка ЭЦД устанавливает в БД смежный(-е) участок(-ки).
   *
   * @param {number} sectorId
   */
   const setAdjacentECDSectors = async (sectorId) => {
    // Смотрим, какие участки выделены пользователем для добавления в список смежных участков
    // для участка с id = sectorId
    const selectedAdjacentSectors = checkedPossibleAdjacentSectors.get(sectorId);
    if (!selectedAdjacentSectors || !selectedAdjacentSectors.length) {
      return; // ничего не выделено
    }

    try {
      // Делаем запрос на сервер с целью добавления информации о смежных участках ЭЦД
      const res = await request(ServerAPI.ADD_ADJACENTECDSECTORS_DATA, 'POST',
        { sectorID: sectorId, adjSectorIDs: selectedAdjacentSectors },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // После успешного добавления информации на сервере удаляем временную информацию об участках ЭЦД,
      // выделенных пользователем для связывания с текущим участком
      checkedPossibleAdjacentSectors.delete(sectorId);
      setCheckedPossibleAdjacentSectors(checkedPossibleAdjacentSectors)

      // Положительный ответ сервера содержит массив id тех участков ЭЦД (finalAdjSectIds),
      // которые сервер сохранил в БД как смежные для участка с id = sectorId.
      // Для каждого полученного id создаем в tableData связи между участками с id и sectorId
      setTableDataCallback(value => {
        let updatedValue = [...value]; // сюда поместим то, что вернем
        const sector1Index = updatedValue.findIndex(sector => sector[ECDSECTOR_FIELDS.KEY] === sectorId);

        res.finalAdjSectIds.forEach(adjSectId => {
          const sector2Index = updatedValue.findIndex(sector => sector[ECDSECTOR_FIELDS.KEY] === adjSectId);

          // Обновляем массив смежных участков у участка с id = sectorId
          updatedValue[sector1Index][ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].push({
            [ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]: adjSectId,
          });

          // Обновляем массив смежных участков у участка с id = adjSectId
          updatedValue[sector2Index][ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].push({
            [ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]: sectorId,
          });
        });

        return updatedValue;
      });

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  return (
    <div className="transfer-list-block">
      {/*
        В данном столбце формируем список участков ЭЦД, смежных с текущим
      */}
      <div className="transfer-list-sub-block">
        <p className="transfer-list-title">Смежные участки ЭЦД</p>
        <div className="transfer-list-list-block">
          <List
            size="small"
            itemLayout="horizontal"
            dataSource={record[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS]}
            renderItem={item => (
              <List.Item>
                <div className="transfer-list-list-item">
                  <div className="transfer-list-del-btn">
                    <Tooltip title="Удалить">
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          delAdjacentECDSector(record[ECDSECTOR_FIELDS.KEY], item[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID])
                        }
                      />
                    </Tooltip>
                  </div>
                  <div>
                    {getECDSectorNameByIdCallback(item[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID])}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
      {/*
        В данном столбце помещаем кнопку для перемещения участка ЭЦД из списка потенциальных
        кандидатов на смежность в список участков ЭЦД, смежных по отношению к текущему
      */}
      <div className="transfer-list-transfer-block">
        <Tooltip title="Переместить в список смежных участков">
          <Button
            type="primary"
            shape="circle"
            icon={<CaretLeftOutlined />}
            onClick={() => setAdjacentECDSectors(record[ECDSECTOR_FIELDS.KEY])}
          />
        </Tooltip>
      </div>
      {/*
        В данном столбце формируем список участков ЭЦД - потенциальных кандидатов стать смежными
        по отношению к текущему
      */}
      <div className="transfer-list-sub-block">
        <p className="transfer-list-title">Выберите смежные участки ЭЦД</p>
        <div className="transfer-list-list-block">
          <List
            size="small"
            itemLayout="horizontal"
            dataSource={possibleAdjECDSectors}
            renderItem={item => (
              <List.Item>
                <div className="transfer-list-list-item">
                  <div className="transfer-list-del-btn">
                    <Checkbox
                      checked={
                        checkedPossibleAdjacentSectors.get(record[ECDSECTOR_FIELDS.KEY]) &&
                        checkedPossibleAdjacentSectors.get(record[ECDSECTOR_FIELDS.KEY]).includes(item[ECDSECTOR_FIELDS.KEY])
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          // по id участка ЭЦД извлекаю список id соответствующих выделенных записей
                          // в списке участков ЭЦД для связывания с текущим
                          let checkedArr = checkedPossibleAdjacentSectors.get(record[ECDSECTOR_FIELDS.KEY]);
                          if (!checkedArr) {
                            checkedArr = [];
                          }
                          // добавляю в данный список id выделяемой записи
                          checkedArr.push(item[ECDSECTOR_FIELDS.KEY]);
                          // и сохраняю
                          setCheckedPossibleAdjacentSectors(map =>
                            new Map([...map, [record[ECDSECTOR_FIELDS.KEY], checkedArr]])
                          );
                        } else {
                          // по id участка ЭЦД извлекаю список id соответствующих выделенных записей
                          // в списке участков ЭЦД для связывания с текущим
                          let checkedArr = checkedPossibleAdjacentSectors.get(record[ECDSECTOR_FIELDS.KEY]);
                          if (checkedArr) {
                            // удаляю из данного списка id записи, с которой снимается выделение, и сохраняю
                            setCheckedPossibleAdjacentSectors((map) =>
                              new Map(map).set(record[ECDSECTOR_FIELDS.KEY],
                                checkedArr.filter(el => el !== item[ECDSECTOR_FIELDS.KEY]))
                            );
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    {item[ECDSECTOR_FIELDS.NAME]}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
};

 export default AdjacentECDSectorsBlock;
