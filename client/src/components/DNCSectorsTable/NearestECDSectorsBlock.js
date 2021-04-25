import React, { useContext, useState } from 'react';
import { List, Button, Tooltip, Checkbox } from 'antd';
import { ServerAPI, DNCSECTOR_FIELDS, NEAREST_SECTOR_FIELDS, ECDSECTOR_FIELDS } from '../../constants';
import { CaretLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';

import './styles.scss';


/**
 * Компонент блока с информацией об участках ЭЦД, ближайших к данному участку ДНЦ.
 * Позволяет редактировать информацию о ближайших участках ЭЦД.
 */
const NearestECDSectorsBlock = (props) => {
  const {
    dataSource, // источник данных об участках ЭЦД, ближайших к данному участку ДНЦ
    currDNCSectorRecord: record, // текущая запись об участке ДНЦ
    possibleNearECDSectors, // источник данных об участках ЭЦД, которые не являются ближайшими к текущему участку ДНЦ
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ДНЦ
    getECDSectorNameByIdCallback, // функция, возвращающая наименование участка ЭЦД по его id
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Пары ключ-значение, где ключ - id участка, значение - массив id тех записей в списке
  // участков ЭЦД для связывания с текущим участком ДНЦ, которые выделены пользователем
  const [checkedPossibleNearestSectors, setCheckedPossibleNearestSectors] = useState(new Map());


  /**
   * Позволяет удалить связь между участками с идентификаторами dncSectorID и ecdSectorID.
   */
   const delNearestECDSector = async (dncSectorID, ecdSectorID) => {
    try {
      // Делаем запрос на сервер с целью удаления информации о ближайшем участке ЭЦД
      const res = await request(ServerAPI.DEL_NEARESTDNCECDSECTORS_DATA, 'POST',
        { dncSectorID, ecdSectorID },
        { Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние для участка ДНЦ
      setTableDataCallback(value => {
        let updatedValue = [...value]; // сюда поместим то, что вернем

        const dncSectorIndex = updatedValue.findIndex(sector => sector[DNCSECTOR_FIELDS.KEY] === dncSectorID);

        updatedValue[dncSectorIndex][DNCSECTOR_FIELDS.NEAREST_ECDSECTORS] =
          updatedValue[dncSectorIndex][DNCSECTOR_FIELDS.NEAREST_ECDSECTORS].filter(el =>
            el[NEAREST_SECTOR_FIELDS.SECTOR_ID] !== ecdSectorID);

        return updatedValue;
      });
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  /**
   * Для данного участка ДНЦ устанавливает в БД ближайший(-е) участок(-ки) ЭЦД.
   *
   * @param {number} dncSectorId
   */
   const setNearestECDSectors = async (dncSectorId) => {
    // Смотрим, какие участки ЭЦД выделены пользователем для добавления в список ближайших участков
    // для участка ДНЦ с id = dncSectorId
    const selectedNearestECDSectors = checkedPossibleNearestSectors.get(dncSectorId);
    if (!selectedNearestECDSectors || !selectedNearestECDSectors.length) {
      return; // ничего не выделено
    }

    try {
      // Делаем запрос на сервер с целью добавления информации о ближайших участках ЭЦД
      const res = await request(ServerAPI.ADD_NEARESTECDFORDNCSECTORS_DATA, 'POST',
        { dncSectorId, ecdSectorIds: selectedNearestECDSectors },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // После успешного добавления информации на сервере удаляем временную информацию об участках ЭЦД,
      // выделенных пользователем для связывания с текущим участком ДНЦ
      checkedPossibleNearestSectors.delete(dncSectorId);
      setCheckedPossibleNearestSectors(checkedPossibleNearestSectors)

      // Положительный ответ сервера содержит массив id тех участков ЭЦД (nearECDSectorsArr),
      // которые сервер сохранил в БД как ближайшие для участка ДНЦ с id = dncSectorId.
      // Для каждого полученного id создаем в tableData связи между участками ДНЦ и ЭЦД.
      setTableDataCallback(value => {
        let updatedValue = [...value]; // сюда поместим то, что вернем
        const dncSectorIndex = updatedValue.findIndex(sector => sector[DNCSECTOR_FIELDS.KEY] === dncSectorId);

        // Обновляем массив ближайших участков ЭЦД у участка ДНЦ с id = dncSectorId
        res.nearECDSectorsArr.forEach(nearECDSectId => {
          updatedValue[dncSectorIndex][DNCSECTOR_FIELDS.NEAREST_ECDSECTORS].push({
            [NEAREST_SECTOR_FIELDS.SECTOR_ID]: nearECDSectId,
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
        В данном столбце формируем список участков ЭЦД, ближайших к текущему участку ДНЦ
      */}
      <div className="transfer-list-sub-block">
        <p className="transfer-list-title">Ближайшие участки ЭЦД</p>
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
                          delNearestECDSector(record[DNCSECTOR_FIELDS.KEY], item[NEAREST_SECTOR_FIELDS.SECTOR_ID])
                        }
                      />
                    </Tooltip>
                  </div>
                  <div>
                    {getECDSectorNameByIdCallback(item[NEAREST_SECTOR_FIELDS.SECTOR_ID])}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
      {/*
        В данном столбце помещаем кнопку для перемещения участка ЭЦД из списка потенциальных
        кандидатов на близость в список участков ЭЦД, ближайших по отношению к текущему участку ДНЦ
      */}
      <div className="transfer-list-transfer-block">
        <Tooltip title="Переместить в список ближайших участков">
          <Button
            type="primary"
            shape="circle"
            icon={<CaretLeftOutlined />}
            onClick={() => setNearestECDSectors(record[DNCSECTOR_FIELDS.KEY])}
          />
        </Tooltip>
      </div>
      {/*
        В данном столбце формируем список участков ЭЦД - потенциальных кандидатов стать ближайшими
        по отношению к текущему участку ДНЦ
      */}
      <div className="transfer-list-sub-block">
        <p className="transfer-list-title">Выберите ближайшие участки ЭЦД</p>
        <div className="transfer-list-list-block">
          <List
            size="small"
            itemLayout="horizontal"
            dataSource={possibleNearECDSectors}
            renderItem={item => (
              <List.Item>
                <div className="transfer-list-list-item">
                  <div className="transfer-list-del-btn">
                    <Checkbox
                      checked={
                        checkedPossibleNearestSectors.get(record[DNCSECTOR_FIELDS.KEY]) &&
                        checkedPossibleNearestSectors.get(record[DNCSECTOR_FIELDS.KEY]).includes(item[ECDSECTOR_FIELDS.KEY])
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          // по id участка ДНЦ извлекаю список id соответствующих выделенных записей
                          // в списке участков ЭЦД для связывания с текущим
                          let checkedArr = checkedPossibleNearestSectors.get(record[DNCSECTOR_FIELDS.KEY]);
                          if (!checkedArr) {
                            checkedArr = [];
                          }
                          // добавляю в данный список id выделяемой записи
                          checkedArr.push(item[ECDSECTOR_FIELDS.KEY]);
                          // и сохраняю
                          setCheckedPossibleNearestSectors(map =>
                            new Map([...map, [record[DNCSECTOR_FIELDS.KEY], checkedArr]])
                          );
                        } else {
                          // по id участка ДНЦ извлекаю список id соответствующих выделенных записей
                          // в списке участков ЭЦД для связывания с текущим
                          let checkedArr = checkedPossibleNearestSectors.get(record[DNCSECTOR_FIELDS.KEY]);
                          if (checkedArr) {
                            // удаляю из данного списка id записи, с которой снимается выделение, и сохраняю
                            setCheckedPossibleNearestSectors((map) =>
                              new Map(map).set(record[DNCSECTOR_FIELDS.KEY],
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

 export default NearestECDSectorsBlock;
