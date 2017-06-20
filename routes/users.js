var express = require('express');
var router  = express.Router();
var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var config  = require('./../config');

/* GET users listing. */
router.get('/', function(req, res, next) {
  var url;
  if (!!req.query.emailAddress) {
    uri = 'user-admin/search/by/emailaddress?emailAddress=' + req.query.emailAddress;
  } else{
    if(!!req.query.firstName || !!req.query.lastName) {
      uri = 'user-admin/search/by/name?firstName=' + req.query.firstName + '&lastName=' + req.query.lastName;
    } else {
      if(!!req.query.vendor){
        uri = 'user-admin/search/by/vendor?id=' + req.query.vendor;
      } else {
        return res.redirect("/");
      }
    }
  }
  console.log("=======================1 ");
    res.locals._GET(uri, null, function(err, body){
      try {
        console.log("uri",uri);
        console.log("body",body);
        var users = JSON.parse(body).result.users;
        if (!users || !users.length){
          users = [];
        }
        try{
          MongoClient.connect(config.mongo, function(err, db) {
            if (err) {throw err;}
            console.log("mongo connected " + req.session.username);
            db.collection(req.session.username, function(err, collection) {
              if(err) { return console.dir(err); }
              collection.count(function(err, count) {
                if (count != 0) {
                  collection.findOne({},{favUsers:1}, function(err, item) {
                    console.log("item",item);
                    console.log("users",users);
                    if(item.favUsers.length > 0) {
                      for (var j = 0; j< item.favUsers.length; j++){
                        for (var i=0;i<users.length;i++){
                            if (users[i].id == item.favUsers[j]){
                              users[i].fav = true;
                            }
                        }
                      }
                    }

                    return res.render('users', { title: 'Found user', found: users.length, total : '0',config:req.session.config,  userName:req.session.username, users: users})
                  });
                } else {
                  return res.render('users', { title: 'Found user', found: users.length, total : '0',config:req.session.config,  userName:req.session.username, users: users})
                }
              });
            });
          });
        } catch (e) {
          console.log(e);
          return res.render('users', { title: 'Found user', found: '0', total : '0',config:req.session.config,  userName:req.session.username, users: users})
        }
      } catch (e){
        console.log(e);
        return res.render('users', { title: 'Found user', found: '0', total : '0',config:req.session.config, userName:req.session.username, users: []})
      }
    });
});



//Bookmark user
router.post('/fav/?', function(req, res) {
  //console.log(req.body);
    var param = req.body;
    try{
      MongoClient.connect(config.mongo, function(err, db) {
        if (err) {throw err;}
        console.log("mongo connected " + req.session.username);
        db.collection(req.session.username, function(err, collection) {
          if(err) { return console.dir(err); }
          collection.count(function(err, count) {
            if (count != 0) {


              //update
              collection.findOne({}, function(err, item) {
                if (param.book == 'false'){
                  var endArr = item.favUsers.filter(function(value){return value.id != parseInt(param.id)});
                  collection.update({}, {$set:{favUsers:endArr}},{multi:true},function (err, numberUpdated){
                    return res.sendStatus(200);
                  });
                } else {
                  var currentUser = item.lastUsers.filter(function(value){return value.id == parseInt(param.id)});
                  var endArr = currentUser.concat(item.favUsers.filter(function(value){return value.id != parseInt(param.id)})).slice(0, 20);
                  collection.update({}, {$set:{favUsers:endArr}},{multi:true},function (err, numberUpdated){
                    return res.sendStatus(200);
                  });
                }

              });

            } else {
              return res.status(500).send({ error: 'Database problem!' });
            }
          });
        });
      });
    } catch (e) {
      console.log(e);
      return res.status(500).send({ error: 'Database problem!' });
    }

  //return res.sendStatus(200);
});

//Change parameters
router.post('/?', function (req, res) {
  try {
    var param = req.body, uri = "";
    console.log(param);
    if (["email", "language", "gender", "password"].indexOf(param.name) == -1) {
      return res.status(500).send({
        error: 'Wrong parameter!'
      });
    }
    var data = '{"userId": ' + param.userId + ', "' + param.name + '":"' + param.value + '"}';
    data = JSON.parse(data);
    uri = 'user-admin/edit/user/' + param.name;
    return res.locals._POST(uri, data, function (err, body) {
      if (!!err) {
        console.log(err);
        return res.status(500).send({
          error: 'Something failed!'
        });
      } else {
        return res.sendStatus(200);
      }
    });
  } catch (e) {
    return res.status(500).send({
      error: 'Something failed!'
    });
  }
});


// Read
router.get('/:id?', function(req, res) {
    try {
      var uri = 'user-admin/get/user/details?userId=' + req.params.id;
      res.locals._GET(uri, null, function(err, body){
          try {
            var user = JSON.parse(body).result;
            //user
            MongoClient.connect(config.mongo, function(err, db) {
              if (err) {
                throw err;
              }
              console.log("mongo connected ");
              db.collection(req.session.username, function(err, collection) {
                if(err) { return console.dir(err); }
                collection.count(function(err, count) {
                  var currentUser = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email:  user.email,
                    status: 0,
                    version: 0,
                    lastActive: user.lastActive
                  };

                  if (count == 0) {
                    //insert
                    var lastUser = {'lastUsers':[currentUser], 'favUsers':[]};
                    collection.insert(lastUser, function(err2, result) {
                        if(err) { return console.dir(err2); }
                        return res.render('user', { title: 'Found user', config:req.session.config, userName:req.session.username, user: user})
                    });
                  } else {
                    //update
                    collection.findOne({},{}, function(err, item) {
                      var endArr = [currentUser].concat(item.lastUsers.filter(function(value){return value.id != currentUser.id})).slice(0, 20);
                      if(item.favUsers.filter(function(value){return value.id == currentUser.id}).length>0){
                        user.fav = true;
                      };
                      collection.update({}, {$set:{lastUsers:endArr}},{multi:true},function (err, numberUpdated){
                        return res.render('user', { title: 'Found user', config:req.session.config, userName:req.session.username, user: user});
                      });
                    });
                  }
                });
              });
            });


          } catch (e){
            console.log(e);
            return res.render('users', { title: 'Found user', found: '0', total : '0', config:req.session.config, userName:req.session.username, users: []})
          }
        });

    } catch (e){
      console.log(e);
      return res.redirect("/");
    }

});

// Update
router.put('/:id?', function(req, res) {
  res.send('PUT request to homepage');
});

// Delete
router.delete('/:id?', function(req, res) {
  res.send('DELETE request to homepage');
});

module.exports = router;
