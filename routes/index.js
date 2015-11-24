var express = require('express');
var router = express.Router();

var Promise = require("bluebird");

var nforce = require('nforce');
var org = require('../lib/connection');

var atoken;

function requireLogin (req, res, next) {
  if (!req.session.atoken) {
    res.redirect('/login/');
  } else {
    atoken = req.session.atoken;
    next();
  }
};

function requireSupport (req, res, next) {
  if (!req.session.support) {
    console.log('User No Eligible for Support!!');    
    res.end;
  } else {    
    next();
  }
};
/**************************************TEST START*****************************************************/
router.get('/table/', function(req, res, next) {

  org.query({ query: "Select Id, CaseNumber, Subject From Case Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('datatable', { records: results.records });
    });

});
router.get('/table2/', function(req, res, next) {

  org.query({ query: "Select Id, CaseNumber, Subject From Case Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('datatable2', { records: results.records });
    });

});

/**************************************TEST START*****************************************************/

/**************************************CASES START*****************************************************/
/* list page. */
router.get('/case/', requireLogin, function(req, res, next) {

  org.query({ query: "Select Id, CaseNumber, Subject From Case Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('caselist', { records: results.records });
    });

});
/* Display new form */
router.get('/case/new', function(req, res, next) {
  res.render('newcase');
});

/* Creates a new record */
router.post('/case/', function(req, res, next) {
  console.log('Resquest Body: '+req.body);

  var cs = nforce.createSObject('Case');
  cs.set('Subject', req.body.subject);
  cs.set('Priority', req.body.priority);
  cs.set('Description', req.body.description);

  org.insert({ sobject: cs })
    .then(function(chamado){
      res.redirect('/case/' + chamado.id);
    })
});

/* Record detail page */
router.get('/case/:id', function(req, res, next) {
  Promise.join(
    org.getRecord({ type: 'case', id: req.params.id }),
    org.query({ query: "Select Id, Name, Email, Title, Phone From CaseComment where CaseId = '" + req.params.id + "'"}),
    function(account, contacts, opportunities) {
        res.render('show', { record: account, contacts: contacts.records, opps: opportunities.records });
  });


  org.getRecord({ type: 'case', id: req.params.id })
    .then(function(chamado){
      res.render('showcase', { record: chamado });
    });
});
/****************************************************CASES END**********************************************/

/****************************************************PROJECT START**********************************************/
/* list page. */
router.get('/project/', requireLogin, function(req, res, next) {  
  org.query({ query: "Select Id,Name,Type__c,Vision__c,Constrains__c,Estimated_Price__c,Actual_Price__c,Real_Price__c, Estimated_Story_Points__c,Price_per_SP__c, Safety_Buffer__c,Story_Points__c,Story_Points_Done__c, Status__c, Progress__c From Project__c Where Account__r.aToken__c = '" +atoken+ "' Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('projectlist', { records: results.records });
    });

});

/* Record detail page */
router.get('/project/:id', requireLogin, function(req, res, next) {  
  // query for record, contacts and opportunities
  Promise.join(
    org.query({ query: "Select Id,Name,Type__c,isProject__c, Active__c,Start_Date_Formatted__c,End_Date_Formatted__c,Start_Date__c,End_Date__c,Vision__c,Constrains__c,Estimated_Price__c,Actual_Price__c,Real_Price__c, Estimated_Story_Points__c,Price_per_SP__c, Safety_Buffer__c,Story_Points__c,Story_Points_Done__c, Status__c, Progress__c From Project__c Where id = '"+req.params.id+"' and Account__r.aToken__c = '" +atoken+ "' LIMIT 1" }),
    org.query({ query: "Select Id, Name, Progress__c, Story_Points__c From Topic__c where Project__c = '" + req.params.id + "' and Project__r.Account__r.aToken__c = '" +atoken+ "'"}),
    org.apexRest({uri:'Project', urlParams: {id: req.params.id , atoken: atoken} }),
    function(project, topics, months) {
        console.log('months--> ' +JSON.stringify(months));
        console.log('topics--> ' +JSON.stringify(topics));
        res.render('projectdetail', { record: project.records[0], topics: topics.records, months: months.meses });
    });
});

/****************************************************PROJECT END**********************************************/

/****************************************************TOPIC START**********************************************/
/* list page. */
router.get('/topic/', requireLogin, function(req, res, next) {

  org.query({ query: "Select Id,Name,Project__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c, Progress__c From Topic__c Where Project__r.Account__r.aToken__c = '" +atoken+ "' Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('topiclist', { records: results.records });
    });

});

/* Record detail page */
router.get('/topic/:id', requireLogin, function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.query({ query: "Select Id,Name,Project__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c, Progress__c From Topic__c Where id = '"+req.params.id+"' and Project__r.Account__r.aToken__c = '" +atoken+ "' LIMIT 1" }),
    org.query({ query: "Select Id, Name, Topic__c, Progress__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c From Epic__c where Topic__c = '" + req.params.id + "' and Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "' "}),
    function(topic, epics) {
        res.render('topicdetail', { record: topic.records[0], epics: epics.records });
    });
});

/****************************************************TOPIC END**********************************************/

/****************************************************EPIC START**********************************************/
/* list page. */
router.get('/epic/', requireLogin, function(req, res, next) {

  org.query({ query: "Select Id, Name, Topic__c, Progress__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c From Epic__c Where Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "' Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('epiclist', { records: results.records });
    });

});

/* Record detail page */
router.get('/epic/:id', requireLogin, function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.query({ query: "Select Id, Name, Topic__c, Progress__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c From Epic__c Where id = '" +req.params.id+ "' and Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "' LIMIT 1" }),
    org.query({ query: "Select Id, Name, Story_Points__c, Status__c From Item__c where Epic__c = '" + req.params.id + "' and Epic__r.Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "'"}),
    function(epic, itens) {
        res.render('epicdetail', { record: epic.records[0], itens: itens.records });
    });
});

/****************************************************EPIC END**********************************************/

/****************************************************ITEM START**********************************************/
/* list page. */
router.get('/item/', requireLogin, function(req, res, next) {

  org.query({ query: "Select Id, Name, Subject__c, Priority__c, Sprint__c, Story_Points__c, Status__c, Sprint_Name__c, Epic_Name__c, Project_Name__c From Item__c Where Epic__r.Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "' Order By LastModifiedDate DESC" })
    .then(function(results){
      var button1, button2;
      if(req.session.support == true){
        button1 = 'slds-hide';//hide inactive button
        button2 = '';//show active button
      }else{
        button1 = '';
        button2 = 'slds-hide';
      }
      res.render('itemlist', { records: results.records , button1: button1 , button2: button2 });
    });

});

/* Display new form */
router.get('/item/new', requireSupport, requireLogin, function(req, res, next) {
  res.render('itemnew');
});

/* Creates a new the record */
router.post('/item/new', requireSupport, requireLogin, function(req, res, next) {

  var it = nforce.createSObject('Item__c');
  it.set('Subject__c', req.body.subject);
  it.set('Priority_user_input__c', req.body.priority);
  it.set('Description__c', req.body.description);
  it.set('Contact__c', req.session.contactid);
  it.set('Origem__c', 'Online'); 
  console.log('New Item--> ' + JSON.stringify(it));
  org.insert({ sobject: it })
    .then(function(item){
      res.redirect('/item/' + item.id);
    })
});

/* Record detail page */
router.get('/item/:id', requireLogin, function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.query({ query: "Select Id, Name, Subject__c, Description__c, Assumptions__c, Priority__c, Story_Points__c, Status__c, Sprint_Name__c, Epic_Name__c, Project_Name__c, Good_Cases__c, Bad_Cases__c From Item__c Where id = '" +req.params.id+ "' and Epic__r.Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "' LIMIT 1" }),
    org.query({ query: "Select Id, Name From Comment__c where Item__c = '" + req.params.id + "' and Item__r.Epic__r.Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "' "}),
    function(item, comments ) {
        res.render('itemdetail', { record: item.records[0], comments: comments.records });
    });
});




/****************************************************ITEM END**********************************************/

/****************************************************COMMENT START**********************************************/


/****************************************************COMMENT END**********************************************/

/****************************************************SPRINT START**********************************************/
/* list page. */
router.get('/sprint/', requireLogin, function(req, res, next) {

  org.query({ query: "Select Id, Name, Start_Date__c, Deploy_Date__c From Sprint__c Where Id IN (Select Sprint__c From Item__c Where Epic__r.Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "') Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('sprintlist', { records: results.records });
    });

});

/* Record detail page */
router.get('/sprint/:id', requireLogin, function(req, res, next) {
  // query
  Promise.join(
    org.query({ query: "Select Name, Start_Date__c, Deploy_Date__c From Sprint__c Where Id = '" +req.params.id+ "' and Id IN (Select Sprint__c From Item__c Where Epic__r.Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "') LIMIT 1" }),
    org.query({ query: "Select Id, Name, Status__c, Story_Points__c, Epic_Name__c, Project_Name__c From Item__c where Sprint__c = '" + req.params.id + "' and Epic__r.Topic__r.Project__r.Account__r.aToken__c = '" +atoken+ "' "}),
    function(sprint, itens ) {
        res.render('sprintdetail', { record: sprint.records[0], itens: itens.records });
    });
});

/****************************************************SPRINT END**********************************************/

/****************************************************LOGIN START**********************************************/

router.get('/login/', function(req, res){
  res.render('login');
  /*var html = '<form action="/login/" method="post">' +
             'Your name: <input type="text" name="userName"><br>' +
             'Your password: <input type="text" name="pass"><br>' +
             '<button type="submit">Submit</button>' +
             '</form>';

  if (req.session.atoken) {
    html += '<br>Your atoken from your session is: ' + req.session.atoken;
  }
  if (req.session.msg) {
    html += '<br>Error: ' + req.session.msg;
  }

  res.send(html);*/

});

router.post('/login/', function(req, res){
  var atoken;
  org.query({ query: "Select Id, Name, Account.Eligible_for_Support__c, Account.atoken__c From Contact where username__c = '" + req.body.username + "'and password__c =  '" + req.body.password + "' LIMIT 1"})
    .then(function(result){      
      console.log('result-->' + JSON.stringify(result));
      console.log('result.records.length-->' + result.records.length);
      if (result.totalSize != 0){
        result3 = JSON.stringify(result);
        result3 = JSON.parse(result3);
        console.log('records[0].name -->' + result3.records[0].name);     
        req.session.atoken = result3.records[0].account.aToken__c;
        req.session.support = result3.records[0].account.Eligible_for_Support__c;
        req.session.contactid = result3.records[0].id;
        console.log('set session-->' + JSON.stringify(req.session));
        //req.session.msg = null;
        res.redirect('/item/');
      }
      else {
        req.session.atoken = null;
        req.session.support = null;
        req.session.contactid =  null;
        req.session.destroy;
        console.log('destroy session-->' + JSON.stringify(req.session));
        //req.session.msg = 'Username or password not valid';
        res.render('login',  { msg: 'Username or password not valid. If the problem persists contact Enigen Support by other means.' });
      }           
    })
});

router.get('/logout/', function(req, res){
  req.session.destroy;
  res.redirect('/login/');
});

/****************************************************LOGIN END**********************************************/


/****************************************************ACCOUNT START**********************************************/
/* home page. */
router.get('/', function(req, res, next) {

  org.query({ query: "Select Id, Name, Type, Industry From Account Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('index', { records: results.records });
    });

});

/* Display new account form */
router.get('/new', function(req, res, next) {
  res.render('new');
});

/* Creates a new the record */
router.post('/', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Name', req.body.name);
  acc.set('Industry', req.body.industry);
  acc.set('Type', req.body.type);
  acc.set('AccountNumber', req.body.accountNumber);
  acc.set('Description', req.body.description);

  org.insert({ sobject: acc })
    .then(function(account){
      res.redirect('/' + account.id);
    })
});


/* Record detail page */
router.get('/:id', function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.getRecord({ type: 'account', id: req.params.id }),
    org.query({ query: "Select Id, Name, Email, Title, Phone From Contact where AccountId = '" + req.params.id + "'"}),
    org.query({ query: "Select Id, Name, StageName, Amount, Probability From Opportunity where AccountId = '" + req.params.id + "'"}),
    function(account, contacts, opportunities) {
        res.render('show', { record: account, contacts: contacts.records, opps: opportunities.records });
    });
});

/* Display record update form */
router.get('/:id/edit', function(req, res, next) {
  org.getRecord({ id: req.params.id, type: 'Account'})
    .then(function(account){
      res.render('edit', { record: account });
    });
});

/* Display record update form */
router.get('/:id/delete', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Id', req.params.id);

  org.delete({ sobject: acc })
    .then(function(account){
      res.redirect('/');
    });
});

/* Updates the record */
router.post('/:id', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Id', req.params.id);
  acc.set('Name', req.body.name);
  acc.set('Industry', req.body.industry);
  acc.set('Type', req.body.type);
  acc.set('AccountNumber', req.body.accountNumber);
  acc.set('Description', req.body.description);

  org.update({ sobject: acc })
    .then(function(){
      res.redirect('/' + req.params.id);
    })
});
/****************************************************ACCOUNT END**********************************************/



// Expose router
module.exports = router;
