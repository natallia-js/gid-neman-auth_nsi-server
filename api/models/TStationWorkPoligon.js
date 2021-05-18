const { DataTypes, Model } = require('sequelize');
const { TStation } = require('./TStation');

const MODEL_NAME = 'TStationWorkPoligon';

class TStationWorkPoligon extends Model {}

function createStationWorkPoligonModel(sequelize) {
  TStationWorkPoligon.init({
    SWP_UserID: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    SWP_StID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: TStation,
        key: 'St_ID',
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
  createStationWorkPoligonModel,
  TStationWorkPoligon,
};
