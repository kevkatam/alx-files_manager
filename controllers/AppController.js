const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const AppController = {
  getStatus: (req, res) => {
    const sts = {};
    if (redisClient.isAlive()) {
      sts.redis = true;
    }
    if (dbClient.isAlive()) {
      sts.db = true;
    }

    res.status(200).json(sts);
  },

  getStats: async (req, res) => {
    const stats = {};

    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();

    stats.users = users;
    stats.files = files;

    res.status(200).json(stats);
  },
};

module.exports = AppController;
