const { Router } = require('express');
const auth = require('../middleware/auth.middleware');
const { isOnDuty } = require('../middleware/isOnDuty.middleware');
const Draft = require('../models/Draft');
const { addError } = require('../serverSideProcessing/processLogsActions');
const { DY58_ACTIONS, hasUserRightToPerformAction } = require('../middleware/hasUserRightToPerformAction.middleware');

const router = Router();

const { OK, UNKNOWN_ERR, UNKNOWN_ERR_MESS, ERR } = require('../constants');


/**
 * Обработка запроса на создание (сохранение) нового черновика распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 */
router.post(
  '/add',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.ADD_ORDER_DRAFT; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка факта нахождения пользователя на смене (дежурстве)
  isOnDuty,
  async (req, res) => {
    // Определяем рабочий полигон пользователя
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }

    // Считываем находящиеся в пользовательском запросе данные
    const {
      type, createDateTime, place, timeSpan, defineOrderTimeSpan, orderText,
      dncToSend, dspToSend, ecdToSend, otherToSend, createdOnBehalfOf, showOnGID,
    } = req.body;

    try {
      // Создаем в БД запись с данными о новом черновике распоряжения
      const draft = new Draft({
        type, createDateTime, place, timeSpan, defineOrderTimeSpan, orderText,
        dncToSend, dspToSend, ecdToSend, otherToSend, workPoligon, createdOnBehalfOf, showOnGID,
      });

      await draft.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', draft });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Создание нового черновика распоряжения',
        error,
        actionParams: {
          type, createDateTime, place, timeSpan, defineOrderTimeSpan, orderText,
          dncToSend, dspToSend, ecdToSend, otherToSend, workPoligon, createdOnBehalfOf, showOnGID,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование существующего черновика распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры запроса:
 *   id - идентификатор черновика
 */
 router.post(
  '/mod',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.MOD_ORDER_DRAFT; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка факта нахождения пользователя на смене (дежурстве)
  isOnDuty,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const {
      id, place, timeSpan, defineOrderTimeSpan, orderText, dncToSend,
      dspToSend, ecdToSend, otherToSend, createdOnBehalfOf, showOnGID,
    } = req.body;

    try {
      const foundDraft = await Draft.findById(id);

      if (!foundDraft) {
        return res.status(ERR).json({ message: 'Не найден черновик документа' });
      }

      foundDraft.place = place;
      foundDraft.timeSpan = timeSpan;
      foundDraft.defineOrderTimeSpan = defineOrderTimeSpan;
      foundDraft.orderText = orderText;
      foundDraft.dncToSend = dncToSend;
      foundDraft.dspToSend = dspToSend;
      foundDraft.ecdToSend = ecdToSend;
      foundDraft.otherToSend = otherToSend,
      foundDraft.createdOnBehalfOf = createdOnBehalfOf;
      foundDraft.showOnGID = showOnGID;

      await foundDraft.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', draft: foundDraft });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование черновика распоряжения',
        error,
        actionParams: {
          id, place, timeSpan, defineOrderTimeSpan, orderText, dncToSend,
          dspToSend, ecdToSend, otherToSend, createdOnBehalfOf, showOnGID,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление существующего черновика распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры запроса:
 *   id - идентификатор черновика
 */
 router.post(
  '/del',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.DEL_ORDER_DRAFT; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка факта нахождения пользователя на смене (дежурстве)
  isOnDuty,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;

    try {
      const delRes = await Draft.deleteOne({ _id: id });
      if (!delRes.deletedCount) {
        return res.status(ERR).json({ message: 'Не найден черновик документа' });
      }
      res.status(OK).json({ message: 'Информация успешно удалена', id });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление черновика распоряжения',
        error,
        actionParams: { id },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка черновиков распоряжений, созданных на заданном полигоне
 * управления (или рабочем месте заданного полигона управления).
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Информация о типе, id рабочего полигона (и id рабочего места в рамках рабочего полигона) извлекается из
 * токена пользователя. Именно по этим данным осуществляется поиск в БД. Если этой информации в токене нет,
 * то информация извлекаться не будет.
 */
 router.get(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.GET_ORDER_DRAFTS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Определяем рабочий полигон пользователя
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }

    const findRecordsConditions = {
      "workPoligon.id": workPoligon.id,
      "workPoligon.type": workPoligon.type,
    };
    if (workPoligon.workPlaceId) {
      findRecordsConditions["workPoligon.workPlaceId"] = workPoligon.workPlaceId;
    } else {
      // The { item : null } query matches documents that either contain the item field
      // whose value is null or that do not contain the item field
      findRecordsConditions["workPoligon.workPlaceId"] = null;
    }

    try {
      const data = await Draft.find(findRecordsConditions).sort([['createDateTime', 'ascending']]) || [];
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка черновиков распоряжений, созданных на заданном полигоне управления',
        error,
        actionParams: { workPoligon },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
