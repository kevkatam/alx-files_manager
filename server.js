const express = require('express');
const routes = require('./routes/index');

const app = express();

const port = parseInt(process.env.PORT, 10) || 5000;

app.use(express.json());
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
