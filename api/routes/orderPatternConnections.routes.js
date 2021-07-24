const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const OrderPattern = require('../models/OrderPattern');
const {
  addOrderChildPatternValidationRules,
} = require('../validators/orderPatterns.validator');
const validate = require('../validators/validate');
const { isMainAdmin } = require('../middleware/isMainAdmin.middleware');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  MOD_ORDER_PATTERN_ACTION,
} = require('../constants');


/**
 * Обработка запроса на добавление дочернего шаблона распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может добавить дочерний шаблон к любому распоряжению,
 * а иное лицо сможет добавить дочерний шаблон распоряжения лишь в рамках своей службы (т.е. когда
 * базовый и дочерний шаблоны принадлежат его службе).
 *
 * Параметры тела запроса:
 * basePatternId - идентификатор базового шаблона (обязателен),
 * childPatternId - идентификатор дочернего шаблона (обязателен),
 * patternsParamsMatchingTable - массив соответствия параметров базового и дочернего шаблонов (не обязателен;
 *                               если не задан, то значение параметра должно быть пустым массивом),
 *   каждый элемент - объект с параметрами:
 *   baseParamId - идентификатор параметра базового шаблона (обязателен),
 *   childParamId - идентификатор параметра дочернего шаблона (обязателен)
 */
 router.post(
  '/addChildPattern',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [MOD_ORDER_PATTERN_ACTION],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка параметров запроса
  addOrderChildPatternValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { basePatternId, childPatternId, patternsParamsMatchingTable } = req.body;

      // Ищем в БД базовый шаблон распоряжения
      let baseCandidate = await OrderPattern.findById(basePatternId);
      if (!baseCandidate) {
        return res.status(ERR).json({ message: 'Указанный базовый шаблон распоряжения не найден' });
      }

      // Ищем в БД дочерний шаблон распоряжения
      const childCandidate = await OrderPattern.findById(childPatternId);
      if (!childCandidate) {
        return res.status(ERR).json({ message: 'Указанный дочерний шаблон распоряжения не найден' });
      }

      // Служба, которой принадлежит лицо, запрашивающее действие
      const serviceName = req.user.service;

      if (!isMainAdmin(req) && (serviceName !== baseCandidate.service) && (serviceName !== childCandidate.service)) {
        return res.status(ERR).json({
          message: `Для добавления дочернего шаблона распоряжения базовый и дочерний шаблоны должны принадлежать службе ${serviceName}`
        });
      }

      // Для указанного базового шаблона проверяем наличие связи с указанным дочерним шаблоном.
      // Если находим, то не можем создать аналогичную связь повторно
      if (baseCandidate.childPatterns.find((connection) => String(connection.childPatternId) === String(childPatternId))) {
        return res.status(ERR).json({ message: 'Связь между указанными шаблонами распоряжений уже существует' });
      }

      // Редактируем в БД существующую запись
      baseCandidate = Object.assign(baseCandidate, {
        childPatterns: [
          ...baseCandidate.childPatterns,
          {
            childPatternId,
            patternsParamsMatchingTable,
          },
        ],
      });
      await baseCandidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', baseCandidate });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
