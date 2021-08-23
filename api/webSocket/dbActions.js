const User = require('../models/User');

async function markOnlineUsers(userIds) {
  await User.updateMany({ _id: userIds }, { $set: { online: true } });
  await User.updateMany({ _id: { $nin: userIds } }, { $set: { online: false } });
}

module.exports = {
  markOnlineUsers,
};
