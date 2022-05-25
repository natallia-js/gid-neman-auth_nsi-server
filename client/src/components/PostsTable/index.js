import React, { useState, useEffect, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewPostModal from '../NewPostModal';
import {
  ServerAPI,
  POST_FIELDS,
} from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import postsTableColumns from './PostsTableColumns';
import getAppPostObjFromDBPostObj from '../../mappers/getAppPostObjFromDBPostObj';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией о должностях.
 */
const PostsTable = () => {
  // Информация по должностям (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Ошибка загрузки данных о должностях
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для редактирования данных таблицы служб
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[POST_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewPostModalVisible, setIsAddNewPostModalVisible] = useState(false);

  // Ошибки добавления информации о новой должности
  const [postFieldsErrs, setPostFieldsErrs] = useState(null);

  // Ошибки редактирования информации о должности
  const [modPostFieldsErrs, setModPostFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по должностям
      let res = await request(ServerAPI.GET_POSTS_DATA, 'POST', {});
      const tableData = res.map((post) => getAppPostObjFromDBPostObj(post));
      setTableData(tableData);
      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [request]);


  /**
   * При рендере компонента подгружает информацию для отображения в таблице из БД
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  /**
   * Чистит все сообщения добавления информации о должности (ошибки и успех).
   */
  const clearAddPostMessages = () => {
    setPostFieldsErrs(null);
  };


  /**
   * Добавляет информацию о должности в БД.
   *
   * @param {object} post
   */
  const handleAddNewPost = async (post) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о должности
      const res = await request(ServerAPI.ADD_POST_DATA, 'POST', { ...post });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const newPost = getAppPostObjFromDBPostObj(res.post);
      setTableData([...tableData, newPost]);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setPostFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  };


  /**
   * Удаляет информацию о должности из БД.
   *
   * @param {number} postId
   */
  const handleDelPost = async (postId) => {
    setRecsBeingProcessed((value) => [...value, postId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о должности
      const res = await request(ServerAPI.DEL_POST_DATA, 'POST', { id: postId });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableData(tableData.filter((post) => post[POST_FIELDS.KEY] !== postId));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== postId));
  };


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditPost = (record) => {
    form.setFieldsValue({
      [POST_FIELDS.ABBREV]: '',
      [POST_FIELDS.TITLE]: '',
      ...record,
    });
    setEditingKey(record[POST_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
  const finishEditing = () => {
    setEditingKey('');
    setModPostFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о должности в БД.
   *
   * @param {number} postId
   */
  const handleEditPost = async (postId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, postId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о должности
      const res = await request(ServerAPI.MOD_POST_DATA, 'POST', { id: postId, ...rowData });
      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((post) => {
        if (post[POST_FIELDS.KEY] === postId) {
          return { ...post, ...rowData };
        }
        return post;
      });

      setTableData(newTableData);
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModPostFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== postId));
  };


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новой должности

  const showAddNewPostModal = () => {
    setIsAddNewPostModalVisible(true);
  };

  const handleAddNewPostOk = (post) => {
    handleAddNewPost(post);
  };

  const handleAddNewPostCancel = () => {
    setIsAddNewPostModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы должностей
  const columns = postsTableColumns({
    isEditing,
    editingKey,
    handleEditPost,
    handleCancelMod,
    handleStartEditPost,
    handleDelPost,
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
        errMessage: modPostFieldsErrs ? modPostFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
      <Title level={2} className="center top-margin-05">Должности</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewPostModal
          isModalVisible={isAddNewPostModalVisible}
          handleAddNewPostOk={handleAddNewPostOk}
          handleAddNewPostCancel={handleAddNewPostCancel}
          postFieldsErrs={postFieldsErrs}
          clearAddPostMessages={clearAddPostMessages}
          recsBeingAdded={recsBeingAdded}
        />

        <Button type="primary" onClick={showAddNewPostModal}>
          Добавить запись
        </Button>

        <Table
          loading={!dataLoaded}
          components={{
            body: {
              cell: EditableTableCell
            },
          }}
          bordered
          dataSource={tableData}
          columns={mergedColumns}
          rowClassName="editable-row"
          pagination={{
            onChange: handleCancelMod,
          }}
          sticky={true}
          onRow={(record) => {
            return {
              onDoubleClick: () => {
                if (!editingKey || editingKey !== record[POST_FIELDS.KEY]) {
                  handleStartEditPost(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditPost(record[POST_FIELDS.KEY]);
                }
              }
            };
          }}
        />
      </Form>
    }
    </>
  );
};


export default PostsTable;
