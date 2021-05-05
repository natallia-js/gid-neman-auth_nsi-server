import React, { useContext, useState } from 'react';
import { Button, Form, Input, Typography, Row, Col } from 'antd';
import { ServerAPI, ECDSECTOR_FIELDS, TRAIN_SECTOR_FIELDS } from '../../constants';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import ECDTrainSectorsTable from './ECDTrainSectorsTable';
import getAppECDTrainSectorFromDBECDTrainSectorObj from '../../mappers/getAppECDTrainSectorFromDBECDTrainSectorObj';

const { Text, Title } = Typography;
const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент блока с информацией о поездных участках ЭЦД данного участка ЭЦД.
 * Позволяет редактировать информацию о поездных участках ЭЦД.
 */
const ECDTrainSectorsBlock = (props) => {
  const {
    currECDSectorRecord: record, // текущая запись об участке ЭЦД
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ЭЦД
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
   * Добавление нового поездного участка для текущего участка ЭЦД в БД.
   */
  const handleAdd = async (newSectorTitle) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о новом участке
      const res = await request(ServerAPI.ADD_ECDTRAINSECTORS_DATA, 'POST',
        {
          name: newSectorTitle,
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
        <Title level={4}>Поездные участки ЭЦД</Title>
        </Col>
      </Row>
      <Row>
        <Col span={8}>
          <Form
            layout="horizontal"
            size='small'
            form={form}
            name="new-ecdtrainsector-form"
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
        Формируем список поездных участков ЭЦД текущего участка ЭЦД
      */}
      <Row>
        <Col>
          <ECDTrainSectorsTable
            currECDSectorRecord={record}
            setTableDataCallback={setTableDataCallback}
            stations={stations}
            blocks={blocks}
          />
        </Col>
      </Row>
    </>
  );
};


export default ECDTrainSectorsBlock;
