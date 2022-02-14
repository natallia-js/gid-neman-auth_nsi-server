const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkGeneralCredentials, HOW_CHECK_CREDS } = require('../middleware/checkGeneralCredentials.middleware');
const { isOnDuty } = require('../middleware/isOnDuty.middleware');
const Order = require('../models/Order');
const LastOrdersParam = require('../models/LastOrdersParam');
const WorkOrder = require('../models/WorkOrder');
const {
  addOrderValidationRules,
  getDataForGIDValidationRules,
  getOrdersFromGivenDateRules,
  getOrdersRules,
} = require('../validators/orders.validator');
const { TStation } = require('../models/TStation');
const { TStationWorkPlace } = require('../models/TStationWorkPlace');
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
  DSP_Operator,
  DNC_FULL,
  ECD_FULL,

  WORK_POLIGON_TYPES,
  INCLUDE_DOCUMENTS_CRITERIA,
  ORDER_PATTERN_TYPES,
} = require('../constants');


/**
 * Обработка запроса на добавление нового распоряжения.
 * Создаваемое распоряжение либо само создает новую цепочку распоряжений, либо, если указан параметр
 * orderChainId, является частью существующей цепочки.
 *   ID цепочки распоряжений = id первого распоряжения, изданного в рамках данной цепочки.
 *   Дата начала действия цепочки = дате начала действия первого распоряжения цепочки (если не указана, то
 * берется дата создания распоряжения).
 *   Дата окончания действия цепочки = дате окончания действия последнего распоряжения, изданного в рамках
 * данной цепочки.
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
 *     value - значение параметра (представленное в виде строки!)
 * dncToSend - массив участков ДНЦ, на которые необходимо отправить распоряжение (не обязательно; если не данных, то должен быть пустой массив);
 *   элемент массива - объект с параметрами:
 *     post - должность ДНЦ
 *     fio - ФИО ДНЦ
 *     id - id участка ДНЦ
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * dspToSend - массив участков ДСП, на которые необходимо отправить распоряжение (не обязательно; если не данных, то должен быть пустой массив);
 *   элемент массива - объект с параметрами:
 *     post - должность ДСП
 *     fio - ФИО ДСП
 *     id - id станции
 *     sendOriginal - true - отправить оригинал, false - отправить копию
 * ecdToSend - массив участков ЭЦД, на которые необходимо отправить распоряжение (не обязательно; если не данных, то должен быть пустой массив);
 *   элемент массива - объект с параметрами:
 *     post - должность ЭЦД
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
 * workPoligonTitle - наименование рабочего полигона (рабочего места полигона)
 * creator - информация о создателе распоряжения (обязательно):
 *   id - id пользователя
 *   post - должность
 *   fio - ФИО
 * createdOnBehalfOf - от чьего имени издано распоряжение (не обязательно)
 * specialTrainCategories - отметки об особых категориях поездов, к которым имеет отношение распоряжение
 * orderChainId - id цепочки распоряжений, которой принадлежит издаваемое распоряжение
 * showOnGID - true - отображать на ГИД, false - не отображать на ГИД (не обязательно)
 * idOfTheOrderToCancel - id распоряжения, которое необходимо отменить при издании текущего распоряжения
 *   (специально для случая издания распоряжения о принятии дежурства ДСП: при издании нового распоряжения
 *   у предыдущего время окончания действия становится не "до отмены", а ему присваивается дата и время
 *   начала действия данного распоряжения)
 */
 router.post(
  '/add',
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
  // проверка факта нахождения пользователя на смене (дежурстве)
  isOnDuty,
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
        workPoligonTitle,
        creator,
        createdOnBehalfOf,
        specialTrainCategories,
        orderChainId,
        showOnGID,
        idOfTheOrderToCancel,
      } = req.body;

      // Определяем рабочий полигон пользователя
      const workPoligon = req.user.workPoligon;

      const newOrderObjectId = new mongoose.Types.ObjectId();

      // Полагаем по умолчанию, что распоряжение принадлежит цепочке, в которой оно одно
      let orderChainInfo = {
        chainId: newOrderObjectId,
        chainStartDateTime: timeSpan && timeSpan.start ? timeSpan.start : createDateTime,
        chainEndDateTime: timeSpan && timeSpan.end ? timeSpan.end : null,
      };

      // Если необходимо включить создаваемое распоряжение в существующую цепочку распоряжений,
      // то ищем сведения о существующей цепочке
      if (orderChainId) {
        // для этого берем первое распоряжение в указанной цепочке
        const firstChainOrder = await Order.findById(orderChainId).session(session);
        if (!firstChainOrder) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Распоряжение не может быть издано: не найдена цепочка распоряжений, которой оно принадлежит' });
        }
        // редактируем информацию о цепочке создаваемого распоряжения
        orderChainInfo.chainId = orderChainId;
        orderChainInfo.chainStartDateTime = firstChainOrder.orderChain.chainStartDateTime;
        // обновляем информацию о конечной дате у всех распоряжений цепочки
        await Order.updateMany(
          // filter
          { "orderChain.chainId": orderChainInfo.chainId },
          // update
          { "orderChain.chainEndDateTime": orderChainInfo.chainEndDateTime },
        ).session(session);
        await WorkOrder.updateMany(
          // filter
          { "orderChain.chainId": orderChainInfo.chainId },
          // update
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
        specialTrainCategories,
        orderChain: orderChainInfo,
        showOnGID,
        // если распоряжение не имеет адресатов либо не рассылается ли одного оригинала распоряжения (только
        // копии), то такое распоряжение полагаем утвержденным сразу при издании, дата-время утверждения =
        // дата-время создания распоряжения
        assertDateTime:
          (!dncToSend || !dncToSend.length || !dncToSend.find((el) => el.sendOriginal)) &&
          (!dspToSend || !dspToSend.length || !dspToSend.find((el) => el.sendOriginal)) &&
          (!ecdToSend || !ecdToSend.length || !ecdToSend.find((el) => el.sendOriginal)) &&
          (!otherToSend || !otherToSend.length || !otherToSend.find((el) => el.sendOriginal))
          ? createDateTime : null,
      });

      // Обновляем информацию по номеру последнего изданного распоряжения заданного типа
      // на текущем глобальном полигоне управления
      const filter = {
        ordersType: type,
        'workPoligon.id': workPoligon.id,
        'workPoligon.type': workPoligon.type,
      };
      await LastOrdersParam.findOneAndUpdate(
        filter,
        // update
        { lastOrderNumber: number, lastOrderDateTime: createDateTime },
        { upsert: true, new: true }
      ).session(session);

      // Сохраняем информацию об издаваемом распоряжении в таблице рабочих распоряжений.
      // Здесь есть один нюанс. И связан он с распоряжениями, издаваемыми в рамках полигона "станция" либо
      // адресуемыми на такой полигон. Станция - это не только ДСП, но и операторы при ДСП.
      // Как ДСП, так и операторы при ДСП, - все они могут издавать распоряжения.
      // И получать распоряжения, направляемые в адрес станции, они все тоже должны.
      // Потому для каждой станции - будь то издатель или получатель распоряжения - проверяем наличие в
      // ее составе рабочих мест. Копия издаваемого распоряжения должна попасть как ДСП, так и
      // всем операторам на станции.
      const workOrders = [];
      const getToSendObject = (sectorInfo) => {
        // возвращает объект записи о распоряжении, копию которого необходимо передать
        return {
          senderWorkPoligon: { ...workPoligon, title: workPoligonTitle },
          recipientWorkPoligon: {
            id: sectorInfo.id,
            workPlaceId: sectorInfo.workPlaceId,
            type: sectorInfo.type,
          },
          sendOriginal: sectorInfo.sendOriginal,
          orderId: order._id,
          timeSpan: timeSpan,
          orderChain: orderChainInfo,
        };
      };
      // Формирование копий распоряжения для ДСП станции и всех операторов при ДСП
      // (самому себе копия не формируется)
      const formOrderCopiesForDSPAndOperators = async (stationId, stationName, sendOriginal) => {
        const orderCopies = [];
        const stationWorkPlacesOrderIsSentTo = [];
        // Отправка ДСП (если распоряжение издается не на станции, но ей адресуется, либо издается
        // оператором при ДСП на станции и должна попасть самому ДСП)
        if (workPoligon.type !== WORK_POLIGON_TYPES.STATION ||
          stationId !== workPoligon.id || workPoligon.workPlaceId) {
            orderCopies.push(new WorkOrder(getToSendObject({
            id: stationId,
            workPlaceId: null,
            type: WORK_POLIGON_TYPES.STATION,
            sendOriginal,
          })));
          let stationTitle = stationName;
          if (!stationTitle) {
            const st = await TStation.findOne({ where: { St_ID: stationId } });
            if (st) {
              stationTitle = st.St_Title;
            }
          }
          stationWorkPlacesOrderIsSentTo.push({
            id: stationId,
            type: WORK_POLIGON_TYPES.STATION,
            workPlaceId: null,
            placeTitle: stationTitle,
            sendOriginal,
          });
        }
        // извлекаем информацию обо всех рабочих местах на станции
        const stationWorkPlacesData = await TStationWorkPlace.findAll({
          attributes: ['SWP_ID', 'SWP_Name'],
          where: { SWP_StationId: stationId },
        });
        if (stationWorkPlacesData && stationWorkPlacesData.length) {
          // направляем копию всем операторам при ДСП, кроме самого себя
          // (если распоряжение издано оператором при ДСП)
          //let workPlacesIds = stationWorkPlacesData.map((item) => item.SWP_ID);
          let workPlaces = stationWorkPlacesData.map((item) => ({ id: item.SWP_ID, name: item.SWP_Name }));
          if (workPoligon.type === WORK_POLIGON_TYPES.STATION && stationId === workPoligon.id && workPoligon.workPlaceId) {
            workPlaces = workPlaces.filter((item) => item.id !== workPoligon.workPlaceId);
          }
          workPlaces.forEach((wp) => {
            orderCopies.push(new WorkOrder(getToSendObject({
              id: stationId,
              workPlaceId: wp.id,
              type: WORK_POLIGON_TYPES.STATION,
              sendOriginal,
            })));
            stationWorkPlacesOrderIsSentTo.push({
              id: stationId,
              type: WORK_POLIGON_TYPES.STATION,
              workPlaceId: wp.id,
              placeTitle: wp.name,
              sendOriginal,
            });
          });
        }
        return { orderCopies, stationWorkPlacesOrderIsSentTo };
      };
      // рассылка на участки ДНЦ
      order.dncToSend.forEach((dncSector) => {
        const workOrder = new WorkOrder(getToSendObject(dncSector));
        workOrders.push(workOrder);
      });
      // рассылка на станции (ДСП и операторам при ДСП) - явно указанные издателем распоряжения как адресаты
      for (let dspSector of order.dspToSend) {
        const { orderCopies, stationWorkPlacesOrderIsSentTo } =
          await formOrderCopiesForDSPAndOperators(dspSector.id, dspSector.placeTitle, dspSector.sendOriginal);
        workOrders.push(...orderCopies);
        order.stationWorkPlacesToSend.push(...stationWorkPlacesOrderIsSentTo);
      }
      // рассылка на участки ЭЦД
      order.ecdToSend.forEach((ecdSector) => {
        const workOrder = new WorkOrder(getToSendObject(ecdSector));
        workOrders.push(workOrder);
      });
      // себе
      const senderInfo = { ...workPoligon, title: workPoligonTitle };
      const deliverAndConfirmDateTimeOnCurrentWorkPoligon = new Date();
      workOrders.push(new WorkOrder({
        senderWorkPoligon: senderInfo,
        recipientWorkPoligon: { ...workPoligon },
        orderId: order._id,
        timeSpan: timeSpan,
        sendOriginal: true,
        deliverDateTime: deliverAndConfirmDateTimeOnCurrentWorkPoligon,
        confirmDateTime: deliverAndConfirmDateTimeOnCurrentWorkPoligon,
        orderChain: orderChainInfo,
      }));
      // если распоряжение издается на станции (ДСП или оператором при ДСП), то оно
      // автоматически должно попасть как ДСП, так и на все рабочие места операторов при ДСП данной станции
      if (workPoligon.type === WORK_POLIGON_TYPES.STATION) {
        const { orderCopies, stationWorkPlacesOrderIsSentTo } =
          await formOrderCopiesForDSPAndOperators(workPoligon.id, null, true);
        workOrders.push(...orderCopies);
        order.stationWorkPlacesToSend.push(...stationWorkPlacesOrderIsSentTo);
      }

      // Сохраняем все в БД
      await WorkOrder.insertMany(workOrders, { session });
      await order.save({ session });

      // При необходимости, отменяем некоторое распоряжение по окончании издания текущего
      if (idOfTheOrderToCancel) {
        const orderToCancel = await Order.findById(idOfTheOrderToCancel).session(session);
        if (orderToCancel) {
          await WorkOrder.updateMany(
            { orderId: idOfTheOrderToCancel },
            { $set: {
              "timeSpan.end": orderToCancel.timeSpan.start,
              "timeSpan.tillCancellation": false,
              "orderChain.chainEndDateTime": orderToCancel.timeSpan.start,
            } },
            { session },
          );
          orderToCancel.timeSpan.end = orderToCancel.timeSpan.start;
          orderToCancel.timeSpan.tillCancellation = false;
          orderToCancel.orderChain.chainEndDateTime = orderToCancel.timeSpan.start;
          await orderToCancel.save();
        }
      }

      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно сохранена', order:
        {
          ...order._doc,
          senderWorkPoligon: senderInfo,
          deliverDateTime: deliverAndConfirmDateTimeOnCurrentWorkPoligon,
          confirmDateTime: deliverAndConfirmDateTimeOnCurrentWorkPoligon,
          sendOriginal: true,
        },
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
 * Обработка запроса на редактирование существующего распоряжения.
 * Позволяется редактировать только одиночные распоряжения.
 * Данный запрос не работает с цепочками распоряжений!
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id распоряжения (обязателен),
 * timeSpan - время действия распоряжения (не обязательно) - объект с полями:
 *   start - время начала действия распоряжения
 *   end - время окончания действия распоряжения (если известно)
 *   tillCancellation - true / false (распоряжение действует / не действует до отмены)
 * orderText - текст распоряжения (не обязательно) - объект с полями:
 *   orderTextSource - источник текста (шаблон / не шаблон)
 *   patternId - id шаблона распоряжения, если источник текста - шаблон
 *   orderTitle - наименование распоряжения
 *   orderText - массив объектов с параметрами:
 *     ref - строка, содержащая смысловое значение параметра в шаблоне
 *     type - тип параметра
 *     value - значение параметра (представленное в виде строки!)
 */
router.post(
  '/mod',
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
  // проверка факта нахождения пользователя на смене (дежурстве)
  isOnDuty,
  async (req, res) => {
    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { id, timeSpan, orderText } = req.body;

      const existingOrder = await Order.findById(id).session(session);
      if (!existingOrder) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не существует в базе данных' });
      }

      const ordersInChain = await Order.countDocuments({
        orderChain: { $exists: true },
        "orderChain.chainId": existingOrder.orderChain.chainId,
      });
      if (ordersInChain === 0) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Цепочка распоряжений не существует в базе данных' });
      }
      if (ordersInChain > 1) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'В цепочке распоряжений более одного распоряжения: редактирование невозможно' });
      }

      // Редактируем запись в основной коллекции распоряжений
      let edited = false;
      if (timeSpan) {
        existingOrder.timeSpan = timeSpan;
        existingOrder.orderChain.chainStartDateTime = timeSpan.start;
        existingOrder.orderChain.chainEndDateTime = timeSpan.end;
        edited = true;
      }
      if (orderText) {
        existingOrder.orderText = orderText;
        edited = true;
      }
      if (edited) {
        await existingOrder.save();
      }

      // Редактируем (при необходимости) записи в коллекции рабочих распоряжений
      if (timeSpan) {
        await WorkOrder.updateMany(
          { orderId: id },
          { $set: {
            "timeSpan.start": timeSpan.start,
            "timeSpan.end": timeSpan.end,
            "timeSpan.tillCancellation": timeSpan.tillCancellation,
            "orderChain.chainStartDateTime": timeSpan.start,
            "orderChain.chainEndDateTime": timeSpan.end,
          } },
          { session },
        );
      }

      await session.commitTransaction();

      res.status(OK).json({
        message: 'Информация успешно сохранена',
        order: existingOrder._doc,
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
 * Обработка запроса на получение информации о распоряжениях, которые необходимо отобразить на ГИД.
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


/**
 * Обрабатывает запрос на получение списка id распоряжений, изданных начиная с указанной даты
 * на указанном полигоне управления (полигон управления - глобальный, т.е. не рассматриваются рабочие
 * места на полигонах управления; для запросов, поступающих с рабочего места, извлекаются все данные
 * по полигону управления, к которому данное рабочее место относится).
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Информация о типе и id рабочего полигона извлекается из токена пользователя.
 * Именно по этим данным осуществляется поиск в БД. Если этой информации в токене нет,
 * то информация извлекаться не будет.
 *
 * Параметры тела запроса:
 * datetime - дата-время начала поиска информации (обязателен)
 */
 router.post(
  '/ordersCreatedFromGivenDateOnGivenWorkPoligon',
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
  // проверка параметров запроса
  getOrdersFromGivenDateRules(),
  validate,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { datetime } = req.body;

      const matchFilter = { createDateTime: { $gte: new Date(datetime) } };
      const poligonSearchFilter = { $elemMatch: { id: workPoligon.id, type: workPoligon.type } };
      switch (workPoligon.type) {
        case WORK_POLIGON_TYPES.STATION:
          matchFilter.dspToSend = poligonSearchFilter;
          break;
        case WORK_POLIGON_TYPES.DNC_SECTOR:
          matchFilter.dncToSend = poligonSearchFilter;
          break;
        case WORK_POLIGON_TYPES.ECD_SECTOR:
          matchFilter.ecdToSend = poligonSearchFilter;
          break;
      }
      const data = await Order.find(matchFilter);
      res.status(OK).json(data.map((doc) => doc._id));

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка распоряжений, изданных в заданный промежуток времени на
 * указанном полигоне управления либо адресованных ему (полигон управления - глобальный, т.е. не
 * рассматриваются рабочие места на полигонах управления; для запросов, поступающих с рабочего места,
 * извлекаются все данные по полигону управления, к которому данное рабочее место относится).
 *
 * Распоряжения сортируются по дате и времени их издания (прямой хронологический порядок).
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Информация о типе и id рабочего полигона извлекается из токена пользователя.
 * Именно по этим данным осуществляется поиск в БД. Если этой информации в токене нет,
 * то информация извлекаться не будет.
 *
 * Параметры тела запроса:
 * datetimeStart - дата-время начала поиска информации (обязателен)
 * datetimeEnd - дата-время окончания поиска информации (не обязателен, если не указан, то
 *               информация извлекается начиная с указанной даты до настоящего момента времени)
 * includeDocsCriteria - дополнительные критерии поиска информации (не обязателен)
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
  checkGeneralCredentials,
  // проверка параметров запроса
  getOrdersRules(),
  validate,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const { datetimeStart, datetimeEnd, includeDocsCriteria } = req.body;

      let matchFilter;

      // Фильтрация по дате-времени издания
      const startDate = new Date(datetimeStart);
      const endDate = new Date(datetimeEnd);
      if (!datetimeEnd) {
        matchFilter = { createDateTime: { $gte: startDate } };
      } else {
        matchFilter = {
          createDateTime: { $gte: startDate },
          createDateTime: { $lte: endDate },
        };
      }

      // Фильтрация по издателю
      matchFilter.$or = [
        { "workPoligon.id": workPoligon.id, "workPoligon.type": workPoligon.type },
      ];

      // Фильтрация по адресату
      if(!includeDocsCriteria || !includeDocsCriteria.includes(INCLUDE_DOCUMENTS_CRITERIA.ONLY_OUTGOUING)) {
        const addresseePoligonSearchFilter = { $elemMatch: { id: workPoligon.id, type: workPoligon.type } };
        switch (workPoligon.type) {
          case WORK_POLIGON_TYPES.STATION:
            matchFilter.$or.push({ dspToSend: addresseePoligonSearchFilter });
            break;
          case WORK_POLIGON_TYPES.DNC_SECTOR:
            matchFilter.$or.push({ dncToSend: addresseePoligonSearchFilter });
            break;
          case WORK_POLIGON_TYPES.ECD_SECTOR:
            matchFilter.$or.push({ ecdToSend: addresseePoligonSearchFilter });
            break;
        }
      }

      // Ищем данные
      const data = await Order.find(matchFilter).sort([['createDateTime', 'ascending']]) || [];

      res.status(OK).json(data);

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение списка распоряжений для журнала ЭЦД.
 *
 * Данный запрос доступен любому лицу, наделенному полномочием ЭЦД.
 *
 * Информация о типе и id рабочего полигона извлекается из токена пользователя.
 * Именно по этим данным осуществляется поиск в БД. Если этой информации в токене нет,
 * то информация извлекаться не будет.
 *
 * Параметры тела запроса:
 * datetimeStart - дата-время начала поиска информации (обязателен)
 * datetimeEnd - дата-время окончания поиска информации (не обязателен, если не указан, то
 *               информация извлекается начиная с указанной даты до настоящего момента времени)
 * includeDocsCriteria - дополнительные критерии поиска информации (не обязателен) - массив строк:
 *                       1) включать только исходящие документы;
 *                       2) учитывать действующие документы - данный параметр определяет смысловое значение
 *                       параметров datetimeStart и datetimeEnd: если он не указан, то datetimeStart и datetimeEnd
 *                       используются для поиска документов по дате издания; если же указан, то документы
 *                       ищутся по временному интервалу действия соответствующих им цепочек распоряжений
 *                       (т.е. если документ принадлежит цепочке, время действия которой попадает во временной
 *                       интервал от datetimeStart до datetimeEnd, то такой документ включается в выборку)
 * sortFields - объект полей, по которым производится сортировка данных (если нет, то данные сортируются по
 *              дате-времени издания соответствующих документов; если есть, то к условиям в sortFields
 *              добавляется условие сортировки по id соответствующих документов (сортировка по возрастанию),
 *              все это необходимо для поддерки пагинации)
 * filterFields - объект полей с условиями поиска по массиву данных
 * page - номер страницы, данные по которой необходимо получить (поддерживается пагинация; если не указан,
 *        то запрос возвращает все найденные документы)
 * docsCount - количество документов, которое запрос должен вернуть (поддерживается пагинация; если не указан,
 *             то запрос возвращает все найденные документы)
 */
 router.post(
  '/ecdData',
  // расшифровка токена (извлекаем из него полномочия, которыми наделен пользователь)
  auth,
  // определяем требуемые полномочия на запрашиваемое действие
  (req, _res, next) => {
    req.action = {
      which: HOW_CHECK_CREDS.OR,
      creds: [ECD_FULL],
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
    try {
      // Считываем находящиеся в пользовательском запросе данные
      const {
        datetimeStart,
        datetimeEnd,
        includeDocsCriteria,
        sortFields,
        filterFields,
        page,
        docsCount,
      } = req.body;

      // Только для журнала ЭЦД: изначально в выборку не включаем документы типа "уведомление/отмена запрещения".
      // Потому что данные документы не фигурируют в журнале как отдельные строки - только как дополнение строк
      // с информацией о приказе / запрещении. Если их включить в выборку, то будут проблемы с пагинацией.
      // Потому находим сначала все остальные документы, а потом - для тех, у которых есть связь с документом
      // типа "уведомление/отмена запрещения", найдем дополнительную информацию.
      const matchFilter = {
        $and: [
          { type: { $ne: ORDER_PATTERN_TYPES.ECD_NOTIFICATION } },
        ],
      };

      const startDate = new Date(datetimeStart);
      const endDate = new Date(datetimeEnd);

      if (!includeDocsCriteria || !includeDocsCriteria.includes(INCLUDE_DOCUMENTS_CRITERIA.INCLUDE_ACTIVE)) {
        // Поиск по дате-времени издания
        if (!datetimeEnd) {
          matchFilter.$and.push({ createDateTime: { $gte: startDate } });
        } else {
          matchFilter.$and.push({ createDateTime: { $gte: startDate, $lte: endDate } });
        }
      } else {
        // Поиск по времени действия соответствующих цепочек распоряжений
        if (!datetimeEnd) {
          matchFilter.$and.push(
            {
              $or: [
                // The { item : null } query matches documents that either contain the item field
                // whose value is null or that do not contain the item field
                { "orderChain.chainEndDateTime": null },
                { "orderChain.chainEndDateTime": { $gte: startDate } },
              ],
            },
          );
        } else {
          matchFilter.$and.push(
            {
              "orderChain.chainStartDateTime": { $lte: endDate },
              "orderChain.chainEndDateTime": { $gte: startDate },
            },
          );
        }
      }

      // Фильтрация по издателю (в выборку всегда включаются документы, изданные на том рабочем месте,
      // с которого пришел запрос)
      const orderCreatorFilter = { "workPoligon.id": workPoligon.id, "workPoligon.type": workPoligon.type };

      let orderCreatorAddresseeFilter = {};

      // Фильтрация по адресату (не используется, если необходимо включать в выборку лишь исходящие документы)
      if (!includeDocsCriteria || !includeDocsCriteria.includes(INCLUDE_DOCUMENTS_CRITERIA.ONLY_OUTGOUING)) {
        let orderAddresseeFilter = {};
        const addresseePoligonSearchFilter = { $elemMatch: { id: workPoligon.id, type: workPoligon.type } };
        switch (workPoligon.type) {
          case WORK_POLIGON_TYPES.STATION:
            orderAddresseeFilter = { dspToSend: addresseePoligonSearchFilter };
            break;
          case WORK_POLIGON_TYPES.DNC_SECTOR:
            orderAddresseeFilter = { dncToSend: addresseePoligonSearchFilter };
            break;
          case WORK_POLIGON_TYPES.ECD_SECTOR:
            orderAddresseeFilter = { ecdToSend: addresseePoligonSearchFilter };
            break;
        }
        orderCreatorAddresseeFilter.$or = [
          orderCreatorFilter,
          orderAddresseeFilter,
        ];
      } else {
        orderCreatorAddresseeFilter = orderCreatorFilter;
      }

      matchFilter.$and.push(orderCreatorAddresseeFilter);

      if (filterFields) {
        const orderAcceptorFilter = (value) => {
          return { $elemMatch: {
            // $ne selects the documents where the value of the field is not equal to the specified value.
            // This includes documents that do not contain the field.
            confirmDateTime: { $exists: true },
            confirmDateTime: { $ne: null },
            $or: [
              { placeTitle: new RegExp(value, 'i') },
              { post: new RegExp(value, 'i') },
              { fio: new RegExp(value, 'i') },
            ],
          } };
        };
        filterFields.forEach((filter) => {
          switch (filter.field) {
            case 'toWhom':
              // Поиск по иным адресатам производится только в том случае, если распоряжение издано ЭЦД
              matchFilter.$and.push({
                "workPoligon.type": WORK_POLIGON_TYPES.ECD_SECTOR,
                otherToSend: { $elemMatch: {
                  $or: [
                    { placeTitle: new RegExp(filter.value, 'i') },
                    { post: new RegExp(filter.value, 'i') },
                    { fio: new RegExp(filter.value, 'i') },
                  ]
                } },
              });
              break;
            // Поиск подчисла в числе
            case 'number':
              matchFilter.$and.push({
                $expr: {
                  $regexMatch: {
                    input: { $toString: `$${filter.field}` },
                    regex: new RegExp(filter.value),
                  },
                },
              });
              break;
            // Поиск по значениям полей объектов массива
            case 'orderContent':
              matchFilter.$and.push({
                'orderText.orderText': { $elemMatch: { value: new RegExp(filter.value, 'i') } },
              });
              break;
            case 'orderAcceptor':
              matchFilter.$and.push({
                $or: [
                  { dspToSend: orderAcceptorFilter(filter.value) },
                  { dncToSend: orderAcceptorFilter(filter.value) },
                  { ecdToSend: orderAcceptorFilter(filter.value) },
                  { otherToSend: orderAcceptorFilter(filter.value) },
                ],
              });
              break;
            case 'orderSender':
              matchFilter.$and.push({
                $or: [
                  { 'creator.post': new RegExp(filter.value, 'i') },
                  { 'creator.fio': new RegExp(filter.value, 'i') },
                ],
              });
          }
        });
      }

      const util = require('util')
      console.log(util.inspect(matchFilter, {showHidden: false, depth: null, colors: true}))

      // Применяем сортировку
      let sortConditions = {};
      if (sortFields) {
        sortConditions = sortFields;
      } else {
        sortConditions.createDateTime = 1;
      }
      sortConditions._id = 1;

      // Ищем данные
      const totalRecords = await Order.countDocuments(matchFilter);

      let data = await Order
        .find(matchFilter)
        .sort(sortConditions)
        .skip(page > 0 ? (page - 1) * docsCount : 0)
        .limit(docsCount)
        .exec();

      // Имея конечную выборку документов, можем для тех из них, тип которых "приказ ЭЦД" либо
      // "запрещение ЭЦД" и у которых есть связанный с ними документ, найти этот документ типа
      // "уведомление/отмена запрещения" и связать его с найденным

      if (data && data.length) {
        const orderChainIds = data.filter((el) =>
          [ORDER_PATTERN_TYPES.ECD_ORDER, ORDER_PATTERN_TYPES.ECD_PROHIBITION].includes(el.type) &&
          String(el.orderChain.chainId) === String(el._id) && el.orderChain.chainEndDateTime !== el.timeSpan.end)
          .map((el) => el.orderChain.chainId);
        if (orderChainIds.length) {
          const connectedData = await Order
            .find({
              type: ORDER_PATTERN_TYPES.ECD_NOTIFICATION,
              "orderChain.chainId": orderChainIds,
            });
          if (connectedData.length) {
            data = data.map((order) => {
              const connectedOrder = connectedData.find((el) => String(el.orderChain.chainId) === String(order.orderChain.chainId));
              if (!connectedOrder) {
                return order;
              }
              return {
                ...order._doc,
                orderNotificationDateTime: connectedOrder._doc.timeSpan.start,
                notificationNumber: connectedOrder._doc.number,
              };
            });
          }
        }
      }

      res.status(OK).json({ data, totalRecords });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на проверку утвержденности распоряжения.
 * Распоряжение считается утвержденным, если все получатели его оригинала подтвердили данное распоряжение.
 * При этом дата и время утверждения = самая поздняя из всех дат утверждения распоряжения оригиналами.
 * Получатели оригинала ищутся среди ДСП, ДНЦ, ЭЦД и Иных адресатов (т.е. всех тех, кто был упомянут в
 * секции "Кому" при издании распоряжения). Если распоряжение утверждено, данный запрос ничего не делает.
 * Если еще не утверждено, то проверяет, может ли оно быть утверждено. Если да, то проставляет дату
 * утверждения и возвращает ее.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * id - id распоряжения (обязательный параметр)
 */
 router.post(
  '/checkIfOrderIsAsserted',
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
    // Считываем находящиеся в пользовательском запросе данные
    const { id } = req.body;

    try {
      // Вначале ищем распоряжение в основной коллекции распоряжений
      const order = await Order.findOne({ _id: id });
      if (!order) {
        return res.status(ERR).json({ message: 'Указанное распоряжение не найдено в базе данных' });
      }

      if (order.assertDateTime) {
        return res.status(OK).json({ message: 'Указанное распоряжение уже утверждено', assertDateTime: order.assertDateTime });
      }

      let assertDateTime = null;
      let continueSearch = true;

      const searchAssertDateTimeAmongAddresses = (addresses) => {
        if (continueSearch && addresses && addresses.length) {
          for (let el of addresses) {
            if (!el.sendOriginal) {
              continue;
            }
            if (!el.confirmDateTime) {
              continueSearch = false;
              break;
            }
            if (!assertDateTime || assertDateTime < el.confirmDateTime) {
              assertDateTime = el.confirmDateTime;
            }
          }
        }
      };

      searchAssertDateTimeAmongAddresses(order.dncToSend);
      searchAssertDateTimeAmongAddresses(order.dspToSend);
      searchAssertDateTimeAmongAddresses(order.ecdToSend);
      searchAssertDateTimeAmongAddresses(order.otherToSend);

      if (continueSearch && assertDateTime) {
        order.assertDateTime = assertDateTime;
        await order.save();
      }

      return res.status(OK).json({ assertDateTime: order.assertDateTime });

    } catch (error) {
      console.log(error);
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
