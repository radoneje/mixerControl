
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
    type: 'application/*'
}));
app.use(bodyParser.raw({
    inflate: true,
    limit: '10000kb',
    type: 'image/x-png'
}));


app.use('/fullImage',async (req,res)=>{
    var buf=req.body;//Buffer.from(req.body, 'base64')
    console.log("readFullImage", buf);
    gm(buf)
        .quality(75)
        .density(300, 300)
        .resize(1920,1080)
        .gravity('Center')
        .background('#FFFFFF')
        .extent(1920, 1080)
        .flatten()
        .setFormat('png')
        .out('+adjoin')
        .toBuffer(async (err, buffer)=> {
            if (err) {

                return console.warn("this err",err);
            }
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
        .density(150, 150)
        .resize(320,180)
        .gravity('Center')
        .background('#FFFFFF')
        .extent(180, 180)
        .flatten()
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
