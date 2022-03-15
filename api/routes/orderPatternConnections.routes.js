const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const OrderPattern = require('../models/OrderPattern');
const {
  addOrderChildPatternValidationRules,
  delOrderChildPatternValidationRules,
} = require('../validators/orderPatterns.validator');
const validate = require('../validators/validate');
const { isMainAdmin } = require('../middleware/isMainAdmin.middleware');
const { addError } = require('../serverSideProcessing/processLogsActions');

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
  '/setChildPattern',
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
  checkGeneralCredentials,
  // проверка параметров запроса
  addOrderChildPatternValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { basePatternId, childPatternId, patternsParamsMatchingTable } = req.body;

    try {
      if (basePatternId === childPatternId) {
        return res.status(ERR).json({ message: 'Базовый и дочерний шаблоны не могут совпадать' });
      }

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

      // Для указанного базового шаблона проверяем наличие связи с указанным дочерним шаблоном
      if (baseCandidate.childPatterns.find((connection) => String(connection.childPatternId) === String(childPatternId))) {
        // Редактируем в БД существующую запись путем редактирования существующего объекта массива
        baseCandidate = Object.assign(baseCandidate, {
          childPatterns: baseCandidate.childPatterns.map((connection) => {
            if (String(connection.childPatternId) !== String(childPatternId)) {
              return connection;
            }
            return {
              childPatternId,
              patternsParamsMatchingTable,
            }
          }),
        });
      } else {
        // Редактируем в БД существующую запись путем добавления нового объекта в массив
        baseCandidate = Object.assign(baseCandidate, {
          childPatterns: [
            ...baseCandidate.childPatterns,
            {
              childPatternId,
              patternsParamsMatchingTable,
            },
          ],
        });
      }
      await baseCandidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', baseCandidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление дочернего шаблона распоряжения',
        error,
        actionParams: { basePatternId, childPatternId, patternsParamsMatchingTable },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление связи с шаблоном распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может удалить дочерний шаблон у любого распоряжения,
 * а иное лицо сможет удалить дочерний шаблон распоряжения лишь в рамках своей службы (т.е. когда
 * базовый и дочерний шаблоны принадлежат его службе).
 *
 * Параметры тела запроса:
 * basePatternId - идентификатор базового шаблона (обязателен),
 * childPatternId - идентификатор дочернего шаблона (обязателен),
 */
 router.post(
  '/delChildPattern',
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
  checkGeneralCredentials,
  // проверка параметров запроса
  delOrderChildPatternValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { basePatternId, childPatternId } = req.body;

    try {
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
          message: `Для удаления дочернего шаблона распоряжения базовый и дочерний шаблоны должны принадлежать службе ${serviceName}`
        });
      }

      // Для указанного базового шаблона проверяем наличие связи с указанным дочерним шаблоном.
      // Если не находим, то не можем удалить связь
      if (!baseCandidate.childPatterns.find((connection) => String(connection.childPatternId) === String(childPatternId))) {
        return res.status(ERR).json({ message: 'Связь между указанными шаблонами распоряжений не существует' });
      }

      // Редактируем в БД существующую запись
      baseCandidate = Object.assign(baseCandidate, {
        childPatterns: baseCandidate.childPatterns.filter((connection) => String(connection.childPatternId) !== String(childPatternId)),
      });
      await baseCandidate.save();

      res.status(OK).json({ message: 'Информация успешно удалена', baseCandidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление связи с шаблоном распоряжения',
        error,
        actionParams: { basePatternId, childPatternId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
