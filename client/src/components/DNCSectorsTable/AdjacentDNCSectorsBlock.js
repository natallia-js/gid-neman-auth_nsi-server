import React, { useContext, useState } from 'react';
import { List, Button, Tooltip, Checkbox } from 'antd';
import { ServerAPI, DNCSECTOR_FIELDS, ADJACENT_DNCSECTOR_FIELDS } from '../../constants';
import { CaretLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';

import 'antd/dist/antd.css';
import './styles.scss';


/**
 * Компонент блока с информацией об участках ДНЦ, смежных с данным участком ДНЦ.
 * Позволяет редактировать информацию о смежных участках ДНЦ.
 */
const AdjacentDNCSectorsBlock = (props) => {
  const {
    dataSource, // источник данных об участках ДНЦ, смежных с данным участком ДНЦ
    currDNCSectorRecord: record, // текущая запись об участке ДНЦ
    possibleAdjDNCSectors, // источник данных об участках ДНЦ, которые не являются смежными с текущим участком
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ДНЦ
    getDNCSectorNameByIdCallback, // функция, возвращающая наименование участка ДНЦ по его id
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Пары ключ-значение, где ключ - id участка, значение - массив id тех записей в списке
  // участков ДНЦ для связывания с текущим, которые выделены пользователем
  const [checkedPossibleAdjacentSectors, setCheckedPossibleAdjacentSectors] = useState(new Map());


  /**
   * Позволяет удалить связь смежности между участками с идентификаторами sectorId и adjSectorId.
   */
   const delAdjacentDNCSector = async (sectorId, adjSectorId) => {
    try {
      // Делаем запрос на сервер с целью удаления информации о смежных участках ДНЦ
      const res = await request(ServerAPI.DEL_ADJACENTDNCSECTORS_DATA, 'POST',
        { sectorID1: sectorId, sectorID2: adjSectorId },
        { Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние (необходимо обновить смежность для двух участков ДНЦ)
      setTableDataCallback(value => {
        let updatedValue = [...value]; // сюда поместим то, что вернем

        const sector1Index = updatedValue.findIndex(sector => sector[DNCSECTOR_FIELDS.KEY] === sectorId);
        const sector2Index = updatedValue.findIndex(sector => sector[DNCSECTOR_FIELDS.KEY] === adjSectorId);

        updatedValue[sector1Index][DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS] =
          updatedValue[sector1Index][DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].filter(el =>
            el[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID] !== adjSectorId);

        updatedValue[sector2Index][DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS] =
          updatedValue[sector2Index][DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].filter(el =>
            el[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID] !== sectorId);

        return updatedValue;
      });
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  /**
   * Для данного участка ДНЦ устанавливает в БД смежный(-е) участок(-ки).
   *
   * @param {number} sectorId
   */
   const setAdjacentDNCSectors = async (sectorId) => {
    // Смотрим, какие участки выделены пользователем для добавления в список смежных участков
    // для участка с id = sectorId
    const selectedAdjacentSectors = checkedPossibleAdjacentSectors.get(sectorId);
    if (!selectedAdjacentSectors || !selectedAdjacentSectors.length) {
      return; // ничего не выделено
    }

    try {
      // Делаем запрос на сервер с целью добавления информации о смежных участках ДНЦ
      const res = await request(ServerAPI.ADD_ADJACENTDNCSECTORS_DATA, 'POST',
        { sectorID: sectorId, adjSectorIDs: selectedAdjacentSectors },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // После успешного добавления информации на сервере удаляем временную информацию об участках ДНЦ,
      // выделенных пользователем для связывания с текущим участком
      checkedPossibleAdjacentSectors.delete(sectorId);
      setCheckedPossibleAdjacentSectors(checkedPossibleAdjacentSectors)

      // Положительный ответ сервера содержит массив id тех участков ДНЦ (finalAdjSectIds),
      // которые сервер сохранил в БД как смежные для участка с id = sectorId.
      // Для каждого полученного id создаем в tableData связи между участками с id и sectorId
      setTableDataCallback(value => {
        let updatedValue = [...value]; // сюда поместим то, что вернем
        const sector1Index = updatedValue.findIndex(sector => sector[DNCSECTOR_FIELDS.KEY] === sectorId);

        res.finalAdjSectIds.forEach(adjSectId => {
          const sector2Index = updatedValue.findIndex(sector => sector[DNCSECTOR_FIELDS.KEY] === adjSectId);

          // Обновляем массив смежных участков у участка с id = sectorId
          updatedValue[sector1Index][DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].push({
            [ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]: adjSectId,
          });

          // Обновляем массив смежных участков у участка с id = adjSectId
          updatedValue[sector2Index][DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].push({
            [ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]: sectorId,
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
        В данном столбце формируем список участков ДНЦ, смежных с текущим
      */}
      <div className="transfer-list-sub-block">
        <p className="transfer-list-title">Смежные участки ДНЦ</p>
        <div className="transfer-list-list-block">
          <List
            size="small"
            itemLayout="horizontal"
            dataSource={dataSource}
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
                          delAdjacentDNCSector(record[DNCSECTOR_FIELDS.KEY], item[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID])
                        }
                      />
                    </Tooltip>
                  </div>
                  <div>
                    {getDNCSectorNameByIdCallback(item[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID])}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
      {/*
        В данном столбце помещаем кнопку для перемещения участка ДНЦ из списка потенциальных
        кандидатов на смежность в список участков ДНЦ, смежных по отношению к текущему
      */}
      <div className="transfer-list-transfer-block">
        <Tooltip title="Переместить в список смежных участков">
          <Button
            type="primary"
            shape="circle"
            icon={<CaretLeftOutlined />}
            onClick={() => setAdjacentDNCSectors(record[DNCSECTOR_FIELDS.KEY])}
          />
        </Tooltip>
      </div>
      {/*
        В данном столбце формируем список участков ДНЦ - потенциальных кандидатов стать смежными
        по отношению к текущему
      */}
      <div className="transfer-list-sub-block">
        <p className="transfer-list-title">Выберите смежные участки ДНЦ</p>
        <div className="transfer-list-list-block">
          <List
            size="small"
            itemLayout="horizontal"
            dataSource={possibleAdjDNCSectors}
            renderItem={item => (
              <List.Item>
                <div className="transfer-list-list-item">
                  <div className="transfer-list-del-btn">
                    <Checkbox
                      checked={
                        checkedPossibleAdjacentSectors.get(record[DNCSECTOR_FIELDS.KEY]) &&
                        checkedPossibleAdjacentSectors.get(record[DNCSECTOR_FIELDS.KEY]).includes(item[DNCSECTOR_FIELDS.KEY])
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          // по id участка ДНЦ извлекаю список id соответствующих выделенных записей
                          // в списке участков ДНЦ для связывания с текущим
                          let checkedArr = checkedPossibleAdjacentSectors.get(record[DNCSECTOR_FIELDS.KEY]);
                          if (!checkedArr) {
                            checkedArr = [];
                          }
                          // добавляю в данный список id выделяемой записи
                          checkedArr.push(item[DNCSECTOR_FIELDS.KEY]);
                          // и сохраняю
                          setCheckedPossibleAdjacentSectors(map =>
                            new Map([...map, [record[DNCSECTOR_FIELDS.KEY], checkedArr]])
                          );
                        } else {
                          // по id участка ДНЦ извлекаю список id соответствующих выделенных записей
                          // в списке участков ДНЦ для связывания с текущим
                          let checkedArr = checkedPossibleAdjacentSectors.get(record[DNCSECTOR_FIELDS.KEY]);
                          if (checkedArr) {
                            // удаляю из данного списка id записи, с которой снимается выделение, и сохраняю
                            setCheckedPossibleAdjacentSectors((map) =>
                              new Map(map).set(record[DNCSECTOR_FIELDS.KEY],
                                checkedArr.filter(el => el !== item[DNCSECTOR_FIELDS.KEY]))
                            );
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    {item[DNCSECTOR_FIELDS.NAME]}
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

 export default AdjacentDNCSectorsBlock;
