const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const { isOnDuty } = require('../middleware/isOnDuty.middleware');
const Order = require('../models/Order');
const WorkOrder = require('../models/WorkOrder');
const { WORK_POLIGON_TYPES } = require('../constants');

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
} = require('../constants');


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
 * Параметры запроса (workPoligonType, workPoligonId, workSubPoligonId), если указаны, то определяют рабочий полигон
 * (либо рабочее место в рамках рабочего полигона, если указан параметр workSubPoligonId), информацию по которому
 * необходимо извлечь. В противном случае информация извлекаться не будет.
 *
 * Параметр startDate - дата-время начала временного интервала извлечения информации (временного интервала,
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
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { workPoligonType, workPoligonId, workSubPoligonId, startDate } = req.body;

      let data;

      if (!workPoligonType || !workPoligonId) {
        return res.status(OK).json([]);
      }

      const findRecordConditions = [
        { recipientWorkPoligon: { $exists: true } },
        { "recipientWorkPoligon.id": workPoligonId },
        { "recipientWorkPoligon.type": workPoligonType },
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
      if (workSubPoligonId) {
        findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workSubPoligonId });
      } else {
        findRecordConditions.push({
          $or: [
            { "recipientWorkPoligon.workPlaceId": { $exists: false } },
            { "recipientWorkPoligon.workPlaceId": null },
          ]
        });
      }

      const matchFilter = !startDate ? {} : { $and: findRecordConditions };
      const workData = await WorkOrder.find(matchFilter);

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
      res.status(OK).json(data || []);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на подтверждение доставки распоряжений на конкретный рабочий полигон.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры запроса:
 *   workPoligonType, workPoligonId, workSubPoligonId - определяют рабочий полигон (либо рабочее место
 *     в рамках рабочего полигона, если указан параметр workSubPoligonId), с которого приходит подтверждение
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
  checkAuthority,
  async (req, res) => {
    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { workPoligonType, workPoligonId, workSubPoligonId, orderIds, deliverDateTime } = req.body;

      // Отмечаем подтверждение доставки распоряжений в коллекции рабочих распоряжений
      const findRecordConditions = [
        { orderId: orderIds },
        { recipientWorkPoligon: { $exists: true } },
        { "recipientWorkPoligon.id": workPoligonId },
        { "recipientWorkPoligon.type": workPoligonType },
      ];
      if (workSubPoligonId) {
        findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workSubPoligonId });
      } else {
        findRecordConditions.push({
          $or: [
            { "recipientWorkPoligon.workPlaceId": { $exists: false } },
            { "recipientWorkPoligon.workPlaceId": null },
          ]
        });
      }

      await WorkOrder.updateMany({ $and: findRecordConditions }, { $set: { deliverDateTime } }).session(session);

      // Отмечаем подтверждение доставки распоряжений в основной коллекции распоряжений.
      // При этом нам неважно, кто подтвердил на станции (ДСП либо оператор при ДСП).
      const orders = await Order.find({ _id: orderIds }).session(session);

      if (orders && orders.length) {
        const findSector = (sectors) => {
          if (sectors && sectors[0] && sectors[0].type === workPoligonType) {
            return sectors.find((el) => el.id === workPoligonId);
          }
          return null;
        };
        for (let order of orders) {
          let sector = findSector(order.dspToSend);
          if (sector) {
            sector.deliverDateTime = deliverDateTime;
          } else {
            sector = findSector(order.dncToSend);
            if (sector) {
              sector.deliverDateTime = deliverDateTime;
            } else {
              sector = findSector(order.ecdToSend);
              if (sector) {
                sector.deliverDateTime = deliverDateTime;
              }
            }
          }
          if (sector) {
            // By default, `save()` uses the associated session
            await order.save();
          }
        }
      }

      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно сохранена' });

    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обрабатывает запрос на подтверждение распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры запроса:
 *   workPoligonType, workPoligonId, workSubPoligonId - определяют рабочий полигон / рабочее место полигона (если
 *     указан параметр workSubPoligonId), на котором производится подтверждение распоряжения
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
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { workPoligonType, workPoligonId, workSubPoligonId, id, confirmDateTime } = req.body;

      // Отмечаем подтверждение распоряжения в коллекции рабочих распоряжений, а также
      // в общей коллеции распоряжений (в общей коллекции - если отсутствует workSubPoligonId, т.к.
      // только сам ДСП может подтвердить глобально)

      const findRecordConditions = [
        { orderId: id },
        { recipientWorkPoligon: { $exists: true } },
        { "recipientWorkPoligon.id": workPoligonId },
        { "recipientWorkPoligon.type": workPoligonType },
      ];
      if (workSubPoligonId) {
        findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workSubPoligonId });
      } else {
        findRecordConditions.push({
          $or: [
            { "recipientWorkPoligon.workPlaceId": { $exists: false } },
            { "recipientWorkPoligon.workPlaceId": null },
          ]
        });
      }

      const result = await WorkOrder.updateOne(
        { $and: findRecordConditions }, { $set: { confirmDateTime } }
      ).session(session);

      if (result.nModified !== 1) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено среди распоряжений, находящихся в работе на указанном полигоне' });
      }

      const workOrder = await WorkOrder.findOne({ $and: findRecordConditions }).session(session);
      if (!workOrder) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение исчезло из списка распоряжений, находящихся в работе на указанном полигоне' });
      }

      // Если подтверждение распоряжения производится не на рабочем месте, а глобально на полигоне управления,
      // то подтверждение такого распоряжения необходимо отметить в основной коллекции распоряжений.
      // Исключение: если распоряжение издано в рамках станции оператором при ДСП и пришло самому ДСП (такое
      // распоряжение будет у ДСП в рабочих распоряжениях, но не будет адресовано ему в общей таблице распоряжений)
      if (!(workSubPoligonId ||
        (workOrder.senderWorkPoligon.type === workPoligonType && workOrder.senderWorkPoligon.id === workPoligonId))) {
        const order = await Order.findOne({ _id: id }).session(session);
        if (!order) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в базе данных' });
        }

        const findSector = (sectors) => {
          if (sectors && sectors[0] && sectors[0].type === workPoligonType) {
            return sectors.find((el) => el.id === workPoligonId);
          }
          return null;
        };

        let sector = findSector(order.dspToSend);
        if (sector) {
          sector.confirmDateTime = confirmDateTime;
        } else {
          sector = findSector(order.dncToSend);
          if (sector) {
            sector.confirmDateTime = confirmDateTime;
          } else {
            sector = findSector(order.ecdToSend);
            if (sector) {
              sector.confirmDateTime = confirmDateTime;
            }
          }
        }

        if (!sector) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Для указанного распоряжения не найден участок, осуществляющий подтверждение' });
        }

        // By default, `save()` uses the associated session
        await order.save();
      }

      await session.commitTransaction();

      res.status(OK).json({ message: 'Распоряжение подтверждено', id });

    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обрабатывает запрос на подтверждение распоряжения за других лиц (с других рабочих полигонов).
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * Подтвердить распоряжение за других может лишь лицо-работник рабочего полигона, на котором
 * распоряжение было создано.
 *
 * Параметры запроса:
 *   workPoligonType, workPoligonId, workSubPoligonId - определяют рабочий полигон (либо рабочее место в рамках
 *     рабочего полигона, если указан параметр workSubPoligonId), с которого пришел запрос на подтверждение распоряжения за других
 *   confirmWorkPoligons - массив элементов, каждый из которых включает поля:
 *     workPoligonType, workPoligonId - определяют рабочий полигон, за который производится подтверждение распоряжения
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
      creds: [DNC_FULL, DSP_FULL, ECD_FULL],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const {
      workPoligonType,
      workPoligonId,
      workSubPoligonId,
      confirmWorkPoligons,
      orderId,
      confirmDateTime,
    } = req.body;

    if (!confirmWorkPoligons || !confirmWorkPoligons.length) {
      return res.status(ERR).json({ message: 'Не указаны полигоны управления, за которые необходимо подтвердить распоряжение' });
    }

    // Отмечаем подтверждение распоряжения в коллекции рабочих распоряжений, а также
    // в общей коллеции распоряжений

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Вначале ищем распоряжение в основной коллекции распоряжений
      const order = await Order.findOne({ _id: orderId }).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в базе данных' });
      }

      // Далее, нам необходимо убедиться в том, что распоряжение было издано на том рабочем
      // полигоне, на котором может работать пользователь, сделавший запрос
      let wrongPoligon =
        (order.workPoligon.type !== workPoligonType) ||
        (String(order.workPoligon.id) !== String(workPoligonId)) ||
        (workSubPoligonId && String(order.workPoligon.workPlaceId) !== String(workSubPoligonId));

      if (!wrongPoligon) {
        switch (order.workPoligon.type) {
          case WORK_POLIGON_TYPES.STATION:
            if (!req.user.stationWorkPoligons.find((el) => String(el.SWP_StID) === String(order.workPoligon.id))) {
              wrongPoligon = true;
            }
            break;
          case WORK_POLIGON_TYPES.DNC_SECTOR:
            if (!req.user.dncSectorsWorkPoligons.find((el) => String(el.DNCSWP_DNCSID) === String(order.workPoligon.id))) {
              wrongPoligon = true;
            }
            break;
          case WORK_POLIGON_TYPES.ECD_SECTOR:
            if (!req.user.ecdSectorsWorkPoligons.find((el) => String(el.ECDSWP_ECDSID) === String(order.workPoligon.id))) {
              wrongPoligon = true;
            }
            break;
        }
      }
      if (wrongPoligon) {
        await session.abortTransaction();
        return res.status(ERR).json({
          message: 'Подтверждать распоряжение за других может лишь работник того рабочего полигона, на котором распоряжение было издано',
        });
      }

      const findSector = (sectors, workPoligonType, workPoligonId) => {
        if (sectors && sectors[0] && sectors[0].type === workPoligonType) {
          return sectors.find((el) => el.id === workPoligonId);
        }
        return null;
      };

      for (let workPoligon of confirmWorkPoligons) {
        // Для записи в основной коллекции распоряжений ищем полигон управления, за который необходимо
        // осуществить подтверждение распоряжения, и подтверждаем это распоряжение, если оно не подтверждено
        let sector = findSector(order.dspToSend, workPoligon.workPoligonType, workPoligon.workPoligonId);
        if (sector && !sector.confirmDateTime) {
          sector.confirmDateTime = confirmDateTime;
        } else {
          sector = findSector(order.dncToSend, workPoligon.workPoligonType, workPoligon.workPoligonId);
          if (sector && !sector.confirmDateTime) {
            sector.confirmDateTime = confirmDateTime;
          } else {
            sector = findSector(order.ecdToSend, workPoligon.workPoligonType, workPoligon.workPoligonId);
            if (sector && !sector.confirmDateTime) {
              sector.confirmDateTime = confirmDateTime;
            }
          }
        }
        if (!sector) {
          await session.abortTransaction();
          return res.status(ERR).json({
            message: `Для указанного распоряжения не найден полигон управления ${workPoligon.workPoligonType} с id=${workPoligon.workPoligonId}, на котором необходимо осуществить подтверждение`,
          });
        }

        const findRecordConditions = [
          { orderId },
          { recipientWorkPoligon: { $exists: true } },
          { "recipientWorkPoligon.id": workPoligon.workPoligonId },
          { "recipientWorkPoligon.type": workPoligon.workPoligonType },
          {
            $or: [
              { "recipientWorkPoligon.workPlaceId": { $exists: false } },
              { "recipientWorkPoligon.workPlaceId": null },
            ]
          }
        ];

        // Подтвержаем распоряжение в коллекции рабочих распоряжений
        const result = await WorkOrder.updateOne(
          { $and: findRecordConditions}, { $set: { confirmDateTime } }
        ).session(session);

        if (result.nModified !== 1) {
          await session.abortTransaction();
          return res.status(ERR).json({
            message: `Указанное распоряжение не найдено среди распоряжений, находящихся в работе, на полигоне ${workPoligon.workPoligonType} с id=${workPoligon.workPoligonId}`,
          });
        }
      }

      // By default, `save()` uses the associated session
      await order.save();

      await session.commitTransaction();

      res.status(OK).json({ message: 'Распоряжение подтверждено', orderId, confirmWorkPoligons });

    } catch (error) {
      console.log(error);

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
 * Параметры запроса:
 *   workPoligonType, workPoligonId, workSubPoligonId - определяют рабочий полигон (либо рабочее место в рамках
 *     рабочего полигона, если указан параметр workSubPoligonId), на котором производится удаление цепочки
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
  checkAuthority,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { workPoligonType, workPoligonId, workSubPoligonId, chainId } = req.body;

      const findRecordsConditions = [
        { recipientWorkPoligon: { $exists: true } },
        { "recipientWorkPoligon.id": workPoligonId },
        { "recipientWorkPoligon.type": workPoligonType },
        { orderChain: { $exists: true } },
        { "orderChain.chainId": chainId },
        // $ne selects the documents where the value of the field is not equal to the specified value.
        // This includes documents that do not contain the field.
        { confirmDateTime: { $exists: true } },
        { confirmDateTime: { $ne: null } },
      ];
      if (workSubPoligonId) {
        findRecordsConditions.push({ "recipientWorkPoligon.workPlaceId": workSubPoligonId });
      } else {
        findRecordsConditions.push({
          $or: [
            { "recipientWorkPoligon.workPlaceId": { $exists: false } },
            { "recipientWorkPoligon.workPlaceId": null },
          ]
        });
      }

      // Удаляем записи в таблице рабочих распоряжений
      await WorkOrder.deleteMany({ $and: findRecordsConditions });

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
