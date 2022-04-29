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
        fs.mm
        var r = (await req.knex("t_presfolders").insert({
            originalname: file.originalname,
            type: file.mimetype,
            eventid: events[0].id,
            originalname:file.originalname,
            originalpath:file.path,
            originalsize:file.size
        }, "*"))[0];
        if(file.mimetype.toLowerCase().indexOf('image/')==0){
            //TODO: convert images
            gm(file.path)
                .resize('1280', '720', '^')
                .gravity('Center')
                .crop('1280', '720')
                .write(config.filePresPath+file.filename, function (err) {
                    if (!err) console.log(' hooray! ');
                    console.log(err)
                });
        }
        if(file.mimetype.toLowerCase().indexOf('application/pdf')==0){
            //TODO: convert PDF
        }
        if(file.mimetype.toLowerCase().indexOf('video/')==0){
            //TODO: convert vodeo
        }
        console.log(r)
    }
    console.log(req.files, req.body)
    var mixerid = req.body.mixerid;
    res.json(1);
});


module.exports = router;
