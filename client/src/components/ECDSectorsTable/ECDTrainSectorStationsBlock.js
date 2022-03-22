import React, { useContext, useState } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import { Typography, Row, Col, Button } from 'antd';
import { ServerAPI, STATION_FIELDS, TRAIN_SECTOR_FIELDS, ECDSECTOR_FIELDS } from '../../constants';
import EditTrainSectorStationListModal from '../EditTrainSectorStationListModal';
import ECDTrainSectorStationsTable from './ECDTrainSectorStationsTable';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';

const { Title } = Typography;


/**
 * Компонент блока с информацией о станциях, принадлежащих поездному участку ЭЦД.
 * Позволяет редактировать информацию о принадлежности станций участку.
 */
const ECDTrainSectorStationsBlock = (props) => {
  const {
    currTrainSectorRecord: record, // текущая запись о поездном участке ЭЦД
    stations, // все станции ЖД
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ЭЦД
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Видимо либо нет модальное окно редактирования перечня станций
  const [isModalVisible, setIsModalVisible] = useState(false);

  // количество запущенных процессов редактирования списков станций поездных участков на сервере
  const [recsBeingProcessed, setRecsBeingProcessed] = useState(0);


  // ---------------------------------------------------------------
  // Для работы с диалоговым окном редактирования списка станций

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async (selectedStationsValues) => {
    setRecsBeingProcessed(value => value + 1);

    try {
      const res = await request(ServerAPI.MOD_ECDTRAINSECTORSTATIONLIST, 'POST',
        {
          trainSectorId: record[TRAIN_SECTOR_FIELDS.KEY],
          stationIds: selectedStationsValues.map((val) => {
            const stationObj = stations.find((station) => station[STATION_FIELDS.NAME_AND_CODE] === val);
            return stationObj[STATION_FIELDS.KEY];
          })
        },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) => value.map((ecdSector) => {
        const trainSector = ecdSector[ECDSECTOR_FIELDS.TRAIN_SECTORS]
          .find((trainSector) => trainSector[TRAIN_SECTOR_FIELDS.KEY] === record[TRAIN_SECTOR_FIELDS.KEY]);
        if (trainSector) {
          trainSector[TRAIN_SECTOR_FIELDS.STATIONS] =
            res.trainSectorStations.map((station) => getAppStationObjFromDBStationObj(station, true));
        }
        return ecdSector;
      }));

      setIsModalVisible(false);
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed(value => value - 1);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // ---------------------------------------------------------------


  return (
    <React.Fragment key={record[TRAIN_SECTOR_FIELDS.KEY]}>
      <EditTrainSectorStationListModal
        isModalVisible={isModalVisible}
        trainSectorName={record[TRAIN_SECTOR_FIELDS.NAME]}
        allStations={stations}
        selectedStations={record[TRAIN_SECTOR_FIELDS.STATIONS]}
        handleOk={handleOk}
        handleCancel={handleCancel}
        recsBeingProcessed={recsBeingProcessed}
      />
      <Row>
        <Col>
          <Title level={4}>Станции поездного участка</Title>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button type="primary" onClick={showModal}>
            Редактировать список
          </Button>
        </Col>
      </Row>
      <ECDTrainSectorStationsTable
        currECDTrainSectorRecord={record}
        setTableDataCallback={setTableDataCallback}
      />
    </React.Fragment>
  );
};


export default ECDTrainSectorStationsBlock;
