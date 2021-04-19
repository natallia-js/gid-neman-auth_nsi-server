const { check, body } = require('express-validator');

const addBlockValidationRules = () => {
  return [
    check('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования перегона 1 символ'),
    check('station1')
      .exists()
      .withMessage('Не определена граничная станция 1 перегона'),
    check('station2')
      .exists()
      .withMessage('Не определена граничная станция 2 перегона'),
  ];
};

const delBlockValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого перегона'),
  ];
};

const modBlockValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id перегона'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1 })
      .withMessage('Минимальная длина наименования перегона 1 символ'),
  ];
};

module.exports = {
  addBlockValidationRules,
  delBlockValidationRules,
  modBlockValidationRules,
};
