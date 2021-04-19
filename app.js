const express = require('express');
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

// Создаем объект приложения express
const app = express();

// express.json() is a method inbuilt in express to recognize the incoming Request Object
// as a JSON Object. This method is called as a middleware.
app.use(express.json({ extended: true }));

// CORS middleware
const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
}
app.use(allowCrossDomain);

// Для связи с конфигурационной БД ЦИВК (MS SQL)
let sequelize;

// Маршрутизация
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/apps', require('./routes/apps.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/nsi/stations', require('./routes/stations.routes'));
app.use('/api/nsi/blocks', require('./routes/blocks.routes'));
app.use('/api/nsi/dncSectors', (req, res, next) => { req.sequelize = sequelize; next(); }, require('./routes/dncSectors.routes'));
app.use('/api/nsi/ecdSectors', (req, res, next) => { req.sequelize = sequelize; next(); }, require('./routes/ecdSectors.routes'));
app.use('/api/nsi/adjacentDNCSectors', require('./routes/adjacentDNCSectors.routes'));
app.use('/api/nsi/adjacentECDSectors', require('./routes/adjacentECDSectors.routes'));
app.use('/api/nsi/nearestDNCandECDSectors', require('./routes/nearestDNCandECDSectots.routes'));

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
      useCreateIndex: true
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
        }
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

    // This creates the tables if they don't exist (and does nothing if they already exist)
    await sequelize.sync({ alter: true });

    // ----------------------------------------------------

    // Запускаем http-сервер на указанном порту
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

  } catch (e) {
    console.log('Server Error', e.message);
    process.exit(1);
  }
}

// Запускаем сервер
start();
