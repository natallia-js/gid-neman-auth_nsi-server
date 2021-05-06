const { check, body } = require('express-validator');

const modECDTrainSectorStationsListValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ЭЦД'),
    check('stationIds')
      .exists()
      .withMessage('Не указан массив id станций поездного участка ЭЦД')
      .bail()
      .isArray()
      .withMessage('Список id станций поездного участка ЭЦД должен быть массивом')
  ];
};

const delECDTrainSectorStationValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ЭЦД'),
    check('stationId')
      .exists()
      .withMessage('Не указан id станции'),
  ];
};

const modECDTrainSectorStationValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ЭЦД'),
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
      .withMessage('Принадлежность станции участку ЭЦД должна определяться одним из значений {0,1}'),
  ];
};

module.exports = {
  modECDTrainSectorStationsListValidationRules,
  delECDTrainSectorStationValidationRules,
  modECDTrainSectorStationValidationRules,
};
