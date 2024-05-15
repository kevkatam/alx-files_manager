const fs = require('fs').promises;
const { ObjectID } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const FilesController = {
  retrieve: async (req) => {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const users = dbClient.db.collection('users');
      const objId = new ObjectID(userId);
      const user = await users.findOne({ _id: objId });
      if (!user) {
        return null;
      }
      return user;
    }
    return null;
  },

  postUpload: async (req, res) => {
    const user = await FilesController.retrieve(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name } = req.body;
    const { type } = req.body;
    const { parentId } = req.body;
    const { isPublic } = req.body.isPublic || false;
    const { data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }
    const files = dbClient.db.collection('files');
    if (parentId) {
      const objId = new ObjectID(parentId);
      const file = await files.findOne({ _id: objId, userId: user._id });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      files.insertOne(
        {
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic,
        },
      ).then((result) => res.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      })).catch((err) => {
        console.log(err);
      });
    } else {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${folderPath}/${uuidv4()}`;
      const buf = Buffer.from(data, 'base64');

      try {
        try {
          await fs.mkdir(folderPath);
        } catch (err) {
          console.log(err);
        }
        await fs.writeFile(fileName, buf, 'utf-8');
      } catch (err) {
        console.log(err);
      }

      files.insertOne(
        {
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
          localPath: fileName,
        },
      ).then((result) => {
        res.status(201).json(
          {
            id: result.insertedId,
            userId: user._id,
            name,
            type,
            isPublic,
            parentId: parentId || 0,
          },
        );
      }).catch((err) => console.log(err));
    }
    return null;
  },
};
