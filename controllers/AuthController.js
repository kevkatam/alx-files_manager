const dbClient = require('../utils/db.js')
const sha1 = require('sha1');
const uuidv4 = require('uuid');
const redisClient = require('../utils/redis.js');

const AuthController = {
  getConnect: (req, res) => {
    let userAuth = req.header('Authorization');
    userAuth = userAuth.split(' ');
    let email = userAuth[1];
    const buf = Buffer.from(email, 'base64');
    email = buf.toString('ascii');
    const info = email.split(':');

    if (info.length !== 2) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const hashedpswd = sha1(info[1]);
    const users = dbClient.db.collection('users');

    users.findOne({ email: info[0], password: hashedpswd }, async (error, user) => {
      if (user) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 86400);
        res.status(200).json({ token: token });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    });
  },

  getDisconnect: async (req, res) => {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      await redisClient.del(key);
      res.status(204).json({});
    } else {
      res.status(401).json({error: 'Unauthorized' });
    }
  }
};

module.exports = AuthController; 
