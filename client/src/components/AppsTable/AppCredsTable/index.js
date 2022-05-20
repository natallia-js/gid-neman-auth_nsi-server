import React, { useState, useContext } from 'react';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';
import { Table, Form, Button } from 'antd';
import EditableTableCell from '../../EditableTableCell';
import NewAppCredModal from '../../NewAppCredModal';
import { ServerAPI, APP_CRED_FIELDS, APP_FIELDS } from '../../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import appCredsTableColumns from './AppCredsTableColumns';
import getAppApplicationCredObjFromDBApplicationCredObj from '../../../mappers/getAppApplicationCredObjFromDBApplicationCredObj';


/**
 * Компонент таблицы с информацией о полномочиях пользователей в приложении.
 */
const AppCredsTable = ({ appId, appCredentials, setTableDataCallback }) => {
  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы полномочий
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[APP_CRED_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewAppCredModalVisible, setIsAddNewAppCredModalVisible] = useState(false);

  // Ошибки добавления информации о новом полномочии
  const [appCredFieldsErrs, setAppCredFieldsErrs] = useState(null);

  // Ошибки редактирования информации о полномочиях приложения
  const [modAppCredFieldsErrs, setModAppCredFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Чистит все сообщения добавления информации о полномочии (ошибки и успех).
   */
  const clearAddAppCredMessages = () => {
    setAppCredFieldsErrs(null);
  }


  /**
   * Добавляет информацию о полномочии в БД.
   *
   * @param {object} cred
   */
  const handleAddNewAppCred = async (cred) => {
    setRecsBeingAdded((value) => value + 1);
    try {
      // Делаем запрос на сервер с целью добавления информации о полномочии
      const res = await request(ServerAPI.ADD_APP_CRED_DATA, 'POST', { appId, ...cred });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableDataCallback((value) =>
        value.map((app) => {
          if (String(app[APP_FIELDS.KEY]) === String(appId)) {
            const newAppCreds = app[APP_FIELDS.CREDENTIALS].slice();
            newAppCreds.push(getAppApplicationCredObjFromDBApplicationCredObj(res.cred));
            app[APP_FIELDS.CREDENTIALS] = newAppCreds;
          }
          return app;
        })
      );
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setAppCredFieldsErrs(errs);
      }
    }
    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о полномочии из БД.
   *
   * @param {number} credId
   */
  const handleDelAppCred = async (credId) => {
    setRecsBeingProcessed((value) => [...value, credId]);
    try {
      // Делаем запрос на сервер с целью удаления всей информации о полномочии
      const res = await request(ServerAPI.DEL_APP_CRED_DATA, 'POST', { appId, credId });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableDataCallback((value) =>
        value.map((app) => {
          if (String(app[APP_FIELDS.KEY]) === String(appId)) {
            app[APP_FIELDS.CREDENTIALS] =
              app[APP_FIELDS.CREDENTIALS].filter((cred) => String(cred[APP_CRED_FIELDS.KEY]) !== String(credId))
          }
          return app;
        })
      );
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
    setRecsBeingProcessed((value) => value.filter((id) => id !== credId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditAppCred = (record) => {
    form.setFieldsValue({
      [APP_CRED_FIELDS.ENGL_ABBREVIATION]: '',
      [APP_CRED_FIELDS.DESCRIPTION]: '',
      ...record,
    });
    setEditingKey(record[APP_CRED_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModAppCredFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о полномочии в БД.
   *
   * @param {number} credId
   */
  const handleEditAppCred = async (credId) => {
    let rowData;

    try {
      rowData = await form.validateFields();
    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, credId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о полномочии
      const res = await request(ServerAPI.MOD_APP_CRED_DATA, 'POST', { appId, credId, ...rowData });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableDataCallback((value) =>
        value.map((app) => {
          if (String(app[APP_FIELDS.KEY]) === String(appId)) {
            app[APP_FIELDS.CREDENTIALS] = app[APP_FIELDS.CREDENTIALS].map((cred) => {
              if (String(cred[APP_CRED_FIELDS.KEY]) === String(credId)) {
                return { ...cred, ...getAppApplicationCredObjFromDBApplicationCredObj(res.cred) };
              }
              return cred;
            });
          }
          return app;
        })
      );
      finishEditing();
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModAppCredFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== credId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом полномочии

  const showAddNewAppCredModal = () => {
    setIsAddNewAppCredModalVisible(true);
  };

  const handleAddNewAppCredOk = (app) => {
    handleAddNewAppCred(app);
  };

  const handleAddNewAppCredCancel = () => {
    setIsAddNewAppCredModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы полномочий
  const columns = appCredsTableColumns({
    isEditing,
    editingKey,
    handleEditAppCred,
    handleCancelMod,
    handleStartEditAppCred,
    handleDelAppCred,
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
        required: col.dataIndex !== APP_CRED_FIELDS.DESCRIPTION,
        errMessage: modAppCredFieldsErrs ? modAppCredFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <Form form={form} component={false}>
      <NewAppCredModal
        isModalVisible={isAddNewAppCredModalVisible}
        handleAddNewAppCredOk={handleAddNewAppCredOk}
        handleAddNewAppCredCancel={handleAddNewAppCredCancel}
        appCredFieldsErrs={appCredFieldsErrs}
        clearAddAppCredMessages={clearAddAppCredMessages}
        recsBeingAdded={recsBeingAdded}
      />
      <Button type="primary" onClick={showAddNewAppCredModal}>
        Добавить запись
      </Button>

      <Table
        components={{
          body: {
            cell: EditableTableCell
          },
        }}
        bordered
        dataSource={appCredentials}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: handleCancelMod,
        }}
        sticky={true}
        onRow={(record) => {
          return {
            onDoubleClick: () => { handleStartEditAppCred(record) },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEditAppCred(record[APP_CRED_FIELDS.KEY]);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default AppCredsTable;
