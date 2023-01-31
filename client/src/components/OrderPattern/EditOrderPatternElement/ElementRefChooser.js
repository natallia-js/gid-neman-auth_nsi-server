import React, { useEffect, useState } from 'react';
import { Col, Row, Button, Form, Input, List, Modal, Popconfirm, Select, Table, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, RollbackOutlined, SaveOutlined } from '@ant-design/icons';
import { useHttp } from '../../../hooks/http.hook';
import { ServerAPI, ORDER_PATTERN_ELEMENT_REFS_FIELDS, ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS } from '../../../constants';
import EditableTableCell from '../../EditableTableCell';
import orderPatternElementRefsTableColumns from './OrderPatternElementRefsTableColumns';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import expandIcon from '../../ExpandIcon';
import NewOrderPatternElementRefModal from '../../NewOrderPatternElementRefModal';
import NewOrderPatternElementRefMeaningModal from '../../NewOrderPatternElementRefMeaningModal';
import getAppPossibleElRefsObjFromDBPossibleElRefObj from '../../../mappers/getAppPossibleElRefsObjFromDBPossibleElRefObj';
import compareStrings from '../../../sorters/compareStrings';

const chosenRefSelectName = 'chosenRefSelectName';


export const ElementRefChooser = (props) => {
  const {
    orderPatternElRefs, // полный список всех возможных типов элементов шаблонов распоряжений с их смысловыми значениями (при наличии)
    elementType,
    chosenRef,
    handleChangeRefCallback,
    onNewOrderPatternElRef,
    onDelOrderPatternElRef,
    onModOrderPatternElRef,
    stations,
    dncSectors,
    ecdSectors,
  } = props;

  // --------------- ФОРМЫ
  // Для редактирования информации о смысловом значении выбранного элемента шаблона
  // (просто выбор из списка смысловых значений)
  const [form] = Form.useForm();
  // Для редактирования данных таблицы смысловых значений
  const [editTableDataForm] = Form.useForm();
  // Для редактирования допустимого значения элемента с данным смысловым значением (в списке допустимых значений)
  const [editElRefMeaningDataForm] = Form.useForm();

  // --------------- ФЛАГИ ОТКРЫТИЯ МОДАЛЬНЫХ ОКОН
  // Открыто/закрыто модальное окно смысловых значений текущего элемента шаблона распоряжения
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Видимо либо нет модальное окно добавления нового смыслового значения
  const [isAddNewOrderPatternRefVisible, setIsAddNewOrderPatternRefVisible] = useState(false);
  // Видимо либо нет модальное окно добавления нового возможного значения элемента шаблона
  // распоряжения с заданным смысловым значением
  const [isAddNewOrderPatternRefMeaningVisible, setIsAddNewOrderPatternRefMeaningVisible] = useState(false);

  // --------------- КЛЮЧИ РЕДАКТИРУЕМЫХ ЗАПИСЕЙ
  // Ключ редактируемой записи таблицы cмысловых значений
  const [editingKey, setEditingKey] = useState('');
  // Флаг текущего состояния редактируемости записи в таблице cмысловых значений
  const isEditing = (rec) => rec[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY] === editingKey;
  // Информация о редактируемом смысловом значении
  const [editingElRefMeaningInfo, setEditingElRefMeaningInfo] = useState(null);

  // --------------- ОБЪЕКТЫ
  // Объект с информацией о смысловых значениях текущего типа элемента шаблона распоряжения
  const [currentElRefsInfoObj, setCurrentElRefsInfoObj] = useState(null);
  // Объект с информацией о текущем смысловом значении текущего элемента шаблона распоряжения
  const [currentElRefsMeaningObj, setCurrentElRefsMeaningObj] = useState(null);

  // --------------- ОШИБКИ
  // Ошибки редактирования записи таблицы cмысловых значений
  const [modTableFieldsErrs, setModTableFieldsErrs] = useState(null);
  // Ошибка, связанная с необходимостью ввести наименование допустимого значения текущего элемента шаблона распоряжения
  const [requiredMeaningErrMess, setRequiredMeaningErrMess] = useState(null);
  // Ошибки редактирования информации о допустимом значении, которое может принимать элемент шаблона распоряжения
  // с текущим смысловым значением
  const [modElRefListItemErrs, setModElRefListItemErrs] = useState(null);
  // Ошибки добавления информации о новом смысловом значении
  const [orderPatternElementRefFieldsErrs, setOrderPatternElementRefFieldsErrs] = useState(null);
  // Ошибки добавления информации о допустимом значении элемента шаблона распоряжения с данным смысловым значением
  const [orderPatternElementRefMeaningFieldsErrs, setOrderPatternElementRefMeaningFieldsErrs] = useState(null);

  // -------------- СТАТИСТИКА
  // id записей (таблицы cмысловых значений), по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);
  // Количество запущенных процессов добавления записей о смысловых значениях на сервере
  const [orderPatternRefRecsBeingAdded, setOrderPatternRefRecsBeingAdded] = useState(0);
  // Количество запущенных процессов добавления записей о допустимых значениях элементов шаблонов распоряжений,
  // имеющих данное смысловое значение, на сервере
  const [orderPatternRefMeaningRecsBeingAdded, setOrderPatternRefMeaningRecsBeingAdded] = useState(0);

  // ------------- ДОПОЛНИТЕЛЬНО
  // Для вывода всплывающих сообщений
  const message = useCustomMessage();
  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();


  /**
   * Изменилось выбранное пользователем в списке смысловое значение текущего элемента шаблона распоряжения
   * (об изменении сообщаем "наверх").
   */
  const handleChangeRef = (value) => {
    handleChangeRefCallback(value);
  };


  /**
   * При изменении списка типов элементов шаблонов распоряжений и/или типа элемента шаблона распоряжения
   * определяем и запоминаем объект текущего типа элементов шаблонов распоряжений с его смысловыми значениями (при наличии).
   */
  useEffect(() => {
    if (!orderPatternElRefs || !orderPatternElRefs.length) {
      setCurrentElRefsInfoObj(null);
      return;
    }
    setCurrentElRefsInfoObj(orderPatternElRefs
      .find((ref) => ref[ORDER_PATTERN_ELEMENT_REFS_FIELDS.ELEMENT_TYPE] === elementType)
    );
  }, [orderPatternElRefs, elementType]);


  /**
   *
   */
  useEffect(() => {
    if (currentElRefsInfoObj && currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]) {
      if (currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS].map((r) => r[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME]).includes(chosenRef))
        form.setFieldsValue({ [chosenRefSelectName]: chosenRef });
      else
        form.setFieldsValue({ [chosenRefSelectName]: '' });
    }
  }, [currentElRefsInfoObj, chosenRef, form]);


  // ------------------- РЕДАКТИРОВАНИЕ ИНФОРМАЦИИ О СМЫСЛОВЫХ ЗНАЧЕНИЯХ ТЕКУЩЕГО ЭЛЕМЕНТА ШАБЛОНА РАСПОРЯЖЕНИЙ

  /**
   * Открыть диалог редактирования информации о смысловых значениях текущего элемента шаблона распоряжений.
   */
  const handleEditOrderPatternElementRefs = () => {
    setIsModalOpen(true);
  };

  /**
   * Закрыть диалоговое окно работы со смысловыми значениями текущего типа элемента шаблона распоряжений.
   */
  const handleClose = () => {
    setIsModalOpen(false);
  };

  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} rec
   */
  const handleStartEditOrderPatternElementRef = (rec) => {
    editTableDataForm.setFieldsValue({
      [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME]: '',
      [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON]: null,
      [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID]: '',
      ...rec,
    });
    setEditingKey(rec[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]);
  };

  /**
   * Редактирует информацию о смысловом значении элемента шаблона распоряжения.
   */
  const handleEditOrderPatternElementRef = async (refId) => {
    let rowData;

    try {
      rowData = await editTableDataForm.validateFields();
    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, refId]);
    try {
      const res = await request(ServerAPI.MOD_ORDER_PATTERN_ELEMENT_REF, 'POST', {
        elementTypeId: currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY],
        refId,
        ...rowData,
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      onModOrderPatternElRef(res.data.elementTypeId, getAppPossibleElRefsObjFromDBPossibleElRefObj(res.data.ref, stations, dncSectors, ecdSectors));
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModTableFieldsErrs(errs);
      }
    }
    setRecsBeingProcessed((value) => value.filter((id) => id !== refId));
  };

  /**
   * Действия, выполняемые по окончании процесса редактирования записи в таблице смысловых значений
   * (вне зависимости от результата редактирования).
   */
  const finishEditing = () => {
    setEditingKey('');
    setModTableFieldsErrs(null);
  };

  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };

  /**
   * Удаляет информацию о смысловом значении из БД.
   */
  const handleDelOrderPatternElementRef = async (refId) => {
    setRecsBeingProcessed((value) => [...value, refId]);

    try {
      const res = await request(ServerAPI.DEL_ORDER_PATTERN_ELEMENT_REF, 'POST', {
        elementTypeId: currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY],
        refId,
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      onDelOrderPatternElRef(res.data.elementTypeId, res.data.refId);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== refId));
  };

  // Описание столбцов таблицы смысловых значений
  const columns = orderPatternElementRefsTableColumns({
    isEditing,
    editingKey,
    handleEditOrderPatternElementRef,
    handleCancelMod,
    handleStartEditOrderPatternElementRef,
    handleDelOrderPatternElementRef,
    recsBeingProcessed,
  });

  /**
   * Правила отображения редактируемых и нередактируемых столбцов таблицы смысловых значений элемента шаблона распоряжения.
   */
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType:
          (col.dataIndex === ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID) ? 'boolean' :
          col.dataIndex === ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON ? 'workPoligonSelect' : 'text',
        dataType:
          (col.dataIndex === ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID) ? 'boolean' :
          col.dataIndex === ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON ? 'object' : 'string',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: col.dataIndex === ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON ? false : true,
        errMessage: modTableFieldsErrs ? modTableFieldsErrs[col.dataIndex] : null,
        stations,
        dncSectors,
        ecdSectors,
        handleError: (errorMessage) => message(MESSAGE_TYPES.ERROR, errorMessage),
      }),
    };
  });

  /**
   * Добавляет информацию о смысловом значении в БД.
   */
  const handleAddNewOrderPatternRef = async (orderPatternElementRef) => {
    setOrderPatternRefRecsBeingAdded((value) => value + 1);

    try {
      const res = await request(ServerAPI.ADD_ORDER_PATTERN_ELEMENT_REF, 'POST', {
        elementTypeId: currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY],
        ...orderPatternElementRef,
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const newOrderPatternElementRef = getAppPossibleElRefsObjFromDBPossibleElRefObj(res.ref, stations, dncSectors, ecdSectors);
      onNewOrderPatternElRef(res.ref.typeId, newOrderPatternElementRef);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setOrderPatternElementRefFieldsErrs(errs);
      }
    }

    setOrderPatternRefRecsBeingAdded((value) => value - 1);
  };



  // ------------------- РЕДАКТИРОВАНИЕ ИНФОРМАЦИИ О ДОПУСТИМЫХ ЗНАЧЕНИЯХ, КОТОРЫЕ МОЖЕТ ПРИНИМАТЬ ТЕКУЩИЙ
  // ------------------- ЭЛЕМЕНТ ШАБЛОНА РАСПОРЯЖЕНИЙ

  const handleStartEditOrderPatternRefMeaning = (ref, meaning) => {
    editElRefMeaningDataForm.setFieldsValue({ meaning });
    setEditingElRefMeaningInfo({ ref, meaning });
  };

  /**
   *
   */
  const handleEditOrderPatternRefMeaning = async () => {
    let listItemData;

    try {
      listItemData = await editElRefMeaningDataForm.validateFields();
    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    const refId = editingElRefMeaningInfo.ref[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY];
    setRecsBeingProcessed((value) => [...value, refId]);

    try {
      const res = await request(ServerAPI.MOD_ORDER_PATTERN_ELEMENT_REF, 'POST', {
        elementTypeId: currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY],
        refId,
        possibleMeanings: [
          ...editingElRefMeaningInfo.ref[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.MEANINGS]
            .map((el) => {
              if (el !== editingElRefMeaningInfo.meaning)
                return el;
              return listItemData.meaning;
            }),
        ],
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const updatedElRefObject = getAppPossibleElRefsObjFromDBPossibleElRefObj(res.data.ref, stations, dncSectors, ecdSectors);
      onModOrderPatternElRef(res.data.elementTypeId, updatedElRefObject);
      setCurrentElRefsMeaningObj(updatedElRefObject);
      finishEditingElRefMeaning();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModElRefListItemErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== refId));
  };

  /**
   *
   */
  const handleCancelEditOrderPatternRefMeaning = () => {
    finishEditingElRefMeaning();
  };

  /**
   * Действия, выполняемые по окончании процесса редактирования записи в списке значений, которые может
   * принимать элемент шаблона распоряжения с заданным смысловым значением
   * (вне зависимости от результата редактирования).
   */
  const finishEditingElRefMeaning = () => {
    setEditingElRefMeaningInfo(null);
    setModElRefListItemErrs(null);
  };

  /**
   * Удаляет информацию о допустимом значении элемента шаблона распоряжения с заданным
   * смысловым значением из БД.
   */
  const handleDelOrderPatternRefMeaning = async (ref, meaning) => {
    const refId = ref[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY];
    setRecsBeingProcessed((value) => [...value, refId]);

    try {
      const res = await request(ServerAPI.MOD_ORDER_PATTERN_ELEMENT_REF, 'POST', {
        elementTypeId: currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY],
        refId,
        possibleMeanings: ref[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.MEANINGS].filter((el) => el !== meaning),
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      onModOrderPatternElRef(res.data.elementTypeId, getAppPossibleElRefsObjFromDBPossibleElRefObj(res.data.ref, stations, dncSectors, ecdSectors));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== refId));
  };

  /**
   *
   */
  const handleAddNewOrderPatternRefMeaning = async (meaning) => {
    const refId = currentElRefsMeaningObj[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY];
    setOrderPatternRefMeaningRecsBeingAdded((value) => value + 1);

    try {
      const res = await request(ServerAPI.MOD_ORDER_PATTERN_ELEMENT_REF, 'POST', {
        elementTypeId: currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.KEY],
        refId,
        possibleMeanings: [...currentElRefsMeaningObj[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.MEANINGS], meaning],
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const updatedElRefObject = getAppPossibleElRefsObjFromDBPossibleElRefObj(res.data.ref, stations, dncSectors, ecdSectors);
      onModOrderPatternElRef(res.data.elementTypeId, updatedElRefObject);
      setCurrentElRefsMeaningObj(updatedElRefObject);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModElRefListItemErrs(errs);
      }
    }

    setOrderPatternRefMeaningRecsBeingAdded((value) => value - 1);
  };


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом смысловом значении элемента шаблона распоряжения

  const showAddNewOrderPatternRefModal = () => {
    setIsAddNewOrderPatternRefVisible(true);
  };

  const handleAddNewOrderPatternRefOk = (ref) => {
    handleAddNewOrderPatternRef(ref);
  };

  const handleAddNewOrderPatternRefCancel = () => {
    setIsAddNewOrderPatternRefVisible(false);
  };

  const handleCreateOrderPatternElementRefError = (errorMessage) => {
    message(MESSAGE_TYPES.ERROR, errorMessage);
  };

  /**
   * Чистит все сообщения добавления информации о смысловом значении (ошибки и успех).
   */
  const clearAddOrderPatternRefMessages = () => {
    setOrderPatternElementRefFieldsErrs(null);
  };

  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом возможном значении, которое может принимать
  // элемент шаблона распоряжения с данным смысловым значением

  const showAddNewOrderPatternRefMeaningModal = (rec) => {
    setIsAddNewOrderPatternRefMeaningVisible(true);
    setCurrentElRefsMeaningObj(rec);
  };

  const handleAddNewOrderPatternRefMeaningOk = (meaning) => {
    handleAddNewOrderPatternRefMeaning(meaning.Meaning);
  };

  const handleAddNewOrderPatternRefMeaningCancel = () => {
    setIsAddNewOrderPatternRefMeaningVisible(false);
    setCurrentElRefsMeaningObj(null);
  };

  /**
   * Чистит все сообщения добавления информации о новом возможном значении, которое может принимать
   * элемент шаблона рампоряжения с данным смысловым значением (ошибки и успех)
   */
  const clearAddOrderPatternRefMeaningMessages = () => {
    setOrderPatternElementRefMeaningFieldsErrs(null);
  };

  // --------------------------------------------------------------

  const meaningListItemIsInEditMode = (rec, item) =>
    editingElRefMeaningInfo &&
    editingElRefMeaningInfo.ref[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY] === rec[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY] &&
    editingElRefMeaningInfo.meaning === item;


  return (
    <>
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="element-ref-form"
      >
        <Form.Item
          label="Смысловое значение"
          name={chosenRefSelectName}
        >
          <Row>
            <Col flex="auto">
              <Select
                style={{ width: '100%' }}
                options={
                  currentElRefsInfoObj && currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]
                  ? [{ value: '' }].concat(currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]
                      .map((r) => r[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME])
                      .map((ref) => {
                        return {
                          value: ref,
                        };
                      }))
                  : []
                }
                value={chosenRef}
                onChange={handleChangeRef}
              />
            </Col>
            <Col flex="30px">
              <Tooltip
                title="Редактировать список смысловых значений"
                placement="bottom"
              >
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={handleEditOrderPatternElementRefs}
                />
              </Tooltip>
            </Col>
          </Row>
        </Form.Item>
      </Form>

      <Modal
        title={`Смысловые значения элемента ${elementType}`}
        footer={null}
        destroyOnClose={true}
        width={800}
        visible={isModalOpen}
        onCancel={handleClose}
      >
        <Form form={editTableDataForm} component={false}>
          <NewOrderPatternElementRefModal
            isModalVisible={isAddNewOrderPatternRefVisible}
            handleAddNewRecOk={handleAddNewOrderPatternRefOk}
            handleAddNewRecCancel={handleAddNewOrderPatternRefCancel}
            handleError={handleCreateOrderPatternElementRefError}
            recFieldsErrs={orderPatternElementRefFieldsErrs}
            clearAddRecMessages={clearAddOrderPatternRefMessages}
            recsBeingAdded={orderPatternRefRecsBeingAdded}
            stations={stations}
            dncSectors={dncSectors}
            ecdSectors={ecdSectors}
          />

          <NewOrderPatternElementRefMeaningModal
            isModalVisible={isAddNewOrderPatternRefMeaningVisible}
            handleAddNewRecOk={handleAddNewOrderPatternRefMeaningOk}
            handleAddNewRecCancel={handleAddNewOrderPatternRefMeaningCancel}
            recFieldsErrs={orderPatternElementRefMeaningFieldsErrs}
            clearAddRecMessages={clearAddOrderPatternRefMeaningMessages}
            recsBeingAdded={orderPatternRefMeaningRecsBeingAdded}
          />

          <Button type="primary" size="small" onClick={showAddNewOrderPatternRefModal}>
            Добавить запись
          </Button>

          {/* Таблица смысловых значений выбранного типа элемента шаблона распоряжения.
              Записи сортируются по наименованиям смысловых значений.
           */}
          <Table
            components={{
              body: {
                cell: EditableTableCell
              },
            }}
            bordered
            size="small"
            dataSource={
              currentElRefsInfoObj && currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]
              ? currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]
                  .sort((a, b) => compareStrings(a[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME].toLowerCase(),
                                                 b[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME].toLowerCase()))
              : []
            }
            columns={mergedColumns}
            rowClassName="editable-row"
            pagination={{
              onChange: handleCancelMod,
            }}
            sticky={true}
            onRow={(record) => {
              return {
                onDoubleClick: () => {
                  if (!editingKey || editingKey !== record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]) {
                    handleStartEditOrderPatternElementRef(record);
                  }
                },
                onKeyUp: event => {
                  if (event.key === 'Enter') {
                    handleEditOrderPatternElementRef(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]);
                  }
                }
              };
            }}
            expandable={{
              expandedRowRender: rec => (
                <Row className="expandable-row-content">
                  <Col span={24}>
                    <Row>
                      Допустимые значения:
                    </Row>
                    <Row>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => showAddNewOrderPatternRefMeaningModal(rec)}
                      >
                        Добавить запись
                      </Button>
                    </Row>
                    <List
                      size="small"
                      bordered
                      dataSource={rec[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.MEANINGS]}
                      renderItem={(item) =>
                        <List.Item
                          style={{ marginLeft: 10, marginRight: 10 }}
                          actions={
                            !meaningListItemIsInEditMode(rec, item)
                            ? [
                              <Tooltip title="Редактировать">
                                <EditOutlined onClick={() => handleStartEditOrderPatternRefMeaning(rec, item)} />
                              </Tooltip>,
                              <Tooltip title="Удалить">
                                <Popconfirm
                                  title="Удалить запись?"
                                  onConfirm={() => handleDelOrderPatternRefMeaning(rec, item)}
                                  okText="Да"
                                  cancelText="Отмена"
                                >
                                  <DeleteOutlined />
                                </Popconfirm>
                              </Tooltip>
                            ]
                            : [
                              <Tooltip title="Сохранить">
                                <SaveOutlined onClick={() => handleEditOrderPatternRefMeaning()} />
                              </Tooltip>,
                              <Tooltip title="Отменить">
                                <Popconfirm
                                  title="Отменить редактирование?"
                                  onConfirm={() => handleCancelEditOrderPatternRefMeaning(rec, item)}
                                  okText="Да"
                                  cancelText="Отмена"
                                >
                                  <RollbackOutlined />
                                </Popconfirm>
                              </Tooltip>,
                            ]
                          }
                        >
                          {
                            meaningListItemIsInEditMode(rec, item)
                            ?
                              <Form form={editElRefMeaningDataForm} component={false}>
                                <Form.Item
                                  name="meaning"
                                  style={{
                                    margin: 0,
                                    width: '100%',
                                  }}
                                  rules={[
                                    {
                                      required: true,
                                      validator: async (_, value) => {
                                        if (!value || value.length < 1) {
                                          setRequiredMeaningErrMess(`Не задано значение!`);
                                        } else {
                                          setRequiredMeaningErrMess(null);
                                        }
                                      },
                                    }
                                  ]}
                                  validateStatus={requiredMeaningErrMess ? 'error' : null}
                                  help={requiredMeaningErrMess}
                                >
                                  <Input
                                    autoComplete="off"
                                    onKeyUp={(event) => {
                                      if (event.key === 'Enter') {
                                        handleEditOrderPatternRefMeaning();
                                      }}
                                    }
                                  />
                                </Form.Item>
                              </Form>
                            :
                              <span
                                style={{ width: '100%' }}
                                onDoubleClick={() => handleStartEditOrderPatternRefMeaning(rec, item)}
                              >
                                {item}
                              </span>
                          }
                        </List.Item>
                      }
                    />
                  </Col>
                </Row>
              ),
              rowExpandable: _record => true,
              expandIcon: expandIcon,
            }}
          />
          <Button type="primary" size="small" onClick={handleClose}>
            Закрыть окно
          </Button>
        </Form>
      </Modal>
    </>
  );
};
