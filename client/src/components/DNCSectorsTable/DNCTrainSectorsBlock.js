import React, { useContext, useRef } from 'react';
import { Button, Form, Input, Tooltip } from 'antd';
import { ServerAPI, DNCSECTOR_FIELDS, TRAIN_SECTOR_FIELDS } from '../../constants';
import { PlusOutlined } from '@ant-design/icons';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import DNCTrainSectorsTable from './DNCTrainSectorsTable';
import getAppDNCTrainSectorFromDBDNCTrainSectorObj from '../../mappers/getAppDNCTrainSectorFromDBDNCTrainSectorObj';

import 'antd/dist/antd.css';
import './styles.scss';


/**
 * Компонент блока с информацией о поездных участках ДНЦ данного участка ДНЦ.
 * Позволяет редактировать информацию о поездных участках ДНЦ.
 */
const DNCTrainSectorsBlock = (props) => {
  const {
    currDNCSectorRecord: record, // текущая запись об участке ДНЦ
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ДНЦ
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // ссылка на input, где задается наименование нового поездного участка
  const newSectorTitleInputRef = useRef(null);

  // Ref для кнопки подтверждения ввода
  const submitBtnRef = useRef(null);

  // Сюда помещается информация, содержащаяся в поле ввода формы
  const [form] = Form.useForm();


  /**
   * Добавление нового поездного участка для текущего участка ДНЦ в БД.
   */
  const handleAdd = async () => {
    if (newSectorTitleInputRef && newSectorTitleInputRef.current) {
      try {
        // Делаем запрос на сервер с целью добавления информации о новом участке
        const res = await request(ServerAPI.ADD_DNCTRAINSECTORS_DATA, 'POST',
          {
            name: newSectorTitleInputRef.current.state.value,
            dncSectorId: record[DNCSECTOR_FIELDS.KEY],
          },
          { Authorization: `Bearer ${auth.token}` }
        );

        message(MESSAGE_TYPES.SUCCESS, res.message);

        // Обновляем локальное состояние
        const newSector = getAppDNCTrainSectorFromDBDNCTrainSectorObj(res.sector);

        setTableDataCallback((value) => value.map((dncSector) => {
          if (dncSector[DNCSECTOR_FIELDS.KEY] === record[DNCSECTOR_FIELDS.KEY]) {
            return {
              ...dncSector,
              [DNCSECTOR_FIELDS.TRAIN_SECTORS]: [...dncSector[DNCSECTOR_FIELDS.TRAIN_SECTORS], newSector],
            };
          }
          return dncSector;
        }));

      } catch (e) {
        message(MESSAGE_TYPES.ERROR, e.message);
      }
    }
  };


  /**
   * При нажатии кнопки Enter на текстовом поле ввода происходит подтверждение
   * пользователем окончания ввода.
   *
   * @param {object} event
   */
  const handleTrainSectorDataFieldClick = (event) => {
    if (event.key === 'Enter') {
      submitBtnRef.current.click();
    }
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   */
   const onFinish = (values) => {
    handleAdd({ ...values });
  };


  return (
    <div className="train-sectors-block">
      {/*
        В данном столбце формируем список поездных участков ДНЦ текущего участка ДНЦ
      */}
      <div className="train-sectors-info-sub-block">
        <p className="train-sectors-title">Поездные участки ДНЦ</p>
        <Form
          layout="horizontal"
          size='small'
          form={form}
          name="new-dnctrainsector-form"
          onFinish={onFinish}
        >
          <Form.Item
            name={TRAIN_SECTOR_FIELDS.NAME}
          >
            <Input
              autoComplete="off"
              onClick={handleTrainSectorDataFieldClick}
              placeholder="Название добавляемого участка"
              ref={newSectorTitleInputRef}
              addonAfter={
                <Tooltip title="Добавить поездной участок">
                  <Button
                    htmlType="submit"
                    shape="circle"
                    icon={<PlusOutlined />}
                    ref={submitBtnRef}
                  />
                </Tooltip>
              }
            />
          </Form.Item>
        </Form>
        <DNCTrainSectorsTable
          currDNCSectorRecord={record}
          setTableDataCallback={setTableDataCallback}
        />
      </div>
    </div>
  );
};

 export default DNCTrainSectorsBlock;
