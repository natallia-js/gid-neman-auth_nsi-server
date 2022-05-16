const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const ServerLog = require('../models/ServerLog');
const { addError } = require('../serverSideProcessing/processLogsActions');
const { getLogsRules } = require('../validators/logs.validator');
const validate = require('../validators/validate');
const { AUTH_NSI_ACTIONS, hasUserRightToPerformAction } = require('../middleware/hasUserRightToPerformAction.middleware');

const router = Router();

const { OK, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка логов действий сервера.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * datetimeStart - дата-время начала поиска информации (обязателен)
 * datetimeEnd - дата-время окончания поиска информации (не обязателен, если не указан, то
 *               информация извлекается начиная с указанной даты до настоящего момента времени)
 * page - номер страницы, данные по которой необходимо получить (поддерживается пагинация; если не указан,
 *        то запрос возвращает все найденные документы)
 * docsCount - количество документов, которое запрос должен вернуть (поддерживается пагинация; если не указан,
 *             то запрос возвращает все найденные документы)
 */
 router.post(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_SERVER_ACTIONS_LOGS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getLogsRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { datetimeStart, datetimeEnd, page, docsCount } = req.body;

    try {
      const startDate = new Date(datetimeStart);
      const endDate = new Date(datetimeEnd);

      // Поиск по дате-времени издания
      const matchFilter = {};
      if (!datetimeEnd) {
        matchFilter.actionTime = { $gte: startDate };
      } else {
        matchFilter.actionTime = { $gte: startDate, $lte: endDate };
      }

      // Применяем сортировку
      let sortConditions = {
        actionTime: 1,
        _id: 1,
      };

      const aggregation = [
        { $match: matchFilter },
        { $sort: sortConditions },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          data: { $push: '$$ROOT' },
        } },
        { $project: {
          total: 1,
          // skip = page > 0 ? (page - 1) * docsCount : 0
          // limit = docsCount || 1000000
          data: { $slice: ['$data', page > 0 ? (page - 1) * docsCount : 0, docsCount || 1000000] },
        } },
      ];

      // Ищем данные
      const data = await ServerLog.aggregate(aggregation);

      res.status(OK).json({
        data: data && data[0] ? data[0].data : [],
        totalRecords: data && data[0] ? data[0].total : 0,
      });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка логов действий сервера',
        error,
        actionParams: {
          datetimeStart, datetimeEnd, page, docsCount,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
