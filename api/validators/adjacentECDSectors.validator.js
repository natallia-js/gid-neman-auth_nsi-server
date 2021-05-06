const { check } = require('express-validator');

const addAdjacentECDSectorsValidationRules = () => {
  return [
    check('sectorID')
      .exists()
      .withMessage('Не определен id участка ЭЦД'),
    check('adjSectorIDs')
      .exists()
      .withMessage('Не указан массив id смежных участков ЭЦД')
      .bail()
      .isArray()
      .withMessage('Список id смежных участков ЭЦД должен быть массивом')
  ];
};

const delAdjacentECDSectorValidationRules = () => {
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
  addAdjacentECDSectorsValidationRules,
  delAdjacentECDSectorValidationRules,
  changeAdjacentSectorsValidationRules,
};
