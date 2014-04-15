var express = require('express');
var app = express();

var DEFAULT_PORT = 8000;

app.use(express.static(__dirname + '/build'));

app.listen(DEFAULT_PORT, function() {
    console.log('Listening on port %d',DEFAULT_PORT );
});