
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var config = require('./config.json')
const http = require('http');
var fs = require('fs');
const fsPromises = fs.promises;
var bodyParser = require('body-parser');
var gm = require('gm').subClass({imageMagick: true});


var app = express();
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.raw({
    inflate: true,
    limit: '10000kb',
    type: 'application/pdf'
}));


app.use('/',async (req,res)=>{
    console.log("readPdf");
    console.log(req.body);
    let handle=await fsPromises.open("/tmp/1.pdf", "w+");
    await handle.writeFile(req.body);
    await handle.close();
    gm(req.body)
        .command("convert")
        .quality(75)
        .density(300, 300)
        .resize(1920,1080)
       // .out("background:transparent")
        .selectFrame(0).write('/var/www/mixerControl/public/resize.png', function (err) {
        if (!err) console.log('done');
        else console.log(err);
    });
    res.send("pong");
});
var server = http.createServer(app);
server.listen(config.pdfConverterPort, ()=>{
    console.log("encoder server listen on "+ config.pdfConverterPort)
})
