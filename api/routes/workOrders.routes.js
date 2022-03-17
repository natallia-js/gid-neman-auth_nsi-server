const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const { isOnDuty } = require('../middleware/isOnDuty.middleware');
const Order = require('../models/Order');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
const { WORK_POLIGON_TYPES } = require('../constants');
const { addDY58UserActionInfo, addError } = require('../serverSideProcessing/processLogsActions');
const { getUserConciseFIOString, userPostFIOString } = require('../routes/additional/getUserTransformedData');
const isOrderAsserted = require('../routes/additional/isOrderAsserted');

const router = Router();

const {
  OK,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,
  ERR,

  DSP_FULL,
  DSP_Operator,
  DNC_FULL,
  ECD_FULL,
  REVISOR,
} = require('../constants');


/**
 * Позволяет найти workPoligon в массиве sectors учитывая флаг findGlobalSector (true - поиск по глобальным
 * полигонам: станция, участок ДНЦ, участок ЭЦД; false - поиск по рабочим местам в рамках глобального полигона)
 */
const findSector = (sectors, workPoligon, findGlobalSector) => {
  if (sectors && sectors[0] && sectors[0].type === workPoligon.type) {
    return sectors.find((el) =>
      (String(el.id) === String(workPoligon.id)) &&
      (findGlobalSector || (
        (!workPoligon.workPlaceId && !el.workPlaceId) ||
        (workPoligon.workPlaceId && el.workPlaceId && String(workPoligon.workPlaceId) === String(el.workPlaceId))
      ))
    );
  }
  return null;
};


/**
 * Обрабатывает запрос на получение списка распоряжений, которые являются входящими уведомлениями
 * для заданного полигона управления (или рабочего места заданного полигона управления) либо же
 * распоряжениями в работе в указанный временной интервал.
 *    Входящее уведомление - такое распоряжение, для которого не определено deliverDateTime (дата-время
 * доставки распоряжения на рабочее место работника) либо confirmDateTime (дата-время подтверждения
 * доставки распоряжения работником).
 *    Распоряжение в работе - такое распоряжение, для которого последнее распоряжение в его цепочке
 * распоряжений является действующим либо дата окончания его действия попадает во временной промежуток,
 * в течение которого распоряжение считается находящимся в работе.
 *    Действующее распоряжение - распоряжение, у которого не определена дата окончания действия либо
 * определена и больше текущей даты.
 *    Временной интервал, в течение которого распоряжения полагаются находящимися в работе, определяется
 * настройками программы.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Информация о типе, id рабочего полигона (и id рабочего места в рамках рабочего полигона) извлекается из
 * токена пользователя. Именно по этим данным осуществляется поиск в БД. Если этой информации в токене нет,
 * то информация извлекаться не будет.
 *
 * Параметр запроса startDate - дата-время начала временного интервала извлечения информации (временного интервала,
 * в течение которого распоряжения считаются находящимися в работе).
 * Данный временной интервал не ограничен справа. Если параметр startDate не указан, то извлекается
 * вся имеющаяся информация в коллекции рабочих распоряжений, относящаяся к указанному рабочему полигону.
 */
 router.post(
  '/data',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL, REVISOR],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }

    // Считываем находящиеся в пользовательском запросе данные
    const { startDate } = req.body;

    // Формируем условие фильтрации для извлечения информации из коллекции рабочих распоряжений.
    const findRecordConditions = [
      { "recipientWorkPoligon.id": workPoligon.id },
      { "recipientWorkPoligon.type": workPoligon.type },
      { orderChain: { $exists: true } },
      {
        $or: [
          { deliverDateTime: null },
          { confirmDateTime: null },
          {
            $or: [
              // The { item : null } query matches documents that either contain the item field
              // whose value is null or that do not contain the item field
              { "orderChain.chainEndDateTime": null },
              { "orderChain.chainEndDateTime": { $gt: new Date(startDate) } },
            ],
          },
        ],
      },
    ];
    if (workPoligon.workPlaceId) {
      findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workPoligon.workPlaceId });
    } else {
      // The { item : null } query matches documents that either contain the item field
      // whose value is null or that do not contain the item field
      findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": null });
    }

    const matchFilter = !startDate ? {} : { $and: findRecordConditions };

    try {
      let data;
      const workData = await WorkOrder.find(matchFilter);

      // Ищем распоряжения в основной коллекции распоряжений и сопоставляем их с распоряжениями,
      // найденными в рабочей коллекции распоряжений
      if (workData && workData.length) {
        data = await Order.find({ _id: workData.map((item) => item.orderId) });
        data = data.map((item) => {
          const correspWorkDataObject = workData.find((wd) => String(wd.orderId) === String(item._id));
          if (correspWorkDataObject) {
            return {
              ...item._doc,
              senderWorkPoligon: correspWorkDataObject.senderWorkPoligon,
              deliverDateTime: correspWorkDataObject.deliverDateTime,
              confirmDateTime: correspWorkDataObject.confirmDateTime,
              sendOriginal: correspWorkDataObject.sendOriginal,
            };
          }
          return { ...item._doc };
        });
      }
      res.status(OK).json(data);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка входящих распоряжений',
        error,
        actionParams: {
          userId: req.user.userId, user: userPostFIOString(req.user), startDate,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на подтверждение доставки распоряжений на конкретный рабочий полигон.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Информация о типе, id рабочего полигона (и id рабочего места в рамках рабочего полигона) извлекается из
 * токена пользователя.
 *
 * Параметры запроса:
 *   orderIds - идентификаторы подтверждаемых распоряжений
 *   deliverDateTime - дата и время, когда клиентское место получило распоряжения
 */
router.post(
  '/reportOnDelivery',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }

    // Считываем находящиеся в пользовательском запросе данные
    const { orderIds, deliverDateTime } = req.body;

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Отмечаем подтверждение доставки распоряжений в коллекции рабочих распоряжений
    const findRecordConditions = [
      { orderId: orderIds },
      { "recipientWorkPoligon.id": workPoligon.id },
      { "recipientWorkPoligon.type": workPoligon.type },
    ];
    if (workPoligon.workPlaceId) {
      findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workPoligon.workPlaceId });
    } else {
      // The { item : null } query matches documents that either contain the item field
      // whose value is null or that do not contain the item field
      findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": null });
    }

    try {
      await WorkOrder.updateMany({ $and: findRecordConditions }, { $set: { deliverDateTime } }).session(session);

      // Отмечаем подтверждение доставки распоряжений в основной коллекции распоряжений.
      // Для установки даты подтверждения распоряжения в секции "Кому" в основной коллекции необходимо,
      // чтобы его подтверждение пришло с глобального полигона. Так, в частности, при подтверждении
      // учитывается рабочее место ДСП и не учитывается рабочее место оператора при ДСП.
      // Для всех подтверждений, идущих со станции, подтверждение в основной коллекции проставляется лишь
      // в секции адресатов на станциях.
      const orders = await Order.find({ _id: orderIds }).session(session);

      if (orders && orders.length) {
        for (let order of orders) {
          let sector; // участок глобального подтверждения распоряжения (секция "Кому")
          let thereAreChangesInObject = false;
          switch (workPoligon.type) {
            case WORK_POLIGON_TYPES.STATION:
              if (req.user.specialCredentials && req.user.specialCredentials.includes(DSP_FULL)) {
                // на уровне станции подтвердить распоряжение может только ДСП (секция "Кому" распоряжения)
                sector = findSector(order.dspToSend, workPoligon, true);
              }
              // подтверждаем распоряжение в рамках станции (локально)
              const localSector = findSector(order.stationWorkPlacesToSend, workPoligon, false);
              if (localSector) {
                localSector.deliverDateTime = deliverDateTime;
                thereAreChangesInObject = true;
              }
              break;
            case WORK_POLIGON_TYPES.DNC_SECTOR:
              sector = findSector(order.dncToSend, workPoligon, true);
              break;
            case WORK_POLIGON_TYPES.ECD_SECTOR:
              sector = findSector(order.ecdToSend, workPoligon, true);
              break;
          }
          if (sector && !sector.deliverDateTime) {
            sector.deliverDateTime = deliverDateTime;
            if (!thereAreChangesInObject) thereAreChangesInObject = true;
          }
          if (thereAreChangesInObject) {
            // By default, `save()` uses the associated session
            await order.save();
          }
        }
      }

      await session.commitTransaction();

      res.status(OK).json({ message: 'Подтверждена доставка распоряжений', orderIds, deliverDateTime });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Подтверждение доставки распоряжений на рабочий полигон',
        error,
        actionParams: {
          userId: req.user.userId, user: userPostFIOString(req.user), orderIds, deliverDateTime,
        },
      });
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обрабатывает запрос на подтверждение распоряжения.
 * Подтверждение распоряжения производится как на уровне рабочих распоряжений полигона управления, так и
 * на уровне самого распоряжения, хранящегося в общей коллекции распоряжений. В последнем случае распоряжение
 * подтверждается на соответствующем глобальном полигоне управления лишь в том случае, если ранее на данном
 * полигоне управления его никто не подтверждал. На локальном полигоне управления (рабочем месте) подтверждается
 * при условии наличия этого рабочего места.
 * Для случая ДСП и Операторов при ДСП на станции: на уровне рабочих распоряжений и своих локальных рабочих
 * полигонов каждый подтверждает распоряжение сам за себя, на уровне самого распоряжения (из общей коллекции)
 * подтверждать может только ДСП.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Информация о типе, id рабочего полигона (и id рабочего места в рамках рабочего полигона) извлекается из
 * токена пользователя. Если этой информации в токене нет, то распоряжение подтвержаться не будет.
 * Из токена пользователя также извлекается информация об id пользователя, который подтверждает распоряжение.
 * Данная информация извлекается и используется лишь на стадии глобального подтверждения распоряжения, если
 * данное распоряжение никем ранее не подтверждалось.
 *
 * Параметры запроса:
 *   id - идентификатор подтверждаемого распоряжения
 *   confirmDateTime - дата и время, когда пользователь подтвердил распоряжение
 */
 router.post(
  '/confirmOrder',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL],
    };
    next();
  },
  // проверка наличия у пользователя определенных выше полномочий
  checkGeneralCredentials,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { id, confirmDateTime } = req.body;

    // Отмечаем подтверждение распоряжения в коллекции рабочих распоряжений, а также
    // (при необходимости) в общей коллеции распоряжений

    // Итак, вначале подтвержаем на своем рабочем полигоне

    const findRecordConditions = [
      { orderId: id },
      { "recipientWorkPoligon.id": workPoligon.id },
      { "recipientWorkPoligon.type": workPoligon.type },
    ];
    if (workPoligon.workPlaceId) {
      findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workPoligon.workPlaceId });
    } else {
      // The { item : null } query matches documents that either contain the item field
      // whose value is null or that do not contain the item field
      findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": null });
    }

    try {
      const workOrder = await WorkOrder.findOne({ $and: findRecordConditions }).session(session);
      if (!workOrder) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в списке распоряжений, находящихся в работе на полигоне управления' });
      }
      if (workOrder.confirmDateTime) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение ранее было подтверждено в списке рабочих распоряжений полигона управления' });
      }
      workOrder.confirmDateTime = confirmDateTime;
       // By default, `save()` uses the associated session
      await workOrder.save();

      // Теперь распоряжение необходимо подтвердить в общей коллекции распоряжений, при необходимости

      const order = await Order.findOne({ _id: id }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в базе данных' });
      }

      // Проверяем, подтверждено ли распоряжение на указанном рабочем полигоне глобально и (в случае станции) локально

      let sector;
      let localSector;

      switch (workPoligon.type) {
        case WORK_POLIGON_TYPES.STATION:
          if (req.user.specialCredentials && req.user.specialCredentials.includes(DSP_FULL)) {
            // в рамках станции (глобального полигона управления) подтверждать распоряжения может только ДСП
            // (операторы при ДСП не могут)
            sector = findSector(order.dspToSend, workPoligon, true);
          }
          // зато в рамках станции (локально) могут подтверждать распоряжения как ДСП, так и Операторы при ДСП
          localSector = findSector(order.stationWorkPlacesToSend, workPoligon, false);
          break;
        case WORK_POLIGON_TYPES.DNC_SECTOR:
          sector = findSector(order.dncToSend, workPoligon, true);
          break;
        case WORK_POLIGON_TYPES.ECD_SECTOR:
          sector = findSector(order.ecdToSend, workPoligon, true);
          break;
      }

      // Ситуация, когда не определены и sector, и localSector, вполне допустима.
      // Такое может произойти тогда, когда ДСП, получив распоряжение, удаляет из списка
      // адресатов по станции определенное рабочее место на этой станции. В этом случае
      // работник данного рабочего места сможет подтвердить распоряжение лишь в списке
      // рабочих распоряжений.

      let userPost;
      let userFIO;
      if ((sector && !sector.confirmDateTime) || (localSector && !localSector.confirmDateTime)) {
        // ищем информацию о лице, подтверждающем распоряжение
        const user = await User.findOne({ _id: req.user.userId, confirmed: true }).session(session);
        if (!user) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Не удалось найти информацию о лице, подтверждающем распоряжение' });
        }
        userPost = user.post;
        userFIO = getUserConciseFIOString({ name: user.name, fatherName: user.fatherName, surname: user.surname });
        if (sector && !sector.confirmDateTime) {
          sector.confirmDateTime = confirmDateTime;
          sector.post = userPost;
          sector.fio = userFIO;
        }
        if (localSector && !localSector.confirmDateTime) {
          localSector.confirmDateTime = confirmDateTime;
          localSector.post = userPost;
          localSector.fio = userFIO;
        }
        // После подтверждения распоряжения необходимо проверить его утвержденность, если оно еще не утверждено
        if (!order.assertDateTime) {
          order.assertDateTime = isOrderAsserted(order);
        }
        // By default, `save()` uses the associated session
        await order.save();
      }

      await session.commitTransaction();

      res.status(OK).json({
        message: `Распоряжение подтверждено`,
        id,
        confirmDateTime,
        userPost,
        userFIO,
        assertDateTime: order.assertDateTime,
      });

      // Логируем действие пользователя
      const logObject = {
        user: userPostFIOString(req.user),
        workPoligon: `${workPoligon.type}, id=${workPoligon.id}, workPlaceId=${workPoligon.workPlaceId}`,
        actionTime: confirmDateTime,
        action: 'Подтверждение распоряжения',
        actionParams: {
          userId: req.user.userId, orderId: id, confirmDateTime,
        },
      };
      addDY58UserActionInfo(logObject);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Подтверждение распоряжения',
        error,
        actionParams: {
          userId: req.user.userId, user: userPostFIOString(req.user), orderId: id, confirmDateTime,
        },
      });
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обрабатывает запрос на подтверждение распоряжения за "иные" рабочие полигоны.
 * Это возможно сделать лишь на полигоне-издателе распоряжения.
 *
 * Информация о типе, id рабочего полигона (и id рабочего места в рамках рабочего полигона) извлекается из
 * токена пользователя. Если этой информации в токене нет, то распоряжение подтвержаться не будет.
 *
 * Параметры запроса:
 *   id - идентификатор подтверждаемого распоряжения
 *   confirmDateTime - дата и время, когда пользователь подтвердил распоряжение
 */
 router.post(
  '/confirmOrderForOtherReceivers',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка факта нахождения пользователя на дежурстве
  isOnDuty,
  async (req, res) => {
    const userWorkPoligon = req.user.workPoligon;

    // Считываем находящиеся в пользовательском запросе данные
    const { orderId, confirmDateTime } = req.body;

    try {
      // Вначале ищем распоряжение в основной коллекции распоряжений
      const order = await Order.findOne({ _id: orderId });
      if (!order) {
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в базе данных' });
      }

      // Нужно, чтобы распоряжение было издано на том рабочем полигоне, с которого пришел запрос.
      const wrongPoligonByDispatchSector =
        (order.workPoligon.type !== userWorkPoligon.type) ||
        (String(order.workPoligon.id) !== String(userWorkPoligon.id)) ||
        (
          (!order.workPoligon.workPlaceId && userWorkPoligon.workPlaceId) ||
          (order.workPoligon.workPlaceId && !userWorkPoligon.workPlaceId) ||
          (order.workPoligon.workPlaceId && userWorkPoligon.workPlaceId && String(order.workPoligon.workPlaceId) !== String(userWorkPoligon.workPlaceId))
        );
      if (wrongPoligonByDispatchSector) {
        return res.status(ERR).json({ message: 'Подтвердить за иных адресатов можно лишь с того рабочего полигона, на котором распоряжение было издано' });
      }

      if (!order.otherToSend || !order.otherToSend.length) {
        return res.status(ERR).json({ message: 'Нет полигонов для подтверждения' });
      }

      order.otherToSend.forEach((el) => {
        el.confirmDateTime = confirmDateTime;
      });

      // После подтверждения распоряжения необходимо проверить его утвержденность, если оно еще не утверждено
      if (!order.assertDateTime) {
        order.assertDateTime = isOrderAsserted(order);
      }

      await order.save();

      res.status(OK).json({ message: 'Распоряжение подтверждено', orderId, assertDateTime: order.assertDateTime });

      // Логируем действие пользователя
      const logObject = {
        user: userPostFIOString(req.user),
        workPoligon: `${userWorkPoligon.type}, id=${userWorkPoligon.id}, workPlaceId=${userWorkPoligon.workPlaceId}`,
        actionTime: confirmDateTime,
        action: 'Подтверждение распоряжения за других',
        actionParams: {
          userId: req.user.userId, orderId, confirmDateTime,
        },
      };
      addDY58UserActionInfo(logObject);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Подтверждение распоряжения за других',
        error,
        actionParams: {
          userId: req.user.userId, user: userPostFIOString(req.user), orderId, confirmDateTime,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на подтверждение распоряжения за других лиц (с других рабочих полигонов / рабочих мест).
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * Подтвердить распоряжение за других может лишь:
 * 1) создатель распоряжения - за те рабочие полигоны, которые явно были прописаны в секции "Кому" при
 *    создании распоряжения; если распоряжение издается на станции, то за рабочие места на станции
 *    подтвердить распоряжение может лишь его издатель (например, распоряжение издается на рабочем месте
 *    Оператора при ДСП №1, значит, его подтвердить за все рабочие места на станции может только лицо с
 *    этого рабочего места, ДСП не может)
 * 2) получатель распоряжения на станции (ДСП) может подтвердить распоряжение за все рабочие места на этой
 *    станции (получатель распоряжения, изданного вне станции - станция, значит, подтвердить за других на
 *    станции может только ДСП).
 *
 * ! Запрос не может вызываться одновременно для подтверждения распоряжений за рабочие полигоны, которым оно
 * было адресовано через секцию "Кому" и подтверждения за рабочие места на станции. Только независимые вызовы!
 *
 * При подтверждении распоряжения за другой рабочий полигон данное распоряжение автоматически переходит из
 * списка "Входящие уведомления" в список "Распоряжения в работе" на этом рабочем полигоне.
 *
 * Информация о типе, id рабочего полигона (и id рабочего места в рамках рабочего полигона), с которого направлен
 * запрос на подтверждение, извлекается из токена пользователя. Если этой информации в токене нет, то распоряжения
 * подтвержаться не будут.
 *
 * Параметры запроса:
 *   confirmWorkPoligons - массив элементов, каждый из которых включает поля:
 *     workPoligonType, workPoligonId - определяют рабочий полигон, за который производится подтверждение распоряжения,
 *     workPlaceId - определяет рабочее место в рамках рабочего полигона (не обязательное поле),
 *     post, fio - должность и ФИО лица, за которого производится подтверждение распоряжения,
 *   orderId - идентификатор подтверждаемого распоряжения
 *   confirmDateTime - дата и время, когда пользователь подтвердил распоряжение
 */
 router.post(
  '/confirmOrdersForOthers',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка факта нахождения пользователя на дежурстве
  isOnDuty,
  async (req, res) => {
    const userWorkPoligon = req.user.workPoligon;

    // Считываем находящиеся в пользовательском запросе данные
    const { confirmWorkPoligons, orderId, confirmDateTime } = req.body;

    if (!confirmWorkPoligons || !confirmWorkPoligons.length) {
      return res.status(ERR).json({ message: 'Не указаны полигоны управления, за которые необходимо подтвердить распоряжение' });
    }

    // Отмечаем подтверждение распоряжения в коллекции рабочих распоряжений, а также
    // в общей коллеции распоряжений

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    let orderConfirmed = false;

    try {
      // Вначале ищем распоряжение в основной коллекции распоряжений
      const order = await Order.findOne({ _id: orderId }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в базе данных' });
      }

      // Далее, нам необходимо убедиться в том, что распоряжение было издано на том рабочем
      // полигоне, на котором может работать пользователь, сделавший запрос
      const wrongPoligonByDispatchSector =
        (order.workPoligon.type !== userWorkPoligon.type) ||
        (String(order.workPoligon.id) !== String(userWorkPoligon.id)) ||
        (
          (!order.workPoligon.workPlaceId && userWorkPoligon.workPlaceId) ||
          (order.workPoligon.workPlaceId && !userWorkPoligon.workPlaceId) ||
          (order.workPoligon.workPlaceId && userWorkPoligon.workPlaceId && String(order.workPoligon.workPlaceId) !== String(userWorkPoligon.workPlaceId))
        );
      if (wrongPoligonByDispatchSector) {
        // Если рабочий полигон не прошел проверку, то убеждаемся в том, что распоряжение было адресовано
        // станции, при этом рабочие полигоны, за которые необходимо подтвердить распоряжение - рабочие места
        // на этой станции, а подтверждающий за других - обязательно ДСП этой станции!
        const wrongConfirmedWorkPoligon = confirmWorkPoligons.find((wp) =>
          wp.workPoligonType !== userWorkPoligon.type ||
          wp.workPoligonId !== userWorkPoligon.id
        );
        const wrongPoligonByAddressee =
          (
            userWorkPoligon.type !== WORK_POLIGON_TYPES.STATION ||
            wrongConfirmedWorkPoligon ||
            !order.dspToSend ||
            !order.dspToSend.find((item) => String(item.id) === String(userWorkPoligon.id)) ||
            !req.user.specialCredentials ||
            !req.user.specialCredentials.includes(DSP_FULL)
          );
        if (wrongPoligonByAddressee) {
          await session.abortTransaction();
          return res.status(ERR).json({
            message: 'Подтверждать распоряжение за других может лишь его издатель либо ДСП в случае подтверждения адресованного станции распоряжения за рабочие места на станции',
          });
        }
      }

      // Для записи в основной коллекции распоряжений ищем каждый из указанных полигонов управления,
      // за который необходимо осуществить подтверждение распоряжения, и подтверждаем это распоряжение,
      // если оно еще на данном полигоне не подтверждено (ФИО и должность подтвердившего не указываем)

      const findSector = (sectors, workPoligonType, workPoligonId, findGlobalSector, workPlaceId = null) => {
        if (sectors && sectors[0] && sectors[0].type === workPoligonType) {
          return sectors.find((el) =>
            (String(el.id) === String(workPoligonId)) &&
            (findGlobalSector || (
              (!workPlaceId && !el.workPlaceId) ||
              (workPlaceId && el.workPlaceId && String(workPlaceId) === String(el.workPlaceId))
            ))
          );
        }
        return null;
      };

      // сюда поместим и возвратим пользователю реальную ситуацию по рабочим полигонам, указанным в запросе
      // (возможно, какие-то из них не подтвердятся ввиду того, что кто-то их успел подтвердить раньше,
      // потому нужно вернуть информацию по более раннему подтверждению)
      const actualGlobalConfirmWorkPoligonsInfo = []; // для информации по секции "Кому" распоряжения
      const actualLocalConfirmWorkPoligonsInfo = []; // для информации по рабочим местам на станции

      for (let workPoligon of confirmWorkPoligons) {
        let sector; // полигон управления для глобального подтверждения распоряжения (секция "Кому" распоряжения)
        let localSector; // рабочее место в рамках станции

        switch (workPoligon.workPoligonType) {
          case WORK_POLIGON_TYPES.STATION:
            if (!workPoligon.workPlaceId)
              sector = findSector(order.dspToSend, workPoligon.workPoligonType, workPoligon.workPoligonId, true);
            // смотрим, нужно ли подтверждать распоряжение в рамках станции (локально)
            localSector = findSector(order.stationWorkPlacesToSend, workPoligon.workPoligonType, workPoligon.workPoligonId, false, workPoligon.workPlaceId);
            break;
          case WORK_POLIGON_TYPES.DNC_SECTOR:
            sector = findSector(order.dncToSend, workPoligon.workPoligonType, workPoligon.workPoligonId, true);
            break;
          case WORK_POLIGON_TYPES.ECD_SECTOR:
            sector = findSector(order.ecdToSend, workPoligon.workPoligonType, workPoligon.workPoligonId, true);
            break;
        }
        // объект sector может оказаться неопределен; такое, в частности, возможно, если распоряжение было издано
        // в рамках станции и никуда не рассылалось, кроме рабочих мест на самой станции

        if (sector) {
          if (!sector.confirmDateTime) {
            sector.confirmDateTime = confirmDateTime;
            if (workPoligon.post) sector.post = workPoligon.post;
            if (workPoligon.fio) sector.fio = workPoligon.fio;
            if (!orderConfirmed) orderConfirmed = true;
          }
          actualGlobalConfirmWorkPoligonsInfo.push({
            workPoligonType: sector.type,
            workPoligonId: sector.id,
            workPlaceId: null,
            confirmDateTime: sector.confirmDateTime,
            post: sector.post,
            fio: sector.fio,
          });
        }
        if (localSector) {
          if (!localSector.confirmDateTime) {
            localSector.confirmDateTime = confirmDateTime;
            if (workPoligon.post) localSector.post = workPoligon.post;
            if (workPoligon.fio) localSector.fio = workPoligon.fio;
            if (!orderConfirmed) orderConfirmed = true;
          }
          actualLocalConfirmWorkPoligonsInfo.push({
            workPoligonType: localSector.type,
            workPoligonId: localSector.id,
            workPlaceId: localSector.workPlaceId,
            confirmDateTime: localSector.confirmDateTime,
            post: localSector.post,
            fio: localSector.fio,
          });
        }

        // Подтвержаем распоряжение в коллекции рабочих распоряжений
        const findRecordConditions = [
          { orderId },
          { "recipientWorkPoligon.id": workPoligon.workPoligonId },
          { "recipientWorkPoligon.type": workPoligon.workPoligonType },
        ];
        if (workPoligon.workPlaceId) {
          findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workPoligon.workPlaceId });
        } else {
          // The { item : null } query matches documents that either contain the item field
          // whose value is null or that do not contain the item field
          findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": null });
        }
        const workOrder = await WorkOrder.findOne({ $and: findRecordConditions }).session(session);
        // Здесь не генерируем никаких ошибок, если в коллекции рабочих распоряжений ничего не найдем
        // либо если там будет присутствовать дата подтверждения
        if (workOrder && !workOrder.confirmDateTime) {
          workOrder.confirmDateTime = confirmDateTime;
          // By default, `save()` uses the associated session
          await workOrder.save();
        }
      }

      if (orderConfirmed) {
        // После подтверждения распоряжения необходимо проверить его утвержденность, если оно еще не утверждено
        if (!order.assertDateTime) {
          order.assertDateTime = isOrderAsserted(order);
        }
        // By default, `save()` uses the associated session
        await order.save();
      }

      await session.commitTransaction();

      res.status(OK).json({
        message: 'Распоряжение подтверждено',
        orderId,
        actualGlobalConfirmWorkPoligonsInfo,
        actualLocalConfirmWorkPoligonsInfo,
        assertDateTime: order.assertDateTime,
      });

      // Логируем действие пользователя
      const logObject = {
        user: userPostFIOString(req.user),
        workPoligon: `${userWorkPoligon.type}, id=${userWorkPoligon.id}, workPlaceId=${userWorkPoligon.workPlaceId}`,
        actionTime: confirmDateTime,
        action: 'Подтверждение распоряжения за других',
        actionParams: {
          userId: req.user.userId, confirmWorkPoligons, orderId, confirmDateTime,
        },
      };
      addDY58UserActionInfo(logObject);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Подтверждение распоряжения за других',
        error,
        actionParams: {
          userId: req.user.userId, user: userPostFIOString(req.user), confirmWorkPoligons, orderId, confirmDateTime,
        },
      });
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обрабатывает запрос на удаление цепочки распоряжений из списка распоряжений, находящихся
 * в работе на заданном полигоне управления. Удалению подлежат лишь те распоряжения цепочки,
 * которые имеют статус "подтверждено".
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Информация о типе, id рабочего полигона (и id рабочего места в рамках рабочего полигона) извлекается из
 * токена пользователя. Если этой информации в токене нет, то цепочка распоряжений удаляться не будет.
 *
 * Параметры запроса:
 *   chainId - идентификатор цепочки распоряжений
 */
 router.post(
  '/delConfirmedOrdersFromChain',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;

    // Считываем находящиеся в пользовательском запросе данные
    const { chainId } = req.body;

    const findRecordsConditions = [
      { "recipientWorkPoligon.id": workPoligon.id },
      { "recipientWorkPoligon.type": workPoligon.type },
      { "orderChain.chainId": chainId },
      // $ne selects the documents where the value of the field is not equal to the specified value.
      // This includes documents that do not contain the field.
      { confirmDateTime: { $exists: true } },
      { confirmDateTime: { $ne: null } },
    ];
    if (workPoligon.workPlaceId) {
      findRecordsConditions.push({ "recipientWorkPoligon.workPlaceId": workPoligon.workPlaceId });
    } else {
      // The { item : null } query matches documents that either contain the item field
      // whose value is null or that do not contain the item field
      findRecordsConditions.push({ "recipientWorkPoligon.workPlaceId": null });
    }

    try {
      // Удаляем записи в таблице рабочих распоряжений
      await WorkOrder.deleteMany({ $and: findRecordsConditions });
      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление рабочего распоряжения / цепочки распоряжений',
        error,
        actionParams: {
          userId: req.user.userId, user: userPostFIOString(req.user), chainId,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на удаление записи об адресате распоряжения в рамках станции.
 * ! Удалить можно только не подтвержденную запись.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * Информацию по получателю распоряжения на рабочем месте станции может удалить:
 * 1) издатель данного распоряжения, если он - работник станции (ДСП или Оператор при ДСП) -
 *    может удалить любого из получателей на станции (в том числе и ДСП),
 * 2) ДСП (не Оператор при ДСП!) в случае распоряжения, изданного не на станции, но адресованного ей,
 *    может удалить любого из получателей на станции, кроме себя
 *
 * Информация о типе, id рабочего полигона (и id рабочего места) извлекается из токена пользователя.
 * Если этой информации в токене нет, то запрос не будет обработан.
 *
 * Параметры запроса:
 *   orderId - идентификатор распоряжения
 *   workPlaceId - id рабочего места на станции
 */
 router.post(
  '/delStationWorkPlaceReceiver',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [DSP_FULL, DSP_Operator],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkGeneralCredentials,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    const userWorkPoligon = req.user.workPoligon;

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { orderId, workPlaceId } = req.body;

    try {
      // Ищем распоряжение в основной коллекции
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Распоряжение не найдено' });
      }

      const recordToDelete = !order.stationWorkPlacesToSend ? null :
        order.stationWorkPlacesToSend.find((item) =>
          item.type === userWorkPoligon.type && String(item.id) === String(userWorkPoligon.id) &&
          (
            (!item.workPlaceId && !workPlaceId) ||
            (item.workPlaceId && workPlaceId && String(item.workPlaceId) === String(workPlaceId))
          )
        );

      if (!recordToDelete) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Получатель распоряжения на станции не найден' });
      }

      if (recordToDelete.confirmDateTime) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Нельзя удалить подтвержденную запись' });
      }

      // Далее, нам необходимо убедиться в том, что распоряжение было издано на том рабочем
      // полигоне, на котором может работать пользователь, сделавший запрос, и этот полигон - станция
      const wrongPoligonByDispatchSector =
        (order.workPoligon.type !== WORK_POLIGON_TYPES.STATION) ||
        (order.workPoligon.type !== userWorkPoligon.type) ||
        (String(order.workPoligon.id) !== String(userWorkPoligon.id)) ||
        (
          (!order.workPoligon.workPlaceId && userWorkPoligon.workPlaceId) ||
          (order.workPoligon.workPlaceId && !userWorkPoligon.workPlaceId) ||
          (order.workPoligon.workPlaceId && userWorkPoligon.workPlaceId && String(order.workPoligon.workPlaceId) !== String(userWorkPoligon.workPlaceId))
        );
      if (wrongPoligonByDispatchSector) {
        // Если пользователь - не издатель распоряжения, то он должен быть ДСП, станции которого
        // адресовано распоряжение
        const wrongPoligonByAddressee =
          (
            userWorkPoligon.type !== WORK_POLIGON_TYPES.STATION ||
            !order.dspToSend ||
            !order.dspToSend.find((item) => String(item.id) === String(userWorkPoligon.id)) ||
            !req.user.specialCredentials ||
            !req.user.specialCredentials.includes(DSP_FULL)
          );
        if (wrongPoligonByAddressee) {
          await session.abortTransaction();
          return res.status(ERR).json({
            message: 'Удалить адресата на станции может лишь работник того рабочего места на станции, на котором распоряжение было издано, либо ДСП в случае распоряжения, изданного вне станции',
          });
        }
        // ДСП не может удалить сам себя!
        if (!recordToDelete.workPlaceId) {
          await session.abortTransaction();
          return res.status(ERR).json({
            message: 'Удаление основного получателя на станции недопустимо',
          });
        }
      }

      order.stationWorkPlacesToSend = order.stationWorkPlacesToSend.filter((el) => el !== recordToDelete);

      // В таблице рабочих распоряжений запись удалять не нужно!

      // By default, `save()` uses the associated session
      await order.save();

      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Удаление адресата распоряжения в рамках станции',
        error,
        actionParams: {
          userId: req.user.userId, user: userPostFIOString(req.user), orderId, workPlaceId,
        },
      });
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


module.exports = router;
