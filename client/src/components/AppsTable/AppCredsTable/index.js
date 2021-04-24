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

import 'antd/dist/antd.css';


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
  const isEditing = (record) => record.key === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewAppCredModalVisible, setIsAddNewAppCredModalVisible] = useState(false);

  // Ошибки добавления информации о новом полномочии
  const [commonAddErr, setCommonAddErr] = useState(null);
  const [appCredFieldsErrs, setAppCredFieldsErrs] = useState(null);

  // Сообщение об успешном окончании процесса сохранения нового полномочия
  const [successSaveMessage, setSuccessSaveMessage] = useState(null);

  const message = useCustomMessage();


  /**
   * Чистит все сообщения добавления информации о полномочии (ошибки и успех).
   */
  const clearAddAppCredMessages = () => {
    setCommonAddErr(null);
    setAppCredFieldsErrs(null);
    setSuccessSaveMessage(null);
  }


  /**
   * Добавляет информацию о полномочии в БД.
   *
   * @param {object} cred
   */
  const handleAddNewAppCred = async (cred) => {
    try {
      // Делаем запрос на сервер с целью добавления информации о полномочии
      const res = await request(ServerAPI.ADD_APP_CRED_DATA, 'POST', { appId, ...cred }, {
        Authorization: `Bearer ${auth.token}`
      });

      setSuccessSaveMessage(res.message);

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
      setCommonAddErr(e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setAppCredFieldsErrs(errs);
      }
    }
  }


  /**
   * Удаляет информацию о полномочии из БД.
   *
   * @param {number} credId
   */
  const handleDelAppCred = async (credId) => {
    try {
      // Делаем запрос на сервер с целью удаления всей информации о полномочии
      const res = await request(ServerAPI.DEL_APP_CRED_DATA, 'POST', { appId, credId }, {
        Authorization: `Bearer ${auth.token}`
      });

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
    setEditingKey(record.key);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    setEditingKey('');
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

    try {
      // Делаем запрос на сервер с целью редактирования информации о полномочии
      const res = await request(ServerAPI.MOD_APP_CRED_DATA, 'POST', { appId, credId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((app) => {
          if (String(app[APP_FIELDS.KEY]) === String(appId)) {
            app[APP_FIELDS.CREDENTIALS] = app[APP_FIELDS.CREDENTIALS].map((cred) => {
              if (String(cred[APP_CRED_FIELDS.KEY]) === String(credId)) {
                return { ...cred, ...getAppApplicationCredObjFromDBApplicationCredObj(res.cred) };
              }
              return cred;
            })
          }
          return app;
        })
      );

      setEditingKey('');

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
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
      }),
    };
  });


  return (
    <Form form={form} component={false}>
      <NewAppCredModal
        appId={appId}
        isModalVisible={isAddNewAppCredModalVisible}
        handleAddNewAppCredOk={handleAddNewAppCredOk}
        handleAddNewAppCredCancel={handleAddNewAppCredCancel}
        commonAddErr={commonAddErr}
        appCredFieldsErrs={appCredFieldsErrs}
        clearAddAppCredMessages={clearAddAppCredMessages}
        successSaveMessage={successSaveMessage}
      />
      <Button
        type="primary"
        style={{
          marginBottom: 16,
        }}
        onClick={showAddNewAppCredModal}
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
        dataSource={appCredentials}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: handleCancelMod,
        }}
        onRow={(record) => {
          return {
            onDoubleClick: () => { handleStartEditAppCred(record) },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEditAppCred(record.key);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default AppCredsTable;
