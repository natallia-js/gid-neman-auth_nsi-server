const WebSocket = require('ws');
const { ping, /*setClientsOnlineStatus*/ } = require('./pipeline');
const {
  CONNECTION_OK_MESSAGE,
  UPGRADE_ERROR_MESSAGE,
  PONG_MESSAGE_PATTERN,
  GET_ONLINE_USERS_MESSAGE_PATTERN,
  ONLINE_USERS,
} = require('../constants');


// accepts an http server instance
function setupWebSocket(server) {
  // websocket server instance
  const wss = new WebSocket.Server({ noServer: true, clientTracking: true });

  // setClientsOnlineStatus(wss.clients);

  // hookup broadcast pipeline
  // broadcastPipeline(wss.clients);

  // handle upgrade of the request
  // (the WebSocket clients send the HTTP request asking for a WebSocket connection,
  // then the server responds with an HTTP 101 Switching protocols, meaning that it accepts the connection,
  // and then the client can start to send and receive data in binary format)
  server.on('upgrade', function upgrade(request, socket, head) {
    try {
      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.log('ws upgrade exception', err);
      socket.write(UPGRADE_ERROR_MESSAGE);
      socket.destroy();
      return;
    }
  });

  // what to do after a connection is established
  wss.on('connection', (ctx, req) => {
    // print number of active connections
    let clientIP;
    try {
      clientIP = req.headers['x-forwarded-for'].split(',')[0].trim();
    } catch {
      clientIP = req.socket.remoteAddress;
    }
    console.log(`connected ip=${clientIP}, connected clients number=${wss.clients.size}`);

    ctx.isAlive = true;
    const timerId = ping(ctx);

    // handle message events
    ctx.on('message', function incomingMessage(message) {
      console.log(`Received message => ${message}`);
      if (!message) {
        return;
      }
      ctx.isAlive = true;
      const messageString = JSON.parse(message);

      // PONG-ответ клиента
      if (messageString.match(PONG_MESSAGE_PATTERN)) {
        const clientData = messageString.slice(5).split(',');
        const clientID = clientData.length >= 1 ? clientData[0] : null;
        const clientWorkPoligonType = clientData.length >= 2 ? clientData[1] : null;
        const clientWorkPoligonId = clientData.length >= 3 ? clientData[2] : null;
        const clientWorkSubPoligonId = clientData.length >= 4 ? clientData[3] : null;
        if (ctx.clientID !== clientID) {
          ctx.clientID = (clientID === 'null') ? null : clientID;
        }
        if (ctx.clientWorkPoligonType !== clientWorkPoligonType) {
          ctx.clientWorkPoligonType = (clientWorkPoligonType === 'null') ? null : clientWorkPoligonType;
        }
        if (ctx.clientWorkPoligonId !== clientWorkPoligonId) {
          ctx.clientWorkPoligonId = (clientWorkPoligonId === 'null') ? null : clientWorkPoligonId;
        }
        if (ctx.clientWorkSubPoligonId !== clientWorkSubPoligonId) {
          ctx.clientWorkSubPoligonId = (clientWorkSubPoligonId === 'null') ? null : clientWorkSubPoligonId;
        }
        return;
      }
      // Запрос клиента на получение списка online-пользователей на указанных рабочих полигонах
      if (messageString.match(GET_ONLINE_USERS_MESSAGE_PATTERN)) {
        const workPoligonsObjects = JSON.parse(messageString.slice(7));
        // workPoligonsObjects - массив объектов, каждый из которых состоит из полей type, id, workPlaceId
        if (Array.isArray(workPoligonsObjects)) {
          let onlineUsers = [];
          for (let client of wss.clients.values()) {
            const wp = workPoligonsObjects.find((wp) =>
              wp.type === client.clientWorkPoligonType &&
              String(wp.id) === String(client.clientWorkPoligonId)
            );
            if (wp) {
              const existingItem = onlineUsers.find((el) =>
                el.type === wp.type &&
                String(el.id) === String(wp.id) &&
                (
                  (!el.workPlaceId && !client.clientWorkSubPoligonId) ||
                  (el.workPlaceId && client.clientWorkSubPoligonId && String(el.workPlaceId) === String(client.clientWorkSubPoligonId))
                ));
              if (existingItem) {
                if (!existingItem.people.includes(client.clientID)) {
                  existingItem.people.push(client.clientID);
                }
              } else {
                onlineUsers.push({
                  type: wp.type,
                  id: String(wp.id),
                  workPlaceId: client.clientWorkSubPoligonId ? String(client.clientWorkSubPoligonId): null,
                  people: [client.clientID],
                });
              }
            }
          }
          ctx.send(ONLINE_USERS(onlineUsers));
          console.log('onlineUsers',onlineUsers)
        }
        return;
      }
    });

    // handle close event
    ctx.on('close', function closeClientConnection() {
      console.log('closed', wss.clients.size);
      clearInterval(timerId);
    });

    // sent a message that we're good to proceed
    ctx.send(CONNECTION_OK_MESSAGE);
  });
}


module.exports = setupWebSocket;
