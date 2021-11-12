const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const Order = require('../models/Order');
const LastOrdersParam = require('../models/LastOrdersParam');
const WorkOrder = require('../models/WorkOrder');
const {
  addOrderValidationRules,
  getDataForGIDValidationRules,
} = require('../validators/orders.validator');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const OrderPatternElementRef = require('../models/OrderPatternElementRef');
const validate = require('../validators/validate');
const { Op } = require('sequelize');

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
 * timeSpan - время действия распоряжения (обязательно) - объект с полями:
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
 * showOnGID - true - отображать на ГИД, false - не отображать на ГИД (не обязательно)
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
        showOnGID,
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
      // Нюанс здесь такой: ранее изданное распоряжение, с которым пользователь хочет связать
      // новое распоряжение, может уже оказаться связанным с другим распоряжением (какой-то
      // другой пользователь успел сделать это раньше). В этом случае издание нового распоряжения
      // становится невозможным.
      if (prevOrderId) {

        const prevOrder = await Order.findById(prevOrderId).session(session);
        if (!prevOrder) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Распоряжение не может быть издано: не найдено распоряжение, предшествующее ему' });
        }
        if (prevOrder.nextRelatedOrderId) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Распоряжение не может быть издано: распоряжение, предшествующее ему, уже связано с другим распоряжением' });
        }

        let updateRes = await Order.updateOne(
          // filter
          { _id: prevOrderId },
          // update
          { nextRelatedOrderId: newOrderObjectId },
        ).session(session);
        if (updateRes.nModified !== 1) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Распоряжение не может быть издано: не найдено распоряжение, предшествующее ему' });
        }

        updateRes = await WorkOrder.updateMany(
          { orderId: prevOrderId },
          { nextRelatedOrderId: newOrderObjectId },
        ).session(session);
        if (updateRes.nModified < 1) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Распоряжение не может быть издано: проблема в установке связи с предшествующим ему распоряжением в оперативной коллекции' });
        }

        // редактируем информацию о цепочке нового распоряжения
        orderChainInfo.chainId = prevOrder.orderChain.chainId;
        orderChainInfo.chainStartDateTime = prevOrder.orderChain.chainStartDateTime;
        // обновляем информацию о конечной дате у всех распоряжений цепочки
        await Order.updateMany(
          { "orderChain.chainId": orderChainInfo.chainId },
          { "orderChain.chainEndDateTime": orderChainInfo.chainEndDateTime },
        ).session(session);
        await WorkOrder.updateMany(
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
        showOnGID,
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
      const getToSendObject = (sectorInfo) => {
        return {
          senderWorkPoligon: { ...workPoligon },
          recipientWorkPoligon: {
            id: sectorInfo.id,
            type: sectorInfo.type,
          },
          sendOriginal: sectorInfo.sendOriginal,
          orderId: order._id,
          timeSpan: timeSpan,
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
        timeSpan: timeSpan,
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


/**
 * Обработка запроса на получение информации о распоряжениях, которые необходимо отобразить ни ГИД.
 * Распоряжения извлекаются и сортируются в порядке увеличения времени их создания.
 *
 * Предполагается, что данный запрос будет выполняться службой (программой, установленной на рабочем месте ДНЦ).
 * Полномочия службы на выполнение данного действия не проверяем.
 *
 * Параметры тела запроса:
 * startDate - дата-время начала временного интервала выполнения запроса (не обязательно) - с этим параметром
 *   сравниваются даты издания распоряжений, которые необходимо отобразить на ГИД: если дата издания распоряжения
 *   больше startDate, то такое распоряжение включается в выборку; если startDate не указана либо null, то
 *   извлекаются все распоряжения, которые необходимо отобразить на ГИД
 * stations - массив ЕСР-кодов станций, по которым необходимо осуществлять выборку распоряжений (обязателен) -
 *   если данный массив не указан либо пуст, то поиск информации производиться не будет
 */
 router.post(
  '/getDataForGID',
  // проверка параметров запроса
  getDataForGIDValidationRules(),
  validate,
  async (req, res) => {
    // Извлекаем типы и смысловые значения элементов текста шаблона распоряжения, значения которых передаются ГИД
    let orderParamsRefsForGID = [];
    try {
      orderParamsRefsForGID = await OrderPatternElementRef.find() || [];
      orderParamsRefsForGID = orderParamsRefsForGID
        .filter((item) => 0 <= item.possibleRefs.findIndex((el) => el.additionalOrderPlaceInfoForGID))
        .map((item) => {
          return {
            elementType: item.elementType,
            possibleRefs: item.possibleRefs
              .filter((el) => el.additionalOrderPlaceInfoForGID)
              .map((el) => el.refName),
          };
        });
    } catch {
      orderParamsRefsForGID = [];
    }

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { startDate, stations } = req.body;

      // Формируем список id станций по указанным кодам ЕСР
      const stationsData = await TStation.findAll({
        raw: true,
        attributes: ['St_ID', 'St_UNMC'],
        where: { St_UNMC: stations },
      });
      if (!stationsData || !stationsData.length) {
        return res.status(OK).json([]);
      }
      const stationIds = stationsData.map((item) => item.St_ID);

      const blocksData = await TBlock.findAll({
        raw: true,
        attributes: ['Bl_ID', 'Bl_StationID1', 'Bl_StationID2'],
        where: {
          [Op.and]: [{ Bl_StationID1: stationIds }, { Bl_StationID2: stationIds }],
        },
      }) || [];
      const blockIds = blocksData.map((item) => item.Bl_ID);

      const possibleOrdersPlaces = [
        {
          $and: [
            { "place.place": "station" },
            { "place.value": stationIds },
          ],
        },
      ];
      if (blockIds && blockIds.length) {
        possibleOrdersPlaces.push(
          {
            $and: [
              { "place.place": "span" },
              { "place.value": blockIds },
            ],
          }
        );
      }

      const ordersMatchFilter = {
        $and: [
          { showOnGID: true },
          { place: { $exists: true } },
          { $or: possibleOrdersPlaces },
        ],
      };
      if (startDate) {
        ordersMatchFilter.$and.push({ createDateTime: { $gt: new Date(startDate) } });
      }

      const data = await Order.find(ordersMatchFilter).sort([['createDateTime', 'ascending']]) || [];

      res.status(OK).json(data.map((item) => {
        let STATION1 = null;
        let STATION2 = null;
        if (item.place.place === 'station') {
          STATION1 = stationsData.find((station) => String(station.St_ID) === String(item.place.value)).St_UNMC;
        } else {
          const block = blocksData.find((block) => String(block.Bl_ID) === String(item.place.value));
          STATION1 = stationsData.find((station) => String(station.St_ID) === String(block.Bl_StationID1)).St_UNMC;
          STATION2 = stationsData.find((station) => String(station.St_ID) === String(block.Bl_StationID2)).St_UNMC;
        }
        let ADDITIONALPLACEINFO = null;
        const additionalOrderPlaceInfoElements = item.orderText.orderText.filter((el) =>
          (el.value !== null) &&
          orderParamsRefsForGID.find((r) => (r.elementType === el.type) && r.possibleRefs.includes(el.ref))
        );
        if (additionalOrderPlaceInfoElements && additionalOrderPlaceInfoElements.length) {
          ADDITIONALPLACEINFO = additionalOrderPlaceInfoElements.reduce((accumulator, currentValue, index) =>
            accumulator + `${currentValue.ref}: ${currentValue.value}${index === additionalOrderPlaceInfoElements.length - 1 ? '' : ', '}`, '');
        }
        return {
          ORDERID: item._id,
          ORDERGIVINGTIME: item.createDateTime,
          STATION1,
          STATION2,
          ADDITIONALPLACEINFO,
          ORDERSTARTTIME: item.timeSpan.start,
          ORDERENDTIME: item.timeSpan.end,
          ORDERTITLE: item.orderText.orderTitle,
          ORDERCHAINID: item.orderChain.chainId,
        };
      }));

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);

module.exports = router;
