const { Router } = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth.middleware');
const { checkAuthority, HOW_CHECK_CREDS } = require('../middleware/checkAuthority.middleware');
const { isOnDuty } = require('../middleware/isOnDuty.middleware');
const Order = require('../models/Order');
const LastOrdersParam = require('../models/LastOrdersParam');
const WorkOrder = require('../models/WorkOrder');
const {
  addOrderValidationRules,
  getDataForGIDValidationRules,
  getOrdersFromGivenDateRules,
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
  checkAuthority,
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
      });
      await order.save({ session });

      // Обновляем информацию по номеру последнего изданного распоряжения заданного типа
      // на текущем полигоне управления
      const filter = {
        ordersType: type,
        'workPoligon.id': workPoligon.id,
        'workPoligon.type': workPoligon.type,
      };
      if (workPoligon.workPlaceId) {
        filter['workPoligon.workPlaceId'] = workPoligon.workPlaceId;
      } else {
        filter.$or = [
          { 'workPoligon.workPlaceId': { $exists: false } },
          { 'workPoligon.workPlaceId': null },
        ];
      }
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
      // ее составе операторов при ДСП. Копия издаваемого распоряжения должна попасть как ДСП, так и
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
      const formOrderCopiesForDSPAndOperators = async (stationId, sendOriginal) => {
        const workOrders = [];
        // Отправка ДСП
        if (workPoligon.type !== WORK_POLIGON_TYPES.STATION ||
          stationId !== workPoligon.id || workPoligon.workPlaceId) {
          workOrders.push(new WorkOrder(getToSendObject({
            id: stationId,
            workPlaceId: null,
            type: WORK_POLIGON_TYPES.STATION,
            sendOriginal: sendOriginal,
          })));
        }
        const stationWorkPlacesData = await TStationWorkPlace.findAll({
          attributes: ['SWP_ID'], // извлекаем id всех рабочих мест на станции
          where: { SWP_StationId: stationId },
        });
        if (stationWorkPlacesData && stationWorkPlacesData.length) {
          // направляем копию всем операторам при ДСП, кроме самого себя
          // (если распоряжение издано оператором при ДСП)
          let workPlacesIds = stationWorkPlacesData.map((item) => item.SWP_ID);
          if (workPoligon.type === WORK_POLIGON_TYPES.STATION && stationId === workPoligon.id && workPoligon.workPlaceId) {
            workPlacesIds = workPlacesIds.filter((item) => item !== workPoligon.workPlaceId);
          }
          workPlacesIds.forEach((wpID) => {
            const workOrder = new WorkOrder(getToSendObject({
              id: stationId,
              workPlaceId: wpID,
              type: WORK_POLIGON_TYPES.STATION,
              sendOriginal: sendOriginal,
            }));
            workOrders.push(workOrder);
          });
        }
        return workOrders;
      };
      // рассылка на участки ДНЦ
      order.dncToSend.forEach((dncSector) => {
        const workOrder = new WorkOrder(getToSendObject(dncSector));
        workOrders.push(workOrder);
      });
      // рассылка на станции (ДСП и операторам при ДСП)
      for (let dspSector of order.dspToSend) {
        const orderCopies = await formOrderCopiesForDSPAndOperators(dspSector.id, dspSector.sendOriginal);
        workOrders.push(...orderCopies);
      }
      // рассылка на участки ЭЦД
      order.ecdToSend.forEach((ecdSector) => {
        const workOrder = new WorkOrder(getToSendObject(ecdSector));
        workOrders.push(workOrder);
      });
      // себе
      workOrders.push(new WorkOrder({
        senderWorkPoligon: { ...workPoligon, title: workPoligonTitle },
        recipientWorkPoligon: { ...workPoligon },
        orderId: order._id,
        timeSpan: timeSpan,
        sendOriginal: true,
        deliverDateTime: new Date(),
        confirmDateTime: new Date(),
        orderChain: orderChainInfo,
      }));
      // если распоряжение издается на станции (ДСП или оператором при ДСП), то оно
      // автоматически должно попасть как ДСП, так и на все рабочие места операторов ДСП данной станции
      if (workPoligon.type === WORK_POLIGON_TYPES.STATION) {
        const orderCopies = await formOrderCopiesForDSPAndOperators(workPoligon.id, true);
        workOrders.push(...orderCopies);
      }

      await WorkOrder.insertMany(workOrders, { session });

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
  '/ordersCreatedFromGivenDate',
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


module.exports = router;
