import React, { useState, useEffect } from 'react';
import { Col, Row, Select } from 'antd';
import {
  ALL_SECTORS_MARK,
  DNCSECTOR_FIELDS,
  ECDSECTOR_FIELDS,
  ServerAPI,
  STATION_FIELDS,
  WORK_POLIGON_TYPES,
} from '../../constants';
import compareStrings from '../../sorters/compareStrings';
import { useHttp } from '../../hooks/http.hook';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';
import getAppDNCSectorObjFromDBDNCSectorObj from '../../mappers/getAppDNCSectorObjFromDBDNCSectorObj';
import getAppECDSectorObjFromDBECDSectorObj from '../../mappers/getAppECDSectorObjFromDBECDSectorObj';

const { Option } = Select;


const SpecifyWorkPoligon = ({ workPoligon, onChangeValue, onError }) => {
  // true - идет процесс получения данных о рабочих полигонах
  const [gettingWorkPoligonsData, setGettingWorkPoligonsData] = useState(false);
  // тип выбранного рабочего полигона
  const [selectedWorkPoligonType, setSelectedWorkPoligonType] = useState(workPoligon?.type || ALL_SECTORS_MARK);
  // id выбранного рабочего полигона
  const [selectedWorkPoligonId, setSelectedWorkPoligonId] = useState(workPoligon?.id || null);
  // информация обо всех рабочих полигонах выбранного типа
  const [workPoligons, setWorkPoligons] = useState([]);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();


  const getWorkPoligonsOfGivenType = async () => {
    let workPoligonsArray = [];

    if (!selectedWorkPoligonType) {
      setWorkPoligons(workPoligonsArray);
    }

    setGettingWorkPoligonsData(true);
    try {
      switch (selectedWorkPoligonType) {
        case WORK_POLIGON_TYPES.STATION:
          workPoligonsArray = await request(ServerAPI.GET_STATIONS_DATA, 'POST', {});
          workPoligonsArray = workPoligonsArray
            .map((station) => getAppStationObjFromDBStationObj(station))
            .map((station) => ({ label: station[STATION_FIELDS.NAME], value: station[STATION_FIELDS.KEY] }))
            .sort((a, b) => compareStrings(a.label.toLowerCase(), b.label.toLowerCase()));
          break;
        case WORK_POLIGON_TYPES.DNC_SECTOR:
          workPoligonsArray = await request(ServerAPI.GET_DNCSECTORS_SHORT_DATA, 'POST', {});
          workPoligonsArray = workPoligonsArray
            .map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector))
            .map((sector) => ({ label: sector[DNCSECTOR_FIELDS.NAME], value: sector[DNCSECTOR_FIELDS.KEY] }))
            .sort((a, b) => compareStrings(a.label.toLowerCase(), b.label.toLowerCase()));
          break;
        case WORK_POLIGON_TYPES.ECD_SECTOR:
          workPoligonsArray = await request(ServerAPI.GET_ECDSECTORS_SHORT_DATA, 'POST', {});
          workPoligonsArray = workPoligonsArray
            .map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector))
            .map((sector) => ({ label: sector[ECDSECTOR_FIELDS.NAME], value: sector[ECDSECTOR_FIELDS.KEY] }))
            .sort((a, b) => compareStrings(a.label.toLowerCase(), b.label.toLowerCase()));
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
    if (selectedWorkPoligonType === ALL_SECTORS_MARK || !selectedWorkPoligonId)
      onChangeValue(null);
    else
      onChangeValue({ type: selectedWorkPoligonType, id: selectedWorkPoligonId });
  }, [selectedWorkPoligonId]);


  return (
    <Row gutter={8} wrap={false}>
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
          />
        </Col>
      }
    </Row>
  );
};

export default SpecifyWorkPoligon;
