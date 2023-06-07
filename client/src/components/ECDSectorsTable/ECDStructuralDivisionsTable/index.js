import React, { useState } from 'react';
import EditableTableCell from '../../EditableTableCell';
import ecdStructuralDivisionsTableColumns from './ECDStructuralDivisionsTableColumns';
import { Table, Form, Button } from 'antd';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { useHttp } from '../../../hooks/http.hook';
import { ServerAPI, ECDSECTOR_FIELDS, ECD_STRUCTURAL_DIVISION_FIELDS } from '../../../constants';
import getAppECDStructuralDivisionFromDBECDStructuralDivisionObj from '../../../mappers/getAppECDStructuralDivisionFromDBECDStructuralDivisionObj';
import NewECDStructuralDivisionModal from '../../NewECDStructuralDivisionModal';
import { useColumnSearchProps } from '../../../hooks/columnSearchProps.hook';


/**
 * Компонент таблицы с информацией о структурных подразделениях ЭЦД.
 */
const ECDStructuralDivisionsTable = (props) => {
  const {
    currECDSectorRecordId,
    ecdSectorStructuralDivisions,
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ЭЦД
  } = props;

  // Для редактирования данных таблицы
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (rec) => rec[ECD_STRUCTURAL_DIVISION_FIELDS.KEY] === editingKey;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewDivisionModalVisible, setIsAddNewDivisionModalVisible] = useState(false);

  // Ошибки добавления информации
  const [divisionFieldsErrs, setDivisionFieldsErrs] = useState(null);

  // Ошибки редактирования информации
  const [modDivisionFieldsErrs, setModDivisionFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);

  // Для поиска данных в столбцах таблицы
  const { getColumnSearchProps } = useColumnSearchProps({ useOnFilterEventProcessor: true });


  /**
   * Чистит все сообщения добавления информации о подразделении (ошибки и успех).
   */
  const clearAddDivisionMessages = () => {
    setDivisionFieldsErrs(null);
  };


  /**
   * Добавляет информацию о подразделении в БД.
   *
   * @param {object} division
   */
  const handleAddNewDivision = async (division) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о подразделении
      const res = await request(ServerAPI.ADD_ECDSTRUCTURALDIVISIONS_DATA, 'POST',
        { ecdSectorId: currECDSectorRecordId, ...division }
      );
      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((ecdSector) => {
          if (String(ecdSector[ECDSECTOR_FIELDS.KEY]) === String(currECDSectorRecordId)) {
            const newECDSectorStructuralDivisions = ecdSector[ECDSECTOR_FIELDS.STRUCTURAL_DIVISIONS].slice();
            newECDSectorStructuralDivisions.push(getAppECDStructuralDivisionFromDBECDStructuralDivisionObj(res.newRecord));
            ecdSector[ECDSECTOR_FIELDS.STRUCTURAL_DIVISIONS] = newECDSectorStructuralDivisions;
          }
          return ecdSector;
        })
      );

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setDivisionFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о подразделении из БД.
   *
   * @param {number} divisionId
   */
  const handleDelECDStructuralDivision = async (divisionId) => {
    setRecsBeingProcessed((value) => [...value, divisionId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о подразделении ЭЦД
      const res = await request(ServerAPI.DEL_ECDSTRUCTURALDIVISIONS_DATA, 'POST', { id: divisionId });
      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((ecdSector) => {
          if (String(ecdSector[ECDSECTOR_FIELDS.KEY]) === String(currECDSectorRecordId)) {
            ecdSector[ECDSECTOR_FIELDS.STRUCTURAL_DIVISIONS] =
            ecdSector[ECDSECTOR_FIELDS.STRUCTURAL_DIVISIONS].filter(
              (division) => String(division[ECD_STRUCTURAL_DIVISION_FIELDS.KEY]) !== String(divisionId))
          }
          return ecdSector;
        })
      );
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== divisionId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditECDStructuralDivision = (record) => {
    form.setFieldsValue({
      [ECD_STRUCTURAL_DIVISION_FIELDS.NAME]: '',
      [ECD_STRUCTURAL_DIVISION_FIELDS.POST]: '',
      [ECD_STRUCTURAL_DIVISION_FIELDS.FIO]: '',
      [ECD_STRUCTURAL_DIVISION_FIELDS.POSITION]: null,
      ...record,
    });
    setEditingKey(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModDivisionFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о подразделении в БД.
   *
   * @param {number} divisionId
   */
  const handleEditECDStructuralDivision = async (divisionId) => {
    let rowData;

    try {
      rowData = await form.validateFields();
    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, divisionId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о подразделении
      const res = await request(ServerAPI.MOD_ECDSTRUCTURALDIVISIONS_DATA, 'POST', { id: divisionId, ...rowData });
      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((ecdSector) => {
          if (String(ecdSector[ECDSECTOR_FIELDS.KEY]) === String(currECDSectorRecordId)) {
            ecdSector[ECDSECTOR_FIELDS.STRUCTURAL_DIVISIONS] =
            ecdSector[ECDSECTOR_FIELDS.STRUCTURAL_DIVISIONS].map((division) => {
              if (String(division[ECD_STRUCTURAL_DIVISION_FIELDS.KEY]) === String(divisionId)) {
                return { ...division, ...getAppECDStructuralDivisionFromDBECDStructuralDivisionObj(res.modRecord) };
              }
              return division;
            });
          }
          return ecdSector;
        })
      );

      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModDivisionFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== divisionId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом подразделении

  const showAddNewDivisionModal = () => {
    setIsAddNewDivisionModalVisible(true);
  };

  const handleAddNewDivisionOk = (ecdSector) => {
    handleAddNewDivision(ecdSector);
  };

  const handleAddNewDivisionCancel = () => {
    setIsAddNewDivisionModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы структурных подразделений ЭЦД
  const columns = ecdStructuralDivisionsTableColumns({
    isEditing,
    editingKey,
    handleEditECDStructuralDivision,
    handleCancelMod,
    handleStartEditECDStructuralDivision,
    handleDelECDStructuralDivision,
    recsBeingProcessed,
    getColumnSearchProps,
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
        inputType: col.dataIndex !== ECD_STRUCTURAL_DIVISION_FIELDS.POSITION ? 'text' : 'number',
        dataType: col.dataIndex !== ECD_STRUCTURAL_DIVISION_FIELDS.POSITION ? 'string' : 'number',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: ![ECD_STRUCTURAL_DIVISION_FIELDS.POST,
                    ECD_STRUCTURAL_DIVISION_FIELDS.FIO,
                    ECD_STRUCTURAL_DIVISION_FIELDS.POSITION].includes(col.dataIndex),
        errMessage: modDivisionFieldsErrs ? modDivisionFieldsErrs[col.dataIndex] : null,
      }),
    };
  });

  return (
    <Form form={form} component={false}>
      <NewECDStructuralDivisionModal
        isModalVisible={isAddNewDivisionModalVisible}
        handleAddNewDivisionOk={handleAddNewDivisionOk}
        handleAddNewDivisionCancel={handleAddNewDivisionCancel}
        divisionFieldsErrs={divisionFieldsErrs}
        clearAddDivisionMessages={clearAddDivisionMessages}
        recsBeingAdded={recsBeingAdded}
      />
      <Button type="primary" onClick={showAddNewDivisionModal}>
        Добавить запись
      </Button>

      <Table
        components={{
          body: {
            cell: EditableTableCell
          },
        }}
        bordered
        dataSource={ecdSectorStructuralDivisions}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: handleCancelMod,
        }}
        sticky={true}
        onRow={(record) => {
          return {
            onDoubleClick: () => { handleStartEditECDStructuralDivision(record) },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEditECDStructuralDivision(record[ECD_STRUCTURAL_DIVISION_FIELDS.KEY]);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default ECDStructuralDivisionsTable;
