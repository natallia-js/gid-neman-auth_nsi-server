const express = require('express');
const setupWebSocket = require('./webSocket/setup');
//const http = require('http');
const https = require('https');
const cors = require('cors');
const config = require('config');
const mongoose = require('mongoose');
const Sequelize = require('sequelize');
const { createStationModel } = require('./models/TStation');
const { createBlockModel } = require('./models/TBlock');
const { createDNCSectorModel } = require('./models/TDNCSector');
const { createECDSectorModel } = require('./models/TECDSector');
const { createAdjacentDNCSectorModel } = require('./models/TAdjacentDNCSector');
const { createAdjacentECDSectorModel } = require('./models/TAdjacentECDSector');
const { createNearestDNCandECDSectorModel } = require('./models/TNearestDNCandECDSector');
const { createDNCTrainSectorModel } = require('./models/TDNCTrainSector');
const { createECDTrainSectorModel } = require('./models/TECDTrainSector');
const { createDNCTrainSectorStationModel } = require('./models/TDNCTrainSectorStation');
const { createECDTrainSectorStationModel } = require('./models/TECDTrainSectorStation');
const { createDNCTrainSectorBlockModel } = require('./models/TDNCTrainSectorBlock');
const { createECDTrainSectorBlockModel } = require('./models/TECDTrainSectorBlock');
const { createServiceModel } = require('./models/TService');
const { createPostModel } = require('./models/TPost');
const { createStationWorkPoligonModel } = require('./models/TStationWorkPoligon');
const { createDNCSectorWorkPoligonModel } = require('./models/TDNCSectorWorkPoligon');
const { createECDSectorWorkPoligonModel } = require('./models/TECDSectorWorkPoligon');
const { createBlockTrackModel } = require('./models/TBlockTrack');
const { createStationTrackModel } = require('./models/TStationTrack');
const { createStationWorkPlaceModel } = require('./models/TStationWorkPlace');
const { createECDStructuralDivisionModel } = require('./models/TECDStructuralDivision');
const processDelDBData = require('./serverSideProcessing/processDelDBData');
const fs = require('fs');
const path = require('path');
const privateKey = fs.readFileSync(path.resolve(__dirname, 'sslcert', 'key.pem'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, 'sslcert', 'cert.pem'), 'utf8');
const rootCertificate = fs.readFileSync(path.resolve(__dirname, 'sslcert', 'rootCA.pem'), 'utf8');

// Создаем объект приложения express
const app = express();

// express.json() is a method inbuilt in express to recognize the incoming Request Object
// as a JSON Object. This method is called as a middleware.
app.use(express.json({ extended: true }));

// CORS middleware
app.use(cors());

// initialize a server (https)
const credentials = {
  key: privateKey,
  cert: certificate,
  //requestCert: false,
  rejectUnauthorized: false,
  ca: rootCertificate,
};
const httpsServer = https.createServer(credentials, app);
//const server = http.createServer(app);

// pass the same server to our websocket setup function;
// the websocket server will run on the same port accepting wss:// connections
setupWebSocket(httpsServer);

// Для связи с конфигурационной БД ЦИВК (MS SQL)
let sequelize;

// Маршрутизация
app.use('/api/auth', (req, _res, next) => { req.sequelize = sequelize; next(); }, require('./routes/auth.routes'));
app.use('/api/apps', require('./routes/apps.routes'));
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

// Порт сервера
const PORT = config.get('port') || 4000;

// mongodb://localhost:27017/test?connectTimeoutMS=1000&bufferCommands=false&authSource=otherdb

/**
 * Действия, которые необходимо выполнить для запуска сервера.
 */
async function start() {
  try {
    // Подключаемся к серверу MongoDB (для работы с аутентификацией: данные приложений, ролей, пользователей)
    await mongoose.connect(config.get('mongoURI'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    // ----------------------------------------------------

    // Подключаемся к серверу MS SQL (для работы с данными участков: станции, перегоны, участки ДНЦ...)
    sequelize = new Sequelize(
      config.get('CentralConfigDB.dbName'),
      config.get('CentralConfigDB.login'),
      config.get('CentralConfigDB.password'),
      {
        dialect: config.get('CentralConfigDB.dialect'),
        host: config.get('CentralConfigDB.host'),
        port: config.get('CentralConfigDB.port'),
        // The timezone used when converting a date from the database into a JavaScript date.
        // The timezone is also used to SET TIMEZONE when connecting to the server, to ensure that
        // the result of NOW, CURRENT_TIMESTAMP and other time related functions have in the right timezone.
        timezone: config.get('CentralConfigDB.timezone'),
        // определяем совокупность сохраненнных многоразовых соединений
        // (повторное использование соединения с БД, когда это возможно,
        // чтобы не нести накладных расходов на установление соединения
        // с БД снова и снова)
        pool: {
          // максимальное количество открытых соединений
          max: 5,
          // не поддерживать открытых соединений
          min: 0,
          // удалить соединение из пула после того как оно простаивало
          // (не использовалось) в течение 10 сек
          idle: 10000
        },
      }
    );

    // Override timezone formatting for MSSQL (это нужно, чтобы не было ошибки,
    // когда дату в виде строки записываю в БД)
    Sequelize.DATE.prototype._stringify = function(date, options) {
      return this._applyTimezone(date, options).format(config.get('CentralConfigDB.timezoneFormat'));
    };

    // Testing the connection to the Central Config database
    await sequelize.authenticate();

    // Создаю модели для работы с конфигурационной БД
    createDNCSectorModel(sequelize);
    createECDSectorModel(sequelize);
    createDNCTrainSectorModel(sequelize);
    createECDTrainSectorModel(sequelize);
    createStationModel(sequelize);
    createBlockModel(sequelize);
    createAdjacentDNCSectorModel(sequelize);
    createAdjacentECDSectorModel(sequelize);
    createNearestDNCandECDSectorModel(sequelize);
    createDNCTrainSectorStationModel(sequelize);
    createECDTrainSectorStationModel(sequelize);
    createDNCTrainSectorBlockModel(sequelize);
    createECDTrainSectorBlockModel(sequelize);
    createServiceModel(sequelize);
    createPostModel(sequelize);
    createStationWorkPoligonModel(sequelize);
    createDNCSectorWorkPoligonModel(sequelize);
    createECDSectorWorkPoligonModel(sequelize);
    createBlockTrackModel(sequelize);
    createStationTrackModel(sequelize);
    createStationWorkPlaceModel(sequelize);
    createECDStructuralDivisionModel(sequelize);

    // This creates the tables if they don't exist (and does nothing if they already exist)
    //await sequelize.sync({ alter: true });

    // ----------------------------------------------------

    // Запускаем https-сервер на указанном порту
    httpsServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    //server.listen(5001, () => console.log(`Server started on port 5001`));

  } catch (e) {
    console.log('Server Error', e.message);
    process.exit(1);
  }

  // Запускаем таймер для периодического удаления ненужной информации о распоряжениях из БД
  const delDataFrequency = config.get('delDBDataIntervalInMs');
  let delDBDataTimerId = setTimeout(function delDBData() {
    processDelDBData()
      .then(() => {
        delDBDataTimerId = setTimeout(delDBData, delDataFrequency);
      })
      .catch((err) => console.log(err));
  }, delDataFrequency);
}

// Запускаем сервер
start();
