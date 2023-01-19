import React, { useState, useEffect } from 'react';
import { Col, Row, Select } from 'antd';
import { ALL_SECTORS_MARK, WORK_POLIGON_TYPES } from '../../constants';
import { useStations } from '../../serverRequests/stations';
import { useDNCSectors } from '../../serverRequests/dncSectors';
import { useECDSectors } from '../../serverRequests/ecdSectors';

const { Option } = Select;


const SpecifyWorkPoligon = (props) => {
  const {
    value = null,
    onChange,
    onError,
    availableStationWorkPoligons,
    availableDNCSectorWorkPoligons,
    availableECDSectorWorkPoligons,
  } = props;

  // true - идет процесс получения данных о рабочих полигонах
  const [gettingWorkPoligonsData, setGettingWorkPoligonsData] = useState(false);
  // тип выбранного рабочего полигона
  const [selectedWorkPoligonType, setSelectedWorkPoligonType] = useState(value?.type || ALL_SECTORS_MARK);
  // id выбранного рабочего полигона
  const [selectedWorkPoligonId, setSelectedWorkPoligonId] = useState(value?.id || null);
  // информация обо всех рабочих полигонах выбранного типа
  const [workPoligons, setWorkPoligons] = useState([]);

  const { getShortStationsData } = useStations();
  const { getShortDNCSectorsData } = useDNCSectors();
  const { getShortECDSectorsData } = useECDSectors();


  const getWorkPoligonsOfGivenType = async () => {
    let workPoligonsArray = [];

    if (!selectedWorkPoligonType) {
      setWorkPoligons(workPoligonsArray);
    }

    setGettingWorkPoligonsData(true);
    try {
      switch (selectedWorkPoligonType) {
        case WORK_POLIGON_TYPES.STATION:
          // Пустой массив пропускаем
          if (!availableStationWorkPoligons) {
            workPoligonsArray = await getShortStationsData({ mapStationToLabelValue: true });
          } else {
            workPoligonsArray = availableStationWorkPoligons;
          }
          break;
        case WORK_POLIGON_TYPES.DNC_SECTOR:
          // Пустой массив пропускаем
          if (!availableDNCSectorWorkPoligons) {
            workPoligonsArray = await getShortDNCSectorsData({ mapSectorToLabelValue: true });
          } else {
            workPoligonsArray = availableDNCSectorWorkPoligons;
          }
          break;
        case WORK_POLIGON_TYPES.ECD_SECTOR:
          // Пустой массив пропускаем
          if (!availableECDSectorWorkPoligons) {
            workPoligonsArray = await getShortECDSectorsData({ mapSectorToLabelValue: true });
          } else {
            workPoligonsArray = availableECDSectorWorkPoligons;
          }
          break;
      }
    } catch (e) {
      onError(e.message);
    } finally {
      setGettingWorkPoligonsData(false);
      setWorkPoligons(workPoligonsArray);
    }
  };


  const handleChangeWorkPoligonType = (value) => {
    setSelectedWorkPoligonType(value);
    setSelectedWorkPoligonId(null);
  };


  useEffect(() => {
    getWorkPoligonsOfGivenType();
  }, [selectedWorkPoligonType]);


  const handleChangeWorkPoligonId = (value) => {
    setSelectedWorkPoligonId(value);
  };


  useEffect(() => {
    if (selectedWorkPoligonType === ALL_SECTORS_MARK || !selectedWorkPoligonId) {
      onChange(null);
    } else {
      onChange({ type: selectedWorkPoligonType, id: selectedWorkPoligonId });
    }
  }, [selectedWorkPoligonId]);


  return (
    <Row gutter={8} wrap={true}>
      <Col flex="150px">
        <Select value={selectedWorkPoligonType} onChange={handleChangeWorkPoligonType} style={{ width: '100%' }}>
        {
          [ALL_SECTORS_MARK].concat(Object.values(WORK_POLIGON_TYPES)).map(type =>
            <Option key={type} value={type}>
              {type}
            </Option>
          )
        }
        </Select>
      </Col>
      {
        (selectedWorkPoligonType !== ALL_SECTORS_MARK) &&
        <Col flex="auto">
          <Select
            options={workPoligons}
            value={selectedWorkPoligonId}
            style={{ width: '100%' }}
            loading={gettingWorkPoligonsData}
            onChange={handleChangeWorkPoligonId}
            dropdownMatchSelectWidth={false}
          />
        </Col>
      }
    </Row>
  );
};

export default SpecifyWorkPoligon;
