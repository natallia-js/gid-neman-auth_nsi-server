const { check, body } = require('express-validator');

const addBlockTrackValidationRules = () => {
  return [
    check('blockId')
      .exists()
      .withMessage('Не указан id перегона'),
    check('name')
      .trim()
      .isLength({ min: 1, max: 16 })
      .withMessage('Длина наименования пути перегона минимум 1 символ, максимум 16 символов'),
  ];
};

const delBlockTrackValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id удаляемого пути перегона'),
  ];
};

const modBlockTrackValidationRules = () => {
  return [
    check('id')
      .exists()
      .withMessage('Не указан id пути перегона'),
    check('name')
      .if(body('name').exists())
      .trim()
      .isLength({ min: 1, max: 16 })
      .withMessage('Длина наименования пути перегона минимум 1 символ, максимум 16 символов'),
  ];
};

module.exports = {
  addBlockTrackValidationRules,
  delBlockTrackValidationRules,
  modBlockTrackValidationRules,
};
