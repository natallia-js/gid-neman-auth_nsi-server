const {
  PING_PONG_INTERVAL,
  CHECK_CLIENTS_ONLINE_STATE_INTERVAL,
} = require('../constants');
const { markOnlineUsers } = require('./dbActions');


// Each websocket client gets an individual instance of this function
function ping(ctx) {
  const timerId = setInterval(() => {
    if (ctx.isAlive === false) {
      return ctx.terminate();
    }
    ctx.isAlive = false;
    ctx.send('ping');
  }, PING_PONG_INTERVAL);
  return timerId;
}


// Set online status for all existing clients in database
function setClientsOnlineStatus(clients) {
  const timerId = setInterval(() => {
    clientsIds = [];
    if (clients && clients.size) {
      for (let client of clients.values()) {
        if (client.clientID) {
          clientsIds.push(client.clientID);
        }
      }
    }
    try {
      console.log('clientsIds',clientsIds)
      markOnlineUsers(clientsIds);
    } catch(err) {
      console.log(err);
    }
  }, CHECK_CLIENTS_ONLINE_STATE_INTERVAL);
  return timerId;
}


// broadcast messages
// one instance for all clients
/*
function broadcastPipeline(clients) {
  let idx = 0;
  const interval = setInterval(() => {
    for (let c of clients.values()) {
      c.send(`broadcast message ${idx}`);
    }
    idx++;
  }, 3000);
  return interval;
}
*/


module.exports = {
  ping,
  setClientsOnlineStatus,
  //broadcastPipeline,
};
