import React, { useContext, useRef } from 'react';
import { Button, Form, Input, Tooltip } from 'antd';
import { ServerAPI, ECDSECTOR_FIELDS, TRAIN_SECTOR_FIELDS } from '../../constants';
import { PlusOutlined } from '@ant-design/icons';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import ECDTrainSectorsTable from './ECDTrainSectorsTable';
import getAppECDTrainSectorFromDBECDTrainSectorObj from '../../mappers/getAppECDTrainSectorFromDBECDTrainSectorObj';

import './styles.scss';


/**
 * Компонент блока с информацией о поездных участках ЭЦД данного участка ЭЦД.
 * Позволяет редактировать информацию о поездных участках ЭЦД.
 */
const ECDTrainSectorsBlock = (props) => {
  const {
    currECDSectorRecord: record, // текущая запись об участке ЭЦД
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ЭЦД
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
   * Добавление нового поездного участка для текущего участка ЭЦД в БД.
   */
  const handleAdd = async () => {
    if (newSectorTitleInputRef && newSectorTitleInputRef.current) {
      try {
        // Делаем запрос на сервер с целью добавления информации о новом участке
        const res = await request(ServerAPI.ADD_ECDTRAINSECTORS_DATA, 'POST',
          {
            name: newSectorTitleInputRef.current.state.value,
            ecdSectorId: record[ECDSECTOR_FIELDS.KEY],
          },
          { Authorization: `Bearer ${auth.token}` }
        );

        message(MESSAGE_TYPES.SUCCESS, res.message);

        // Обновляем локальное состояние
        const newSector = getAppECDTrainSectorFromDBECDTrainSectorObj(res.sector);

        setTableDataCallback((value) => value.map((ecdSector) => {
          if (ecdSector[ECDSECTOR_FIELDS.KEY] === record[ECDSECTOR_FIELDS.KEY]) {
            return {
              ...ecdSector,
              [ECDSECTOR_FIELDS.TRAIN_SECTORS]: [...ecdSector[ECDSECTOR_FIELDS.TRAIN_SECTORS], newSector],
            };
          }
          return ecdSector;
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
        В данном столбце формируем список поездных участков ЭЦД текущего участка ЭЦД
      */}
      <div className="train-sectors-info-sub-block">
        <p className="train-sectors-title">Поездные участки ЭЦД</p>
        <Form
          layout="horizontal"
          size='small'
          form={form}
          name="new-ecdtrainsector-form"
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
        <ECDTrainSectorsTable
          currECDSectorRecord={record}
          setTableDataCallback={setTableDataCallback}
        />
      </div>
    </div>
  );
};

 export default ECDTrainSectorsBlock;
