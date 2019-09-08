const express = require('express');
const static = require('express-static');
const app = express();

app.use(express.static('client'));

const data = require('./data.js');

data.request(true, 60000);

app.get('/data.json', (req, res) => {
    res.json(data.data);
});

app.listen(process.env.PORT || 8080);