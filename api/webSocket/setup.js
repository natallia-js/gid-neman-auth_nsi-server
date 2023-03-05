const WebSocket = require('ws');
const { ping, /*setClientsOnlineStatus*/ } = require('./pipeline');
const {
  CONNECTION_OK_MESSAGE,
  UPGRADE_ERROR_MESSAGE,
  PONG_MESSAGE_PATTERN,
  GET_ONLINE_USERS_MESSAGE_PATTERN,
  ONLINE_USERS,
  UPGRADE_EVENT,
  CONNECTION_EVENT,
  MESSAGE_EVENT,
  CLOSE_EVENT,
} = require('../constants');
const { addServerActionInfo, addError } = require('../serverSideProcessing/processLogsActions');


// accepts an http/https server instance
function setupWebSocket(server) {
  // creating a websocket server instance;
  // 'noServer = true' option says "do not set up an HTTP server alongside this websocket server";
  // the advantage to doing this is that we can share a single HTTP server (our Express server)
  // across multiple websocket connections
  const wss = new WebSocket.Server({ noServer: true, clientTracking: true });

  // setClientsOnlineStatus(wss.clients);

  // hookup broadcast pipeline
  // broadcastPipeline(wss.clients);

  // We need to handle the attachment of the websocket server to the existing Express Server.
  // To do it, on the Express Server we listen for an upgrade event.
  // This event is fired whenever our Express server — a plain HTTP(S) server — receives a request
  // for an endpoint using the websockets protocol. "Upgrade" here is saying, "we need to upgrade this
  // request to handle websockets".
  // Below, we handle upgrade of the request
  // (the WebSocket clients send the HTTP request asking for a WebSocket connection,
  // then the server responds with an HTTP 101 Switching protocols, meaning that it accepts the connection,
  // and then the client can start to send and receive data in binary format)
  server.on(UPGRADE_EVENT, function upgrade(request, socket, head) {
    try {
      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit(CONNECTION_EVENT, ws, request);
      });
    } catch (err) {
      addError({
        errorTime: new Date(),
        action: `webSocket событие ${UPGRADE_EVENT}`,
        error: err.message,
        actionParams: null,
      });
      socket.write(UPGRADE_ERROR_MESSAGE);
      socket.destroy();
      return;
    }
  });

  // what to do after a connection is established
  wss.on(CONNECTION_EVENT, (ctx, req) => {
    // print number of active connections
    let clientIP;
    try {
      clientIP = req.headers['x-forwarded-for'].split(',')[0].trim();
    } catch {
      clientIP = req.socket.remoteAddress;
    }
    addServerActionInfo({
      actionTime: new Date(),
      action: 'Новое подключение',
      description: `Подключение с ip=${clientIP}, общее количество подключенных клиентов=${wss.clients.size}`,
    });

    ctx.isAlive = true;
    const timerId = ping(ctx);

    // handle message events
    ctx.on(MESSAGE_EVENT, function incomingMessage(message) {
      if (!message) {
        return;
      }
      ctx.isAlive = true;
      const messageString = JSON.parse(message);

      // PONG-ответ клиента
      if (messageString.match(PONG_MESSAGE_PATTERN)) {
        const clientData = messageString.slice(5).split(',');
        const clientID = clientData.length < 1 ? null :
          (clientData[0] === 'null' || clientData[0] === 'undefined') ? null : clientData[0]; // string | null
        const clientWorkPoligonType = clientData.length < 2 ? null :
          (clientData[1] === 'null' || clientData[1] === 'undefined') ? null : clientData[1]; // string | null
        const clientWorkPoligonId = clientData.length < 3 ? null :
          (clientData[2] === 'null' || clientData[2] === 'undefined') ? null : clientData[2]; // string | null
        const clientWorkSubPoligonId = clientData.length < 4 ? null :
          (clientData[3] === 'null' || clientData[3] === 'undefined') ? null : clientData[3]; // string | null
        const isClientOnDuty = clientData.length < 5 ? null :
          (clientData[4] === 'null' || clientData[4] === 'undefined') ? null : clientData[4]; // string | null
        if (ctx.clientID !== clientID) {
          ctx.clientID = clientID;
        }
        if (ctx.clientWorkPoligonType !== clientWorkPoligonType) {
          ctx.clientWorkPoligonType = clientWorkPoligonType;
        }
        if (ctx.clientWorkPoligonId !== clientWorkPoligonId) {
          ctx.clientWorkPoligonId = clientWorkPoligonId;
        }
        if (ctx.clientWorkSubPoligonId !== clientWorkSubPoligonId) {
          ctx.clientWorkSubPoligonId = clientWorkSubPoligonId;
        }
        if (ctx.isClientOnDuty !== isClientOnDuty) {
          ctx.isClientOnDuty = isClientOnDuty;
        }
        return;
      }
      // Запрос клиента на получение списка online-пользователей на указанных рабочих полигонах
      if (messageString.match(GET_ONLINE_USERS_MESSAGE_PATTERN)) {
        const workPoligonsObjects = JSON.parse(messageString.slice(7));
        // workPoligonsObjects - массив объектов, каждый из которых состоит из полей type, id, workPlaceId
        if (!Array.isArray(workPoligonsObjects)) {
          // если workPoligonsObjects - не массив, то нечего обрабатывать
          return;
        }
        // сюда поместим информацию, которую отошлем клиенту по его текущему запросу
        let onlineUsers = [];
        // цикл по всем подключившимся к системе пользователям
        for (let client of wss.clients.values()) {
          // смотрим, есть ли для очередного пользователя рабочий полигон в списке workPoligonsObjects
          const wp = workPoligonsObjects.find((wp) =>
            wp.type === client.clientWorkPoligonType &&
            String(wp.id) === String(client.clientWorkPoligonId)
          );
          // если нет - переходим к следующему пользователю
          if (!wp) {
            continue;
          }
          // смотрим, помещали ли мы ранее информацию по рабочему полигону wp в массив onlineUsers
          const existingItem = onlineUsers.find((el) =>
            el.type === wp.type &&
            String(el.id) === String(wp.id) &&
            (
              (!el.workPlaceId && !client.clientWorkSubPoligonId) ||
              (el.workPlaceId && client.clientWorkSubPoligonId && String(el.workPlaceId) === String(client.clientWorkSubPoligonId))
            ));
          // если информация по рабочему полигону wp есть в onlineUsers и при этом там нет текущего
          // пользователя, то включаем информацию о нем
          if (existingItem) {
            if (!existingItem.people.includes(client.clientID)) {
              existingItem.people.push({ clientId: client.clientID, isClientOnDuty: client.isClientOnDuty });
            }
          }
          // если информации по рабочему полигону wp нет в onlineUsers, то создаем в onlineUsers
          // одну запись, относящуюся к wp, с привязкой к ней текущего пользователя
          else {
            onlineUsers.push({
              type: wp.type,
              id: String(wp.id),
              workPlaceId: client.clientWorkSubPoligonId ? String(client.clientWorkSubPoligonId): null,
              people: [{ clientId: client.clientID, isClientOnDuty: client.isClientOnDuty }],
            });
          }
        }
        ctx.send(ONLINE_USERS(onlineUsers));
        return;
      }
    });

    // handle close event
    ctx.on(CLOSE_EVENT, function closeClientConnection() {
      addServerActionInfo({
        actionTime: new Date(),
        action: 'закрытие соединения',
        description: `клиент на ip=${clientIP} закрыл соединение, общее количество подключенных клиентов=${wss.clients.size}`,
      });
      clearInterval(timerId);
    });

    // sent a message that we're good to proceed
    ctx.send(CONNECTION_OK_MESSAGE);
  });
}


module.exports = setupWebSocket;
