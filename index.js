const express = require('express');
const static = require('express-static');
const app = express();

app.use(express.static('client'));

const data = require('./data.js');

data.request(false, 300000);

app.get('/data.json', (req, res) => {
    var muns = Object.keys(data.municipal).map(k => {return data.municipal[k]});
    res.json(Object.assign({municipal: muns}, data.data));
});

app.listen(process.env.PORT || 8080);