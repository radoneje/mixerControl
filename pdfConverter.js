
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var config = require('./config.json')
const http = require('http');
var fs = require('fs');
const fsPromises = fs.promises;


var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/',async (req,res)=>{
    console.log("readPdf");
    let handle=await fsPromises.open("/tmp/1.pdf", "w+");
    await handle.writeFile(req.body);
    await handle.close();
    res.send("pong");
});
var server = http.createServer(app);
server.listen(config.pdfConverterPort, ()=>{
    console.log("encoder server listen on "+ config.pdfConverterPort)
})
