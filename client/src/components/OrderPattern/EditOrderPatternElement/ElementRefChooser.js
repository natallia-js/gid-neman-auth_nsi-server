import React, { useEffect, useState } from 'react';
import { Col, Row, Button, Form, Modal, Select, Table, Tooltip } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useHttp } from '../../../hooks/http.hook';
import { ServerAPI, ORDER_PATTERN_ELEMENT_REFS_FIELDS, ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS } from '../../../constants';
import EditableTableCell from '../../EditableTableCell';
import orderPatternElementRefsTableColumns from './OrderPatternElementRefsTableColumns';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import expandIcon from '../../ExpandIcon';
import NewOrderPatternElementRefModal from '../../NewOrderPatternElementRefModal';
import getAppPossibleElRefsObjFromDBPossibleElRefObj from '../../../mappers/getAppPossibleElRefsObjFromDBPossibleElRefObj';

const chosenRefSelectName = 'chosenRefSelectName';


export const ElementRefChooser = (props) => {
  const {
    orderPatternElRefs,
    elementType,
    chosenRef,
    handleChangeRefCallback,
    onNewOrderPatternElRef,
    onDelOrderPatternElRef,
  } = props;

  const [form] = Form.useForm();
  const [currentElRefsInfoObj, setCurrentElRefsInfoObj] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Для редактирования данных таблицы
  const [editTableDataForm] = Form.useForm();
  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');
  // Ошибки редактирования записи таблицы
  const [modTableFieldsErrs, setModTableFieldsErrs] = useState(null);
  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (rec) => rec[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY] === editingKey;
  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);
  // Для вывода всплывающих сообщений
  const message = useCustomMessage();
  // Видимо либо нет модальное окно добавления нового смыслового значения
  const [isAddNewOrderPatternRefVisible, setIsAddNewOrderPatternRefVisible] = useState(false);
  // Ошибки добавления информации о новом смысловом значении
  const [orderPatternElementRefFieldsErrs, setOrderPatternElementRefFieldsErrs] = useState(null);
  // количество запущенных процессов добавления записей о смысловых значениях на сервере
  const [orderPatternRefRecsBeingAdded, setOrderPatternRefRecsBeingAdded] = useState(0);
  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();


  const handleChangeRef = (value) => {
    handleChangeRefCallback(value);
  };


  useEffect(() => {
    if (!orderPatternElRefs || !orderPatternElRefs.length) {
      setCurrentElRefsInfoObj(null);
      return;
    }
    setCurrentElRefsInfoObj(orderPatternElRefs.find((ref) => ref[ORDER_PATTERN_ELEMENT_REFS_FIELDS.ELEMENT_TYPE] === elementType));
  }, [orderPatternElRefs, elementType]);


  const updateCurrentlySelectedFormValue = () => {
    if (currentElRefsInfoObj && currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]) {
      if (currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS].map((r) => r[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME]).includes(chosenRef))
        form.setFieldsValue({ [chosenRefSelectName]: chosenRef });
      else
        form.setFieldsValue({ [chosenRefSelectName]: '' });
    }
  };


  useEffect(() => {
    updateCurrentlySelectedFormValue();
  }, [currentElRefsInfoObj]);


  useEffect(() => {
    updateCurrentlySelectedFormValue();
  }, [chosenRef, form]);


  /**
   * Открыть диалог редактирования информации о смысловых значениях элементов шаблонов распоряжений.
   */
  const handleEditOrderPatternElementRefs = () => {
    setIsModalOpen(true);
  };

  /**
   * Закрытие диалогового окна работы со смысловыми значениями текущего типа элемента
   * шаблона распоряжения.
   */
  const handleClose = () => {
    setIsModalOpen(false);
  };

  /**
   * Редактирует информацию о смысловом значении элемента шаблона распоряжения.
   */
  const handleEditOrderPatternElementRef = async (orderPatternRefId) => {
    let rowData;

    try {
      rowData = await editTableDataForm.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }
  };

  /**
   * Действия, выполняемые по окончании процесса редактирования записи
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
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} rec
   */
  const handleStartEditOrderPatternElementRef = (rec) => {
    editTableDataForm.setFieldsValue({
      [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME]: '',
      [ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID]: '',
      ...rec,
    });
    setEditingKey(rec[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]);
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
        inputType: (col.dataIndex === ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID) ? 'boolean' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: true,
        errMessage: modTableFieldsErrs ? modTableFieldsErrs[col.dataIndex] : null,
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
        refName: orderPatternElementRef[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME],
        addDataForGID: orderPatternElementRef[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID],
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const newOrderPatternElementRef = getAppPossibleElRefsObjFromDBPossibleElRefObj(res.ref);
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
  }


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

  /**
   * Чистит все сообщения добавления информации о смысловом значении (ошибки и успех).
   */
  const clearAddOrderPatterbRefMessages = () => {
    setOrderPatternElementRefFieldsErrs(null);
  }

  // --------------------------------------------------------------


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
                  ? currentElRefsInfoObj[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]
                      .map((r) => r[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME])
                      .map((ref) => {
                        return {
                          value: ref,
                        };
                      })
                  : []
                }
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
        width={600}
        visible={isModalOpen}
        onCancel={handleClose}
      >
        <Form form={editTableDataForm} component={false}>
          <NewOrderPatternElementRefModal
            isModalVisible={isAddNewOrderPatternRefVisible}
            handleAddNewRecOk={handleAddNewOrderPatternRefOk}
            handleAddNewRecCancel={handleAddNewOrderPatternRefCancel}
            recFieldsErrs={orderPatternElementRefFieldsErrs}
            clearAddRecMessages={clearAddOrderPatterbRefMessages}
            recsBeingAdded={orderPatternRefRecsBeingAdded}
          />

          <Button type="primary" onClick={showAddNewOrderPatternRefModal}>
            Добавить запись
          </Button>

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
                  <Col>
                    Hello
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
