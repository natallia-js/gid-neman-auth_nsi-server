import React, { useState, useEffect } from 'react';
import { Col, Row, Select } from 'antd';
import { ALL_SECTORS_MARK, WORK_POLIGON_TYPES } from '../../constants';
import { useStations } from '../../serverRequests/stations';
import { useDNCSectors } from '../../serverRequests/dncSectors';
import { useECDSectors } from '../../serverRequests/ecdSectors';

const { Option } = Select;


const SpecifyWorkPoligons = (props) => {
  const {
    // массив объектов {type,id} - типы и идентификаторы рабочих полигонов (у всех полигонов типы должны быть одинаковыми)
    value = null,
    onChange,
    onError,
    availableStationWorkPoligons,
    availableDNCSectorWorkPoligons,
    availableECDSectorWorkPoligons,
  } = props;

  // true - идет процесс получения данных о рабочих полигонах
  const [gettingWorkPoligonsData, setGettingWorkPoligonsData] = useState(false);
  // тип выбранных рабочих полигонов
  const [selectedWorkPoligonType, setSelectedWorkPoligonType] = useState(value?.length ? value[0].type : ALL_SECTORS_MARK);
  // id выбранных рабочих полигонов
  const [selectedWorkPoligonIds, setSelectedWorkPoligonIds] = useState(value?.length ? value.map(el => el.id) : []);
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
    setSelectedWorkPoligonIds([]);
  };


  useEffect(() => {
    getWorkPoligonsOfGivenType();
  }, [selectedWorkPoligonType]);


  const handleChangeWorkPoligonIds = (value) => {
    setSelectedWorkPoligonIds(value);
  };


  const getWorkPoligonName = (workPoligonId) => {
    if (!selectedWorkPoligonType) return null;
    switch (selectedWorkPoligonType) {
      case WORK_POLIGON_TYPES.STATION:
        if (!availableStationWorkPoligons?.length) return null;
        return availableStationWorkPoligons.find((el) => el.value === workPoligonId).label;
      case WORK_POLIGON_TYPES.DNC_SECTOR:
        if (!availableDNCSectorWorkPoligons?.length) return null;
        return availableDNCSectorWorkPoligons.find((el) => el.value === workPoligonId).label;
      case WORK_POLIGON_TYPES.ECD_SECTOR:
        if (!availableECDSectorWorkPoligons?.length) return null;
        return availableECDSectorWorkPoligons.find((el) => el.value === workPoligonId).label;
    }
    return null;
  }


  useEffect(() => {
    if (selectedWorkPoligonType === ALL_SECTORS_MARK || !selectedWorkPoligonIds.length) {
      onChange(null);
    } else {
      onChange(selectedWorkPoligonIds.map(el => ({ type: selectedWorkPoligonType, id: el, name: getWorkPoligonName(el) })));
    }
  }, [selectedWorkPoligonIds]);


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
            mode="multiple"
            style={{ width: '100%' }}
            value={selectedWorkPoligonIds}
            loading={gettingWorkPoligonsData}
            onChange={handleChangeWorkPoligonIds}
          >
            {
              workPoligons.map(wp =>
                <Option key={wp.value} value={wp.value}>
                  {wp.label}
                </Option>
              )
            }
          </Select>
        </Col>
      }
    </Row>
  );
};

export default SpecifyWorkPoligons;
