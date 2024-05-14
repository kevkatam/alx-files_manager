const sha1 = require('sha1');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const UsersController = {
  postNew: (req, res) => {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const users = dbClient.db.collection('users');
    users.findOne({ email }, (err, user) => {
      if (user) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }
      const hashedPswd = sha1(password);
      users.insertOne(
        {
          email,
          password: hashedPswd,
        },
      ).then((result) => {
        res.status(201).json({ id: result.insertedId, email });
      }).catch((err) => console.log(err));
    });
  },

  getMe: async (req, res) => {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const users = dbClient.db.collection('users');
      const objId = new ObjectID(userId);
      users.findOne({ _id: objId }, (err, user) => {
        if (user) {
          res.status(200).json({ id: userId, email: user.email });
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  },
};

module.exports = UsersController;
