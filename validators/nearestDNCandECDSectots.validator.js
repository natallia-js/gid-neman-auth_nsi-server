const { check } = require('express-validator');

const addECDToDNCValidationRules = () => {
  return [
    check('dncSectorId')
      .exists()
      .withMessage('Не определен id участка ДНЦ'),
    check('ecdSectorIds')
      .exists()
      .withMessage('Не указан массив id ближайших участков ЭЦД')
      .bail()
      .isArray()
      .withMessage('Массив id ближайших участков ЭЦД должен быть массивом')
  ];
};

const addDNCToECDValidationRules = () => {
  return [
    check('ecdSectorId')
      .exists()
      .withMessage('Не определен id участка ЭЦД'),
    check('dncSectorIds')
      .exists()
      .withMessage('Не указан массив id ближайших участков ДНЦ')
      .bail()
      .isArray()
      .withMessage('Массив id ближайших участков ДНЦ должен быть массивом')
  ];
};

const delNearestDNCOrECDValidationRules = () => {
  return [
    check('dncSectorID')
      .exists()
      .withMessage('Не определен id участка ДНЦ'),
    check('ecdSectorID')
      .exists()
      .withMessage('Не определен id участка ЭЦД'),
  ];
};

const changeNearestECDSectorsValidationRules = () => {
  return [
    check('sectorId')
      .exists()
      .withMessage('Не определен id участка ДНЦ'),
    check('nearestECDSectIds')
      .exists()
      .withMessage('Не указан массив id ближайших участков ЭЦД')
      .bail()
      .isArray()
      .withMessage('Список id ближайших участков ЭЦД должен быть массивом'),
  ];
};

const changeNearestDNCSectorsValidationRules = () => {
  return [
    check('sectorId')
      .exists()
      .withMessage('Не определен id участка ЭЦД'),
    check('nearestDNCSectIds')
      .exists()
      .withMessage('Не указан массив id ближайших участков ДНЦ')
      .bail()
      .isArray()
      .withMessage('Список id ближайших участков ДНЦ должен быть массивом'),
  ];
};

module.exports = {
  addECDToDNCValidationRules,
  addDNCToECDValidationRules,
  delNearestDNCOrECDValidationRules,
  changeNearestECDSectorsValidationRules,
  changeNearestDNCSectorsValidationRules,
};
