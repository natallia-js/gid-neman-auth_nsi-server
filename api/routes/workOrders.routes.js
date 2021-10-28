const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const Order = require('../models/Order');
const WorkOrder = require('../models/WorkOrder');

const router = Router();

const {
  OK,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,
  ERR,

  DSP_FULL,
  DNC_FULL,
  ECD_FULL,
} = require('../constants');


/**
 * Обрабатывает запрос на получение списка распоряжений, которые являются входящими уведомлениями
 * для заданного полигона управления либо же распоряжениями в работе.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры запроса (workPoligonType, workPoligonId), если указаны, то определяют рабочий полигон,
 * информацию по которому необходимо извлечь. В противном случае информация извлекаться не будет.
 */
 router.post(
  '/data',
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
  async (req, res) => {
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { workPoligonType, workPoligonId } = req.body;

      let data;
      if (workPoligonType && workPoligonId) {
        const matchFilter = {
          $and: [
            { recipientWorkPoligon: { $exists: true } },
            { "recipientWorkPoligon.id": workPoligonId },
            { "recipientWorkPoligon.type": workPoligonType },
            { orderChain: { $exists: true } },
            {
              $or: [
                // The { item : null } query matches documents that either contain the item field
                // whose value is null or that do not contain the item field
                { "orderChain.chainEndDateTime": null },
                { "orderChain.chainEndDateTime": { $gt: new Date() } },
              ],
            },
          ],
        };
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
 *   workPoligonType, workPoligonId - определяют рабочий полигон, с которого приходит подтверждение
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
      creds: [DNC_FULL, DSP_FULL, ECD_FULL],
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
      const { workPoligonType, workPoligonId, orderIds, deliverDateTime } = req.body;

      // Отмечаем подтверждение доставки распоряжений в коллекции рабочих распоряжений, а также
      // в общей коллеции распоряжений

      await WorkOrder.updateMany({
        $and: [
          { orderId: orderIds },
          { recipientWorkPoligon: { $exists: true } },
          { "recipientWorkPoligon.id": workPoligonId },
          { "recipientWorkPoligon.type": workPoligonType },
        ]},
        { $set: { deliverDateTime } }
      ).session(session);

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
 *   workPoligonType, workPoligonId - определяют рабочий полигон, на котором производится подтверждение распоряжения
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
      creds: [DNC_FULL, DSP_FULL, ECD_FULL],
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
      const { workPoligonType, workPoligonId, id, confirmDateTime } = req.body;

      // Отмечаем подтверждение распоряжения в коллекции рабочих распоряжений, а также
      // в общей коллеции распоряжений

      const result = await WorkOrder.updateOne({
        $and: [
          { orderId: id },
          { recipientWorkPoligon: { $exists: true } },
          { "recipientWorkPoligon.id": workPoligonId },
          { "recipientWorkPoligon.type": workPoligonType },
        ]},
        { $set: { confirmDateTime } }
      ).session(session);

      if (result.nModified !== 1) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено среди распоряжений, находящихся в работе' });
      }

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

      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно сохранена', id });

    } catch (error) {
      console.log(error);

      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


module.exports = router;
