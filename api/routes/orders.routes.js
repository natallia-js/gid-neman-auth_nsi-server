const { Router } = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Draft = require('../models/Draft');
const LastOrdersParam = require('../models/LastOrdersParam');
const WorkOrder = require('../models/WorkOrder');
const {
  addOrderValidationRules,
  getDataForGIDValidationRules,
  getOrdersFromGivenDateRules,
} = require('../validators/orders.validator');
const { TStation } = require('../models/TStation');
const { TBlock } = require('../models/TBlock');
const { TDNCSector } = require('../models/TDNCSector');
const OrderPatternElementRef = require('../models/OrderPatternElementRef');
const validate = require('../validators/validate');
const { Op } = require('sequelize');
const { addDY58UserActionInfo, addError } = require('../serverSideProcessing/processLogsActions');
const { getUserConciseFIOString, userPostFIOString } = require('../routes/additional/getUserTransformedData');
const hasUserRightToPerformAction = require('../middleware/hasUserRightToPerformAction.middleware');
const DY58_ACTIONS = require('../middleware/DY58_ACTIONS');
const getUserWorkPoligonString = require('./additional/getUserWorkPoligonString');
const escapeSpecialCharactersInRegexString = require('../additional/escapeSpecialCharactersInRegexString');

const router = Router();

const {
  OK, UNKNOWN_ERR, UNKNOWN_ERR_MESS, ERR,
  WORK_POLIGON_TYPES, INCLUDE_DOCUMENTS_CRITERIA, ORDER_PATTERN_TYPES,
  SPECIAL_ORDER_DSP_TAKE_DUTY_SIGN, TAKE_DUTY_PERSONAL_ORDER_TEXT_ELEMENT_REF,
  TAKE_PASS_DUTY_ORDER_DNC_ECD_SPECIAL_SIGN, SPECIAL_CLOSE_BLOCK_ORDER_SIGN,
  SPECIAL_OPEN_BLOCK_ORDER_SIGN, TAKE_DUTY_FIO_ORDER_TEXT_ELEMENT_REF,
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
 * При издании распоряжения о приеме-сдаче дежурства ДСП это распоряжение автоматически рассылается только на те
 * рабочие места этой станции, которые явно прописаны в тексте данного распоряжения.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 *
 * Параметры тела запроса:
 * type - тип распоряжения (обязателен),
 * orderNumSaveType - тип распоряжения, под которым хранить информацию о номере последнего изданного документа (обязателен),
 * number - номер распоряжения (обязателен),
 * createDateTime - дата и время издания распоряжения - то время, которое "удобно" пользователю (обязательно),
 * actualCreateDateTime - дата и время издания распоряжения - когда пользователь нажал на кнопку отправки распоряжения на сервер (обязательно),
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
 * createdOnBehalfOf - от чьего имени издано распоряжение (не обязательно)
 * specialTrainCategories - отметки об особых категориях поездов, к которым имеет отношение распоряжение
 * orderChainId - id цепочки распоряжений, которой принадлежит издаваемое распоряжение
 * dispatchedOnOrder - id распоряжения, которое предшествует текущему (связано с ним либо текущее
 * распоряжение отменяет его) в рамках цепочки распоряжений
 * showOnGID - true - отображать на ГИД, false - не отображать на ГИД (не обязательно)
 * idOfTheOrderToCancel - id распоряжения, которое необходимо отменить при издании текущего распоряжения
 *   (специально для случая издания распоряжения о принятии дежурства ДСП: при издании нового распоряжения
 *   у предыдущего время окончания действия становится не "до отмены", а ему присваивается дата и время
 *   начала действия данного распоряжения)
 * draftId - id черновика, который необходимо удалить при успешном издании распоряжения,
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/add',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.ADD_ORDER; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  addOrderValidationRules(),
  validate,
  async (req, res) => {
    // Определяем рабочий полигон пользователя
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const {
      type, orderNumSaveType, number, createDateTime, actualCreateDateTime, place, timeSpan, orderText,
      dncToSend, dspToSend, ecdToSend, otherToSend,
      workPoligonTitle, createdOnBehalfOf, specialTrainCategories,
      orderChainId, dispatchedOnOrder, showOnGID, idOfTheOrderToCancel, draftId,
      additionalWorkers,
    } = req.body;

    // Генерируем id нового распоряжения
    const newOrderObjectId = new mongoose.Types.ObjectId();

    try {
      // Полагаем по умолчанию, что распоряжение принадлежит цепочке, в которой оно одно
      let orderChainInfo = {
        chainId: newOrderObjectId,
        // время начала действия рассчитывается на основании того времени, которое "удобно" пользователю
        // (т.е. время, которое он хочет видеть в качестве времени создания распоряжения)
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
          { session }
        );
        await WorkOrder.updateMany(
          // filter
          { "orderChain.chainId": orderChainInfo.chainId },
          // update
          { "orderChain.chainEndDateTime": orderChainInfo.chainEndDateTime },
          { session }
        );
      }

      // Если распоряжение:
      // - имеет только "иных" адресатов,
      // - либо не имеет адресатов,
      // - либо не рассылается ни одного оригинала распоряжения (только копии),
      // то такое распоряжение полагаем утвержденным сразу при издании, дата-время утверждения =
      // дата-время создания распоряжения.
      // В случае, когда распоряжение (неважно, какого типа и кем издано) имеет "иных" адресатов, сразу проставляем
      // дату и время утверждения распоряжения за этих "иных" адресатов
      const getOrderAssertDateTime = () => {
        // true - если распоряжение имеет только "иных" адресатов,
        // false - если распоряжение не имеет "иных" адресатов либо имеет адресатов, отличных от "иных"
        const case1 = Boolean(
          (otherToSend?.length > 0) &&
          (!dncToSend?.length) && (!dspToSend?.length) && (!ecdToSend?.length));
        // true - если распоряжение не имеет адресатов либо не имеет адресатов, которым необходимо передать оригинал документа
        const case2 = Boolean(
          (!dncToSend || !dncToSend.length || !dncToSend.find((el) => el.sendOriginal)) &&
          (!dspToSend || !dspToSend.length || !dspToSend.find((el) => el.sendOriginal)) &&
          (!ecdToSend || !ecdToSend.length || !ecdToSend.find((el) => el.sendOriginal)) &&
          (!otherToSend || !otherToSend.length || !otherToSend.find((el) => el.sendOriginal)));
        // Определяем дату утверждения распоряжения
        const assertDateTime = (case1 || case2) ? createDateTime : null;
        // Автоматическое подтверждение распоряжения за "иных" адресатов
        if (otherToSend?.length > 0) {
          otherToSend.forEach((el) => { el.confirmDateTime = createDateTime });
        }
        return assertDateTime;
      };

      // Создаем в БД запись с данными о новом распоряжении
      const order = new Order({
        _id: newOrderObjectId,
        type,
        number,
        createDateTime,
        actualCreateDateTime,
        place,
        timeSpan,
        orderText,
        dncToSend,
        dspToSend,
        // Если издано циркулярное распоряжение ДНЦ, то в его список адресатов искусственно на клиенте
        // включаются ЭЦД, которых ДНЦ никогда не указывает. Этих ЭЦД не нужно включать в оригинальный документ.
        // Они нужны только в документах в работе (чтобы у ЭЦД автоматически формировался список адресатов
        // на станциях при создании нового документа)
        ecdToSend: (workPoligon.type === WORK_POLIGON_TYPES.DNC_SECTOR && specialTrainCategories?.includes(TAKE_PASS_DUTY_ORDER_DNC_ECD_SPECIAL_SIGN))
          ? [] : ecdToSend,
        otherToSend,
        workPoligon: { ...workPoligon, title: workPoligonTitle },
        creator: {
          id: req.user.userId,
          post: req.user.post,
          fio: getUserConciseFIOString({
            name: req.user.name,
            fatherName: req.user.fatherName,
            surname: req.user.surname,
          }) + (additionalWorkers ? ', ' + additionalWorkers : ''),
        },
        createdOnBehalfOf, specialTrainCategories, orderChain: orderChainInfo, showOnGID,
        assertDateTime: getOrderAssertDateTime(),
        dispatchedOnOrder,
      });

      // Обновляем информацию по номеру последнего изданного распоряжения заданного типа
      // на текущем глобальном полигоне управления
      await LastOrdersParam.findOneAndUpdate(
        // filter
        {
          ordersType: orderNumSaveType,
          'workPoligon.id': workPoligon.id,
          'workPoligon.type': workPoligon.type,
        },
        // update
        { lastOrderNumber: number, lastOrderDateTime: createDateTime },
        { upsert: true, new: true }
      ).session(session);

      // Информация о полигоне, на котором было издано распоряжение
      const senderInfo = { ...workPoligon, title: workPoligonTitle };


      // Функция, которую необходимо вызвать после успешного сохранения всей информации о распоряжении в БД
      const successfullFinishAddingNewDocument = async (delOrderDraftRes, deliverAndConfirmDateTimeOnCurrentWorkPoligon) => {
        await session.commitTransaction();

        res.status(OK).json({ message: 'Информация успешно сохранена', order:
          {
            ...order._doc,
            senderWorkPoligon: senderInfo,
            deliverDateTime: deliverAndConfirmDateTimeOnCurrentWorkPoligon,
            confirmDateTime: deliverAndConfirmDateTimeOnCurrentWorkPoligon,
            sendOriginal: true,
          },
          draftId: (delOrderDraftRes && delOrderDraftRes.deletedCount === 1) ? draftId : null,
        });

        // Логируем действие пользователя
        const logObject = {
          user: userPostFIOString(req.user),
          workPoligon: await getUserWorkPoligonString({
            workPoligonType: workPoligon.type,
            workPoligonId: workPoligon.id,
            workSubPoligonId: workPoligon.workPlaceId,
          }),
          actionTime: actualCreateDateTime,
          action: 'Издание распоряжения',
          actionParams: {
            userId: req.user.userId,
            type, number, createDateTime, actualCreateDateTime, place, timeSpan, orderText,
            dncToSend, dspToSend, ecdToSend, otherToSend,
            workPoligonTitle, createdOnBehalfOf, specialTrainCategories,
            orderChainId, showOnGID, idOfTheOrderToCancel, draftId,
          },
        };
        addDY58UserActionInfo(logObject);
      };


      // Сохраняем информацию об издаваемом распоряжении в таблице рабочих распоряжений.
      // Сохраняем все, кроме отметок ревизоров в журнале! Эти отметки не являются рабочими распоряжениями.
      if (type === ORDER_PATTERN_TYPES.CONTROL) {
        await order.save({ session });
        await successfullFinishAddingNewDocument(null, new Date());
        return;
      }

      // Здесь есть один нюанс. И связан он с распоряжениями, издаваемыми в рамках полигона "станция" либо
      // адресуемыми на такой полигон.
      // Станция - это не только ДСП, но и операторы при ДСП, и иные рабочие места
      // (в частности, временные рабочие места руководителей работ на станции).
      // Как ДСП, так и операторы при ДСП, а также руководители работ - все они могут издавать распоряжения.
      // Но получать распоряжения, направляемые в адрес станции, могут только "стационарные" рабочие места
      // (т.е. на временное рабочее место руководителя работ распоряжение не должно идти; на такое рабочее место
      // идут только те распоряжения, которые издаются в рамках этого временного рабочего места).
      // Потому для каждой станции - будь то издатель или получатель распоряжения - проверяем наличие в
      // ее составе рабочих мест ОПЕРАТОРОВ. Копия издаваемого распоряжения должна попасть как ДСП,
      // так и тем операторам на станции, которые фигурировали в последнем (ныне активном) распоряжении
      // о приеме-сдаче дежурства ДСП.
      const workOrders = [];
      const getToSendObject = ({ sectorInfo, isHiddenDocument = false }) => {
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
          hidden: isHiddenDocument,
          // Для скрытых документов сразу устанавливаем даты доставки и подтверждения, чтобы документ находился "в работе"
          deliverDateTime: isHiddenDocument ? new Date() : null,
          confirmDateTime: isHiddenDocument ? new Date() : null,
        };
      };
      // Формирование копий распоряжения для ДСП станции и тех операторов при ДСП, которые приняли дежурство
      // вместе с ДСП согласно распоряжения о приеме-сдаче дежурства ДСП (самому себе копия не формируется).
      // Если же издается распоряжение о приеме-сдаче дежурства ДСП, то копии распоряжения идут тем операторам
      // при ДСП, которые фигурируют в тексте распоряжения.
      const formOrderCopiesForDSPAndOperators = async (stationId, stationName, sendOriginal) => {
        const orderCopies = [];
        const stationWorkPlacesOrderIsSentTo = [];
        // Отправка ДСП (если распоряжение издается не на станции, но ей адресуется, либо издается
        // на рабочем месте станции и должна попасть на это рабочее место)
        if (workPoligon.type !== WORK_POLIGON_TYPES.STATION ||
          stationId !== workPoligon.id || workPoligon.workPlaceId) {
            orderCopies.push(new WorkOrder(
              getToSendObject({
                sectorInfo: {
                  id: stationId,
                  workPlaceId: null,
                  type: WORK_POLIGON_TYPES.STATION,
                  sendOriginal,
                }
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

        // Рабочие места ОПЕРАТОРОВ при ДСП станции, которым будет передана копия издаваемого документа
        let workPlaces = [];

        // Издается распоряжение о приеме-сдаче дежурства ДСП => из текста распоряжения выделяем информацию о
        // рабочих местах операторов при ДСП станции, которым данное распоряжение адресуется. Им необходимо отправить
        // копию издаваемого документа о приеме-сдаче дежурства.
        if (specialTrainCategories?.includes(SPECIAL_ORDER_DSP_TAKE_DUTY_SIGN)) {
          if (orderText?.orderText?.length) {
            const takeDutyPersonalInfo = orderText.orderText.find((el) => el.ref === TAKE_DUTY_PERSONAL_ORDER_TEXT_ELEMENT_REF);
            if (takeDutyPersonalInfo) {
              try {
                // В списке лиц, принимающих дежурство, может оказаться (теоретически) несколько лиц с одного рабочего
                // полигона. Но нас не интересуют работники, нас интересует непосредственно сам рабочий полигон (работа
                // ДУ-58 ведется на рабочих полигонах!). Поэтому формируем список рабочих полигонов с учетом возможного
                // дублирования информации (дубликаты удаляем).
                const takeDutyPersonal = JSON.parse(takeDutyPersonalInfo.value);
                takeDutyPersonal.forEach((el) => {
                  if (!workPlaces.find((wp) => wp.id === el.workPlaceId))
                    workPlaces.push({ id: el.workPlaceId, name: el.placeTitle });
                });
              } catch (error) {
                addError({
                  errorTime: new Date(),
                  action: 'Издание распоряжения',
                  error: error.message,
                  actionParams: {
                    userId: req.user.userId, user: userPostFIOString(req.user),
                    type, number, createDateTime, actualCreateDateTime, place, timeSpan, orderText,
                    dncToSend, dspToSend, ecdToSend, otherToSend,
                    workPoligonTitle, createdOnBehalfOf, specialTrainCategories,
                    orderChainId, showOnGID, idOfTheOrderToCancel, draftId,
                  },
                });
              }
            }
          }
        } else {
          // Если издается распоряжение НЕ о приеме-сдаче дежурства ДСП, то для определения адресатов распоряжения на
          // рабочих местах станции (т.е. операторов при ДСП) извлекаем действующее распоряжение о приеме-сдаче
          // дежурства на станции stationId
          const activeTakePassOrders = await Order.find({
            "workPoligon.type": WORK_POLIGON_TYPES.STATION,
            "workPoligon.id": stationId,
            $or: [
              // The { item : null } query matches documents that either contain the item field
              // whose value is null or that do not contain the item field
              { "timeSpan.end": null },
              { "timeSpan.end": { $gt: new Date() } },
            ],
            specialTrainCategories: SPECIAL_ORDER_DSP_TAKE_DUTY_SIGN,
          }).sort({ createDateTime: -1 });

          const activeTakePassOrder = activeTakePassOrders?.length ? activeTakePassOrders[0] : null;

          // если на станции stationId нет действующего распоряжения о приеме сдаче-дежурства либо в нем нет
          // списка рабочих мест операторов при ДСП, то новое распоряжение не будет передаваться на рабочие места
          // операторов при ДСП этой станции
          if (activeTakePassOrder?.stationWorkPlacesToSend?.length) {
            // если на станции stationId найдено действующее распоряжение о приеме-сдаче дежурства, то
            // новое распоряжение будет передано на те рабочие места операторов при ДСП станции, которые
            // фигурируют в найденном распоряжении о приеме-сдаче дежурства
            workPlaces = activeTakePassOrder.stationWorkPlacesToSend.map((workPlace) => {
              return { id: workPlace.workPlaceId, name: workPlace.placeTitle };
            });
          }
        }

        if (!workPlaces.length) {
          return { orderCopies, stationWorkPlacesOrderIsSentTo };
        }

        if (workPoligon.type === WORK_POLIGON_TYPES.STATION && stationId === workPoligon.id && workPoligon.workPlaceId) {
          workPlaces = workPlaces.filter((item) => item.id !== workPoligon.workPlaceId);
        }
        workPlaces.forEach((wp) => {
          orderCopies.push(new WorkOrder(
            getToSendObject({
              sectorInfo: {
                id: stationId,
                workPlaceId: wp.id,
                type: WORK_POLIGON_TYPES.STATION,
                sendOriginal,
              }
            })));
          stationWorkPlacesOrderIsSentTo.push({
            id: stationId,
            type: WORK_POLIGON_TYPES.STATION,
            workPlaceId: wp.id,
            placeTitle: wp.name,
            sendOriginal,
          });
        });

        return { orderCopies, stationWorkPlacesOrderIsSentTo };
      };

      // рассылка на участки ДНЦ
      dncToSend.forEach((dncSector) => {
        const workOrder = new WorkOrder(getToSendObject({ sectorInfo: dncSector }));
        workOrders.push(workOrder);
      });

      // рассылка на станции (ДСП и операторам при ДСП) - явно указанные издателем распоряжения как адресаты
      for (let dspSector of dspToSend) {
        const { orderCopies, stationWorkPlacesOrderIsSentTo } =
          await formOrderCopiesForDSPAndOperators(dspSector.id, dspSector.placeTitle, dspSector.sendOriginal);
        workOrders.push(...orderCopies);
        order.stationWorkPlacesToSend.push(...stationWorkPlacesOrderIsSentTo);
      }

      // рассылка на участки ЭЦД
      ecdToSend.forEach((ecdSector) => {
        const isHiddenDocument = (workPoligon.type === WORK_POLIGON_TYPES.DNC_SECTOR &&
          specialTrainCategories?.includes(TAKE_PASS_DUTY_ORDER_DNC_ECD_SPECIAL_SIGN));
        const workOrder = new WorkOrder(getToSendObject({ sectorInfo: ecdSector, isHiddenDocument }));
        workOrders.push(workOrder);
      });

      // себе
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

      // Удаляем (при необходимости) черновик распоряжения
      const delRes = draftId ? await Draft.deleteOne({ _id: draftId }, { session }) : null;

      await successfullFinishAddingNewDocument(delRes, deliverAndConfirmDateTimeOnCurrentWorkPoligon);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Издание распоряжения',
        error: error.message,
        actionParams: {
          userId: req.user.userId, user: userPostFIOString(req.user),
          type, number, createDateTime, actualCreateDateTime, place, timeSpan, orderText,
          dncToSend, dspToSend, ecdToSend, otherToSend,
          workPoligonTitle, createdOnBehalfOf, specialTrainCategories,
          orderChainId, showOnGID, idOfTheOrderToCancel, draftId,
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
 * Обработка запроса на редактирование существующего распоряжения.
 *
 * Данный запрос ПОКА доступен только:
 *  - в случае редактирования распоряжения ДСП о приеме-сдаче дежурства,
 *  - в случае редактирования ДСП информации о дополнительно ознакомленных с распоряжением лицах.
 * Он не позволяет анализировать изменяемое время действия распоряжения для редактирования времени действия
 * всей цепочки распоряжений. В связи с этим, редактирование времени возможно только у одиночных распоряжений
 * (т.е. распоряжений, которые не принадлежат цепочке из 2 и более распоряжений).
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
 *     value - значение параметра (представленное в виде строки!),
 * additionallyInformedPeople - лица, дополнительно ознакомленные с распоряжением (строка)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/mod',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.MOD_ORDER; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    // Определяем рабочий полигон пользователя
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    // Считываем находящиеся в пользовательском запросе данные
    const { id, timeSpan, orderText, additionallyInformedPeople } = req.body;

    try {
      const existingOrder = await Order.findById(id).session(session);
      if (!existingOrder) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Указанное распоряжение не существует в базе данных' });
      }

      if (timeSpan) {
        const ordersInChain = await Order.countDocuments({
          'orderChain.chainId': existingOrder.orderChain.chainId,
        });
        if (ordersInChain === 0) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'Цепочка распоряжений не существует в базе данных' });
        }
        if (ordersInChain > 1) {
          await session.abortTransaction();
          return res.status(ERR).json({ message: 'В цепочке распоряжений более одного распоряжения: редактирование невозможно' });
        }
      }

      // Редактируем запись в основной коллекции распоряжений
      let edited = false;

      // Запоминаем рабочие места на станции, которым текущее распоряжение было адресовано ранее
      let stationWorkPlacesToSend = [...existingOrder.stationWorkPlacesToSend || []];

      // Сюда поместим id тех рабочих мест на станции, по которым были изменения
      const deletedWorkPlacesIds = [];
      const newWorkPlacesIds = [];

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

      if (req.body.hasOwnProperty('additionallyInformedPeople')) {
        existingOrder.additionallyInformedPeople = additionallyInformedPeople;
        edited = true;
      }

      // Если редактируется распоряжение о приеме-сдаче дежурства ДСП, то количество рабочих мест
      // ОПЕРАТОРОВ при ДСП на станции, которым адресуется документ, должно соответствовать количеству
      // ОПЕРАТОРОВ при ДСП, указанных в тексте распоряжения в качестве персонала, принимающего дежурство вместе с ДСП станции.
      if (existingOrder.specialTrainCategories?.includes(SPECIAL_ORDER_DSP_TAKE_DUTY_SIGN)) {
        // Извлекаем элемент текста распоряжения, в котором приводится список рабочих мест на станции, принимающих
        // дежурство наряду с текущим ДСП
        const takeDutyPersonalInfo = orderText?.orderText?.find((el) => el.ref === TAKE_DUTY_PERSONAL_ORDER_TEXT_ELEMENT_REF) || { value: '[]' };

        try {
          // Получаем список рабочих мест, которым необходимо адресовать текущее распоряжение
          const takeDutyPersonal = JSON.parse(takeDutyPersonalInfo.value);
          // Просто заменить текущий список новым не можем: затрем время доставки и подтверждения документа на
          // рабочих местах станции. Придется анализировать каждый элемент списка отдельно.

          // Удаляем тех получателей распоряжения на станции, которых нет в новом списке получателей
          stationWorkPlacesToSend = stationWorkPlacesToSend.filter((el) => {
            const doNotDeleteRecord =
              el.type !== WORK_POLIGON_TYPES.STATION ||
              el.id !== workPoligon.id ||
              el.workPlaceId === null ||
              Boolean(takeDutyPersonal.find((newEl) => el.workPlaceId === newEl.workPlaceId));
            if (!doNotDeleteRecord)
              deletedWorkPlacesIds.push(el.workPlaceId);
            return doNotDeleteRecord;
          });

          // Добавляем новых получателей распоряжения на рабочих местах станции
          takeDutyPersonal.forEach((newWorkPlaceInfo) => {
            const existingElement = stationWorkPlacesToSend.find((el) =>
              el.type === WORK_POLIGON_TYPES.STATION &&
              el.id === workPoligon.id &&
              el.workPlaceId === newWorkPlaceInfo.workPlaceId
            );
            if (!existingElement) {
              stationWorkPlacesToSend.push({
                id: workPoligon.id,
                type: WORK_POLIGON_TYPES.STATION,
                workPlaceId: newWorkPlaceInfo.workPlaceId,
                placeTitle: newWorkPlaceInfo.placeTitle,
                sendOriginal: true,
              });
              newWorkPlacesIds.push(newWorkPlaceInfo.workPlaceId);
            }
          });

          if (deletedWorkPlacesIds.length || newWorkPlacesIds.length) {
            existingOrder.stationWorkPlacesToSend = stationWorkPlacesToSend;
            edited = true;
          }

        } catch (err) {
          addError({
            errorTime: new Date(),
            action: 'Редактирование распоряжения',
            error: error.message,
            actionParams: {
              user: userPostFIOString(req.user), orderId: id, timeSpan, orderText,
            },
          });
        }
      }

      if (edited) {
        await existingOrder.save({ session });
      }

      // Редактируем (при необходимости) записи в коллекции рабочих распоряжений.

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

      // При редактировании учитываем тот факт, что список адресатов среди рабочих мест на теущей станции
      // после выполнения кода выше мог измениться.

      // Из WorkOrders удаляем те записи по рабочим местам станции, которых нет в stationWorkPlacesToSend
      // для распоряжения с id
      if (deletedWorkPlacesIds.length) {
        await WorkOrder.deleteMany({
          orderId: id,
          "recipientWorkPoligon.type": WORK_POLIGON_TYPES.STATION,
          "recipientWorkPoligon.id": workPoligon.id,
          "recipientWorkPoligon.workPlaceId": deletedWorkPlacesIds,
        }, { session });
      }

      // Записи из stationWorkPlacesToSend, которых нет в WorkOrders, добавляем туда.
      if (newWorkPlacesIds.length) {
        await WorkOrder.insertMany(
          newWorkPlacesIds.map((wp) => new WorkOrder({
            senderWorkPoligon: {
              id: workPoligon.id,
              workPlaceId: workPoligon.workPlaceId,
              type: workPoligon.type,
              title: existingOrder.workPoligon.title,
            },
            recipientWorkPoligon: {
              id: workPoligon.id,
              workPlaceId: wp,
              type: workPoligon.type,
            },
            orderId: id,
            timeSpan: existingOrder.timeSpan,
            sendOriginal: true,
            orderChain: {
              chainId: existingOrder.orderChain.chainId,
              chainStartDateTime: timeSpan.start,
              chainEndDateTime: timeSpan.end,
            },
          })),
          { session }
        );
      }

      await session.commitTransaction();

      res.status(OK).json({ message: 'Информация успешно сохранена', order: existingOrder._doc });

      // Логируем действие пользователя
      const logObject = {
        user: userPostFIOString(req.user),
        workPoligon: await getUserWorkPoligonString({
          workPoligonType: req.user.workPoligon.type,
          workPoligonId: req.user.workPoligon.id,
          workSubPoligonId: req.user.workPoligon.workPlaceId,
        }),
        actionTime: new Date(),
        action: 'Редактирование распоряжения',
        actionParams: {
          userId: req.user.userId, orderId: id, timeSpan, orderText, additionallyInformedPeople,
        },
      };
      addDY58UserActionInfo(logObject);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Редактирование распоряжения',
        error: error.message,
        actionParams: {
          user: userPostFIOString(req.user), orderId: id, timeSpan, orderText, additionallyInformedPeople
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
/*router.post(
  '/getDataForGID',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.GET_DATA_FOR_GID; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
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

    // Считываем находящиеся в пользовательском запросе данные
    const { startDate, stations } = req.body;

    try {
      // Формируем список id станций по указанным кодам ЕСР
      const stationsData = await TStation.findAll({
        raw: true,
        attributes: ['St_ID', 'St_GID_UNMC'],
        where: { St_GID_UNMC: stations },
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
          STATION1 = stationsData.find((station) => String(station.St_ID) === String(item.place.value)).St_GID_UNMC;
        } else {
          const block = blocksData.find((block) => String(block.Bl_ID) === String(item.place.value));
          STATION1 = stationsData.find((station) => String(station.St_ID) === String(block.Bl_StationID1)).St_GID_UNMC;
          STATION2 = stationsData.find((station) => String(station.St_ID) === String(block.Bl_StationID2)).St_GID_UNMC;
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
      addError({
        errorTime: new Date(),
        action: 'Получение информации о распоряжениях для отображения на ГИД',
        error: error.message,
        actionParams: {
          startDate, stations,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);*/


/**
 * Обработка запроса на получение информации о распоряжениях, которые необходимо отобразить на ГИД участка ДНЦ,
 * а также циркулярных распоряжений ДНЦ этого участка.
 * Распоряжения извлекаются и сортируются в порядке увеличения времени их создания.
 *
 * Предполагается, что данный запрос будет выполняться службой (программой, установленной на рабочем месте ДНЦ).
 * Полномочия службы на выполнение данного действия не проверяем.
 *
 * Параметры тела запроса:
 * startDate - дата-время начала временного интервала выполнения запроса (не обязательно) - с этим параметром
 *   сравниваются даты издания распоряжений ДНЦ: если дата издания распоряжения больше startDate, то такое
 *   распоряжение включается в выборку; если startDate не указана либо null, то извлекаются все распоряжения требуемых типов;
 * stations - массив ЕСР-кодов станций, по которым необходимо осуществлять выборку распоряжений о закрытии-открытии перегонов/станций
 *   (не обязателен, ведь ДНЦ могут быть нужны только циркуляры) - если данный массив не указан либо пуст, то поиск информации
 *   по распоряжениям о закрытии-открытии перегонов производиться не будет;
 * dncSectorName - наименование участка ДНЦ, нужно для поиска циркуляров; если не указано, то циркуляры искаться не будут
 */
 router.post(
  '/getDataForGID',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.GET_DATA_FOR_GID; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getDataForGIDValidationRules(),
  validate,
  async (req, res) => {
    // Считываем находящиеся в пользовательском запросе данные
    const { startDate, stations, dncSectorName } = req.body;

    // Если указан массив станций stations, то будет произведен поиск распоряжений о закрытии-открытии перегонов/станций,
    // в тексте которых могут содержаться дополнительные данные, которые необходимо отобразить на ГИД.
    // Дополнительные данные - это элементы шаблона распоряжения. Они содержат текст, который является частью
    // общего текста распоряжения. Однако среди таких элементов шаблона необходимо выбрать только те, которые
    // важны для ГИД. Для этого в самом начале извлекаем типы и смысловые значения тех возможных элементов текстов шаблонов
    // распоряжений, значения которых должны точно передаваться ГИД (далее - список DisplayGIDElements).
    // В дальнейшем, анализируя очередное найденное распоряжение о закрытии-открытии перегона/станции, из него
    // извлечем только те значения элементов текста, которые будут находиться в списке DisplayGIDElements.
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
    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение смысловых значений элементов для распоряжений, отправляемых ГИД',
        error: error.message,
        actionParams: {},
      });
    }

    try {
      // Ищем данные по указанному в запросе рабочему полигону
      const workPoligon = !dncSectorName ? null : await TDNCSector.findOne({ where: { DNCS_Title: dncSectorName } });

      // Формируем список id станций по указанным кодам ЕСР
      const stationsData = !stations?.length ? null :
        await TStation.findAll({
          raw: true,
          attributes: ['St_ID', 'St_GID_UNMC'],
          where: { St_GID_UNMC: stations },
        });
      // Если станции найдены не будут - все равно продолжаем: могут быть найдены циркуляры.
      // Но если при этом не указано наименование участка для поиска циркуляров, то искать нечего: выходим.
      if (!stationsData?.length && !workPoligon)
        return res.status(OK).json([]);

      const stationIds = !stationsData?.length ? null : stationsData.map((item) => item.St_ID);

      // Формируем список перегонов по найденным станциям
      const blocksData = !stationIds?.length ? null :
        await TBlock.findAll({
          raw: true,
          attributes: ['Bl_ID', 'Bl_StationID1', 'Bl_StationID2'],
          where: {
            [Op.and]: [{ Bl_StationID1: stationIds }, { Bl_StationID2: stationIds }],
          },
        });
      const blockIds = !blocksData?.length ? null : blocksData.map((item) => item.Bl_ID);

      // Для поиска распоряжений о закрытии/открытии, необходимо определить те места (станции, перегоны),
      // на которые распространяется действие распоряжений.
      const possibleOrdersPlaces = [];
      if (stationIds?.length) {
        possibleOrdersPlaces.push({
          $and: [
            { "place.place": "station" },
            { "place.value": stationIds },
          ],
        });
      }
      if (blockIds?.length) {
        possibleOrdersPlaces.push({
          $and: [
            { "place.place": "span" },
            { "place.value": blockIds },
          ],
        });
      }

      // Формируем критерии выборки данных из коллекции распоряжений
      const ordersMatchFilter = {};
      if (possibleOrdersPlaces.length) {
        ordersMatchFilter.$or = [
          // условия для распоряжений о закрытии-открытии перегона
          { showOnGID: true, $or: possibleOrdersPlaces },
        ];
      }

      if (workPoligon) {
        // условия для циркулярных распоряжений
        const circularOrdersConditions = {
          showOnGID: false,
          specialTrainCategories: TAKE_PASS_DUTY_ORDER_DNC_ECD_SPECIAL_SIGN,
          "workPoligon.id": workPoligon.DNCS_ID,
          "workPoligon.type": WORK_POLIGON_TYPES.DNC_SECTOR,
        };
        if (ordersMatchFilter.$or) {
          ordersMatchFilter.$or.push(circularOrdersConditions);
        } else {
          Object.assign(ordersMatchFilter, circularOrdersConditions);
        }
      }
      // Дата начала извлечения информации
      if (startDate) {
        ordersMatchFilter.createDateTime = { $gt: new Date(startDate) };
      }

      // Ищем данные, сортируя найденные распоряжения по времени их создания
      const data = await Order.find(ordersMatchFilter).sort([['createDateTime', 'ascending']]) || [];

      // Перед отправкой распоряжений ГИД форматирую их в соответствии с форматом предоставления данных ГИД
      res.status(OK).json(data.map((item) => {
        let STATION1 = null;
        let STATION2 = null;
        // если у распоряжения есть место действия, то это точно не циркуляр - это может быть только
        // распоряжение о закрытии-открытии
        if (item.place?.place === 'station') {
          STATION1 = stationsData?.find((station) => String(station.St_ID) === String(item.place.value)).St_GID_UNMC;
        } else if (item.place?.place === 'span') {
          const block = blocksData?.find((block) => String(block.Bl_ID) === String(item.place.value));
          STATION1 = stationsData?.find((station) => String(station.St_ID) === String(block.Bl_StationID1)).St_GID_UNMC;
          STATION2 = stationsData?.find((station) => String(station.St_ID) === String(block.Bl_StationID2)).St_GID_UNMC;
        }
        let ADDITIONALPLACEINFO = null;
        let TAKEDUTY = null;
        let TAKEDUTYPERSONAL = null;
        if (!item.specialTrainCategories?.includes(TAKE_PASS_DUTY_ORDER_DNC_ECD_SPECIAL_SIGN)) {
          // если не циркуляр, то ищем дополнительную информацию о месте действия
          const additionalOrderPlaceInfoElements = item.orderText.orderText.filter((el) =>
            (el.value !== null) &&
            orderParamsRefsForGID?.find((r) => (r.elementType === el.type) && r.possibleRefs.includes(el.ref))
          );
          if (additionalOrderPlaceInfoElements?.length) {
            ADDITIONALPLACEINFO = additionalOrderPlaceInfoElements.reduce((accumulator, currentValue, index) =>
              accumulator + `${currentValue.ref}: ${currentValue.value}${index === additionalOrderPlaceInfoElements.length - 1 ? '' : ', '}`, '');
          }
        } else {
          // если циркуляр, то ищем информацию о лице, принявшем дежурство
          TAKEDUTY = item.orderText.orderText.find((el) => el.ref === TAKE_DUTY_FIO_ORDER_TEXT_ELEMENT_REF)?.value;
          if (item.dspToSend?.length) {
            TAKEDUTYPERSONAL = item.dspToSend.map((el) => ({ stationId: el.id, fio: el.fio }));
          }
        }
        // 0 - циркуляр, 1 - распоряжение о закрытии (станции/перегона/пути), 2 - распоряжение об открытии (станции/перегона/пути)
        // -1 - иное распоряжение
        const getOrderType = () => {
          if (item.specialTrainCategories?.includes(TAKE_PASS_DUTY_ORDER_DNC_ECD_SPECIAL_SIGN)) return 0;
          if (item.specialTrainCategories?.includes(SPECIAL_CLOSE_BLOCK_ORDER_SIGN)) return 1;
          if (item.specialTrainCategories?.includes(SPECIAL_OPEN_BLOCK_ORDER_SIGN)) return 2;
          return -1;
        }

        return {
          ORDERID: item._id,
          ORDERTYPE: getOrderType(),
          ORDERGIVINGTIME: item.createDateTime,
          STATION1,
          STATION2,
          ADDITIONALPLACEINFO,
          TAKEDUTY,
          TAKEDUTYPERSONAL,
          ORDERSTARTTIME: item.timeSpan.start,
          ORDERENDTIME: item.timeSpan.end,
          ORDERTITLE: item.orderText.orderTitle,
          ORDERCHAINID: item.orderChain.chainId,
        };
      }));

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение информации о распоряжениях для отображения на ГИД',
        error: error.message,
        actionParams: {
          startDate, stations, dncSectorName,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на получение массива id распоряжений, изданных начиная с указанной даты
 * и адресованных заданному полигону управления (полигон управления - глобальный, т.е. не рассматриваются рабочие
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
 * datetime - дата-время начала поиска информации (обязателен),
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/ordersAddressedToGivenWorkPoligonFromGivenDate',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.GET_ORDERS_ADDRESSED_TO_GIVEN_WORK_POLIGON_FROM_GIVEN_DATE; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  // проверка параметров запроса
  getOrdersFromGivenDateRules(),
  validate,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }
    // Считываем находящиеся в пользовательском запросе данные
    const { datetime } = req.body;

    try {
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
        default:
          res.status(OK).json({ docsNumber: 0 });
          break;
      }

      const data = await Order.find(matchFilter);
      res.status(OK).json(data ? data.map((el) => el._id) : []);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение массива id распоряжений, изданных начиная с указанной даты и адресованных заданному полигону управления',
        error: error.message,
        actionParams: {
          workPoligon, datetime,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


/**
 * Обрабатывает запрос на пометку ранее изданного и находящегося в работе документа как
 * недействительного.
 *
 * Данный запрос доступен любому лицу, наделенному соответствующим полномочием.
 * Но реально пометить документ как недействительный сможет только тот пользователь, который его издал,
 * и только с того рабочего полигона, на котором документ был издан.
 *
 * Информация о пользователе, о типе и id его рабочего полигона извлекается из токена пользователя.
 *
 * Параметры тела запроса:
 * orderId - id документа, который необходимо пометить как недействительный (обязателен)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
router.post(
  '/setOrderInvalidMark',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.SET_ORDER_INVALID_MARK; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }
    // Считываем находящиеся в пользовательском запросе данные
    const { orderId } = req.body;

    // Действия выполняем в транзакции
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Ищем документ по id
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Документ не найден' });
      }
      // Смотрим, был ли издан найденный документ на полигоне workPoligon пользователем с id = req.user.userId
      if (String(order.creator?.id) !== String(req.user?.userId)) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Документ издан не Вами' });
      }
      if (order.workPoligon?.type !== workPoligon.type || order.workPoligon?.id !== workPoligon.id ||
         (order.workPoligon.workPlaceId && order.workPoligon.workPlaceId !== workPoligon.workPlaceId) ||
         (!order.workPoligon.workPlaceId && workPoligon.workPlaceId)) {
        await session.abortTransaction();
        return res.status(ERR).json({ message: 'Документ издан не на этом рабочем полигоне' });
      }

      // Ниже выделим найденный документ в новую (отдельную) цепочку.
      // Для этого генерируем id этой цепочки
      const newOrderChainId = new mongoose.Types.ObjectId();

      // Для документов, которые принадлежат цепочке найденного документа, кроме него самого, делаем следующее:
      // устанавливаем дату и время окончания действия цепочки равной дате и времени окончания действия последнего
      // документа этой цепочки (не учитываем документ, который нужно отметить как недействительный)

      // Ищем последний документ цепочки, отличный от документа order, найденного выше
      const lastOrderInChain = await Order.findOne({ _id: { $ne: orderId }, "orderChain.chainId": order.orderChain.chainId })
        .sort({ createDateTime: -1 }).limit(1).session(session);

      // Если такой документ есть, то для него и всех иных документов его цепочки обновляем дату окончания действия цепочки
      // (если она могла измениться при удалении документа из цепочки)

      // Документ, который будет помечен как недействительный, - единственный документ в цепочке?
      const theOnlyDocInChain = !lastOrderInChain ? true : false;

      // Новая дата окончания действия той цепочки документов, которой недействительный документ принадлежал вначале
      let prevOrderChainNewEndDateTime = !lastOrderInChain ? null : lastOrderInChain.timeSpan.end;

      if (lastOrderInChain && lastOrderInChain.orderChain.chainEndDateTime !== lastOrderInChain.timeSpan.end) {
        await Order.updateMany(
          // filter
          { _id: { $ne: orderId }, "orderChain.chainId": lastOrderInChain.orderChain.chainId },
          // update
          { "orderChain.chainEndDateTime": lastOrderInChain.timeSpan.end },
          { session }
        );
        await WorkOrder.updateMany(
          // filter
          { orderId: { $ne: orderId }, "orderChain.chainId": lastOrderInChain.orderChain.chainId },
          // update
          { "orderChain.chainEndDateTime": lastOrderInChain.timeSpan.end },
          { session }
        );
      }

      // Делаем отметку о недействительности документа в основной коллекции распоряжений
      order.invalid = true;
      // Обновляем id цепочки у документа
      order.orderChain.chainId = newOrderChainId;
      // Принудительно завершаем цепочку
      order.orderChain.chainEndDateTime = order.createDateTime;

      await order.save({ session });

      // Осталось только обновить информацию по цепочке недействительного документа в коллекции рабочих распоряжений
      await WorkOrder.updateMany(
        { orderId },
        { "orderChain.chainId": newOrderChainId, "orderChain.chainEndDateTime": order.orderChain.chainEndDateTime },
        { session }
      );

      await session.commitTransaction();

      res.status(OK).json({
        message: `Распоряжение помечено как недействительное`,
        orderId,
        orderChainId: order.orderChain.chainId,
        orderChainEndDateTime: order.orderChain.chainEndDateTime,
        theOnlyDocInChain,
        prevOrderChainNewEndDateTime,
      });

      // Логируем действие пользователя
      const logObject = {
        user: userPostFIOString(req.user),
        workPoligon: await getUserWorkPoligonString({
          workPoligonType: workPoligon.type,
          workPoligonId: workPoligon.id,
          workSubPoligonId: workPoligon.workPlaceId,
        }),
        actionTime: new Date(),
        action: 'Проставление отметки о действительности документа',
        actionParams: { userId: req.user.userId, user: userPostFIOString(req.user), workPoligon, orderId },
      };
      addDY58UserActionInfo(logObject);

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Проставление отметки о действительности документа',
        error: error.message,
        actionParams: { workPoligon, orderId },
      });
      await session.abortTransaction();
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });

    } finally {
      session.endSession();
    }
  }
);


/**
 * Обрабатывает запрос на получение списка распоряжений для журнала ЭЦД либо для журнала ДНЦ/ДСП.
 *
 * Данный запрос доступен любому лицу, наделенному полномочием ЭЦД, ДНЦ, ДСП, Оператора при ДСП либо Ревизора.
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
 *                       интервал от datetimeStart до datetimeEnd, то такой документ включается в выборку);
 *                       3) включать ошибочно изданные документы;
 *                       4) включать текст уведомлений - для ЭЦД
 * sortFields - объект полей, по которым производится сортировка данных (если нет, то данные сортируются по
 *              дате-времени издания соответствующих документов; если есть, то к условиям в sortFields
 *              добавляется условие сортировки по id соответствующих документов (сортировка по возрастанию),
 *              все это необходимо для поддерки пагинации)
 * filterFields - массив объектов (field, value) с условиями поиска по массиву данных
 *                (если поиск запрашивается по номеру уведомления, то остальные критерии поиска и сортировка
 *                автоматически не принимаются во внимание)
 * page - номер страницы, данные по которой необходимо получить (поддерживается пагинация; если не указан,
 *        то запрос возвращает все найденные документы)
 * docsCount - количество документов, которое запрос должен вернуть (поддерживается пагинация; если не указан,
 *             то запрос возвращает все найденные документы)
 * Обязательный параметр запроса - applicationAbbreviation!
 */
 router.post(
  '/journalData',
  // определяем действие, которое необходимо выполнить
  (req, _res, next) => { req.requestedAction = DY58_ACTIONS.GET_ORDERS_JOURNAL_DATA; next(); },
  // проверяем полномочия пользователя на выполнение запрошенного действия
  hasUserRightToPerformAction,
  async (req, res) => {
    const workPoligon = req.user.workPoligon;
    if (!workPoligon || !workPoligon.type || !workPoligon.id) {
      return res.status(ERR).json({ message: 'Не указан рабочий полигон' });
    }
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
    try {
      const matchFilter = { $and: [] };

      // Только для журнала ЭЦД: изначально в выборку не включаем документы типа "уведомление/отмена запрещения".
      // Потому что данные документы не фигурируют в журнале как отдельные строки - только как дополнение строк
      // с информацией о приказе / запрещении. Если их включить в выборку, то будут проблемы с пагинацией.
      // Потому находим сначала все остальные документы, а потом - для тех, у которых есть связь с документом
      // типа "уведомление/отмена запрещения", найдем дополнительную информацию.
      if (workPoligon.type === WORK_POLIGON_TYPES.ECD_SECTOR) {
        matchFilter.$and.push({ type: { $ne: ORDER_PATTERN_TYPES.ECD_NOTIFICATION } });
      }

      const startDate = new Date(datetimeStart);
      const endDate = new Date(datetimeEnd);

      if (!includeDocsCriteria || !includeDocsCriteria.includes(INCLUDE_DOCUMENTS_CRITERIA.INCLUDE_INVALID)) {
        // По умолчанию (в случае, если явно не указано) и в случае, если это явно указано,
        // в выборку не включаем ошибочно изданные документы
        matchFilter.$and.push({ invalid: false });
      }

      if (!includeDocsCriteria || !includeDocsCriteria.includes(INCLUDE_DOCUMENTS_CRITERIA.INCLUDE_ACTIVE)) {
        // Поиск по дате-времени издания
        if (!datetimeEnd) {
          matchFilter.$and.push({ createDateTime: { $gte: startDate } });
        } else {
          matchFilter.$and.push({ createDateTime: { $gte: startDate, $lte: endDate } });
        }
      } else {
        // Поиск по времени действия соответствующих цепочек распоряжений
        const chainEndDateTimeFilter = {
          $or: [
            // The { item : null } query matches documents that either contain the item field
            // whose value is null or that do not contain the item field
            { "orderChain.chainEndDateTime": null },
            { "orderChain.chainEndDateTime": { $gte: startDate } },
          ],
        };
        if (!datetimeEnd) {
          matchFilter.$and.push(chainEndDateTimeFilter);
        } else {
          matchFilter.$and.push(
            {
              "orderChain.chainStartDateTime": { $lte: endDate },
              ...chainEndDateTimeFilter,
            },
          );
        }
      }

      // Фильтрация по издателю (в выборку всегда включаются документы, изданные на том рабочем полигоне,
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
        // Функция, позволяющая осуществить поиск среди адресатов (поиск только по
        // подтвержденным записям, т.к. именно такие записи возвращает в итоге запрос клиенту)
        const orderAcceptorFilter = (value, placeId) => {
          const resFilter = {
            $elemMatch: {
              // $ne selects the documents where the value of the field is not equal to the specified value.
              // This includes documents that do not contain the field.
              confirmDateTime: { $exists: true },
              confirmDateTime: { $ne: null },
              $or: [
                { placeTitle: new RegExp(escapeSpecialCharactersInRegexString(value), 'i') },
                { post: new RegExp(escapeSpecialCharactersInRegexString(value), 'i') },
                { fio: new RegExp(escapeSpecialCharactersInRegexString(value), 'i') },
              ],
            },
          };
          if (placeId) {
            resFilter.$elemMatch.id = placeId;
          }
          return resFilter;
        };
        // Фильтрация (поиск) по остальным полям
        filterFields.forEach((filter) => {
          switch (filter.field) {
            case 'toWhom':
              if (workPoligon.type === WORK_POLIGON_TYPES.ECD_SECTOR) {
                // Поиск по иным адресатам производится только в том случае, если распоряжение издано ЭЦД
                matchFilter.$and.push({
                  "workPoligon.type": WORK_POLIGON_TYPES.ECD_SECTOR,
                  otherToSend: { $elemMatch: {
                    $or: [
                      { placeTitle: new RegExp(escapeSpecialCharactersInRegexString(filter.value), 'i') },
                      { post: new RegExp(escapeSpecialCharactersInRegexString(filter.value), 'i') },
                      { fio: new RegExp(escapeSpecialCharactersInRegexString(filter.value), 'i') },
                    ]
                  } },
                });
              }
              break;
            // Поиск подчисла в числе (для номера распоряжения)
            case 'number':
              matchFilter.$and.push({
                $expr: {
                  $regexMatch: {
                    input: { $toString: `$${filter.field}` },
                    regex: new RegExp(escapeSpecialCharactersInRegexString(filter.value)),
                  },
                },
              });
              break;
            // Поиск по значениям полей объектов массива (для текста распоряжения)
            case 'orderContent':
              matchFilter.$and.push({
                'orderText.orderText': { $elemMatch: { value: new RegExp(escapeSpecialCharactersInRegexString(filter.value), 'i') } },
              });
              break;
            case 'orderAcceptor':
              // Если запрос поступает со станции, то поиск - только среди адресатов этой станции,
              // в противном случае поиск по всем адресатам, включая адресатов на станциях
              if (workPoligon.type === WORK_POLIGON_TYPES.STATION) {
                matchFilter.$and.push({
                  stationWorkPlacesToSend: orderAcceptorFilter(filter.value, workPoligon.id)
                });
              } else {
                matchFilter.$and.push({
                  $or: [
                    { dspToSend: orderAcceptorFilter(filter.value) },
                    { dncToSend: orderAcceptorFilter(filter.value) },
                    { ecdToSend: orderAcceptorFilter(filter.value) },
                    { otherToSend: orderAcceptorFilter(filter.value) },
                    { stationWorkPlacesToSend: orderAcceptorFilter(filter.value) },
                  ],
                });
              }
              break;
            /*case 'orderSender':*/
            // этот случай здесь не рассматриваем, т.к. в случае журнала ЭЦД в поле издателя распоряжения
            // включается информация также и со связанного распоряжения (уведомления), поэтому поиск
            // по издателю осуществляется ниже, когда будет известна информация о связанных уведомлениях
          }
        });
      }

      // Поиск связанных документов типа 'Уведомление ЭЦД' (только для журнала ЭЦД!).
      // Уведомление по id в БД всегда связано с приказом / запрещением.
      let lookupConditions = null;
      if (workPoligon.type === WORK_POLIGON_TYPES.ECD_SECTOR) {
        const projectConditions = {
          _id: 0,
          number: 1,
          startDate: '$timeSpan.start',
          creator: 1,
        };
        if (includeDocsCriteria && includeDocsCriteria.includes(INCLUDE_DOCUMENTS_CRITERIA.INCLUDE_ORDER_NOTIFICATION_TEXT)) {
          projectConditions.orderText = '$orderText.orderText';
        }
        lookupConditions = {
          from: 'orders',
          let: { the_id: '$_id', the_chainId: '$orderChain.chainId', the_orderType: '$type'},
          pipeline: [
            { $match:
              { $expr:
                { $and:
                  [
                    { $in: ['$$the_orderType', [ORDER_PATTERN_TYPES.ECD_ORDER, ORDER_PATTERN_TYPES.ECD_PROHIBITION]] },
                    { $eq: ['$type', ORDER_PATTERN_TYPES.ECD_NOTIFICATION] },
                    { $eq: ['$$the_chainId', '$orderChain.chainId'] },
                    { $eq: ['$$the_id', '$dispatchedOnOrder'] },
                  ],
                },
              },
            },
            {
              $project: projectConditions,
            },
          ],
          as: 'connectedOrder',
        };
      }

      // Фильтрация по номеру уведомления ЭЦД (если необходима)
      let connectedDataFilterExists = false;
      if (workPoligon.type === WORK_POLIGON_TYPES.ECD_SECTOR && filterFields) {
        const notificationNumberFilter = filterFields.find((el) => el.field === 'notificationNumber');
        if (notificationNumberFilter) {
          connectedDataFilterExists = true;
          lookupConditions.pipeline[0].$match.$expr.$and.push({
            $regexMatch: { input: { $toString: '$number'}, regex: new RegExp((notificationNumberFilter.value)) },
          });
        }
      }

      // Применяем сортировку
      let sortConditions = {};
      if (sortFields) {
        for (let sortCond in sortFields) {
          if (sortCond !== 'orderNotificationDateTime') {
            sortConditions[sortCond] = sortFields[sortCond];
          } else {
            sortConditions['connectedOrder.startDate'] = sortFields[sortCond];
          }
        }
      } else {
        sortConditions.createDateTime = -1;
      }
      // Именно здесь, а не в начале, т.к. другие условия сортировки важнее, чем сортировка по id
      sortConditions._id = 1;

      const aggregation = [
        { $match: matchFilter },
      ];
      if (workPoligon.type === WORK_POLIGON_TYPES.ECD_SECTOR) {
        aggregation.push(
          { $lookup: lookupConditions },
          { $unwind: {
            path: '$connectedOrder',
            // если нет фильтрации по связанному документу, то делаем LEFT JOIN, в противном случае
            // делаем FULL JOIN
            preserveNullAndEmptyArrays: !connectedDataFilterExists,
          } }
        );
      }
      // Именно здесь производим фильтрацию по издателю распоряжения!
      // (т.к. в случае журнала ЭЦД нужно знать издателя как приказа/запрещения, так и уведомления)
      if (filterFields) {
        const orderSenderFilter = filterFields.find((el) => el.field === 'orderSender');
        if (orderSenderFilter) {
          const orderSenderFilterValue = new RegExp((orderSenderFilter.value), 'i');
          aggregation.push(
            {
              $match: {
                $or: [
                  { 'creator.post': orderSenderFilterValue },
                  { 'creator.fio': orderSenderFilterValue },
                  { 'connectedOrder.creator.post': orderSenderFilterValue },
                  { 'connectedOrder.creator.fio': orderSenderFilterValue },
                ],
              },
            }
          );
        }
      }
      aggregation.push(
        { $sort: sortConditions },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          data: { $push: '$$ROOT' },
        } },
        { $project: {
          total: 1,
          // skip = page > 0 ? (page - 1) * docsCount : 0
          // limit = docsCount || 1000000
          data: { $slice: ['$data', page > 0 ? (page - 1) * docsCount : 0, docsCount || 1000000] },
        } }
      );

      // Ищем данные
      const data = await Order.aggregate(aggregation);

      res.status(OK).json({
        data: data && data[0] ? data[0].data : [],
        totalRecords: data && data[0] ? data[0].total : 0,
      });

    } catch (error) {
      addError({
        errorTime: new Date(),
        action: 'Получение списка распоряжений для журнала',
        error: error.message,
        actionParams: {
          workPoligon, datetimeStart, datetimeEnd, includeDocsCriteria,
          sortFields, filterFields, page, docsCount,
        },
      });
      res.status(UNKNOWN_ERR).json({ message: `${UNKNOWN_ERR_MESS}. ${error.message}` });
    }
  }
);


module.exports = router;
