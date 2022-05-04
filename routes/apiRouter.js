var express = require('express');
var router = express.Router();
const multer = require('multer')
const config = require("../config.json");
const upload = multer({dest: config.fileUploadPath});
var path = require('path')
var fs = require('fs')
var gm = require('gm');

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
    var events = await req.knex.select("*").from("t_events").where({ownerid: req.session["user"].id, isDeleted: false});
    if (events.length == 0)
        return res.sendStatus(401);//.send("Unauthorized");
    if (events[0].ownerid != req.session["user"].id)
        return res.sendStatus(401);//.send("Unauthorized");

    for (var file of req.files) {
        var ext=path.extname(file.originalname);

        fs.renameSync(file.path, file.path+ext)
        file.path=file.path+ext;
        var r = (await req.knex("t_presfolders").insert({
            originalname: file.originalname,
            type: file.mimetype,
            eventid: events[0].id,
            originalname:file.originalname,
            originalpath:file.path,
            originalsize:file.size
        }, "*"))[0];
        res.json({id:r.id, type:r.type, images:[]});

        if(file.mimetype.toLowerCase().indexOf('image/')==0){
            //TODO: convert images
            var fullpath=config.filePresPath+file.filename+".png";
            var lrvpath=config.fileLRVPath+file.filename+".png";
            gm(file.path)
                .resize('1280', '720', '^')
                .gravity('Center')
                .crop('1280', '720')
                .write(fullpath,async function (err) {
                    if (!err)
                    {
                        var stat = fs.statSync(fullpath)
                        var fileRecord=await req.knex("t_presfiles").insert({folderid:r.id,fullpath, fullsize:stat.size}, "*");

                        gm(file.path).resize('320', '180', '^').gravity('Center').crop('320', '180').write(lrvpath, async (err)=>{
                            if(!err) {
                                var stat = fs.statSync(lrvpath);
                                var presfiles = await req.knex("t_presfiles").update({
                                    lrvpath,
                                    lrvsize: stat.size
                                }, "*").where({id: fileRecord[0].id});
                                var rr=await req.knex("t_presfolders").update({image: lrvpath}).where({id: r.id})
                                req.io.emit("message", JSON.stringify({cmd:"addPresImg", eventid:events[0].id,  folderid:r.id, value:{id:presfiles[0].id, size:presfiles[0].lrvsize}}))
                               // res.json({id:r.id, type:r.type});
                            }
                           // else
                              //  return  res.json({err:true, err});
                        });
                    }
                    //else
                       // return res.json({err:true, err});

                });
        }
        if(file.mimetype.toLowerCase().indexOf('application/pdf')==0){
            //TODO: convert PDF
        }
        if(file.mimetype.toLowerCase().indexOf('video/')==0){
            //TODO: convert vodeo
        }
    }
    var eventid = req.body.eventid;

});
router.get('/presImg/:id', checkLogin, async (req, res, next) => {
    var r = await req.knex.select("*").from("t_presfiles").where({id: req.params.id});
    if(r.length==0)
        return res.sendStatus(404);
    res.sendFile(r[0].lrvpath);
});

router.get('/presFolders/:id', checkLogin, async (req, res, next) => {
    var r = await req.knex.select("*").from("t_presfolders").where({isDeleted:false, eventid:req.params.id}).orderBy("id");
    var ret=[];
    for(var rr of r){
        var images=[];
        var i=await req.knex.select("*").from("t_presfiles").where({isDeleted:false, folderid:rr.id})
        i.forEach(ii=>{
            images.push({id:ii.id, size:ii.lrvsize});
        });
        ret.push({id:rr.id, type:rr.type, images});
    }

    res.json(ret);
});
router.post('/presFoldersDelete', checkLogin, async (req, res, next) => {
    console.log(req.body.id);
    var r = await req.knex("t_presfolders").update({isDeleted:true},"*").where({ id:req.body.id}).orderBy("id");

    if(r.length==0)
        return res.sendStatus(404);
    req.io.emit("message", JSON.stringify({cmd:"presFoldersDelete", id:r[0].id}))
    res.json(r[0].id);

});




module.exports = router;
