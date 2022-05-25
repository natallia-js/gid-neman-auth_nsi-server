import React, { useState } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import { Typography, Row, Col, Button } from 'antd';
import { ServerAPI, BLOCK_FIELDS, TRAIN_SECTOR_FIELDS, DNCSECTOR_FIELDS } from '../../constants';
import EditTrainSectorBlockListModal from '../EditTrainSectorBlockListModal';
import DNCTrainSectorBlocksTable from './DNCTrainSectorBlocksTable';
import getAppBlockObjFromDBBlockObj from '../../mappers/getAppBlockObjFromDBBlockObj';

const { Title } = Typography;


/**
 * Компонент блока с информацией о перегонах, принадлежащих поездному участку ДНЦ.
 * Позволяет редактировать информацию о принадлежности перегонов участку.
 */
const DNCTrainSectorBlocksBlock = (props) => {
  const {
    currTrainSectorRecord: record, // текущая запись о поездном участке ДНЦ
    blocks, // все перегоны, которыми пользователь может оперировать
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ДНЦ
  } = props;

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Видимо либо нет модальное окно редактирования перечня станций
  const [isModalVisible, setIsModalVisible] = useState(false);

  // количество запущенных процессов редактирования списков перегонов поездных участков на сервере
  const [recsBeingProcessed, setRecsBeingProcessed] = useState(0);


  // ---------------------------------------------------------------
  // Для работы с диалоговым окном редактирования списка перегонов

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async (selectedBlocksValues) => {
    setRecsBeingProcessed(value => value + 1);

    try {
      const res = await request(ServerAPI.MOD_DNCTRAINSECTORBLOCKLIST, 'POST',
        {
          trainSectorId: record[TRAIN_SECTOR_FIELDS.KEY],
          blockIds: selectedBlocksValues.map((val) => {
            const blockObj = blocks.find((block) => block[BLOCK_FIELDS.NAME] === val);
            return blockObj[BLOCK_FIELDS.KEY];
          })
        }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) => value.map((dncSector) => {
        const trainSector = dncSector[DNCSECTOR_FIELDS.TRAIN_SECTORS]
          .find((trainSector) => trainSector[TRAIN_SECTOR_FIELDS.KEY] === record[TRAIN_SECTOR_FIELDS.KEY]);
        if (trainSector) {
          trainSector[TRAIN_SECTOR_FIELDS.BLOCKS] =
            res.trainSectorBlocks.map((block) => getAppBlockObjFromDBBlockObj(block, true));
        }
        return dncSector;
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
      <EditTrainSectorBlockListModal
        isModalVisible={isModalVisible}
        trainSectorName={record[TRAIN_SECTOR_FIELDS.NAME]}
        allBlocks={blocks}
        selectedBlocks={record[TRAIN_SECTOR_FIELDS.BLOCKS]}
        handleOk={handleOk}
        handleCancel={handleCancel}
        recsBeingProcessed={recsBeingProcessed}
      />
      <Row>
        <Col>
          <Title level={4}>Перегоны поездного участка</Title>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button type="primary" onClick={showModal}>
            Редактировать список
          </Button>
        </Col>
      </Row>
      <DNCTrainSectorBlocksTable
        currDNCTrainSectorRecord={record}
        setTableDataCallback={setTableDataCallback}
      />
    </React.Fragment>
  );
};


export default DNCTrainSectorBlocksBlock;
