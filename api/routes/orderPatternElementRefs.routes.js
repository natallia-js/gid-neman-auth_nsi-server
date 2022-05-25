const { Router } = require('express');
const OrderPatternElementRef = require('../models/OrderPatternElementRef');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех возможных смысловых значений элементов
 * шаблонов распоряжений. Возвращается вся информация, содержащаяся в коллекции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * 
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/fullData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ORDER_PATTERN_ELEMENT_REFS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await OrderPatternElementRef.find();
      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех возможных смысловых значений элементов шаблонов распоряжений',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка всех возможных смысловых значений элементов
 * шаблонов распоряжений. Информация о смысловых значениях возвращается с привязкой к типу элемента,
 * в виде массива строк - названий смысловых элементов.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * 
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ALL_ORDER_PATTERN_ELEMENT_REFS_AS_STRING_ARRAYS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (_req, res) => {
    try {
      const data = await OrderPatternElementRef.find();
      res.status(OK).json(data.map((item) => {
        return {
          elementType: item.elementType,
          possibleRefs: item.possibleRefs.map((el) => el.refName),
        };
      }));
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех возможных смысловых значений элементов шаблонов распоряжений с привязкой к типу элемента',
        error: error.message,
        actionParams: {},
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
