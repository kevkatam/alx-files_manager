const dbClient = require('../utils/db');


const FilesController = {
  postUpload: (req, res) => {
    const token = req.header('X-Token');
    
