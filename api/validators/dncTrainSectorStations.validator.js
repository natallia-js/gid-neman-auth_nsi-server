const { check, body } = require('express-validator');

const modDNCTrainSectorStationsListValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ДНЦ'),
    check('stationIds')
      .exists()
      .withMessage('Не указан массив id станций поездного участка ДНЦ')
      .bail()
      .isArray()
      .withMessage('Список id станций поездного участка ДНЦ должен быть массивом')
  ];
};

const delDNCTrainSectorStationValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ДНЦ'),
    check('stationId')
      .exists()
      .withMessage('Не указан id станции'),
  ];
};

const modDNCTrainSectorStationValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ДНЦ'),
    check('stationId')
      .exists()
      .withMessage('Не указан id станции'),
    check('posInTrainSector')
      .if(body('posInTrainSector').exists())
      .trim()
      .isInt({ min: 0 })
      .withMessage('Позиция станции на поездном участке должна быть целым числом, минимальное значение 0'),
    check('belongsToSector')
      .if(body('belongsToSector').exists())
      .trim()
      .isInt({ min: 0, max: 1 })
      .withMessage('Принадлежность станции участку ДНЦ должна определяться одним из значений {0,1}'),
  ];
};

module.exports = {
  modDNCTrainSectorStationsListValidationRules,
  delDNCTrainSectorStationValidationRules,
  modDNCTrainSectorStationValidationRules,
};
