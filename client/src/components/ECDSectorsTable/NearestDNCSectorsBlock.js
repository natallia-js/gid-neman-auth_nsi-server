import React, { useContext, useState } from 'react';
import { List, Button, Tooltip, Checkbox } from 'antd';
import { ServerAPI, DNCSECTOR_FIELDS, NEAREST_SECTOR_FIELDS, ECDSECTOR_FIELDS } from '../../constants';
import { CaretLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';

import 'antd/dist/antd.css';
import './styles.scss';


/**
 * Компонент блока с информацией об участках ДНЦ, ближайших к данному участку ЭЦД.
 * Позволяет редактировать информацию о ближайших участках ДНЦ.
 */
const NearestDNCSectorsBlock = (props) => {
  const {
    dataSource, // источник данных об участках ДНЦ, ближайших к данному участку ЭЦД
    currECDSectorRecord: record, // текущая запись об участке ЭЦД
    possibleNearDNCSectors, // источник данных об участках ДНЦ, которые не являются ближайшими к текущему участку ЭЦД
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ЭЦД
    getDNCSectorNameByIdCallback, // функция, возвращающая наименование участка ДНЦ по его id
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Пары ключ-значение, где ключ - id участка, значение - массив id тех записей в списке
  // участков ДНЦ для связывания с текущим участком ЭЦД, которые выделены пользователем
  const [checkedPossibleNearestSectors, setCheckedPossibleNearestSectors] = useState(new Map());


  /**
   * Позволяет удалить связь между участками с идентификаторами ecdSectorID и dncSectorID.
   */
   const delNearestDNCSector = async (ecdSectorID, dncSectorID) => {
    try {
      // Делаем запрос на сервер с целью удаления информации о ближайшем участке ДНЦ
      const res = await request(ServerAPI.DEL_NEARESTDNCECDSECTORS_DATA, 'POST',
        { dncSectorID, ecdSectorID },
        { Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние для участка ЭЦД
      setTableDataCallback(value => {
        let updatedValue = [...value]; // сюда поместим то, что вернем

        const ecdSectorIndex = updatedValue.findIndex(sector => sector[ECDSECTOR_FIELDS.KEY] === ecdSectorID);

        updatedValue[ecdSectorIndex][ECDSECTOR_FIELDS.NEAREST_DNCSECTORS] =
          updatedValue[ecdSectorIndex][ECDSECTOR_FIELDS.NEAREST_DNCSECTORS].filter(el =>
            el[NEAREST_SECTOR_FIELDS.SECTOR_ID] !== dncSectorID);

        return updatedValue;
      });
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  /**
   * Для данного участка ЭЦД устанавливает в БД ближайший(-е) участок(-ки) ДНЦ.
   *
   * @param {number} ecdSectorId
   */
   const setNearestDNCSectors = async (ecdSectorId) => {
    // Смотрим, какие участки ДНЦ выделены пользователем для добавления в список ближайших участков
    // для участка ЭЦД с id = ecdSectorId
    const selectedNearestDNCSectors = checkedPossibleNearestSectors.get(ecdSectorId);
    if (!selectedNearestDNCSectors || !selectedNearestDNCSectors.length) {
      return; // ничего не выделено
    }

    try {
      // Делаем запрос на сервер с целью добавления информации о ближайших участках ДНЦ
      const res = await request(ServerAPI.ADD_NEARESTDNCFORECDSECTORS_DATA, 'POST',
        { ecdSectorId, dncSectorIds: selectedNearestDNCSectors },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // После успешного добавления информации на сервере удаляем временную информацию об участках ДНЦ,
      // выделенных пользователем для связывания с текущим участком ЭЦД
      checkedPossibleNearestSectors.delete(ecdSectorId);
      setCheckedPossibleNearestSectors(checkedPossibleNearestSectors)

      // Положительный ответ сервера содержит массив id тех участков ДНЦ (nearDNCSectorsArr),
      // которые сервер сохранил в БД как ближайшие для участка ЭЦД с id = ecdSectorId.
      // Для каждого полученного id создаем в tableData связи между участками ЭЦД и ДНЦ.
      setTableDataCallback(value => {
        let updatedValue = [...value]; // сюда поместим то, что вернем
        const ecdSectorIndex = updatedValue.findIndex(sector => sector[ECDSECTOR_FIELDS.KEY] === ecdSectorId);

        // Обновляем массив ближайших участков ДНЦ у участка ЭЦД с id = ecdSectorId
        res.nearDNCSectorsArr.forEach(nearDNCSectId => {
          updatedValue[ecdSectorIndex][ECDSECTOR_FIELDS.NEAREST_DNCSECTORS].push({
            [NEAREST_SECTOR_FIELDS.SECTOR_ID]: nearDNCSectId,
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
        В данном столбце формируем список участков ДНЦ, ближайших к текущему участку ЭЦД
      */}
      <div className="transfer-list-sub-block">
        <p className="transfer-list-title">Ближайшие участки ДНЦ</p>
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
                          delNearestDNCSector(record[ECDSECTOR_FIELDS.KEY], item[NEAREST_SECTOR_FIELDS.SECTOR_ID])
                        }
                      />
                    </Tooltip>
                  </div>
                  <div>
                    {getDNCSectorNameByIdCallback(item[NEAREST_SECTOR_FIELDS.SECTOR_ID])}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
      {/*
        В данном столбце помещаем кнопку для перемещения участка ДНЦ из списка потенциальных
        кандидатов на близость в список участков ДНЦ, ближайших по отношению к текущему участку ЭЦД
      */}
      <div className="transfer-list-transfer-block">
        <Tooltip title="Переместить в список ближайших участков">
          <Button
            type="primary"
            shape="circle"
            icon={<CaretLeftOutlined />}
            onClick={() => setNearestDNCSectors(record[ECDSECTOR_FIELDS.KEY])}
          />
        </Tooltip>
      </div>
      {/*
        В данном столбце формируем список участков ДНЦ - потенциальных кандидатов стать ближайшими
        по отношению к текущему участку ЭЦД
      */}
      <div className="transfer-list-sub-block">
        <p className="transfer-list-title">Выберите ближайшие участки ДНЦ</p>
        <div className="transfer-list-list-block">
          <List
            size="small"
            itemLayout="horizontal"
            dataSource={possibleNearDNCSectors}
            renderItem={item => (
              <List.Item>
                <div className="transfer-list-list-item">
                  <div className="transfer-list-del-btn">
                    <Checkbox
                      checked={
                        checkedPossibleNearestSectors.get(record[ECDSECTOR_FIELDS.KEY]) &&
                        checkedPossibleNearestSectors.get(record[ECDSECTOR_FIELDS.KEY]).includes(item[DNCSECTOR_FIELDS.KEY])
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          // по id участка ЭЦД извлекаю список id соответствующих выделенных записей
                          // в списке участков ДНЦ для связывания с текущим
                          let checkedArr = checkedPossibleNearestSectors.get(record[ECDSECTOR_FIELDS.KEY]);
                          if (!checkedArr) {
                            checkedArr = [];
                          }
                          // добавляю в данный список id выделяемой записи
                          checkedArr.push(item[DNCSECTOR_FIELDS.KEY]);
                          // и сохраняю
                          setCheckedPossibleNearestSectors(map =>
                            new Map([...map, [record[ECDSECTOR_FIELDS.KEY], checkedArr]])
                          );
                        } else {
                          // по id участка ЭЦД извлекаю список id соответствующих выделенных записей
                          // в списке участков ДНЦ для связывания с текущим
                          let checkedArr = checkedPossibleNearestSectors.get(record[ECDSECTOR_FIELDS.KEY]);
                          if (checkedArr) {
                            // удаляю из данного списка id записи, с которой снимается выделение, и сохраняю
                            setCheckedPossibleNearestSectors((map) =>
                              new Map(map).set(record[ECDSECTOR_FIELDS.KEY],
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

 export default NearestDNCSectorsBlock;
