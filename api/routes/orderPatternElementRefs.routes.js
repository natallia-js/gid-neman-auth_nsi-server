const { Router } = require('express');
const mongoose = require('mongoose');
const OrderPatternElementRef = require('../models/OrderPatternElementRef');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');
const testUniqueArrayElements = require('../additional/testUniqueArrayElements');
const { isMainAdmin } = require('../middleware/checkMainAdmin');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обрабатывает запрос на получение списка всех возможных смысловых значений элементов
 * шаблонов распоряжений. Возвращается вся информация, содержащаяся в коллекции, если
 * запрашивает информацию главный администратор. Если запрашивает информацию лицо, не
 * имеющее прав главного администратора, то возвращается информация, не привязанная к
 * конкретному рабочему полигону, а также та информация, которая привязана к рабочему полигону
 * пользователя, осуществляющего запрос.
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
  async (req, res) => {
    try {
      const matchFilter = {};
      if (!isMainAdmin(req)) {
        const userWorkPoligon = req.user.workPoligon;
        matchFilter.$or = [
          { workPoligon: { $exists: false } },
          { workPoligon: null },
        ];
        if (userWorkPoligon) {
          matchFilter.$or.push({
            "workPoligon.type": userWorkPoligon.type,
            "workPoligon.id": userWorkPoligon.id,
          });
        }
      }
      const data = await OrderPatternElementRef.find(matchFilter);
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
 /*router.post(
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
);*/


/**
 * Обработка запроса на добавление нового смыслового значения указанного (существующего) типа
 * элементов шаблонов распоряжений.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * elementTypeId - id типа элемента шаблона (обязателен),
 * refName - наименование смыслового значения (обязательно),
 * workPoligon - объект с полями id (id полигона управления) и type (тип полигона управления) либо null - определяет
 *   привязку указанного смыслового значения к конкретному полигону управления (не обязателен),
 * additionalOrderPlaceInfoForGID - учитывать значение элемента как дополнительную информацию о месте действия распоряжения
 *   в ГИД (true) или не учитывать (false) (не обязательно, по умолчанию false),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/addRef',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.ADD_ORDER_PATTERN_ELEMENT_REF; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { elementTypeId, refName, workPoligon, additionalOrderPlaceInfoForGID } = req.body;

    try {
      // Ищем в БД указанный тип элемента шаблона распоряжения
      const candidate = await OrderPatternElementRef.findOne({ _id: elementTypeId });

      // Если не находим, то процесс создания продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Не найден указанный тип элементов шаблонов распоряжений' });
      }

      if (!candidate.possibleRefs) {
        candidate.possibleRefs = [];
      } else {
        if (candidate.possibleRefs.find((ref) => ref.refName === refName)) {
          return res.status(ERR).json({ message: 'У данного типа элемента шаблона уже существует смысловое значение с таким названием' });
        }
      }

      const newRef = {
        _id: new mongoose.Types.ObjectId(),
        refName,
        additionalOrderPlaceInfoForGID: Boolean(additionalOrderPlaceInfoForGID),
      };
      if (workPoligon) {
        newRef.workPoligon = workPoligon;
      }
      candidate.possibleRefs.push(newRef);

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно сохранена', ref: { typeId: elementTypeId, ...newRef } });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Добавление нового смыслового значения',
        error: error.message,
        actionParams: { elementTypeId, refName, additionalOrderPlaceInfoForGID },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление смыслового значения указанного (существующего) типа
 * элементов шаблонов распоряжений.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * elementTypeId - id типа элемента шаблона (обязателен),
 * refId - id смыслового значения (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/delRef',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_ORDER_PATTERN_ELEMENT_REF; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { elementTypeId, refId } = req.body;

    try {
      // Ищем в БД указанный тип элемента шаблона распоряжения
      const candidate = await OrderPatternElementRef.findOne({ _id: elementTypeId });

      // Если не находим, то процесс удаления продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Не найден указанный тип элементов шаблонов распоряжений' });
      }
      if (!candidate.possibleRefs || !candidate.possibleRefs.find((el) => String(el._id) === String(refId))) {
        return res.status(ERR).json({ message: 'Не найдено указанное смысловое значение' });
      }

      candidate.possibleRefs = candidate.possibleRefs.filter((el) => String(el._id) !== String(refId));

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно удалена', data: { elementTypeId, refId } });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление смыслового значения',
        error: error.message,
        actionParams: { elementTypeId, refId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование смыслового значения указанного (существующего) типа
 * элементов шаблонов распоряжений.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * elementTypeId - id типа элемента шаблона (обязателен),
 * refId - id смыслового значения (обязателен),
 * refName - наименование смыслового значения (не обязательно),
 * workPoligon - объект с полями id (id полигона управления) и type (тип полигона управления) либо null - определяет
 *   привязку указанного смыслового значения к конкретному полигону управления (не обязателен),
 * additionalOrderPlaceInfoForGID - учитывать значение элемента как дополнительную информацию о месте действия распоряжения
 *   в ГИД (true) или не учитывать (false) (не обязательно),
 * possibleMeanings - массив допустимых значений элемента шаблона распоряжения с заданным смысловым значением (не обязательно),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/modRef',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_ORDER_PATTERN_ELEMENT_REF; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { elementTypeId, refId, refName, workPoligon, additionalOrderPlaceInfoForGID, possibleMeanings } = req.body;

    try {
      // Ищем в БД указанный тип элемента шаблона распоряжения
      const candidate = await OrderPatternElementRef.findOne({ _id: elementTypeId });

      // Если не находим, то процесс удаления продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Не найден указанный тип элементов шаблонов распоряжений' });
      }
      const refCandidate = !candidate.possibleRefs ? null : candidate.possibleRefs.find((el) => String(el._id) === String(refId));
      if (!refCandidate) {
        return res.status(ERR).json({ message: 'Не найдено указанное смысловое значение типа элементов шаблонов распоряжений' });
      }

      // Если изменилось название смыслового значения, то проверяем его на уникальность в рамках
      // типа распоряжений
      if (candidate.possibleRefs && candidate.possibleRefs.find((el) => String(el._id) !== String(refId) && el.refName === refName)) {
        return res.status(ERR).json({ message: 'Смысловое значение с таким наименованием уже существует' });
      }

      if (req.body.hasOwnProperty('refName'))
        refCandidate.refName = refName;
      if (req.body.hasOwnProperty('workPoligon'))
        refCandidate.workPoligon = workPoligon;
      if (req.body.hasOwnProperty('additionalOrderPlaceInfoForGID'))
        refCandidate.additionalOrderPlaceInfoForGID = additionalOrderPlaceInfoForGID;
      if (req.body.hasOwnProperty('possibleMeanings')) {
        if (refCandidate.possibleMeanings && !possibleMeanings)
          refCandidate.possibleMeanings = null;
        if (!testUniqueArrayElements(possibleMeanings))
          return res.status(ERR).json({ message: 'Смысловое значение не может иметь одинаковых допустимых значений элемента' });
        refCandidate.possibleMeanings = possibleMeanings;
      }

      await candidate.save();

      res.status(OK).json({ message: 'Информация успешно изменена', data: { elementTypeId, ref: refCandidate } });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Изменение смыслового значения',
        error: error.message,
        actionParams: { elementTypeId, refId, refName, additionalOrderPlaceInfoForGID },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
