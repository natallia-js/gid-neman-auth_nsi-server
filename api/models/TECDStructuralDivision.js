const { DataTypes, Model } = require('sequelize');
const { TECDSector } = require('./TECDSector');

const MODEL_NAME = 'TECDStructuralDivision';

class TECDStructuralDivision extends Model {}

// Схема таблицы структурных подразделений ЭЦД
function createECDStructuralDivisionModel(sequelize) {
  TECDStructuralDivision.init({
    // id структурного подразделения
    ECDSD_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // наименование структурного подразделения
    ECDSD_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    // должность лица структурного подразделения
    ECDSD_Post: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    // ФИО лица структурного подразделения
    ECDSD_FIO: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    // id участка ЭЦД
    ECDSD_ECDSectorID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TECDSector.hasMany(TECDStructuralDivision, {
    foreignKey: 'ECDSD_ECDSectorID',
    sourceKey: 'ECDS_ID',
  });
  TECDStructuralDivision.belongsTo(TECDSector, {
    foreignKey: 'ECDSD_ECDSectorID',
    targetKey: 'ECDS_ID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createECDStructuralDivisionModel,
  TECDStructuralDivision,
};
