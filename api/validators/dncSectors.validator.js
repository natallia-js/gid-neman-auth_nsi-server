const { check, body } = require('express-validator');

const getDefiniteStationDNCSectorsValidationRules = () => {
  return [
    check('stationId')
      .exists()
      .withMessage('Не указан id станции'),
    check('onlyHash')
      .if(body('onlyHash').exists())
      .isBoolean()
      .withMessage('Значение параметра запроса onlyHash должно принимать логическое значение'),
  ];
};

const getDefiniteDNCSectorValidationRules = () => {
  return [
    check('sectorId')
      .exists()
      .withMessage('Не указан id участка ДНЦ'),
    check('onlyHash')
      .if(body('onlyHash').exists())
      .isBoolean()
      .withMessage('Значение параметра запроса onlyHash должно принимать логическое значение'),
  ];
};

const getDefiniteDNCSectorsValidationRules = () => {
  return [
    check('dncSectorIds')
      .exists()
      .withMessage('Не указан массив id участков ДНЦ')
      .bail()
      .isArray()
      .withMessage('Список id участков ДНЦ должен быть массивом'),
  ];
};

const addDNCSectorValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования участка ДНЦ минимум 1 символ, максимум 32 символа'),
  ];
};

const delDNCSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого участка ДНЦ'),
  ];
};

const modDNCSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id участка ДНЦ'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования участка ДНЦ минимум 1 символ, максимум 32 символа'),
  ];
};

module.exports = {
  getDefiniteStationDNCSectorsValidationRules,
  getDefiniteDNCSectorValidationRules,
  getDefiniteDNCSectorsValidationRules,
  addDNCSectorValidationRules,
  delDNCSectorValidationRules,
  modDNCSectorValidationRules,
};
