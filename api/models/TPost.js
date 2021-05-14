const { DataTypes, Model } = require('sequelize');

const MODEL_NAME = 'TPost';
const UNIQUE_POST_ABBREV_CONSTRAINT_NAME = 'XUniquePostAbbrev';

class TPost extends Model {}

function createPostModel(sequelize) {
  TPost.init({
    P_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    P_Abbrev: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: UNIQUE_POST_ABBREV_CONSTRAINT_NAME,
    },
    P_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createPostModel,
  TPost,
};
