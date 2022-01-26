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

      // Формируем условие фильтрации для извлечения информации из коллекции рабочих распоряжений.
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

      // Если рабочий полигон - станция, то для каждого распоряжения, адресованного ДАННОМУ рабочему месту,
      // формирую массив получателей копии этого же распоряжения на этой же станции.
      /*const additionalOrders = [];
      const workData = !workDataInitial ? null :
        workDataInitial.filter((item) => {
          if (workPoligon.workPlaceId) {
            if (item.recipientWorkPoligon.workPlaceId === workPoligon.workPlaceId) {
              return true;
            } else {
              additionalOrders.push(item);
              return false;
            }
          }
          if (!item.recipientWorkPoligon.workPlaceId) {
            return true;
          } else {
            additionalOrders.push(item);
            return false;
          }
        });

      additionalOrders.forEach((item) => {
        const parentOrder = workData.find((order) => String(order.orderId) === String(item.orderId));
        if (!parentOrder) {
          return;
        }
        if (!parentOrder.adjacentReceivers) {
          parentOrder.adjacentReceivers = [];
        }
        parentOrder.adjacentReceivers.push({
          id: item.recipientWorkPoligon.id,
          workPlaceId: item.recipientWorkPoligon.workPlaceId,
          type: item.recipientWorkPoligon.type,
          deliverDateTime: item.deliverDateTime,
          confirmDateTime: item.confirmDateTime,
        });
      });*/

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
              //adjacentReceivers: correspWorkDataObject.adjacentReceivers,
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
      // При этом нам неважно, с какого рабочего места на станции (ДСП либо оператора при ДСП)
      // пришло подтверждение доставки распоряжения - от кого первого пришло, такое время и будет зафиксировано.
      const orders = await Order.find({ _id: orderIds }).session(session);

      if (orders && orders.length) {
        const findSector = (sectors, findGlobalSector) => {
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
        for (let order of orders) {
          let sector; // участок глобального подтверждения распоряжения
          let thereAreChangesInObject = false;
          switch (workPoligon.type) {
            case WORK_POLIGON_TYPES.STATION:
              sector = findSector(order.dspToSend, true);
              // подтверждаем распоряжение в рамках станции (локально)
              const localSector = findSector(order.stationWorkPlacesToSend, false);
              if (localSector) {
                localSector.deliverDateTime = deliverDateTime;
                thereAreChangesInObject = true;
              }
              break;
            case WORK_POLIGON_TYPES.DNC_SECTOR:
              sector = findSector(order.dncToSend, true);
              break;
            case WORK_POLIGON_TYPES.ECD_SECTOR:
              sector = findSector(order.ecdToSend, true);
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
 * подтверждается на соответствующем глобальном полигоне управления лишь в том случае, если ранее на данном
 * полигоне управления его никто не подтверждал. На локальном полигоне управления (рабочем месте) подтверждается
 * при условии наличия этого рабочего места.
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
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в списке распоряжений, находящихся в работе на полигоне управления' });
      }
      if (workOrder.confirmDateTime) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение ранее было подтверждено на полигоне управления' });
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

      const findSector = (sectors, findGlobalSector) => {
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

      let sector;
      let localSector;
      switch (workPoligon.type) {
        case WORK_POLIGON_TYPES.STATION:
          sector = findSector(order.dspToSend, true);
          // смотрим, нужно ли подтверждать распоряжение в рамках станции (локально)
          localSector = findSector(order.stationWorkPlacesToSend, false);
          break;
        case WORK_POLIGON_TYPES.DNC_SECTOR:
          sector = findSector(order.dncToSend, true);
          break;
        case WORK_POLIGON_TYPES.ECD_SECTOR:
          sector = findSector(order.ecdToSend, true);
          break;
      }
/*
// Если эту проверку включить, то не будут подтверждаться распоряжения, изданные в рамках станции и неявно
// адресованные рабочим местам на этой же станции.
      if (!sector) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не адресовалось данному рабочему полигону' });
      }
*/
      // отметка о том, как распоряжение было подтверждено в рамках глобального полигона (если true, то лицо,
      // отправившее запрос, было зафиксировано как подтвердившее распоряжение за свой глобальный рабочий полигон -
      // станцию, участок ДСП либо участок ЭЦД; если false, то лицо не было зафиксировано как лицо, подтвердившее
      // распоряжение глобально (данное распоряжение уже было ранее кем-то подтверждено глобально), оно лишь
      // подтвердило распоряжение в рамках своего рабочего места
      let orderConfirmedLocally = true;
      let orderConfirmed = false;

      if ((sector && !sector.confirmDateTime) || (localSector && !localSector.confirmDateTime)) {
        // ищем информацию о лице, подтвердившем распоряжение
        const user = await User.findOne({ _id: req.user.userId }).session(session);
        if (!user) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Не удалось найти информацию о лице, подтверждающем распоряжение' });
        }
        const userFIO = getUserFIOString({ name: user.name, fatherName: user.fatherName, surname: user.surname });
        if (sector && !sector.confirmDateTime) {
          sector.confirmDateTime = confirmDateTime;
          sector.post = user.post;
          sector.fio = userFIO;
          orderConfirmedLocally = false;
          orderConfirmed = true;
        }
        if (localSector && !localSector.confirmDateTime) {
          localSector.confirmDateTime = confirmDateTime;
          localSector.post = user.post;
          localSector.fio = userFIO;
          if (!orderConfirmed) orderConfirmed = true;
        }
        if (orderConfirmed) {
          // By default, `save()` uses the associated session
          await order.save();
        }
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
 * Обрабатывает запрос на подтверждение распоряжений за других лиц (с других рабочих полигонов / рабочих мест).
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * Подтвердить распоряжение за других может лишь:
 * 1) лицо - работник рабочего полигона (локального), на котором распоряжение было создано (т.е., например,
 *    если распоряжение создается на рабочем месте на станции и адресуется ДНЦ, то за этого ДНЦ можно
 *    подтвердить распоряжение с данного станционного рабочего места)
 * 2) либо лицо - работник рабочего полигона (глобального), которому распоряжение адресовалось (например,
 *    распоряжение адресовалось станции, значит подтвердить его могут и ДСП, и оператор при ДСП данной станции
 *    друг за друга, но ни один из них не может подтвердить распоряжение за другие рабочие полигоны, на которые
 *    оно адресовалось)
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
  checkAuthority,
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

      // Далее, нам необходимо убедиться в том, что распоряжение было издано на том глобальном рабочем
      // полигоне, на котором может работать пользователь, сделавший запрос (для ДСП и Оператора при ДСП
      // рабочий полигон - станция)
      const wrongPoligonByDispatchSector =
        (order.workPoligon.type !== userWorkPoligon.type) ||
        (String(order.workPoligon.id) !== String(userWorkPoligon.id))/* ||
        (
          (!order.workPoligon.workPlaceId && userWorkPoligon.workPlaceId) ||
          (order.workPoligon.workPlaceId && !userWorkPoligon.workPlaceId) ||
          (order.workPoligon.workPlaceId && userWorkPoligon.workPlaceId && String(order.workPoligon.workPlaceId) !== String(userWorkPoligon.workPlaceId))
        )*/;
      if (wrongPoligonByDispatchSector) {
        // Если рабочий полигон не прошел проверку, то убеждаемся в том, что распоряжение было адресовано
        // глобальному рабочему полигону, которому принадлежит рабочий полигон пользователя, сделавшего запрос
        // (для ДСП и для оператора при ДСП глобальный рабочий полигон - станция)
        const wrongPoligonByAddressee =
          (
            (userWorkPoligon.type === WORK_POLIGON_TYPES.STATION) &&
            (!order.dspToSend || !order.dspToSend.find((item) => String(item.id) === String(userWorkPoligon.id)))
          ) ||
          (
            (userWorkPoligon.type === WORK_POLIGON_TYPES.DNC_SECTOR) &&
            (!order.dncToSend || !order.dncToSend.find((item) => String(item.id) === String(userWorkPoligon.id)))
          ) ||
          (
            (userWorkPoligon.type === WORK_POLIGON_TYPES.ECD_SECTOR) &&
            (!order.ecdToSend || !order.ecdToSend.find((item) => String(item.id) === String(userWorkPoligon.id)))
          );
        if (wrongPoligonByAddressee) {
          await session.abortTransaction();
          return res.status(ERR).json({
            message: 'Подтверждать распоряжение за других может лишь работник того рабочего полигона, на котором распоряжение было издано, либо работник того рабочего полигона, которому распоряжение адресовалось',
          });
        }
      }

      // Для записи в основной коллекции распоряжений ищем каждый из указанных полигонов управления,
      // за который необходимо осуществить подтверждение распоряжения, и подтверждаем это распоряжение,
      // если оно еще на данном полигоне не подтверждено (ФИО и должность подтвердившего не указываем)
      // и если текущий пользователь имеет право это делать

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
      const actualConfirmWorkPoligonsInfo = [];

      for (let workPoligon of confirmWorkPoligons) {
        let sector;
        let localSector;

        switch (workPoligon.workPoligonType) {
          case WORK_POLIGON_TYPES.STATION:
            sector = findSector(order.dspToSend, workPoligon.workPoligonType, null, true);
            // смотрим, нужно ли подтверждать распоряжение в рамках станции (локально)
            localSector = findSector(order.stationWorkPlacesToSend, workPoligon.workPoligonType, workPoligon.workPoligonId, false, workPoligon.workPlaceId);
            break;
          case WORK_POLIGON_TYPES.DNC_SECTOR:
            sector = findSector(order.dncToSend, workPoligon.workPoligonType, null, true);
            break;
          case WORK_POLIGON_TYPES.ECD_SECTOR:
            sector = findSector(order.ecdToSend, workPoligon.workPoligonType, null, true);
            break;
        }
        // объект sector может оказаться неопределен; такое, в частности, возможно, если распоряжение было издано
        // в рамках станции и никуда не рассылалось, кроме рабочих мест на самой станции
        /*
        if (!sector) {
          await session.abortTransaction();
          return res.status(ERR).json({
            message: `Для указанного распоряжения не найден полигон управления ${workPoligon.workPoligonType} с id=${workPoligon.workPoligonId}, на котором необходимо осуществить подтверждение`,
          });
        }*/
        if (sector && wrongPoligonByDispatchSector) {
          // проверяю, что распоряжение подтверждается на том глобальном полигоне, которому оно адресовалось
          if ((sector.type !== userWorkPoligon.type) || (String(sector.id) !== String(userWorkPoligon.id))) {
            await session.abortTransaction();
            return res.status(ERR).json({
              message: 'Подтверждать распоряжение за других может лишь работник того рабочего полигона, которому распоряжение адресовалось',
            });
          }
        }
        if (sector && !sector.confirmDateTime) {
          sector.confirmDateTime = confirmDateTime;
          if (workPoligon.post) sector.post = workPoligon.post;
          if (workPoligon.fio) sector.fio = workPoligon.fio;
          orderConfirmed = true;
        }
        if (localSector && !localSector.confirmDateTime) {
          localSector.confirmDateTime = confirmDateTime;
          if (workPoligon.post) localSector.post = workPoligon.post;
          if (workPoligon.fio) localSector.fio = workPoligon.fio;
          if (!orderConfirmed) orderConfirmed = true;
        }
        if (!workPoligon.workPlaceId && sector) {
          actualConfirmWorkPoligonsInfo.push({
            workPoligonType: sector.type,
            workPoligonId: sector.id,
            workPlaceId: null,
            confirmDateTime: sector.confirmDateTime,
            post: sector.post,
            fio: sector.fio,
          });
        } else if (localSector) {
          actualConfirmWorkPoligonsInfo.push({
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
          { recipientWorkPoligon: { $exists: true } },
          { "recipientWorkPoligon.id": workPoligon.workPoligonId },
          { "recipientWorkPoligon.type": workPoligon.workPoligonType },
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
        // Здесь не генерируем никаких ошибок, если в коллекции рабочих распоряжений ничего не найдем
        // либо если там будет присутствовать дата подтверждения
        if (workOrder && !workOrder.confirmDateTime) {
          workOrder.confirmDateTime = confirmDateTime;
          // By default, `save()` uses the associated session
          await workOrder.save();
        }
      }

      if (orderConfirmed) {
        // By default, `save()` uses the associated session
        await order.save();
      }

      await session.commitTransaction();

      res.status(OK).json({
        message: 'Распоряжение подтверждено',
        orderId,
        confirmWorkPoligons: actualConfirmWorkPoligonsInfo,
      });

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


/**
 * Обрабатывает запрос на удаление записи об адресате распоряжения в рамках станции.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * Только пользователь, зарегистрированный на станции и наделенный полномочием работать на данном рабочем
 * полигоне может удалить информацию по получателю распоряжения на этой станции.
 *
 * Информация о типе, id рабочего полигона извлекается из токена пользователя.
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
  checkAuthority,
  // проверка факта нахождения пользователя на смене
  isOnDuty,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { orderId, workPlaceId } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Распоряжение не найдено' });
      }
      const condition = (el) =>
        el.type === workPoligon.type && el.id === workPoligon.id &&
        (
          (!el.workPlaceId && !workPlaceId) ||
          (el.workPlaceId && workPlaceId && String(el.workPlaceId) === String(workPlaceId))
        );
      const recordToDel = !order.stationWorkPlacesToSend ? null : order.stationWorkPlacesToSend.find((el) => condition(el));
      if (!recordToDel) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Удаляемая запись не найдена' });
      }
      order.stationWorkPlacesToSend = order.stationWorkPlacesToSend.filter((el) => !condition(el));
      await order.save();

      res.status(OK).json({ message: 'Информация успешно удалена' });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
