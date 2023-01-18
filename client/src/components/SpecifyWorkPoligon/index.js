import React, { useState, useEffect } from 'react';
import { ALL_SECTORS_MARK } from '../../constants';

const SpecifyWorkPoligon = () => {
  // true - идет процесс получения данных о рабочих полигонах
  const [gettingWorkPoligonsData, setGettingWorkPoligonsData] = useState(false);
  // тип выбранного рабочего полигона
  const [selectedSectorType, setSelectedSectorType] = useState(ALL_SECTORS_MARK);
  // информация обо всех рабочих полигонах выбранного типа
  const [workPoligons, setWorkPoligons] = useState([]);


};

export default SpecifyWorkPoligon;
