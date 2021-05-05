const { check, body } = require('express-validator');

const modDNCTrainSectorBlocksListValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ДНЦ'),
    check('blockIds')
      .exists()
      .withMessage('Не указан массив id перегонов поездного участка ДНЦ')
      .bail()
      .isArray()
      .withMessage('Список id перегонов поездного участка ДНЦ должен быть массивом')
  ];
};

const delDNCTrainSectorBlockValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ДНЦ'),
    check('blockId')
      .exists()
      .withMessage('Не указан id перегона'),
  ];
};

const modDNCTrainSectorBlockValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ДНЦ'),
    check('blockId')
      .exists()
      .withMessage('Не указан id перегона'),
    check('posInTrainSector')
      .if(body('posInTrainSector').exists())
      .trim()
      .isInt({ min: 0 })
      .withMessage('Позиция перегона на поездном участке должна быть целым числом, минимальное значение 0'),
    check('belongsToSector')
      .if(body('belongsToSector').exists())
      .trim()
      .isInt({ min: 0, max: 1 })
      .withMessage('Принадлежность перегона участку ДНЦ должна определяться одним из значений {0,1}'),
  ];
};

module.exports = {
  modDNCTrainSectorBlocksListValidationRules,
  delDNCTrainSectorBlockValidationRules,
  modDNCTrainSectorBlockValidationRules,
};
