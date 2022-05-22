
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
const pdf = require('pdf-page-counter');

var app = express();
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
        .resize(1280,720)
        .gravity('Center')
        .background('#FFFFFF')
        .extent(1280, 720)
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
        .extent(320, 180)
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

app.use('/pdf',async (req,res)=>{

    var page=1;
    var pdfData=await pdf(req.body);

    //await convertPDFPage(2);
    //await convertPDFPage(3);
    var arr=[]
    for(var i=0; i<  pdfData.numpages; i++){
       arr.push(i);
    }
    for(var page of arr){
        await convertPDFPage(page);
    }
    function convertPDFPage(page){
        return new Promise((resolve, reject)=>{
            gm(req.body)
                .selectFrame(page)
                .quality(75)
                .density(300, 300)
                .resize(1280,720)
                .gravity('Center')
                .background('#FFFFFF')
                .extent(1280, 720)
                .flatten()
                .setFormat('png')
                .toBuffer(async (err, buffer)=>{
                    if(err)
                        return  console.warn(err);

                    try {
                        await axios.post(config.callBackUrl + ":" + config.port + "/api/v1/addImageToPresFolder/" + req.headers["x-presid"]+"/"+page, buffer,
                            {headers: {'content-type': 'application/pdf'}}
                        );
                        resolve();
                    }
                    catch (e){
                        console.warn(e);
                        reject(e);
                    }
                })

        })
    }


        //.write('/var/www/mixerControl/public/resize1.png', function (err) {


    res.json("ok");

});
app.use('/video', async (req,res)=>{
    console.log("video file ", req.body.url, req.body);
    res.json(true)
    var child_process = require('child_process');
    var encoder = child_process.spawn('ffmpeg',['-i', req.body.url, "-ss", "00:00:01.000", "-vframes", "1", "-y", "/tmp/"+req.body.presid+".png"]);
    console.log(fs.statSync("/tmp/"+req.body.presid+".png"));
    gm("/tmp/"+req.body.presid+".png")
        .quality(75)
        .density(150, 150)
        .resize(320,180)
        .gravity('Center')
        .background('#FFFFFF')
        .extent(320, 180)
        .flatten()
        .setFormat('png')
        .toBuffer(async (err, buffer)=> {
            if (err)
                return console.warn(err);
            try{
                fs.rm("/tmp/"+req.body.presid+".png");
                await axios.post(config.callBackUrl + ":" + config.port + "/api/v1/addVideoLrvToPresFile/" + req.headers["x-fileid"], buffer,
                    {headers: {'content-type': 'image/x-png'}})
            }
            catch (e){
                console.warn(e)
            }

        });

    console.log("/tmp/"+req.body.presid+".png");

});
var server = http.createServer(app);
server.listen(config.pdfConverterPort, ()=>{
    console.log("encoder server listen on "+ config.pdfConverterPort)

})
