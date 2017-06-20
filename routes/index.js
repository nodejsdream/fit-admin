var express = require('express')
var router  = express.Router();
var request = require('request');
var config  = require('./../config');
var MongoClient = require('mongodb').MongoClient;

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.session.logined) {
    try{
      MongoClient.connect(config.mongo, function(err, db) {
        if (err) {
          throw err;
        }
        console.log("mongo connected " + req.session.username);
        db.collection(req.session.username, function(err, collection) {
          if(err) { return console.dir(err); }
          collection.count(function(err, count) {
            if (count != 0) {
              collection.findOne({},{}, function(err, item) {
                if(item.lastUsers.length > 0) {
                  return res.render('users', { title: 'Found user', found: item.lastUsers.length, total : '0', config:req.session.config, userName: req.session.username, users: item.lastUsers, fav:item.favUsers})
                } else {
                  return res.render('index', { title: 'AMINISTRATIVE TOOL', userName: req.session.username});
                }
              });
            } else {
              var lastUser = {'lastUsers':[], 'favUsers':[]};
              collection.insert(lastUser, function(err2, result) {
                  if(err) { return console.dir(err2); }
                  return res.render('index', { title: 'AMINISTRATIVE TOOL', userName: req.session.username});
              });
            }
          });
        });
      });
    } catch (e) {
      console.log(e);
      return res.render('index', { title: 'AMINISTRATIVE TOOL', userName: req.session.username});
    }
  } else {
    return res.redirect('/login');
  }
});

// =====================================
// LOGIN ===============================
// =====================================
// show the login form
router.get('/login', function(req, res) {
    var msq = "";
    if(!!req.session.loginError) {
      delete req.session.loginError;
      msq = "Wrong username or password. Try againe!"
    }
    res.render('login.ejs', {title: 'Fitplan login', message: msq });
});

// =====================================
// LOGOUt ==============================
// =====================================
// show the login form
router.get('/logout', function(req, res) {
    req.session.logined = false;
    res.render('login.ejs', {title: 'Fitplan login', message: "Logout" });
});


// =====================================
// SINGUP ===============================
// =====================================
// route from login form
router.post('/signup', function(req, res) {
    req.session.username = req.body.username;
    req.session.password = req.body.password;

    request.post(config.tokenUrl, {
      form: {
        'grant_type': config.grant_type,
        'client_id': config.client_id,
        'client_secret': config.client_secret,
        'password': req.session.password ,
        'username': req.session.username
      }
    }, function(err, answer, body) {
      try{
        var post = JSON.parse(body);
        if (post.access_token && post.token_type && post.expires_in && post.scope && post.jti){
          req.session.logined = true;
          req.session.started = Date.now();
          req.session.access_token = post.access_token;
          req.session.token_type = post.token_type;
          req.session.expires_in = post.expires_in;
          req.session.scope = post.password;
          req.session.jti = post.jti;

          try{
            MongoClient.connect(config.mongo, function(err, db) {
              if (err) {
                throw err;
              }
              console.log("mongo connected " + req.session.username);
              db.collection(req.session.username, function(err, collection) {
                if(err) { return console.dir(err); }
                collection.count(function(err, count) {
                  if (count != 0) {
                    collection.findOne({},{config:1}, function(err, item) {
                      console.log(item);
                      if (!item.config) {
                        collection.update({}, {$set:{config:config.defaultUserConfig}},{multi:true},function (err, numberUpdated){
                          req.session.config = config.defaultUserConfig;
                          return res.render('index', { title: 'AMINISTRATIVE TOOL', userName: req.session.username});
                        });
                      } else {
                        req.session.config = item.config;
                        return res.render('index', { title: 'AMINISTRATIVE TOOL', userName: req.session.username});
                      }
                    });
                  } else {
                    var lastUser = {'lastUsers':[], 'favUsers':[], config:config.defaultUserConfig};
                    collection.insert(lastUser, function(err2, result) {
                        if(err) { return console.dir(err2); }
                        req.session.config = config.defaultUserConfig;
                        return res.render('index', { title: 'AMINISTRATIVE TOOL', userName: req.session.username});
                    });
                  }
                });
              });
            });
          } catch (e) {
            console.log(e);
            req.session.config = config.defaultUserConfig;
            return res.render('index', { title: 'AMINISTRATIVE TOOL', userName: req.session.username});
          }

        } else{
          req.session.loginError = 2;
          req.session.logined = false;
          return res.redirect('/login');
        }
      } catch (e){
        req.session.loginError = 1;
        req.session.logined = false;
        return res.redirect('/login');
      }
    });
});

router.post('/config', function(req, res) {
  console.log(req.body);
  param = req.body;
  if (['favUsers', 'reportPage', 'listUsers'].indexOf(param.type) == -1){
    return res.status(500).send({ error: 'Wrong parameter!' });
  }
  if (req.session.logined) {
    try{
      MongoClient.connect(config.mongo, function(err, db) {
        if (err) {
          throw err;
        }
        db.collection(req.session.username, function(err, collection) {
          if(err) { return console.dir(err); }
          var obj = {}, key = "config."+param.type;
          req.session.config[param.type] = parseInt(param.value);
          obj[key] = parseInt(param.value);
          collection.update({}, {$set:obj},{multi:true},function (err, numberUpdated){
            return res.sendStatus(200);
          });
        });
      });
    } catch (e) {
      console.log(e);
      return res.sendStatus(200);
    }
  } else {
    return res.sendStatus(200);
  }




});


module.exports = router;
