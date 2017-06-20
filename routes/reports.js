var express = require('express');
var router  = express.Router();
var MongoClient = require('mongodb').MongoClient;
var config  = require('./../config');

/***************
GET users listing.
***************/
router.get('/', function(req, res, next) {
  return res.render('reports', { title: 'Daily report for ', found: '0', total : '0', report: 'true', config:req.session.config, userName:req.session.username, reports: []})
});

/***************
GET plan detail by id
***************/
router.get('/single-plan-stats?', function(req, res, next) {
  var uri, planId, planDate;
  console.log("single-plan-stats ", req.query);

  if (!!req.query.planId) {
    planId = req.query.planId;
    planDate = Date.parse(req.query.date);
    uri = 'subscription-reports/single-plan-stats?planId=' + planId;

    res.locals._GET(uri, null, function(err, body){
      function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }


      try {
        console.log(body);
        var reports = JSON.parse(body).result;
        var len = reports.freeTrials.length;
        var label = [];

        for (var i = 0; i< len; i++){
          var date = addDays(planDate, i-len+1);
          label.push(( (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear()));
        }
        reports.label= label;
        reports.freeTrials = reports.freeTrials.reverse();
        reports.paid = reports.paid.reverse();


        res.setHeader('Content-Type', 'application/json');
        res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", -1);

        res.send(JSON.stringify({
            label:reports.label,
            trial:reports.freeTrials,
            paid: reports.paid}, null, 3));

      } catch (e){
        console.log(e);
        return res.status(500).send({ error: "Error: single-plan-stats." });
      }
    });
  } else {
    return res.status(500).send({ error: "Error: Wrong plan id." });
  }

});

/***************
GET plan list by last date
***************/
router.post('/', function(req, res, next) {
  var uri, report_date = req.body.date;

  if (!!req.body.date) {
    uri = 'subscription-reports/plan-stats?date=' + req.body.date;

    res.locals._GET(uri, null, function(err, body){
      req.session.report_date = report_date;
      try {
        var reports = JSON.parse(body).result;
        return res.render('reports', { title: 'Daily report for '+report_date,report_date:report_date, found: '0', total : '0', report: 'true', config:req.session.config, userName:req.session.username, reports: reports})
      } catch (e){
        console.log(e);
        return res.render('reports', { title: 'Daily report for '+report_date, found: '0', total : '0', report: 'true', config:req.session.config, userName:req.session.username, reports: []})
      }
    });
  } else {
    return res.redirect("/");
  }
});

module.exports = router;
