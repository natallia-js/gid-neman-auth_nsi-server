const { check } = require('express-validator');

const addAdjacentDNCSectorsValidationRules = () => {
  return [
    check('sectorID')
      .exists()
      .withMessage('Не определен id участка ДНЦ'),
    check('adjSectorIDs')
      .exists()
      .withMessage('Не указан массив id смежных участков ДНЦ')
      .bail()
      .isArray()
      .withMessage('Список id смежных участков ДНЦ должен быть массивом'),
  ];
};

const delAdjacentDNCSectorValidationRules = () => {
  return [
    check('sectorID1')
      .exists()
      .withMessage('Не определен id участка'),
    check('sectorID2')
      .exists()
      .withMessage('Не определен id смежного участка'),
  ];
};

const changeAdjacentSectorsValidationRules = () => {
  return [
    check('sectorId')
      .exists()
      .withMessage('Не определен id участка'),
    check('adjacentSectIds')
      .exists()
      .withMessage('Не указан массив id смежных участков')
      .bail()
      .isArray()
      .withMessage('Список id смежных участков должен быть массивом'),
  ];
};

module.exports = {
  addAdjacentDNCSectorsValidationRules,
  delAdjacentDNCSectorValidationRules,
  changeAdjacentSectorsValidationRules,
};
