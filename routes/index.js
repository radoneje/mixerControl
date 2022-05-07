var express = require('express');
var router = express.Router();
var axios = require('axios');
var config = require('../config.json');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/', async function(req, res, next) {

  var r=await req.knex.select("*").from("t_users").where({phone:req.body.phone,pass:req.body.pass, isDeleted:false });
  if(r.length==0)
    return res.render('index', { title: 'Express', phone: req.body.phone});
  req.session["user"]=r[0];
    res.redirect("/events");
});
router.get('/events', function(req, res, next) {
  const user=req.session["user"]
  if(!user)
    return  res.redirect("/");

  res.render('events', { title: 'Express', user:{f:user.name, i:user.suname, id:user.id}});
});
router.get('/logout', function(req, res, next) {
  req.session["user"]=null;
  res.redirect("/");

})

router.get('/event/:id', async function(req, res, next) {
  const user=req.session["user"]
  if(!user)
    return  res.redirect("/");

  var r=await req.knex.select("*").from("t_events").where({isDeleted:false, id:req.params.id});
  if(r.length==0)
    return res.sendStatus(404);
  res.render('event', { title: 'Express', mixerId:req.params.id,title:r[0].title, user:{f:user.name, i:user.suname, id:user.id} });
});

router.get('/showSpk/:id/:eventid', async (req, res, next)=> {
  const user=req.session["user"]
  if(!user)
    return  res.redirect("/");
  try {
    var r = await axios.get(config.mixerCore + "mixer/activeInput/" + req.params["id"])
    req.io.emit("message", JSON.stringify({cmd:"activateSpk", eventid:req.params["eventid"], id:req.params["id"]}))
    res.json({ret:r.data, error:false});

  }
  catch(e) {
    res.status(500).send(JSON.stringify({ret:e.message, error:true}))
  }
});
router.get('/speaker/:eventid/:faceid', async function(req, res, next) {


  var r=await req.knex.select("*").from("t_events").where({isDeleted:false, id:req.params.id});
  if(r.length==0)
    return res.sendStatus(404);
  res.render('speakers/speaker', { title: 'Express', eventid:req.params.id,title:r[0].title, faceid:faceid });
});

module.exports = router;
