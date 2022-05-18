const { Router } = require('express');
const {
  modDNCTrainSectorStationsListValidationRules,
  delDNCTrainSectorStationValidationRules,
  modDNCTrainSectorStationValidationRules,
} = require('../validators/dncTrainSectorStations.validator');
const validate = require('../validators/validate');
const { TDNCTrainSector } = require('../models/TDNCTrainSector');
const { TStation } = require('../models/TStation');
const { TDNCTrainSectorStation } = require('../models/TDNCTrainSectorStation');
const { Op } = require('sequelize');
const { addError } = require('../serverSideProcessing/processLogsActions');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const AUTH_NSI_ACTIONS = require('../middleware/AUTH_NSI_ACTIONS');

const router = Router();

const { OK, ERR, UNKNOWN_ERR, UNKNOWN_ERR_MESS } = require('../constants');


/**
 * Обработка запроса на редактирование списка станций поездного участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ДНЦ (обязателен),
 * stationIds - массив id станций (обязателен),
 */
router.post(
  '/modStationsList',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_STATIONS; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modDNCTrainSectorStationsListValidationRules(),
  validate,
  async (req, res) => {
    const sequelize = req.sequelize;

    if (!sequelize) {
      return res.status(ERR).json({ message: 'Для выполнения операции обновления списка станций не определен объект транзакции' });
    }

    const t = await sequelize.transaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, stationIds } = req.body;

    try {
      // Ищем в БД поездной участок ДНЦ, id которого совпадает с переданным пользователем
      const trainSector = await TDNCTrainSector.findOne({
        where: { DNCTS_ID: trainSectorId },
        transaction: t,
      });

      // Если не находим, то продолжать не можем
      if (!trainSector) {
        await t.rollback();
        return res.status(ERR).json({ message: 'Поездной участок ДНЦ с указанным id не существует' });
      }

      // Ищем в БД информацию обо всех станциях, принадлежащих заданному поездному участку ДНЦ
      let trainSectorStations = await TDNCTrainSectorStation.findAll({
        raw: true,
        where: {
          DNCTSS_TrainSectorID: trainSectorId,
        },
        transaction: t,
      });

      // Теперь нужно сравнить массив trainSectorStations со входным параметром stationIds:
      // 1. если запись из stationIds есть в trainSectorStations, то ничего не делаем
      // 2. если записи из stationIds нет в trainSectorStations, то добавляем ее в БД
      // 3. если записи из trainSectorStations нет в stationIds, то удаляем ее из БД
      const existingStationsIds = trainSectorStations.map((rec) => rec.DNCTSS_StationID);
      let maxExistingStationPositionInTrainSector = 0;
      trainSectorStations.forEach((station) => {
        if (station.DNCTSS_StationPositionInTrainSector > maxExistingStationPositionInTrainSector) {
          maxExistingStationPositionInTrainSector = station.DNCTSS_StationPositionInTrainSector;
        }
      });
      const addRecs = [];
      const delRecs = [];
      let nextTrainSectorPos = maxExistingStationPositionInTrainSector + 1;
      stationIds.forEach((id) => {
        if (!existingStationsIds.includes(id)) {
          addRecs.push({
            DNCTSS_TrainSectorID: trainSectorId,
            DNCTSS_StationID: id,
            DNCTSS_StationPositionInTrainSector: nextTrainSectorPos,
            DNCTSS_StationBelongsToDNCSector: 1,
          });
          nextTrainSectorPos += 1;
        }
      });
      existingStationsIds.forEach((id) => {
        if (!stationIds.includes(id)) {
          delRecs.push(id);
        }
      });

      // Для элементов из addRecs создаем записи в БД
      let createdRecs = await TDNCTrainSectorStation.bulkCreate(addRecs, { returning: true, transaction: t });
      createdRecs = createdRecs.map((rec) => rec.dataValues);

      // Для элементов из delRecs удаляем записи из БД
      await TDNCTrainSectorStation.destroy({
        where: {
          [Op.and]: [
            { DNCTSS_TrainSectorID: trainSectorId },
            { DNCTSS_StationID: delRecs },
          ],
        },
        transaction: t,
      });

      // Формируем массив для возврата пользователю (вся информация по станциям поездного участка)
      // (Возвращаемое значение формирую в том же виде, что и значения, возвращаемые запросом к информации
      // по участкам ДНЦ)
      trainSectorStations.push(...createdRecs);
      trainSectorStations = trainSectorStations.filter((station) => !delRecs.includes(station.DNCTSS_StationID));

      const stations = await TStation.findAll({
        raw: true,
        where: {
          St_ID: trainSectorStations.map(rec => rec.DNCTSS_StationID),
        },
        transaction: t,
      });

      trainSectorStations = trainSectorStations.map((sectorStation) => {
        return {
          ...stations.find(st => st.St_ID === sectorStation.DNCTSS_StationID),
          TDNCTrainSectorStation: { ...sectorStation },
        };
      });

      await t.commit();

      res.status(OK).json({ message: 'Информация успешно обновлена', trainSectorStations });

    } catch (error) {
      await t.rollback();
      addError({
        errorTime: new Date(),
        action: 'Редактирование списка станций поездного участка ДНЦ',
        error: error.message,
        actionParams: { trainSectorId, stationIds },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на удаление записи из таблицы станций поездного участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ДНЦ (обязателен),
 * stationId - id станции (обязателен),
  */
 router.post(
  '/del',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.DEL_DNC_TRAIN_SECTOR_STATION; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  delDNCTrainSectorStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, stationId } = req.body;

    try {
      await TDNCTrainSectorStation.destroy({
        where: {
          DNCTSS_TrainSectorID: trainSectorId,
          DNCTSS_StationID: stationId,
        },
      });

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление записи из таблицы станций поездного участка ДНЦ',
        error: error.message,
        actionParams: { trainSectorId, stationId },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обработка запроса на редактирование информации о станции поездного участка ДНЦ.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * trainSectorId - id поездного участка ДНЦ (обязателен),
 * stationId - id станции (обязателен),
 * posInTrainSector - позиция станции в рамках поездного участка (не обязателен),
 * belongsToSector - принадлежность станции участку ДНЦ (не обязательно),
 */
 router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = AUTH_NSI_ACTIONS.MOD_DNC_TRAIN_SECTOR_STATION; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  modDNCTrainSectorStationValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { trainSectorId, stationId, posInTrainSector, belongsToSector } = req.body;

    try {
      // Ищем в БД определенную запросом запись
      const candidate = await TDNCTrainSectorStation.findOne({
        where: {
          DNCTSS_TrainSectorID: trainSectorId,
          DNCTSS_StationID: stationId,
        },
      });

      // Если не находим, то процесс редактирования продолжать не можем
      if (!candidate) {
        return res.status(ERR).json({ message: 'Указанная станция поездного участка ДНЦ не существует в базе данных' });
      }

      // Далее, смело редактируем (если что - СУБД не даст ошибиться)
      const updateFields = {};

      if (req.body.hasOwnProperty('posInTrainSector')) {
        updateFields.DNCTSS_StationPositionInTrainSector = posInTrainSector;
      }
      if (req.body.hasOwnProperty('belongsToSector')) {
        updateFields.DNCTSS_StationBelongsToDNCSector = belongsToSector;
      }

      await TDNCTrainSectorStation.update(updateFields, {
        where: {
          DNCTSS_TrainSectorID: trainSectorId,
          DNCTSS_StationID: stationId,
        },
      });

      res.status(OK).json({ message: 'Информация успешно изменена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование информации о станции поездного участка ДНЦ',
        error: error.message,
        actionParams: { trainSectorId, stationId, posInTrainSector, belongsToSector },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
