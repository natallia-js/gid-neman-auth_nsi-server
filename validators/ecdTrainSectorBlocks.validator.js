const { check, body } = require('express-validator');

const modECDTrainSectorBlocksListValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ЭЦД'),
    check('blockIds')
      .exists()
      .withMessage('Не указан массив id перегонов поездного участка ЭЦД')
      .bail()
      .isArray()
      .withMessage('Список id перегонов поездного участка ЭЦД должен быть массивом')
  ];
};

const delECDTrainSectorBlockValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ЭЦД'),
    check('blockId')
      .exists()
      .withMessage('Не указан id перегона'),
  ];
};

const modECDTrainSectorBlockValidationRules = () => {
  return [
    check('trainSectorId')
      .exists()
      .withMessage('Не указан id поездного участка ЭЦД'),
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
      .withMessage('Принадлежность перегона участку ЭЦД должна определяться одним из значений {0,1}'),
  ];
};

module.exports = {
  modECDTrainSectorBlocksListValidationRules,
  delECDTrainSectorBlockValidationRules,
  modECDTrainSectorBlockValidationRules,
};
