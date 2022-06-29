const { Router } = require('express');
const { TECDStructuralDivision } = require('../models/TECDStructuralDivision');
const validate = require('../validators/validate');
const {
  addStructuralDivisionValidationRules,
  delStructuralDivisionValidationRules,
  modStructuralDivisionValidationRules,
} = require('../validators/ecdStructuralDivisions.validator');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обработка запроса на добавление нового структурного подразделения / работника структурного
 * подразделения ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * title - наименование структурного подразделения ЭЦД (обязательно),
 * post - должность работника структурного подразделения ЭЦД (не обязательна),
 * fio - ФИО работника структурного подразделения ЭЦД (не обязательно),
 * ecdSectorId - id участка ЭЦД (обязателен),
 * position - позиция структурного подразделения (не обязателен)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_ECD_STRUCTURAL_DIVISION; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addStructuralDivisionValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { title, post, fio, ecdSectorId, position } = req.body;

    try {
      // Создаем в БД запись
      const newRecord = await TECDStructuralDivision.create({
        ECDSD_Title: title,
        ECDSD_Post: post,
        ECDSD_FIO: fio,
        ECDSD_ECDSectorID: ecdSectorId,
        ECDSD_Position: position || null,
      });

      res.status(OK).json({ message: 'Информация успешно сохранена', newRecord });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового структурного подразделения (работника) участка ЭЦД',
        error: error.message,
        actionParams: { title, post, fio, ecdSectorId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление структурного подразделения ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id структурного подразделения (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_ECD_STRUCTURAL_DIVISION; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delStructuralDivisionValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;

    try {
      await TECDStructuralDivision.destroy({ where: { ECDSD_ID: id } });
      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление структурного подразделения (работника) участка ЭЦД',
        error: error.message,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о структурном подразделении ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - идентификатор структурного подразделения (обязателен),
 * title - наименование структурного подразделения (не обязательно),
 * post - должность работника структурного подразделения ЭЦД (не обязательна),
 * fio - ФИО работника структурного подразделения ЭЦД (не обязательно),
 * position - позиция структурного подразделения (не обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_ECD_STRUCTURAL_DIVISION; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modStructuralDivisionValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id, title, post, fio, position } = req.body;

    try {
      // Ищем в БД структруное подразделение ЭЦД, id которого совпадает с переданным пользователем
      const candidate = await TECDStructuralDivision.findOne({ where: { ECDSD_ID: id } });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанное структурное подразделение ЭЦД не существует в базе данных' });
      }

      // Редактируем в БД запись
      const updateFields = {};

      if (req.body.hasOwnProperty('title')) {
        updateFields.ECDSD_Title = title;
      }
      if (req.body.hasOwnProperty('post')) {
        updateFields.ECDSD_Post = post;
      }
      if (req.body.hasOwnProperty('fio')) {
        updateFields.ECDSD_FIO = fio;
      }
      if (req.body.hasOwnProperty('position')) {
        updateFields.ECDSD_Position = position || null;
      }

      candidate.set(updateFields);
      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена', modRecord: candidate });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о структурном подразделении (работнике) участка ЭЦД',
        error: error.message,
        actionParams: { id, title, post, fio },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
