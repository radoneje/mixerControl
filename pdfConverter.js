
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var config = require('./config.json')
const http = require('http');
var fs = require('fs');
const fsPromises = fs.promises;
var bodyParser = require('body-parser');
var gm = require('gm');//.subClass({imageMagick: true});
var axios=require('axios')

var app = express();
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.raw({
    inflate: true,
    limit: '10000kb',
    type: 'application/pdf'
}));
app.use(bodyParser.raw({
    inflate: true,
    limit: '10000kb',
    type: 'image/x-png'
}));


app.use('/fullImage',async (req,res)=>{
    console.log("readLrvImage");
    gm(req.body)
        .quality(75)
        .density(300, 300)
        .extent(1920,1080)
        .gravity('Center')
        .resize(1920,1080)
        .out('+adjoin')
        .setFormat('png')
        .toBuffer(async (err, buffer)=> {
            if (err)
                return console.warn(err);
            try{
                await axios.post(config.callBackUrl + ":" + config.port + "/api/v1/addImageToPresFile/" + req.headers["x-folder"], buffer,
                    {headers: {'content-type': 'image/x-png'}})
            }
            catch (e){
                console.warn(e)
            }

        });
    res.json("ok");
})
app.use('/lrvImage',async (req,res)=>{
    console.log("readLrvImage");
    gm(req.body)
        .quality(75)
        .density(300, 300)
        .resize(320,180)
        .out('+adjoin')
        .setFormat('png')
        .toBuffer(async (err, buffer)=> {
            if (err)
                return console.warn(err);
            try{
            await axios.post(config.callBackUrl + ":" + config.port + "/api/v1/addImageLrvToPresFile/" + req.headers["x-fileid"], buffer,
                {headers: {'content-type': 'image/x-png'}})
            }
            catch (e){
                console.warn(e)
            }

        });
    res.json("ok");
})

app.use('/',async (req,res)=>{
    console.log("readPdf");
    var page=1;
    gm(req.body)
        .selectFrame(page)
        .quality(75)
        .density(300, 300)
        .resize(1920,1080)
        .extent(1920,1080)
        .gravity('Center')
        .out('+adjoin')
        .setFormat('png')
        .toBuffer(async (err, buffer)=>{
            if(err)
                return  console.warn(err);
            console.log("done", req.headers["x-presid"]);
            try {
                await axios.post(config.callBackUrl + ":" + config.port + "/api/v1/addImageToPresFolder/" + req.headers["x-presid"]+"/"+page, buffer,
                    {headers: {'content-type': 'application/pdf'}}
                    );
            }
            catch (e){
                console.warn(e);
            }
        })
        //.write('/var/www/mixerControl/public/resize1.png', function (err) {


    res.json("ok");

});
var server = http.createServer(app);
server.listen(config.pdfConverterPort, ()=>{
    console.log("encoder server listen on "+ config.pdfConverterPort)

})
