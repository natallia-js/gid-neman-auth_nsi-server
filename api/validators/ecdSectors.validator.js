const { check, body } = require('express-validator');

const getDefiniteECDSectorsValidationRules = () => {
  return [
    check('ecdSectorIds')
      .exists()
      .withMessage('Не указан массив id участков ЭЦД')
      .bail()
      .isArray()
      .withMessage('Список id участков ЭЦД должен быть массивом'),
  ];
};

const addECDSectorValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования участка ЭЦД минимум 1 символ, максимум 32 символа'),
  ];
};

const delECDSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого участка ЭЦД'),
  ];
};

const modECDSectorValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id участка ЭЦД'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 32 })
      .withMessage('Длина наименования участка ЭЦД минимум 1 символ, максимум 32 символа'),
  ];
};

module.exports = {
  getDefiniteECDSectorsValidationRules,
  addECDSectorValidationRules,
  delECDSectorValidationRules,
  modECDSectorValidationRules,
};
