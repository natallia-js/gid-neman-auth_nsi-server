const { Router } = require('express');
const mongoose = require('mongoose');
const OrderPattern = require('../models/OrderPattern');
const {
  addOrderPatternValidationRules,
  delOrderPatternValidationRules,
  modOrderPatternValidationRules,
  modOrderPatternsCategoryValidationRules,
} = require('../validators/orderPatterns.validator');
const validate = require('../validators/validate');
const { isMainAdmin } = require('../middleware/checkMainAdmin');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех шаблонов распоряжений, которые являются общими
 * (не приватными! т.е. не созданными конкретным лицом лично для себя) для использования.
 *
 * Параметр запроса (userId - id пользователя), если указан, то определяет дополнительные шаблоны, которые
 * необходимо включить в выборку: личные шаблоны указанного пользователя.
 *
 * Параметры запроса (workPoligonType, workPoligonId), если указаны, то определяют дополнительные шаблоны,
 * которые необходимо включить в выборку: шаблоны пользователей указанного рабочего полигона (для пользователя
 * с userId также в выборку будут включены лишь созданные им шаблоны на заданном полигоне, т.е. значение
 * параметра userId, если указано, будет проигнорировано).
 *
 * Параметр запроса (getChildPatterns), если указан, то определяет необходимость включения в
 * выборку информации о дочерних шаблонах.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман получит полный список всех неприватных шаблонов распоряжений,
 * иное же лицо получит полный список тех неприватных шаблонов распоряжений, которые закреплены за его службой,
 * а также список тех шаблонов распоряжений (приватных), которые созданы данным пользователем.
 *
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/data',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.GET_ORDER_PATTERNS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { userId, workPoligonType, workPoligonId, getChildPatterns } = req.body;
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      var dataProjection = {
        __v: false,
      };
      if (!(!!getChildPatterns)) {
        dataProjection.childPatterns = false;
      }

      let data;
      if (!isMainAdmin(req)) {
        // Ищем шаблоны распоряжений, принадлежащих заданной службе
        const matchFilter = { service: serviceName };
        // Ищем шаблоны распоряжений, принадлежащих указанному рабочему полигону
        if (workPoligonType && workPoligonId) {
          matchFilter.$or = [
            {
              personalPattern: { $exists: false },
            },
            {
              $and: [
                { "workPoligon.id": workPoligonId },
                { "workPoligon.type": workPoligonType },
              ],
            },
          ];
        } else if (userId) {
          // Ищем шаблоны распоряжений, принадлежащих пользователю с id = userId
          matchFilter.$or = [{ personalPattern: { $exists: false } }, { personalPattern: userId }];
        } else {
          matchFilter.personalPattern = { $exists: false };
        }

        data = await OrderPattern.find(matchFilter, dataProjection);
      } else {
        // Извлекаем информацию обо всех шаблонах распоряжений, кроме приватных
        data = await OrderPattern.find({ personalPattern: { $exists: false } }, dataProjection);
      }

      res.status(OK).json(data);
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка всех общих (не приватных) шаблонов распоряжений',
        error: error.message,
        actionParams: { userId, workPoligonType, workPoligonId, getChildPatterns },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на добавление нового шаблона распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может добавить любой шаблон распоряжения,
 * а иное лицо сможет добавить шаблон распоряжения лишь в рамках своей службы.
 *
 * Параметры тела запроса:
 *  _id - идентификатор шаблона (может отсутствовать, в этом случае будет сгенерирован автоматически),
 * service - аббревиатура службы (обязательна),
 * type - тип распоряжения (обязателен),
 * category - категория распоряжения (обязательна),
 * title - наименование распоряжения (обязательно),
 * specialTrainCategories - список строк - отметок об особой категории поезда (не обязательно),
 * elements - массив элементов шаблона (не обязателен; если не задан, то значение параметра должно быть пустым массивом),
 *            каждый элемент - объект с параметрами:
 *            _id - идентификатор элемента (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *            type - тип элемента шаблона (обязателен),
 *            size - размер элемента шаблона (не обязательный параметр),
 *            ref - описание содержимого элемента шаблона (не обязательный параметр),
 *            value - значение элемента шаблона (не обязательный параметр),
 * isPersonalPattern - если true, то создаваемый шаблон принадлежит конкретному лицу, его создавшему;
 *                     в противном случае создаваемый шаблон является общедоступным
 * workPoligonId, workPoligonType - id и тип рабочего полигона пользователей,
 * positionInPatternsCategory - необязательный параметр, значение по умолчанию = -1 (определено моделью шаблона документа)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_ORDER_PATTERN; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addOrderPatternValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const {
      _id, service, type, category, title, specialTrainCategories,
      elements, isPersonalPattern, workPoligonId, workPoligonType,
      positionInPatternsCategory,
    } = req.body;
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      if (!isMainAdmin(req) && (serviceName !== service)) {
        return res.status(ERR).json({ message: `У Вас нет полномочий на добавление шаблона распоряжения в службе ${service}` });
      }

      // Ищем в БД распоряжение, наименование которого совпадает с наименованием создаваемого распоряжения
      // в рамках заданных службы, типа распоряжения и категории распоряжения
      const candidate = await OrderPattern.findOne({ service, type, category, title });

      // Если находим, то процесс создания продолжать не можем
      if (candidate) {
        return res.status(ERR).json({ message: 'Шаблон распоряжения с таким наименованием в заданной категории шаблонов распоряжений уже существует' });
      }

      // Создаем в БД запись с данными о новом распоряжении
      let orderPattern;
      const newPatternObject = {
        service,
        type,
        category,
        title,
        specialTrainCategories,
        elements,
        lastPatternUpdater: req.user.userId,
        positionInPatternsCategory,
      };
      if (Boolean(isPersonalPattern)) {
        newPatternObject.personalPattern = req.user.userId;
      }
      if (Boolean(workPoligonId) && Boolean(workPoligonType)) {
        newPatternObject.workPoligon = {
          id: workPoligonId,
          type: workPoligonType,
        };
      }
      if (_id) {
        orderPattern = new OrderPattern({ _id, ...newPatternObject });
      } else {
        orderPattern = new OrderPattern(newPatternObject);
      }
      await orderPattern.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', orderPattern });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового шаблона распоряжения',
        error: error.message,
        actionParams: {
          _id, service, type, category, title, specialTrainCategories,
          elements, isPersonalPattern, workPoligonId, workPoligonType,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление шаблона распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман может удалить любой шаблон распоряжения,
 * а иное лицо сможет удалить шаблон распоряжения лишь в рамках своей службы.
 *
 * Параметры тела запроса:
 * id - идентификатор шаблона распоряжения (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_ORDER_PATTERN; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delOrderPatternValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      const candidate = await OrderPattern.findById(id);
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный шаблон распоряжения не найден' });
      }

      if (!isMainAdmin(req) && (serviceName !== candidate.service)) {
        return res.status(ERR).json({ message: `У Вас нет полномочий на удаление шаблона распоряжения в службе ${candidate.service}` });
      }

      // Удаляем в БД запись
      await OrderPattern.deleteOne({ _id: id });

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление шаблона распоряжения',
        error: error.message,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование данных шаблона распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор шаблона распоряжения (обязателен),
 * title - наименование шаблона распоряжения (не обязательно),
 * specialTrainCategories - список строк - отметок об особой категории поезда (не обязательно),
 * elements - массив элементов шаблона (не обязателен; если задан и не пуст, то каждое полномочие - объект с параметрами:
 *            _id - идентификатор элемента (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *            type - тип элемента шаблона (обязателен),
 *            size - размер элемента шаблона (не обязательный параметр),
 *            ref - описание содержимого элемента шаблона (не обязательный параметр),
 *            value - значение элемента шаблона (не обязательный параметр),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_ORDER_PATTERN; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modOrderPatternValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные, которые понадобятся для дополнительных проверок
    // (остальными просто обновим запись в БД, когда все проверки будут пройдены)
    const { id, title } = req.body;
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      // Ищем в БД шаблон распоряжения, id которого совпадает с переданным пользователем
      let candidate = await OrderPattern.findById(id);

      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанный шаблон распоряжения не найден' });
      }

      if (!isMainAdmin(req) && (serviceName !== candidate.service)) {
        return res.status(ERR).json({ message: `У Вас нет полномочий на редактирование шаблона распоряжения в службе ${candidate.service}` });
      }

      // Ищем в БД шаблон распоряжения, title которого совпадает с переданным пользователем
      if (title || (title === '')) {
        const antiCandidate = await OrderPattern.findOne({ title });

        // Если находим, то смотрим, тот ли это самый шаблон. Если нет, продолжать не можем.
        if (antiCandidate && (String(antiCandidate._id) !== String(candidate._id))) {
          return res.status(ERR).json({ message: 'Шаблон распоряжения с таким наименованием в заданной категории шаблонов распоряжений уже существует' });
        }
      }

      // Редактируем в БД запись
      delete req.body.id;
      candidate = Object.assign(candidate, req.body);
      candidate.lastPatternUpdater = req.user.userId;
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена', orderPattern: candidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование данных шаблона распоряжения',
        error: error.message,
        actionParams: { id, title },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование наименования категории шаблонов распоряжений.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * service - наименование службы (обязательно),
 * orderType - наименование типа распоряжений в рамках службы (обязательно),
 * title - исходное наименование категории шаблонов распоряжений в рамках типа распоряжений (обязательно),
 * newTitle - новое наименование категории шаблонов распоряжений (обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/modCategoryTitle',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_ORDER_PATTERNS_CATEGORY_TITLE; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modOrderPatternsCategoryValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { service, orderType, title, newTitle } = req.body;
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      // Ищем шаблоны распоряжений, закрепленные за указанной службой, указанного типа и указанной категории
      const findRes = await OrderPattern.find({ service, type: orderType, category: title });

      if (!findRes || !findRes.length) {
        return res.status(ERR).json({ message: 'Указанная категория шаблонов распоряжений не найдена' });
      }

      if (!isMainAdmin(req) && (serviceName !== service)) {
        return res.status(ERR).json({
          message: `У Вас нет полномочий на редактирование категории шаблонов распоряжений в службе ${service}`,
        });
      }

      // Производим переименование категории распоряжений
      await OrderPattern.updateMany(
        { service, type: orderType, category: title },
        { $set: { category: newTitle } },
      );

      res.status(OK).json({ message: 'Информация успешно изменена', newTitle });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование наименования категории шаблонов распоряжений',
        error: error.message,
        actionParams: { service, orderType, title, newTitle },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование позиций шаблонов документов в рамках категории документов.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * data - массив двумерных массивов: первый элемент вложенного массива - id шаблона, второй - номер позиции
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/modPositionsInPatternsCategory',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_ORDER_PATTERNS_POSITIONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { data } = req.body;
    // Служба, которой принадлежит лицо, запрашивающее действие. Пользователь может отредактировать позиции шаблонов
    // документов только в том случае, если он редактирует их в рамках своей службы.
    const serviceName = req.user.service;

    try {
      // Ищем нужные распоряжения
      const findRes = await OrderPattern.find({ _id: data.map((el) => el[0]) });

      if (!findRes || !findRes.length) {
        return res.status(ERR).json({ message: 'Шаблоны распоряжений не найдены' });
      }

      if (!isMainAdmin(req) && findRes.find((el) => el.service !== serviceName)) {
        return res.status(ERR).json({
          message: `У Вас нет полномочий на редактирование позиций шаблонов распоряжений в службе ${serviceName}`,
        });
      }
      // Производим переопределение позиций шаблонов распоряжений

      for (let orderPattern of findRes) {
        const newOrderPatternPosition = data.find((el) => el[0] === String(orderPattern._id))[1];
        orderPattern.positionInPatternsCategory = newOrderPatternPosition;
        await orderPattern.save();
      }

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование позиций шаблонов распоряжений',
        error: error.message,
        actionParams: { serviceName, data },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    }
  }
);


module.exports = router;
