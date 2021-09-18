const { DataTypes, Model } = require('sequelize');
const { TDNCSector } = require('./TDNCSector');

const MODEL_NAME = 'TDNCTrainSector';
const UNIQUE_DNCTRAINSECTOR_TITLE_CONSTRAINT_NAME = 'XUniqueDNCTrainSectorTitle';

class TDNCTrainSector extends Model {}

// Схема таблицы поездных участков ДНЦ
function createDNCTrainSectorModel(sequelize) {
  TDNCTrainSector.init({
    // id поездного участка
    DNCTS_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // наименование поездного участка
    DNCTS_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: UNIQUE_DNCTRAINSECTOR_TITLE_CONSTRAINT_NAME,
    },
    // id участка ДНЦ
    DNCTS_DNCSectorID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TDNCSector.hasMany(TDNCTrainSector, {
    foreignKey: 'DNCTS_DNCSectorID',
    sourceKey: 'DNCS_ID',
  });
  TDNCTrainSector.belongsTo(TDNCSector, {
    foreignKey: 'DNCTS_DNCSectorID',
    targetKey: 'DNCS_ID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createDNCTrainSectorModel,
  TDNCTrainSector,
};
