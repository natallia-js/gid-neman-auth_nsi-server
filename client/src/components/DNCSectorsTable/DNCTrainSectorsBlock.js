import React, { useContext, useState } from 'react';
import { Button, Form, Input, Typography, Row, Col } from 'antd';
import { ServerAPI, DNCSECTOR_FIELDS, TRAIN_SECTOR_FIELDS } from '../../constants';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import DNCTrainSectorsTable from './DNCTrainSectorsTable';
import getAppDNCTrainSectorFromDBDNCTrainSectorObj from '../../mappers/getAppDNCTrainSectorFromDBDNCTrainSectorObj';

const { Text, Title } = Typography;
const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент блока с информацией о поездных участках ДНЦ данного участка ДНЦ.
 * Позволяет редактировать информацию о поездных участках ДНЦ.
 */
const DNCTrainSectorsBlock = (props) => {
  const {
    currDNCSectorRecord: record, // текущая запись об участке ДНЦ
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ДНЦ
    stations, // список всех станций ЖД
    blocks, // список всех перегонов ЖД
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Сюда помещается информация, содержащаяся в поле ввода формы
  const [form] = Form.useForm();

  // Ошибки добавления информации о новом поездном участке
  const [trainSectorFieldsErrs, setTrainSectorFieldsErrs] = useState(null);

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);


  /**
   * Добавление нового поездного участка для текущего участка ДНЦ в БД.
   */
  const handleAdd = async (newSectorTitle) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о новом участке
      const res = await request(ServerAPI.ADD_DNCTRAINSECTORS_DATA, 'POST',
        {
          name: newSectorTitle,
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

      setTrainSectorFieldsErrs(null);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setTrainSectorFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   */
  const onFinish = (values) => {
    handleAdd(values[TRAIN_SECTOR_FIELDS.NAME]);
  };


  return (
    <>
      <Row>
        <Col>
        <Title level={4}>Поездные участки ДНЦ</Title>
        </Col>
      </Row>
      <Row>
        <Col span={8}>
          <Form
            layout="horizontal"
            size='small'
            form={form}
            name="new-dnctrainsector-form"
            onFinish={onFinish}
          >
            <Row wrap={false}>
              <Col flex="auto">
                <Form.Item
                  label="Добавить участок"
                  name={TRAIN_SECTOR_FIELDS.NAME}
                  validateStatus={trainSectorFieldsErrs && trainSectorFieldsErrs[TRAIN_SECTOR_FIELDS.NAME] ? ERR_VALIDATE_STATUS : null}
                  help={trainSectorFieldsErrs ? trainSectorFieldsErrs[TRAIN_SECTOR_FIELDS.NAME] : null}
                >
                  <Input
                    autoComplete="off"
                    placeholder="Название добавляемого участка"
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Добавить
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
      <Row>
        <Col>
          { recsBeingAdded > 0 && <Text type="warning">На сервер отправлено {recsBeingAdded} новых записей. Ожидаю ответ...</Text> }
        </Col>
      </Row>
      {/*
        Формируем список поездных участков ДНЦ текущего участка ДНЦ
      */}
      <Row>
        <Col>
          <DNCTrainSectorsTable
            currDNCSectorRecord={record}
            setTableDataCallback={setTableDataCallback}
            stations={stations}
            blocks={blocks}
          />
        </Col>
      </Row>
    </>
  );
};


export default DNCTrainSectorsBlock;
