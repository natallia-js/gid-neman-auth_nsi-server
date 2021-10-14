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
 * place - место действия распоряжения (не обязательно) - объект с полями:
 *   place - тип места действия (станция / перегон)
 *   value - идентификатор места действия
 * timeSpan - время действия распоряжения (не обязательно) - объект с полями:
 *   start - время начала действия распоряжения
 *   end - время окончания действия распоряжения (если известно)
 *   tillCancellation - true / false (распоряжение действует / не действует до отмены)
 * orderText - текст распоряжения (обязательно) - объект с полями:
 *   orderTextSource - источник текста (шаблон / не шаблон)
 *   patternId - id шаблона распоряжения, если источник текста - шаблон
 *   orderTitle - наименование распоряжения
 *   orderText - массив объектов с параметрами:
 *     ref - строка, содержащая смысловое значение параметра в шаблоне
 *     type - тип параметра
 *     value - значение параметра
 * dncToSend - массив участков ДНЦ, на которые необходимо отправить распоряжение (не обязательно; если не данных, то должен быть пустой массив);
 *   элемент массива - объект с параметрами:
 *     fio - ФИО ДНЦ
 *     id - id участка ДНЦ
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * dspToSend - массив участков ДСП, на которые необходимо отправить распоряжение (не обязательно; если не данных, то должен быть пустой массив);
 *   элемент массива - объект с параметрами:
 *     fio - ФИО ДСП
 *     id - id станции
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * ecdToSend - массив участков ЭЦД, на которые необходимо отправить распоряжение (не обязательно; если не данных, то должен быть пустой массив);
 *   элемент массива - объект с параметрами:
 *     fio - ФИО ЭЦД
 *     id - id участка ЭЦД
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * otherToSend - массив остальных адресатов распоряжения (не обязателен)
 *   элемент массива - объект с параметрами:
 *     id - идентификатор записи
 *     placeTitle - наименование места, куда сообщается о распоряжении
 *     post - должность лица, которому адресуется распоряжение
 *     fio - ФИО этого лица
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * workPoligon - рабочий полигон пользователя (обязателен) - объект с параметрами:
 *   id - id рабочего полигона
 *   type - тип рабочего полигона
 *   title - наименование рабочего полигона
 * creator - информация о создателе распоряжения (обязательно):
 *   id - id пользователя
 *   post - должность
 *   fio - ФИО
 * createdOnBehalfOf - от чьего имени издано распоряжение (не обязательно)
 * prevOrderId - id ранее изданного распоряжения, с которым связано текущее распоряжение (не обязательно)
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
        otherToSend,
        workPoligon,
        creator,
        createdOnBehalfOf,
        prevOrderId,
      } = req.body;

      const newOrderObjectId = new mongoose.Types.ObjectId();

      // Полагаем по умолчанию, что распоряжение принадлежит цепочке, в которой оно одно
      let orderChainInfo = {
        chainId: newOrderObjectId,
        chainStartDateTime: timeSpan && timeSpan.start ? timeSpan.start : createDateTime,
        chainEndDateTime: timeSpan && timeSpan.end ? timeSpan.end : null,
      };

      // Если необходимо связать создаваемое распоряжение с ранее изданным, то ищем
      // ранее изданное распоряжение. У него нам необходимо взять информацию о цепочке
      // распоряжений, которой будет принадлежать новое распоряжение. А также связать
      // данное распоряжение с создаваемым.
      if (prevOrderId) {
        const prevOrder = await Order.findOneAndUpdate(
          // filter
          { _id: prevOrderId },
          // update
          { nextRelatedOrderId: newOrderObjectId },
        ).session(session);
        if (!prevOrder) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Новое распоряжение не сохранено в базе данных: не найдено распоряжение, предшествующее ему' });
        }
        await WorkOrder.update(
          { orderId: prevOrderId },
          { nextRelatedOrderId: newOrderObjectId },
        ).session(session);
        // редактируем информацию о цепочке нового распоряжения
        orderChainInfo.chainId = prevOrder.orderChain.chainId;
        orderChainInfo.chainStartDateTime = prevOrder.orderChain.chainStartDateTime;
        // обновляем информацию о конечной дате у всех распоряжений цепочки
        await Order.update(
          { "orderChain.chainId": orderChainInfo.chainId },
          { "orderChain.chainEndDateTime": orderChainInfo.chainEndDateTime },
        ).session(session);
        await WorkOrder.update(
          { "orderChain.chainId": orderChainInfo.chainId },
          { "orderChain.chainEndDateTime": orderChainInfo.chainEndDateTime },
        ).session(session);
      }

      // Создаем в БД запись с данными о новом распоряжении
      const order = new Order({
        _id: newOrderObjectId,
        type,
        number,
        createDateTime,
        place,
        timeSpan,
        orderText,
        dncToSend,
        dspToSend,
        ecdToSend,
        otherToSend: otherToSend.map((item) => ({ ...item, _id: item.id })),
        workPoligon,
        creator,
        createdOnBehalfOf,
        orderChain: orderChainInfo,
      });
      await order.save({ session });

      // Обновляем информацию по номеру последнего изданного распоряжения заданного типа
      await LastOrdersParam.findOneAndUpdate(
        // filter
        { 'workPoligon.id': workPoligon.id, 'workPoligon.type': workPoligon.type, ordersType: type },
        // update
        { lastOrderNumber: number, lastOrderDateTime: createDateTime },
        { upsert: true, new: true }
      ).session(session);

      // Сохраняем информацию об издаваемом распоряжении в таблице рабочих распоряжений
      const workOrders = [];
      const newOrderTimeSpan = {
        start: timeSpan && timeSpan.start ? timeSpan.start : createDateTime,
        end: timeSpan ? timeSpan.end : null,
        tillCancellation: timeSpan && typeof timeSpan.tillCancellation === 'boolean' ? timeSpan.tillCancellation : true,
      };
      const getToSendObject = (sectorInfo) => {
        return {
          senderWorkPoligon: { ...workPoligon },
          recipientWorkPoligon: {
            id: sectorInfo.id,
            type: sectorInfo.type,
          },
          sendOriginal: sectorInfo.sendOriginal,
          orderId: order._id,
          timeSpan: newOrderTimeSpan,
          orderChain: orderChainInfo,
        };
      };
      order.dncToSend.forEach((dncSector) => {
        const workOrder = new WorkOrder(getToSendObject(dncSector));
        workOrders.push(workOrder);
      });
      order.dspToSend.forEach((dspSector) => {
        const workOrder = new WorkOrder(getToSendObject(dspSector));
        workOrders.push(workOrder);
      });
      order.ecdToSend.forEach((ecdSector) => {
        const workOrder = new WorkOrder(getToSendObject(ecdSector));
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
        orderChain: orderChainInfo,
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
