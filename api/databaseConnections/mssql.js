const Sequelize = require('sequelize');
const { createStationModel } = require('../models/TStation');
const { createBlockModel } = require('../models/TBlock');
const { createDNCSectorModel } = require('../models/TDNCSector');
const { createECDSectorModel } = require('../models/TECDSector');
const { createAdjacentDNCSectorModel } = require('../models/TAdjacentDNCSector');
const { createAdjacentECDSectorModel } = require('../models/TAdjacentECDSector');
const { createNearestDNCandECDSectorModel } = require('../models/TNearestDNCandECDSector');
const { createDNCTrainSectorModel } = require('../models/TDNCTrainSector');
const { createECDTrainSectorModel } = require('../models/TECDTrainSector');
const { createDNCTrainSectorStationModel } = require('../models/TDNCTrainSectorStation');
const { createECDTrainSectorStationModel } = require('../models/TECDTrainSectorStation');
const { createDNCTrainSectorBlockModel } = require('../models/TDNCTrainSectorBlock');
const { createECDTrainSectorBlockModel } = require('../models/TECDTrainSectorBlock');
const { createServiceModel } = require('../models/TService');
const { createPostModel } = require('../models/TPost');
const { createStationWorkPoligonModel } = require('../models/TStationWorkPoligon');
const { createDNCSectorWorkPoligonModel } = require('../models/TDNCSectorWorkPoligon');
const { createECDSectorWorkPoligonModel } = require('../models/TECDSectorWorkPoligon');
const { createBlockTrackModel } = require('../models/TBlockTrack');
const { createStationTrackModel } = require('../models/TStationTrack');
const { createStationWorkPlaceModel } = require('../models/TStationWorkPlace');
const { createECDStructuralDivisionModel } = require('../models/TECDStructuralDivision');

async function connectToMSSQL(CentralConfigDBParams) {
  const sequelize = new Sequelize(
    CentralConfigDBParams.dbName,
    CentralConfigDBParams.login,
    CentralConfigDBParams.password,
    {
      dialect: CentralConfigDBParams.dialect,
      host: CentralConfigDBParams.host,
      port: CentralConfigDBParams.port,
      // The timezone used when converting a date from the database into a JavaScript date.
      // The timezone is also used to SET TIMEZONE when connecting to the server, to ensure that
      // the result of NOW, CURRENT_TIMESTAMP and other time related functions have in the right timezone.
      timezone: CentralConfigDBParams.timezone,
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
      // disable logging; default: console.log
      logging: false,
    }
  );

  // Override timezone formatting for MSSQL (это нужно, чтобы не было ошибки,
  // когда дату в виде строки записываю в БД)
  Sequelize.DATE.prototype._stringify = function(date, options) {
    return this._applyTimezone(date, options).format(CentralConfigDBParams.timezoneFormat);
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

  return sequelize;
}

module.exports = connectToMSSQL;
