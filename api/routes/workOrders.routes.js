const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const { isOnDuty } = require('../middleware/isOnDuty.middleware');
const Order = require('../models/Order');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
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

const getUserFIOString = ({ name, fatherName, surname }) => {
  return `${surname} ${name.charAt(0)}.${fatherName && fatherName.length ? fatherName.charAt(0) + '.': ''}`;
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
      creds: [DNC_FULL, DSP_FULL, DSP_Operator, ECD_FULL],
    };
    next();
  },
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  async (req, res) => {
    try {
      const workPoligon = req.user.workPoligon;
      if (!workPoligon || !workPoligon.type || !workPoligon.id) {
        return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
      }
      // Считываем находящиеся в пользовательском запросе данные
      const { startDate } = req.body;

      let data;

      const findRecordConditions = [
        { recipientWorkPoligon: { $exists: true } },
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
  checkAuthority,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { orderIds, deliverDateTime } = req.body;

      // Отмечаем подтверждение доставки распоряжений в коллекции рабочих распоряжений
      const findRecordConditions = [
        { orderId: orderIds },
        { recipientWorkPoligon: { $exists: true } },
        { "recipientWorkPoligon.id": workPoligon.id },
        { "recipientWorkPoligon.type": workPoligon.type },
      ];
      if (workPoligon.workPlaceId) {
        findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workPoligon.workPlaceId });
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
          if (sectors && sectors[0] && sectors[0].type === workPoligon.type) {
            return sectors.find((el) => el.id === workPoligon.id);
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
 * Подтверждение распоряжения производится как на уровне рабочих распоряжений полигона управления, так и
 * на уровне самого распоряжения, хранящегося в общей коллекции распоряжений. В последнем случае распоряжение
 * подтверждается на указанном полигоне управления лишь в том случае, если ранее на данном полигоне управления
 * его никто не подтверждал.
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
  // проверка полномочий пользователя на выполнение запрашиваемого действия
  checkAuthority,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, confirmDateTime } = req.body;

      // Отмечаем подтверждение распоряжения в коллекции рабочих распоряжений, а также
      // в общей коллеции распоряжений (в общей коллекции - если оно там еще не подтверждено)

      // Итак, вначале подтвержаем на своем рабочем полигоне

      const findRecordConditions = [
        { orderId: id },
        { recipientWorkPoligon: { $exists: true } },
        { "recipientWorkPoligon.id": workPoligon.id },
        { "recipientWorkPoligon.type": workPoligon.type },
      ];
      if (workPoligon.workPlaceId) {
        findRecordConditions.push({ "recipientWorkPoligon.workPlaceId": workPoligon.workPlaceId });
      } else {
        findRecordConditions.push({
          $or: [
            { "recipientWorkPoligon.workPlaceId": { $exists: false } },
            { "recipientWorkPoligon.workPlaceId": null },
          ]
        });
      }
      const workOrder = await WorkOrder.findOne({ $and: findRecordConditions }).session(session);
      if (!workOrder) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в списке распоряжений, находящихся в работе на указанном полигоне управления' });
      }
      if (workOrder.confirmDateTime) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение ранее было подтверждено на уканном полигоне управления' });
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

      // Проверяем, подтверждено ли распоряжение на указанном рабочем полигоне глобально

      const findSector = (sectors) => {
        if (sectors && sectors[0] && sectors[0].type === workPoligon.type) {
          return sectors.find((el) => String(el.id) === String(workPoligon.id));
        }
        return null;
      };

      let sector;
      switch (workPoligon.type) {
        case WORK_POLIGON_TYPES.STATION:
          sector = findSector(order.dspToSend);
          break;
        case WORK_POLIGON_TYPES.DNC_SECTOR:
          sector = findSector(order.dncToSend);
          break;
        case WORK_POLIGON_TYPES.ECD_SECTOR:
          sector = findSector(order.ecdToSend);
          break;
      }
      /*if (!sector) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не адресовалось данному рабочему полигону' });
      }*/
      let orderConfirmedLocally = true;
      // Если распоряжение было ЯВНО адресовано данному рабочему полигону и глобально не подтверждалось...
      if (sector && !sector.confirmDateTime) {
        // ...то подтверждаем и указываем лицо, его подтвердившее; но сначала информацию об этом лице найдем
        const user = await User.findOne({ _id: req.user.userId }).session(session);
        if (!user) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Не удалось найти информацию о лице, подтверждающем распоряжение' });
        }
        sector.confirmDateTime = confirmDateTime;
        sector.fio = getUserFIOString({ name: user.name, fatherName: user.fatherName, surname: user.surname });
        // By default, `save()` uses the associated session
        await order.save();
        orderConfirmedLocally = false;
      }

      await session.commitTransaction();

      res.status(OK).json({ message: `Распоряжение подтверждено ${orderConfirmedLocally ? 'локально' : 'глобально'}`, id });

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
 * Подтвердить распоряжение за других может лишь лицо - работник рабочего полигона, на котором
 * распоряжение было создано.
 *
 * Информация о типе, id рабочего полигона (и id рабочего места в рамках рабочего полигона) извлекается из
 * токена пользователя. Если этой информации в токене нет, то распоряжение подтвержаться не будет.
 *
 * Параметры запроса:
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
    const userWorkPoligon = req.user.workPoligon;

    // Считываем находящиеся в пользовательском запросе данные
    const {
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
      // полигоне, на котором может работать пользователь, сделавший запрос (для оператора при ДСП, так же
      // как и для ДСП, рабочий полигон - станция)
      let wrongPoligon =
        (order.workPoligon.type !== userWorkPoligon.type) ||
        (String(order.workPoligon.id) !== String(userWorkPoligon.id));

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

      // Для записи в основной коллекции распоряжений ищем каждый из указанных полигонов управления,
      // за который необходимо осуществить подтверждение распоряжения, и подтверждаем это распоряжение,
      // если оно еще на данном полигоне не подтверждено

      const findSector = (sectors, workPoligonType, workPoligonId) => {
        if (sectors && sectors[0] && sectors[0].type === workPoligonType) {
          return sectors.find((el) => el.id === workPoligonId);
        }
        return null;
      };

      for (let workPoligon of confirmWorkPoligons) {
        let sector;
        switch (workPoligon.workPoligonType) {
          case WORK_POLIGON_TYPES.STATION:
            sector = findSector(order.dspToSend, workPoligon.workPoligonType, workPoligon.workPoligonId);
            break;
          case WORK_POLIGON_TYPES.DNC_SECTOR:
            sector = findSector(order.dncToSend, workPoligon.workPoligonType, workPoligon.workPoligonId);
            break;
          case WORK_POLIGON_TYPES.ECD_SECTOR:
            sector = findSector(order.ecdToSend, workPoligon.workPoligonType, workPoligon.workPoligonId);
            break;
        }
        if (sector) {
          if (!sector.confirmDateTime) {
            sector.confirmDateTime = confirmDateTime;
          }
        } else {
          await session.abortTransaction();
          return res.status(ERR).json({
            message: `Для указанного распоряжения не найден полигон управления ${workPoligon.workPoligonType} с id=${workPoligon.workPoligonId}, на котором необходимо осуществить подтверждение`,
          });
        }
        // Подтвержаем распоряжение в коллекции рабочих распоряжений.
        // Нюанс здесь такой. Распоряжение подтверждается только на глобальном полигоне (как и адресуется
        // при создании). Это означает, в частности, что в случае ДСП и Операторов при ДСП подтверждение за
        // себя со стороны другого лица может увидеть лишь ДСП, т.к. именно он имеет в качестве рабочего
        // полигона станцию, а не рабочее место на станции.
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
        const workOrder = await WorkOrder.findOne({ $and: findRecordConditions }).session(session);
        // Здесь не генерируем никаких ошибок, если в коллекции рабочих распоряжений ничего не найдем
        // либо если там будет присутствовать дата подтверждения
        if (workOrder && !workOrder.confirmDateTime) {
          workOrder.confirmDateTime = confirmDateTime;
          // By default, `save()` uses the associated session
          await workOrder.save();
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
  checkAuthority,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { chainId } = req.body;

      const findRecordsConditions = [
        { recipientWorkPoligon: { $exists: true } },
        { "recipientWorkPoligon.id": workPoligon.id },
        { "recipientWorkPoligon.type": workPoligon.type },
        { orderChain: { $exists: true } },
        { "orderChain.chainId": chainId },
        // $ne selects the documents where the value of the field is not equal to the specified value.
        // This includes documents that do not contain the field.
        { confirmDateTime: { $exists: true } },
        { confirmDateTime: { $ne: null } },
      ];
      if (workPoligon.workPlaceId) {
        findRecordsConditions.push({ "recipientWorkPoligon.workPlaceId": workPoligon.workPlaceId });
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
