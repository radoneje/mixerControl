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

router.get('/event/:id', function(req, res, next) {
  const user=req.session["user"]
  if(!user)
    return  res.redirect("/");


  res.render('event', { title: 'Express', mixerId:req.params.id });
});

router.get('/showSpk/:id', async (req, res, next)=> {
  try {
    var r = await axios.get(config.mixerCore + "mixer/activeInput/" + req.params["id"])
    res.json({ret:r.data, error:false});
  }
  catch(e) {
    res.status(500).send(JSON.stringify({ret:e.message, error:true}))
  }
});
module.exports = router;
