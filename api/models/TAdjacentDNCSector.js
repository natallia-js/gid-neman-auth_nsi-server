const { DataTypes, Model } = require('sequelize');
const { TDNCSector } = require('./TDNCSector');

const MODEL_NAME = 'TAdjacentDNCSector';

class TAdjacentDNCSector extends Model {}

const TAdjacentDNCSectorFields = {
  ADNCS_DNCSectorID1: 'ADNCS_DNCSectorID1',
  ADNCS_DNCSectorID2: 'ADNCS_DNCSectorID2',
};

// Схема таблицы смежных участков ДНЦ
function createAdjacentDNCSectorModel(sequelize) {
  TAdjacentDNCSector.init({
    // id одного участка ДНЦ
    [TAdjacentDNCSectorFields.ADNCS_DNCSectorID1]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: TDNCSector,
        key: 'DNCS_ID',
      },
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    },
    // id другого участка ДНЦ
    [TAdjacentDNCSectorFields.ADNCS_DNCSectorID2]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: TDNCSector,
        key: 'DNCS_ID',
      },
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createAdjacentDNCSectorModel,
  TAdjacentDNCSectorFields,
  TAdjacentDNCSector,
};
