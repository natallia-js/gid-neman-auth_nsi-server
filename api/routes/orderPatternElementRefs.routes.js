const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const OrderPatternElementRef = require('../models/OrderPatternElementRef');

const router = Router();

const {
  OK,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_ORDER_PATTERNS_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех возможных смысловых значений элементов
 * шаблонов распоряжений. Возвращается вся информация, содержащаяся в коллекции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
 router.get(
  '/fullData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_ORDER_PATTERNS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (_req, res) => {
    try {
      const data = await OrderPatternElementRef.find();
      res.status(OK).json(data);
    } catch (error) {
      console.log(error);
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
 */
 router.get(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [GET_ALL_ORDER_PATTERNS_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
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
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
