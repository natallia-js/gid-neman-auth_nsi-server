const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const compression = require('compression');
const https = require('https');
const cors = require('cors');
const config = require('config');
const connectToMongoDB = require('./databaseConnections/mongodb');
const connectToMSSQL = require('./databaseConnections/mssql');
const setupWebSocket = require('./webSocket/setup');
const requestMethod = require('./middleware/requestMethod.middleware');
const processDelDBData = require('./serverSideProcessing/processDelDBData');
const fs = require('fs');
const path = require('path');
const privateKey = fs.readFileSync(path.resolve(__dirname, 'sslcert', 'key.pem'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, 'sslcert', 'cert.pem'), 'utf8');
const rootCertificate = fs.readFileSync(path.resolve(__dirname, 'sslcert', 'rootCA.pem'), 'utf8');
const { addError } = require('./serverSideProcessing/processLogsActions');

// --------------------------------------------------------------------------

// Порт сервера
const PORT = config.get('port') || 4000;
// Валидные источники CORS
const allowedCORSOrigins = config.get('allowedCORSOrigins');
if (!allowedCORSOrigins || !allowedCORSOrigins.length) {
  console.log('Warning: An array of valid CORS origins is not set!');
} else {
  console.log(`Valid CORS origins: ${allowedCORSOrigins}`);
}
// Строка подключения к MongoDB
const mongoURI = config.get('mongoURI');
if (!mongoURI || !mongoURI.length) {
  console.log('Error: No mongoURI param was found in configuration!');
  process.exit(1);
}
// Параметры соединения с БД MS SQL
const CentralConfigDBParams = config.get('CentralConfigDB');
if (!CentralConfigDBParams) {
  console.log('Error: No CentralConfigDB param was found in configuration!');
  process.exit(1);
}
// Частота "чистки" баз
const delDataFrequency = config.get('delDBDataIntervalInMs') || 3600000;
console.log(`Database cleaning interval: ${delDataFrequency} ms`);
// Максимальное время жизни куки пользовательской сессии (по умолчанию 13 часов)
const cookieMaxAgeInMs = config.get('cookieMaxAgeInMs') || 13*60*60*1000;
console.log(`Max cookie age: ${cookieMaxAgeInMs} ms`);
// Период времени обновления пользовательской сессии в БД при неизменности данных сессии
const touchUserSessionAfterSec = config.get('touchUserSessionAfterSec') || 13*60*60;
console.log(`Touch user session period: ${touchUserSessionAfterSec} sec`);

// --------------------------------------------------------------------------

// Создаем объект приложения express
const app = express();

// compress all responses
app.use(compression());

// express.json() is a method inbuilt in express to recognize the incoming Request Object
// as a JSON Object. This method is called as a middleware.
app.use(express.json({ extended: true }));

// исключаем определенные методы запросов
app.use(requestMethod);

// CORS middleware
app.use(cors({
  credentials: true, // to enable HTTP cookies over CORS
  origin: allowedCORSOrigins || false, // 'false' means 'disable CORS for this request'
}));

// --------------------------------------------------------------------------

// initialize an https-server
const credentials = {
  key: privateKey,
  cert: certificate,
  rejectUnauthorized: false,
  ca: rootCertificate,
};
const httpsServer = https.createServer(credentials, app);
// pass the same server to our websocket setup function;
// the websocket server will run on the same port accepting wss:// connections
setupWebSocket(httpsServer);

// --------------------------------------------------------------------------

// mongodb://localhost:27017/test?connectTimeoutMS=1000&bufferCommands=false&authSource=otherdb

// Подключаемся к серверу MongoDB (для работы с аутентификацией: данные приложений, ролей, пользователей)
connectToMongoDB(mongoURI)
.then(() => {
  console.log('MongoDB connection established');

  // Для каждого подключаемого пользователя будет создаваться своя сессия, хранимая в MongoDB
  app.use(
    session({
      // this is the secret used to sign the session ID stored in cookie
      secret: 'NEMAN server secret',
      // create new MongoDB store (session store instance)
      store: MongoStore.create({ mongoUrl: mongoURI }),
      // TRUE forces a session that is “uninitialized” to be saved to the store; a session is uninitialized when it is new but not modified
      saveUninitialized: false,
      // TRUE forces the session to be saved back to the session store, even if the session was never modified during the request
      // (т.е. если явно в req.session ничего не записать, то при resave = true будет создана запись в БД;
      // нам такое поведение не нужно, в БД будем писать только успешно вошедшего в систему пользователя)
      resave: false,
      cookie: {
        // user session expiration date; each time a user interacts with the server, its session expiration date in refreshed
        maxAge: cookieMaxAgeInMs,
        // no XSS attacks
        httpOnly: true,
        // only via https
        secure: true,
        // connect-mongo uses MongoDB's TTL connection feature to have mongod automatically remove expired sessions
        autoRemove: 'native',
        // we do not want to resave all the session on database every single time that the user refreshes the page, so we
        // lazy update the session, by limiting a period of time; so, the session will be updated only one time in a given
        // period, does not matter how many requests are made (with the exception of those that change smth on the session data)
        touchAfter: touchUserSessionAfterSec,
      },
    })
  );
})
.then(() =>
  // Подключаемся к серверу MS SQL (для работы с данными участков: станции, перегоны, участки ДНЦ...)
  connectToMSSQL(CentralConfigDBParams)
)
.then((sequelize) => {
  console.log('MS SQL connection established');

  // Маршрутизация
  app.use('/api/auth', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/auth.routes'));
  app.use('/api/appCreds', require('./routes/appCreds.routes'));
  app.use('/api/roles', require('./routes/roles.routes'));
  app.use('/api/workPoligons/stations', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/stationWorkPoligons.routes'));
  app.use('/api/workPoligons/dncSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/dncSectorWorkPoligons.routes'));
  app.use('/api/workPoligons/ecdSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/ecdSectorWorkPoligons.routes'));
  app.use('/api/nsi/stations', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/stations.routes'));
  app.use('/api/nsi/stationTracks', require('./routes/stationTracks.routes'));
  app.use('/api/nsi/stationWorkPlaces', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/stationWorkPlaces.routes'));
  app.use('/api/nsi/blocks', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/blocks.routes'));
  app.use('/api/nsi/blockTracks', require('./routes/blockTracks.routes'));
  app.use('/api/nsi/dncSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/dncSectors.routes'));
  app.use('/api/nsi/ecdSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/ecdSectors.routes'));
  app.use('/api/nsi/adjacentDNCSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/adjacentDNCSectors.routes'));
  app.use('/api/nsi/adjacentECDSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/adjacentECDSectors.routes'));
  app.use('/api/nsi/nearestDNCandECDSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/nearestDNCandECDSectots.routes'));
  app.use('/api/nsi/dncTrainSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/dncTrainSectors.routes'));
  app.use('/api/nsi/ecdTrainSectors', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/ecdTrainSectors.routes'));
  app.use('/api/nsi/dncTrainSectorStations', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/dncTrainSectorStations.routes'));
  app.use('/api/nsi/ecdTrainSectorStations', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/ecdTrainSectorStations.routes'));
  app.use('/api/nsi/dncTrainSectorBlocks', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/dncTrainSectorBlocks.routes'));
  app.use('/api/nsi/ecdTrainSectorBlocks', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/ecdTrainSectorBlocks.routes'));
  app.use('/api/nsi/services', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/services.routes'));
  app.use('/api/nsi/posts', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/posts.routes'));
  app.use('/api/orderPatterns', require('./routes/orderPatterns.routes'));
  app.use('/api/orderPatternConnections', require('./routes/orderPatternConnections.routes'));
  app.use('/api/lastOrdersParams', require('./routes/lastOrdersParams.routes'));
  app.use('/api/orders', require('./routes/orders.routes'));
  app.use('/api/workOrders', require('./routes/workOrders.routes'));
  app.use('/api/orderPatternElementRefs', require('./routes/orderPatternElementRefs.routes'));
  app.use('/api/nsi/ecdStructuralDivisions', require('./routes/ecdStructuralDivisions.routes'));
  app.use('/api/orderDrafts', require('./routes/drafts.routes'));
  app.use('/api/adminsLogs', require('./routes/adminsLogs.routes'));
  app.use('/api/dy58UsersLogs', require('./routes/dy58UsersLogs.routes'));
  app.use('/api/errorsLogs', require('./routes/errorsLogs.routes'));
  app.use('/api/serverLogs', require('./routes/serverLogs.routes'));
  app.use('/api/okna', require('./routes/okna.routes'));
  app.use('/api/upload', require('./routes/files.routes'));

  // Запускаем https-сервер на заданном порту
  httpsServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));  

  // Запускаем таймер для периодического удаления ненужной информации о распоряжениях из БД
  setTimeout(function delDBData() {
    processDelDBData()
      .then(() => {
        setTimeout(delDBData, delDataFrequency);
      })
      .catch((error) => {
        addError({
          errorTime: new Date(),
          action: 'Периодическая "чистка" таблиц базы данных',
          error: error.message,
          actionParams: {},
        });
      });
  }, delDataFrequency);
});
