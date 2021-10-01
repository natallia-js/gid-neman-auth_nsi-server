const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const Order = require('../models/Order');
const LastOrdersParam = require('../models/LastOrdersParam');
const WorkOrder = require('../models/WorkOrder');
const {
  addOrderValidationRules,
} = require('../validators/orders.validator');
const validate = require('../validators/validate');

const router = Router();

const {
  OK,
  UNKNOWN_ERR,
  UNKNOWN_ERR_MESS,

  DSP_FULL,
  DNC_FULL,
  ECD_FULL,
} = require('../constants');


/**
 * Обработка запроса на добавление нового распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * type - тип распоряжения (обязателен),
 * number - номер распоряжения (обязателен),
 * createDateTime - дата и время издания распоряжения (обязательны),
 * place - место действия распоряжения - объект с полями:
 *   place - тип места действия (станция / перегон)
 *   value - идентификатор места действия
 * timeSpan - время действия распоряжения - объект с полями:
 *   start - время начала действия распоряжения
 *   end - время окончания действия распоряжения (если известно)
 *   tillCancellation - true / false (распоряжение действует / не действует до отмены)
 * orderText - текст распоряжения - объект с полями:
 *   orderTextSource - источник текста (шаблон / не шаблон)
 *   orderTitle - наименование распоряжения
 *   orderText - массив объектов с параметрами:
 *     ref - строка, содержащая смысловое значение параметра в шаблоне
 *     type - тип параметра
 *     value - значение параметра
 * dncToSend - массив участков ДНЦ, на которые необходимо отправить распоряжение;
 *   элемент массива - объект с параметрами:
 *     fio - ФИО ДНЦ
 *     id - id участка ДНЦ
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * dspToSend - массив участков ДСП, на которые необходимо отправить распоряжение;
 *   элемент массива - объект с параметрами:
 *     fio - ФИО ДСП
 *     id - id станции
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * ecdToSend - массив участков ЭЦД, на которые необходимо отправить распоряжение;
 *   элемент массива - объект с параметрами:
 *     fio - ФИО ЭЦД
 *     id - id участка ЭЦД
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * workPoligon - рабочий полигон пользователя - объект с параметрами:
 *   id - id рабочего полигона
 *   type - тип рабочего полигона
 *   title - наименование рабочего полигона
 * creator - информация о создателе распоряжения:
 *   id - id пользователя
 *   post - должность
 *   fio - ФИО
 * prevOrderId - id ранее изданного распоряжения, с которым связано текущее распоряжение
 */
 router.post(
  '/add',
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
  // проверка параметров запроса
  addOrderValidationRules(),
  validate,
  async (req, res) => {
    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const {
        type,
        number,
        createDateTime,
        place,
        timeSpan,
        orderText,
        dncToSend,
        dspToSend,
        ecdToSend,
        workPoligon,
        creator,
        prevOrderId,
      } = req.body;

      // Создаем в БД запись с данными о новом распоряжении
      const order = new Order({
        type,
        number,
        createDateTime,
        place,
        timeSpan,
        orderText,
        dncToSend,
        dspToSend,
        ecdToSend,
        workPoligon,
        creator,
      });
      await order.save({ session });

      // Ранее изданное распоряжение связываем с текущим, если это необходимо
      if (prevOrderId) {
        await Order.findOneAndUpdate(
          // filter
          { _id: prevOrderId },
          // update
          { nextRelatedOrderId: order._id },
        ).session(session);
        await WorkOrder.findOneAndUpdate(
          // filter
          { orderId: prevOrderId },
          // update
          { nextRelatedOrderId: order._id },
        ).session(session);
      }

      // Обновляем информацию по номеру последнего изданного распоряжения заданного типа
      /*let doc =*/ await LastOrdersParam.findOneAndUpdate(
        // filter
        { 'workPoligon.id': workPoligon.id, 'workPoligon.type': workPoligon.type, ordersType: type },
        // update
        { lastOrderNumber: number, lastOrderDateTime: createDateTime },
        { upsert: true, new: true }
      ).session(session);

      // DeprecationWarning: Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated. See: https://mongoosejs.com/docs/deprecations.html#findandmodify

      // Сохраняем информацию об издаваемом распоряжении в таблице рабочих распоряжений
      const workOrders = [];
      const newOrderTimeSpan = {
        start: timeSpan && timeSpan.start ? timeSpan.start : createDateTime,
        end: timeSpan ? timeSpan.end : null,
        tillCancellation: timeSpan && typeof timeSpan.tillCancellation === 'boolean' ? timeSpan.tillCancellation : true,
      };
      order.dncToSend.forEach((dncSector) => {
        const workOrder = new WorkOrder({
          senderWorkPoligon: { ...workPoligon },
          recipientWorkPoligon: {
            id: dncSector.id,
            type: dncSector.type,
          },
          orderId: order._id,
          timeSpan: newOrderTimeSpan,
          sendOriginal: dncSector.sendOriginal,
        });
        workOrders.push(workOrder);
      });
      order.dspToSend.forEach((dspSector) => {
        const workOrder = new WorkOrder({
          senderWorkPoligon: { ...workPoligon },
          recipientWorkPoligon: {
            id: dspSector.id,
            type: dspSector.type,
          },
          orderId: order._id,
          timeSpan: newOrderTimeSpan,
          sendOriginal: dspSector.sendOriginal,
        });
        workOrders.push(workOrder);
      });
      order.ecdToSend.forEach((ecdSector) => {
        const workOrder = new WorkOrder({
          senderWorkPoligon: { ...workPoligon },
          recipientWorkPoligon: {
            id: ecdSector.id,
            type: ecdSector.type,
          },
          orderId: order._id,
          timeSpan: newOrderTimeSpan,
          sendOriginal: ecdSector.sendOriginal,
        });
        workOrders.push(workOrder);
      });
      // себе
      workOrders.push(new WorkOrder({
        senderWorkPoligon: { ...workPoligon },
        recipientWorkPoligon: { ...workPoligon },
        orderId: order._id,
        timeSpan: newOrderTimeSpan,
        sendOriginal: true,
        deliverDateTime: new Date(),
        confirmDateTime: new Date(),
      }));

      await WorkOrder.insertMany(workOrders, { session });

      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно сохранена', order });

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
