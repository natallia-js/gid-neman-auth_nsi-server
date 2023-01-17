const { Router } = require('express');
const ServerLog = require('../models/ServerLog');
const { addError } = require('../serverSideProcessing/processLogsActions');
const { getLogsRules } = require('../validators/logs.validator');
const validate = require('../validators/validate');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');
const escapeSpecialCharactersInRegexString = require('../additional/escapeSpecialCharactersInRegexString');

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
 * filterFields - массив объектов {field, value} с условиями поиска по массиву информации (value - строка)
 * page - номер страницы, данные по которой необходимо получить (поддерживается пагинация; если не указан,
 *        то запрос возвращает все найденные документы)
 * docsCount - количество документов, которое запрос должен вернуть (поддерживается пагинация; если не указан,
 *             то запрос возвращает все найденные документы)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_SERVER_ACTIONS_LOGS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getLogsRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { datetimeStart, datetimeEnd, filterFields, page, docsCount } = req.body;

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
      // Дополнительные критерии фильтрации данных
      if (filterFields?.length) {
        filterFields.forEach((filter) => {
          if (filter?.field && filter?.value)
            matchFilter[filter.field] = new RegExp(escapeSpecialCharactersInRegexString(filter.value), 'i');
        });
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
        error: error.message,
        actionParams: {
          datetimeStart, datetimeEnd, page, docsCount,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
