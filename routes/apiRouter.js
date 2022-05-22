var express = require('express');
var router = express.Router();
const multer = require('multer')
const config = require("../config.json");
const upload = multer({dest: config.fileUploadPath});
var path = require('path')
var fs = require('fs')
var gm = require('gm');
const fsPromises = fs.promises;
var axios = require('axios');
var FormData = require('form-data');




/* GET users listing. */
function checkLogin(req, res, next) {
    if (!req.session["user"])
        return res.sendStatus(401);//.send("Unauthorized")
    next();
}

router.post('/addEvent', checkLogin, async (req, res, next) => {
    req.body.ownerid = req.session["user"].id;
    var r = await req.knex("t_events").insert(req.body, "*");
    res.json(r[0]);
});
router.post('/delEvent', checkLogin, async (req, res, next) => {
    req.body.ownerid = req.session["user"].id;
    var r = await req.knex("t_events").update({isDeleted: true}, "*").where({
        id: req.body.id,
        ownerid: req.body.ownerid
    });
    res.json(r);
});

router.get('/events', checkLogin, async (req, res, next) => {
    var r = await req.knex.select("*").from("t_events").where({isDeleted: false}).orderBy("date", "desc");
    res.json(r);
});
router.post('/addPresFiles', upload.array('photos', 10), async (req, res, next) => {
    if (!req.session["user"])
        return res.sendStatus(401);//.send("Unauthorized");

    var events = await req.knex.select("*").from("t_events").where({ownerid: req.session["user"].id, id:req.body.eventid, isDeleted: false});
    if (events.length == 0)
        return res.sendStatus(401);//.send("Unauthorized");
    if (events[0].ownerid != req.session["user"].id)
        return res.sendStatus(401);//.send("Unauthorized");

    for (var file of req.files) {
        var ext = path.extname(file.originalname);

        fs.renameSync(file.path, file.path + ext)
        file.path = file.path + ext;
        var r = (await req.knex("t_presfolders").insert({
            originalname: file.originalname,
            type: file.mimetype,
            eventid: events[0].id,
            originalname: file.originalname,
            originalpath: file.path,
            originalsize: file.size
        }, "*"))[0];
        res.json({id: r.id, type: r.type, images: []});


        req.io.emit("message", JSON.stringify({
            cmd: "addPresFolder",
            eventid: events[0].id,
            value: {id: r.id, type: r.type, images: []}
        }));

        if (file.mimetype.toLowerCase().indexOf('image/') == 0) {
            //TODO: convert images
            var fullpath = config.filePresPath + file.filename + ".png";
            var lrvpath = config.fileLRVPath + file.filename + ".png";
            var handle=await  fsPromises.open(file.path, "r+");

            var buf=await handle.readFile();

            var fileRecord=await sendImageToConvertor( buf,r.id );
            await handle.close();

        }
        if (file.mimetype.toLowerCase().indexOf('application/pdf') == 0) {
            //TODO: convert PDF

            let filehandle = await fsPromises.open(file.path, 'r+');
            var data = await filehandle.readFile();
            try {
                await axios.post(
                    config.pdfConverterUrl + ":" + config.pdfConverterPort+"/"+"pdf", data/*.toString('base64')*/,
                    {headers: {'content-type': 'application/pdf', 'x-presid': r.id}});
            } catch (e) {
                console.warn("ERROR: send to PDF")
            }
            await filehandle.close();
        }
        if (file.mimetype.toLowerCase().indexOf('video/') == 0) {
            try {
                await axios.post(
                    config.pdfConverterUrl + ":" + config.pdfConverterPort+"/"+"video", {
                        url:config.uploadAlias+ path.basename(file.path),
                        presid:r.id
                    })
            } catch (e) {
                console.warn("ERROR: send to VIDEO CONV")
            }
        }
    }
    var eventid = req.body.eventid;

});
router.get('/presImg/:id', checkLogin, async (req, res, next) => {
    var r = await req.knex.select("*").from("t_presfiles").where({id: req.params.id});
    if (r.length == 0)
        return res.sendStatus(404);
    if(r[0].lrvpath)
        res.sendFile(r[0].lrvpath);
    else res.sendStatus(404);
});

async function addImageToPresFolder(folderid, filePath, req) {
    var stat = fs.statSync(filePath)
    var fileRecord = await req.knex("t_presfiles").insert({
        folderid: folderid,
        fullpath: filePath,
        fullsize: stat.size
    }, "*");
    return fileRecord;
}
async function sendImageToLrvConvertor(data, id){
    try {
        await axios.post(
            config.pdfConverterUrl + ":" + config.pdfConverterPort + "/lrvImage", data,
            {headers: {'content-type': 'image/x-png', 'x-fileid': id}});
    }
    catch (e){
        console.warn("ERROR: sendImageToLrvConvertor")
    }
}
async function sendImageToConvertor(data, id){
    try {
        await axios.post(
            config.pdfConverterUrl + ":" + config.pdfConverterPort + "/fullImage", data,
            {headers: {'content-type': 'application/octet-stream', 'x-folder': id}});
    }
    catch (e){
        console.warn("ERROR: sendImageToConvertor")
    }
}

router.post("/addImageToPresFolder/:id/:page", async (req, res) => {
    res.json(1);
    var filePath = config.filePresPath + req.params["id"] + "_" + req.params["page"] + ".png";
    var filehandle = await fsPromises.open(filePath, 'w+');
    await filehandle.writeFile(req.body);
    await filehandle.close();
    var fileRecord = await addImageToPresFolder(req.params["id"], filePath, req);
    await sendImageToLrvConvertor(req.body, fileRecord[0].id)

})


async function addImageLrvToPresFile(fileid, filePath, req) {
    var stat = fs.statSync(filePath)
    var fileRecord = await req.knex("t_presfiles").update({
        lrvpath: filePath,
        lrvsize: stat.size
    }, "*").where({id:fileid});
    return fileRecord;
}

router.post("/addImageToPresFile/:id/", async (req, res) => {
    res.json(1);

    var filePath = config.filePresPath + req.params["id"] +  ".png";
    var filehandle = await fsPromises.open(filePath, 'w+');
    await filehandle.writeFile(req.body);
    await filehandle.close();
    ///////
   // await addImageToPresFolder()
    var fileRecord = await addImageToPresFolder(req.params["id"], filePath, req);
    await sendImageToLrvConvertor(req.body, fileRecord[0].id)


})
async function noifyNewPresFile(fileRecord, req){
    var eventid=(await req.knex.select("*").from("t_presfolders").where({id:fileRecord.folderid}))[0].eventid
    req.io.emit("message", JSON.stringify({
        cmd: "addPresImg",
        eventid:eventid ,
        folderid: fileRecord.folderid,
        value: {id: fileRecord.id, size: fileRecord.lrvsize}
    }))
}

router.post("/addImageLrvToPresFile/:id/", async (req, res) => {
    res.json(1);
    var filePath = config.fileLRVPath + req.params["id"] +  ".png";
    var filehandle = await fsPromises.open(filePath, 'w+');
    await filehandle.writeFile(req.body);
    await filehandle.close();
    var fileRecord = await addImageLrvToPresFile(req.params["id"], filePath, req);
    await noifyNewPresFile(fileRecord[0], req);


})
router.post("/addVideoLrvToPresFile/:id/", async (req, res) => {
    res.json(1);
    var filePath = config.fileLRVPath + req.params["id"] +  ".png";
    var filehandle = await fsPromises.open(filePath, 'w+');
    await filehandle.writeFile(req.body);
    await filehandle.close();
    var fileRecord = await addImageLrvToPresFile(req.params["id"], filePath, req);

    await noifyNewPresFile(fileRecord[0], req);


})


router.get('/presFolders/:id', checkLogin, async (req, res, next) => {
    var r = await req.knex.select("*").from("t_presfolders").where({
        isDeleted: false,
        eventid: req.params.id
    }).orderBy("datecreate");
    var ret = [];
    for (var rr of r) {
        var images = [];
        var i = await req.knex.select("*").from("t_presfiles").where({isDeleted: false, folderid: rr.id})
        i.forEach(ii => {
            images.push({id: ii.id, size: ii.lrvsize});
        });
        ret.push({id: rr.id, type: rr.type, images});
    }

    res.json(ret);
});
router.post('/presFoldersDelete', checkLogin, async (req, res, next) => {

    var r = await req.knex("t_presfolders").update({isDeleted: true}, "*").where({id: req.body.id}).orderBy("id");

    if (r.length == 0)
        return res.sendStatus(404);
    req.io.emit("message", JSON.stringify({cmd: "presFoldersDelete", eventid: req.body.eventid, id: r[0].id}))
    res.json(r[0].id);

});


router.get('/activatePresImg/:id/:eventid', async (req, res, next)=> {
    const user=req.session["user"]
    if(!user)
        return  res.redirect("/");
    try {
        var fileRecord=await req.knex.select("*").from("t_presfiles").where({id:req.params["id"]});
        if(fileRecord.length==0)
            return res.sendStatus(404);
       /* var handle=await fsPromises.open(fileRecord[0].fullpath,"r+");
        var buf=await handle.readFile();
        let arraybuffer = Uint8Array.from(buf).buffer
        await handle.close();*/

        var formData= new FormData();
        formData.append('image', fs.createReadStream(fileRecord[0].fullpath), "image.png");
        formData.append('eventid', req.params["eventid"]);
        var r = await axios.post(config.mixerCore + "mixer/activatePresImg/"+req.params["eventid"]+"/"+req.params["id"],formData, {headers: {"Content-Type": "multipart/form-data"}})
        res.json({ret:r.data, error:false});
        if(!r.data.error){
            req.io.emit("message", JSON.stringify({
                cmd: "activatePresFile",
                eventid:req.params["eventid"],
                presFileId: r.data.presFileId,
            }))
        }
    }
    catch(e) {
        res.status(500).send(JSON.stringify({ret:e.message, error:true}))
    }
});
router.post('/webCamPublished', async (req, res, next)=> {

    var spkid=req.body.loginid || "NULL"
    r=await axios.get(config.mixerCore+"mixer/startInput?eventid="+req.body.eventid+"&id="+req.body.faceid+"&url=rtmp://wowza02.onevent.online:1935/live/"+req.body.streamName+"&spkid="+spkid)
    res.json(r.data);
    //http://wowza01.onevent.online:8090/mixer/startInput?id=1&url=rtmp://wowza02.onevent.online:1935/live/test
});
router.post('/webCamOrientation', async (req, res, next)=> {
    console.log("orientation", req.body.needRescale);
   // r=await axios.get(config.mixerCore+"mixer/startInput?eventid="+req.body.eventid+"&id="+req.body.faceid+"&url=rtmp://wowza02.onevent.online:1935/live/"+req.body.streamName)
    res.json(true);
    //http://wowza01.onevent.online:8090/mixer/startInput?id=1&url=rtmp://wowza02.onevent.online:1935/live/test
});

router.get('/eventStatus/:eventid', async (req, res, next)=> {

 try {
     var r = await axios.get(config.mixerCore + "mixer/eventStatus/" + req.params.eventid); //todo: add request ot core;

     for(var input of r.data.inputs){
         console.log("rr", input);
         if(input.spkid && input.spkid.length>6) {
             var rr = await req.knex.select("*").from("t_spklogins").where({id: input.spkid});
             if (rr.length > 0) {
                 input.title = {name: rr[0].titlename, suname: (rr[0].titlesuname || ""), position: (rr[0].titleposition || "")};
             }
         }

     }
     res.json( r.data)
 }catch (e) {
     res.status(404);
 }
});
router.post('/startEvent/:eventid', upload.array('photos', 10), async (req, res, next) => {
    if (!req.session["user"])
        return res.sendStatus(401);//.send("Unauthorized");

    var events = await req.knex.select("*").from("t_events").where({
        ownerid: req.session["user"].id,
        id: req.params.eventid,
        isDeleted: false
    });
    try {
        await axios.get(config.mixerCore + "mixer/startEvent/" + req.params.eventid)
    }
    catch(ex)
    {
        console.warn("ERORR: cant start event",config.mixerCore + "mixer/startEvent/" + req.params["id"] )
    }
    res.json(true);
});



router.get('/eventStarted/:eventid', async (req, res, next)=> {
    console.log("eventStarted", req.params.eventid);
    await req.knex("t_events").update({status:1}).where({id:req.params.eventid});
    //req.io.emit("message", JSON.stringify({cmd: "eventChangeStatus", eventid: req.params.eventid, status:1}));



    req.sendToMixers(req.params.eventid, {cmd: "eventChangeStatus", status:1});
    res.json(true);
});
router.get('/inputStart/:eventid/:input/:spkid?', async (req, res, next)=> {
    console.log("inputStart", req.params.eventid, req.params.spkid );
    var ret={}
   /* if(req.params.spkid && req.params.spkid!="undefined"){
        var r=await req.knex("t_spklogins").update({date:new Date(),input:req.params.input, isactive:true}, "*").where({id:req.params.spkid})
        ret.spkid=r[0].spkid;
        ret.titlename=r[0].titlename;
        ret.titlesuname=r[0].titlesuname;
        ret.titleposition=r[0].titleposition;
        ret.userid=ret.userid;
    }*/

        if(req.params.spkid && req.params.spkid.length>6) {
            var rr = await req.knex.select("*").from("t_spklogins").where({id: req.params.spkid});
            if (rr.length > 0) {
                ret = {name: rr[0].titlename, suname: (rr[0].titlesuname || ""), position: (rr[0].titleposition || "")};
            }
        }

    req.sendToMixers(req.params.eventid, {cmd: "inputChangeStatus", status:1,input:req.params.input, title:ret});
    res.json(true);
});
router.get('/inputStop/:eventid/:input/:spkid?', async (req, res, next)=> {
    console.log("inputStop", req.params.eventid, req.params.spkid);
    if(req.params.spkid && req.params.spkid!="undefined"){
        await req.knex("t_spklogins").update({datestop:new Date(), isactive:false}).where({id:req.params.spkid})
    }
    req.sendToMixers(req.params.eventid, {cmd: "inputChangeStatus", input:req.params.input, status:0});
    res.json(true);
});


router.get('/eventStopped/:eventid', async (req, res, next)=> {
    await req.knex("t_events").update({status:0}).where({id:req.params.eventid});
    req.io.emit("message", JSON.stringify({cmd: "eventChangeStatus", eventid: req.params.eventid, status:0}));
    res.json(true);
});

router.post('/spkLogin/', async (req, res, next)=> {
    var r=[];
    if(req.body.userid && req.body.userid.search(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)!=-1)
        r=await req.knex.select("*").from("t_users").where({id:req.body.userid});
    if(r.length==0)
        r=await req.knex("t_users").insert({name:req.body.name, suname:req.body.suname||"", position:req.body.position||""},"*");
    var rr=await req.knex("t_spklogins").insert({
        userid:r[0].id,
        titlename:req.body.name,
        titlesuname:req.body.suname||"",
        titleposition:req.body.position||""
    }, "*");
    res.json({userid:r[0].id, loginid:rr[0].id});
});





module.exports = router;
