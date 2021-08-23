const WebSocket = require('ws');
const { ping, setClientsOnlineStatus } = require('./pipeline');
const {
  CONNECTION_OK_MESSAGE,
  UPGRADE_ERROR_MESSAGE,
} = require('../constants');


// accepts an http server instance
function setupWebSocket(server) {
  // websocket server instance
  const wss = new WebSocket.Server({ noServer: true, clientTracking: true });

  setClientsOnlineStatus(wss.clients);

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
      const messageString = JSON.parse(message);
      if (messageString.match(/^pong /)) {
        ctx.isAlive = true;
        const clientID = messageString.slice(5);
        if (ctx.clientID !== clientID) {
          ctx.clientID = (clientID === 'null') ? null : clientID;
        }
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
