const sha1 = require('sha1');
const dbClient = require('../utils/db');

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
};

module.exports = UsersController;
