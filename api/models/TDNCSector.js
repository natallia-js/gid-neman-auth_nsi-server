const { DataTypes, Model } = require('sequelize');

const MODEL_NAME = 'TDNCSector';
const UNIQUE_DNCSECTOR_TITLE_CONSTRAINT_NAME = 'XUniqueDNCSectorTitle';

class TDNCSector extends Model {}

// Схема таблицы участков ДНЦ
function createDNCSectorModel(sequelize) {
  TDNCSector.init({
    // id участка ДНЦ
    DNCS_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // наименование участка ДНЦ
    DNCS_Title: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: UNIQUE_DNCSECTOR_TITLE_CONSTRAINT_NAME,
    },
    // комментарий
    DNCS_DESCRIPTION: {
      type: DataTypes.STRING(640),
      allowNull: true,
    },
    // номер участка ДНЦ в ПЭНСИ
    DNCS_PENSI_Code: {
      type: DataTypes.SMALLINT,
      allowNull: true,
    },
    // id участка ДНЦ в ПЭНСИ
    DNCS_PENSI_ID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Дата-время последнего изменения в информации о персонале участка ДНЦ.
    // Данное поле нужно исключительно для обновления информации о персонале в ГИД ДНЦ (в его локальной БД).
    // Учитывается обновление только следующего рода информации: ФИО, должность.
    DNCS_LastPersonalUpdateTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Дата-время последнего запроса с участка ДНЦ с целью обновления информации по персоналу участка ДНЦ
    DNCS_LastUpdatePersonalRequestTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createDNCSectorModel,
  TDNCSector
};
