const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const OrderPattern = require('../models/OrderPattern');
const {
  addOrderPatternValidationRules,
  delOrderPatternValidationRules,
  modOrderPatternValidationRules,
  modOrderPatternsCategoryValidationRules,
} = require('../validators/orderPatterns.validator');
const validate = require('../validators/validate');
const { isMainAdmin } = require('../middleware/isMainAdmin.middleware');

const router = Router();

const {
  OK,
  ERR,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  GET_ALL_ORDER_PATTERNS_ACTION,
  MOD_ORDER_PATTERN_ACTION,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех шаблонов распоряжений, которые являются общими
 * (не приватными! т.е. не созданными конкретным лицом лично для себя) для использования.
 *
 * Параметр запроса (id пользователя), если указан, то определяет дополнительные шаблоны, которые
 * необходимо включить в выборку: личные шаблоны указанного пользователя.
 *
 * Параметр запроса (getChildPatterns), если указан, то определяет необходимость включения в
 * выборку информации о дочерних шаблонах.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * При этом главный администратор ГИД Неман получит полный список всех неприватных шаблонов распоряжений,
 * иное же лицо получит полный список тех неприватных шаблонов распоряжений, которые закреплены за его службой,
 * а также список тех шаблонов распоряжений (приватных), которые созданы данным пользователем.
 */
router.post(
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
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { userId, getChildPatterns } = req.body;

      const serviceName = req.user.service;

      var dataProjection = {
        __v: false,
        childPatterns: !!getChildPatterns,
      };

      let data;
      if (!isMainAdmin(req)) {
        // Ищем шаблоны распоряжений, принадлежащих заданной службе, а также, если указан userId,
        // шаблоны пользователя с id = userId
        const matchFilter = { service: serviceName };
        if (userId) {
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
      console.log(error);
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
 * elements - массив элементов шаблона (не обязателен; если не задан, то значение параметра должно быть пустым массивом),
 *            каждый элемент - объект с параметрами:
 *            _id - идентификатор элемента (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *            type - тип элемента шаблона (обязателен),
 *            size - размер элемента шаблона (не обязательный параметр),
 *            ref - описание содержимого элемента шаблона (не обязательный параметр),
 *            value - значение элемента шаблона (не обязательный параметр)
 */
 router.post(
  '/add',
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
  addOrderPatternValidationRules(),
  validate,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { _id, service, type, category, title, elements } = req.body;

      // Служба, которой принадлежит лицо, запрашивающее действие
      const serviceName = req.user.service;

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
      if (_id) {
        orderPattern = new OrderPattern({ _id, service, type, category, title, elements });
      } else {
        orderPattern = new OrderPattern({ service, type, category, title, elements });
      }
      await orderPattern.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', orderPattern });

    } catch (error) {
      console.log(error);
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
 * id - идентификатор шаблона распоряжения (обязателен)
 */
 router.post(
  '/del',
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
  delOrderPatternValidationRules(),
  validate,
  async (req, res) => {
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id } = req.body;

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
      console.log(error);
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
 * elements - массив элементов шаблона (не обязателен; если задан и не пуст, то каждое полномочие - объект с параметрами:
 *            _id - идентификатор элемента (может отсутствовать, в этом случае будет сгенерирован автоматически),
 *            type - тип элемента шаблона (обязателен),
 *            size - размер элемента шаблона (не обязательный параметр),
 *            ref - описание содержимого элемента шаблона (не обязательный параметр),
 *            value - значение элемента шаблона (не обязательный параметр)
 */
 router.post(
  '/mod',
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
  modOrderPatternValidationRules(),
  validate,
  async (req, res) => {
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      // Считываем находящиеся в пользовательском запросе данные, которые понадобятся для дополнительных проверок
      // (остальными просто обновим запись в БД, когда все проверки будут пройдены)
      const { id, title } = req.body;

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
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена', orderPattern: candidate });

    } catch (error) {
      console.log(error);
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
 * newTitle - новое наименование категории шаблонов распоряжений (обязательно)
 */
 router.post(
  '/modCategoryTitle',
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
  modOrderPatternsCategoryValidationRules(),
  validate,
  async (req, res) => {
    // Служба, которой принадлежит лицо, запрашивающее действие
    const serviceName = req.user.service;

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { service, orderType, title, newTitle } = req.body;

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
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
