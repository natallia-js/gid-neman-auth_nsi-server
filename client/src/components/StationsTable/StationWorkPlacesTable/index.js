import React, { useState, useContext } from 'react';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';
import { Table, Form, Button } from 'antd';
import EditableTableCell from '../../EditableTableCell';
import NewStationWorkPlaceModal from '../../NewStationWorkPlaceModal';
import { ServerAPI, STATION_WORK_PLACE_FIELDS, STATION_FIELDS } from '../../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import stationWorkPlacesTableColumns from './StationWorkPlacesTableColumns';
import getAppStationWorkPlaceObjFromDBStationWorkPlaceObj from '../../../mappers/getAppStationWorkPlaceObjFromDBStationWorkPlaceObj';


/**
 * Компонент таблицы с информацией о рабочих местах на станции.
 */
const StationWorkPlacesTable = ({ stationId, stationWorkPlaces, setTableDataCallback }) => {
  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы рабочих мест на станции
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[STATION_WORK_PLACE_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewStationWorkPlaceModalVisible, setIsAddNewStationWorkPlaceModalVisible] = useState(false);

  // Ошибки добавления информации о новом рабочем месте на станции
  const [stationWorkPlaceFieldsErrs, setStationWorkPlaceFieldsErrs] = useState(null);

  // Ошибки редактирования информации о рабочих местах на станции
  const [modStationWorkPlaceFieldsErrs, setModStationWorkPlaceFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Чистит все сообщения добавления информации о рабочем месте (ошибки и успех).
   */
  const clearAddStationWorkPlaceMessages = () => {
    setStationWorkPlaceFieldsErrs(null);
  };


  /**
   * Добавляет информацию о рабочем месте в БД.
   *
   * @param {object} workPlace
   */
  const handleAddNewStationWorkPlace = async (workPlace) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о рабочем месте
      const res = await request(ServerAPI.ADD_STATION_WORK_PLACE_DATA, 'POST', { stationId, ...workPlace }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((station) => {
          if (String(station[STATION_FIELDS.KEY]) === String(stationId)) {
            const newStationWorkPlaces = station[STATION_FIELDS.WORK_PLACES] ? station[STATION_FIELDS.WORK_PLACES].slice() : [];
            newStationWorkPlaces.push(getAppStationWorkPlaceObjFromDBStationWorkPlaceObj(res.stationWorkPlace));
            station[STATION_FIELDS.WORK_PLACES] = newStationWorkPlaces;
          }
          return station;
        })
      );

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setStationWorkPlaceFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о рабочем месте на станции из БД.
   *
   * @param {number} stationWorkPlaceId
   */
  const handleDelStationWorkPlace = async (stationWorkPlaceId) => {
    setRecsBeingProcessed((value) => [...value, stationWorkPlaceId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о рабочем месте на станции
      const res = await request(ServerAPI.DEL_STATION_WORK_PLACE_DATA, 'POST', { id: stationWorkPlaceId }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((station) => {
          if (String(station[STATION_FIELDS.KEY]) === String(stationId)) {
            station[STATION_FIELDS.WORK_PLACES] =
              station[STATION_FIELDS.WORK_PLACES].filter((place) => String(place[STATION_WORK_PLACE_FIELDS.KEY]) !== String(stationWorkPlaceId))
          }
          return station;
        })
      );

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== stationWorkPlaceId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditStationWorkPlace = (record) => {
    form.setFieldsValue({
      [STATION_WORK_PLACE_FIELDS.NAME]: '',
      ...record,
    });
    setEditingKey(record[STATION_WORK_PLACE_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModStationWorkPlaceFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о рабочем месте на станции в БД.
   *
   * @param {number} stationWorkPlaceId
   */
  const handleEditStationWorkPlace = async (stationWorkPlaceId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, stationWorkPlaceId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о рабочем месте на станции
      const res = await request(ServerAPI.MOD_STATION_WORK_PLACE_DATA, 'POST', { id: stationWorkPlaceId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((station) => {
          if (String(station[STATION_FIELDS.KEY]) === String(stationId)) {
            station[STATION_FIELDS.WORK_PLACES] = station[STATION_FIELDS.WORK_PLACES].map((place) => {
              if (String(place[STATION_WORK_PLACE_FIELDS.KEY]) === String(stationWorkPlaceId)) {
                return { ...place, ...getAppStationWorkPlaceObjFromDBStationWorkPlaceObj(res.stationWorkPlace) };
              }
              return place;
            });
          }
          return station;
        })
      );

      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModStationWorkPlaceFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== stationWorkPlaceId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом рабочем месте на станции

  const showAddNewStationWorkPlaceModal = () => {
    setIsAddNewStationWorkPlaceModalVisible(true);
  };

  const handleAddNewStationWorkPlaceOk = (station) => {
    handleAddNewStationWorkPlace(station);
  };

  const handleAddNewStationWorkPlaceCancel = () => {
    setIsAddNewStationWorkPlaceModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы рабочих мест на станции
  const columns = stationWorkPlacesTableColumns({
    isEditing,
    editingKey,
    handleEditStationWorkPlace,
    handleCancelMod,
    handleStartEditStationWorkPlace,
    handleDelStationWorkPlace,
    recsBeingProcessed,
  });

  /**
   * Правила отображения редактируемых и нередактируемых столбцов таблицы.
   */
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: true,
        errMessage: modStationWorkPlaceFieldsErrs ? modStationWorkPlaceFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <Form form={form} component={false}>
      <NewStationWorkPlaceModal
        isModalVisible={isAddNewStationWorkPlaceModalVisible}
        handleAddNewStationWorkPlaceOk={handleAddNewStationWorkPlaceOk}
        handleAddNewStationWorkPlaceCancel={handleAddNewStationWorkPlaceCancel}
        stationWorkPlaceFieldsErrs={stationWorkPlaceFieldsErrs}
        clearAddStationWorkPlaceMessages={clearAddStationWorkPlaceMessages}
        recsBeingAdded={recsBeingAdded}
      />
      <Button
        type="primary"
        style={{
          marginBottom: 16,
        }}
        onClick={showAddNewStationWorkPlaceModal}
      >
        Добавить запись
      </Button>

      <Table
        components={{
          body: {
            cell: EditableTableCell
          },
        }}
        bordered
        dataSource={stationWorkPlaces}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: handleCancelMod,
        }}
        sticky={true}
        onRow={(record) => {
          return {
            onDoubleClick: () => { handleStartEditStationWorkPlace(record) },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEditStationWorkPlace(record[STATION_WORK_PLACE_FIELDS.KEY]);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default StationWorkPlacesTable;
