console.log('index.js--> start');
console.log('index.js--> var raygun = require(raygun);');
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({ apiKey: '8iA/gZwcXIIvak6Q1/4e4w==' });

var express = require('express');
var multer  = require('multer');
var upload = multer({
  limits: {fileSize: 5000000, files:1},
})

var router = express.Router();

var Promise = require("bluebird");

var fs = require("fs");

var nforce = require('nforce');

var org = require('../lib/connection');

var username, atoken;

console.log('index.js--> requireLogin');
function requireLogin (req, res, next) {
  if (!req.session.username) {
    res.redirect('/login/');
  } else {
    username = req.session.username;
    atoken = req.session.atoken;
    next();
  }
};

console.log('index.js--> requireSupport');
function requireSupport (req, res, next) {
  if (!req.session.support) {
    console.log('User No Eligible for Support!!');    
    res.end;
  } else {    
    next();
  }
};

raygunClient.user = function (req, res, next) {
  console.log('index.js-->raygunClient.user: ' +username);
  return username;  
}
/*
try{  
  throw new Error('Router!');
}catch(err){ 
  console.log('index.js-->raygunClient.send(err);');
  raygunClient.send(err);
}*/

/* home page. */
router.get('/', function(req, res, next) {
  res.redirect('login');
});

/****************************************************PROJECT START**********************************************/
/* list page. */
router.get('/project/', requireLogin, function(req, res, next) {  
  org.query({ query: "Select Id,Name,Type__c, Status_formula__c, Vision__c,Constrains__c,Estimated_Price__c,Actual_Price__c,Real_Price__c, Estimated_Story_Points__c,Price_per_SP__c, Safety_Buffer__c,Story_Points__c,Story_Points_Done__c, Progress__c From Project__c Where Account__r.atoken__c = '" +atoken+ "' Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('projectlist', { records: results.records });
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });
});

/* Record detail page */
router.get('/project/:id', requireLogin, function(req, res, next) {  
  // query for record, contacts and opportunities
  Promise.join(
    org.query({ query: "Select Id,Name,Type__c,isProject__c ,Start_Date_Formatted__c,End_Date_Formatted__c,Start_Date__c,End_Date__c,Vision__c,Constrains__c,Estimated_Price__c,Actual_Price__c,Real_Price__c, Estimated_Story_Points__c,Price_per_SP__c, Safety_Buffer__c,Story_Points__c,Story_Points_Done__c, Status_formula__c, Progress__c From Project__c Where id = '"+req.params.id+"' and Account__r.atoken__c = '" +atoken+ "' LIMIT 1" }),
    org.query({ query: "Select Id, Name, Progress__c, Story_Points__c From Topic__c where Project__c = '" + req.params.id + "' and Project__r.Account__r.atoken__c = '" +atoken+ "'"}),
    org.apexRest({uri:'Project', urlParams: {id: req.params.id , atoken: atoken} }),
    function(project, topics, months) {
        console.log('months--> ' +JSON.stringify(months));
        console.log('topics--> ' +JSON.stringify(topics));
        res.render('projectdetail', { record: project.records[0], topics: topics.records, months: months.meses });
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
      // res.render('error', {
      //   message: 'Erro processing your request. Please try later.',
      //   error: {}
      //   });
    });
});

/****************************************************PROJECT END**********************************************/

/****************************************************TOPIC START**********************************************/
/* list page. */
router.get('/topic/', requireLogin, function(req, res, next) {
  org.query({ query: "Select Id,Name,Project__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c, Progress__c From Topic__c Where Project__r.Account__r.atoken__c = '" +atoken+ "' and Name != 'Default' Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('topiclist', { records: results.records });
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });

});

/* Record detail page */
router.get('/topic/:id', requireLogin, function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.query({ query: "Select Id,Name,Project__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c, Progress__c From Topic__c Where id = '"+req.params.id+"' and Project__r.Account__r.atoken__c = '" +atoken+ "' LIMIT 1" }),
    org.query({ query: "Select Id, Name, Topic__c, Progress__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c From Epic__c where Topic__c = '" + req.params.id + "' and Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "' "}),
    function(topic, epics) {
        res.render('topicdetail', { record: topic.records[0], epics: epics.records });
  }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });
});

/****************************************************TOPIC END**********************************************/

/****************************************************EPIC START**********************************************/
/* list page. */
router.get('/epic/', requireLogin, function(req, res, next) {

  org.query({ query: "Select Id, Name, Topic__c, Progress__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c From Epic__c Where Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "' and Name != 'Default' Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('epiclist', { records: results.records });
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });
});

/* Record detail page */
router.get('/epic/:id', requireLogin, function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.query({ query: "Select Id, Name, Topic__c, Progress__c,Description__c, Assumptions__c, Story_Points__c,Story_Points_Done__c From Epic__c Where id = '" +req.params.id+ "' and Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "' LIMIT 1" }),
    org.query({ query: "Select Id, Name, Subject__c, Story_Points__c, Status__c From Item__c where Epic__c = '" + req.params.id + "' and Epic__r.Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "'"}),
    function(epic, itens) {
        res.render('epicdetail', { record: epic.records[0], itens: itens.records });
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });
});

/****************************************************EPIC END**********************************************/

/****************************************************ITEM START**********************************************/
/* list page. */
router.get('/item/', requireLogin, function(req, res, next) {
  org.query({ query: "Select Id, Stage__c, Name, isProject__c, Project_Id__c, Subject__c, Priority__c, Sprint__c, Story_Points__c, Status__c, Sprint_Name__c, Epic_Name__c, Project_Name__c From Item__c Where Epic__r.Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "' Order By LastModifiedDate DESC" })
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
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
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
  it.set('Origem__c', 'Portal'); 
  console.log('New Item--> ' + JSON.stringify(it));

  org.insert({ sobject: it })
    .then(function(item){
      res.redirect('/item/' + item.id);
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });
});

/* Record detail page */
router.get('/item/:id', requireLogin, function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.query({ query: "Select Id, Name,isSupport__c, Sprint__c, Subject__c, Description__c, Assumptions__c, Priority__c, Story_Points__c, Status__c, Sprint_Name__c, Epic_Name__c, Project_Name__c, Good_Cases__c, Bad_Cases__c From Item__c Where id = '" +req.params.id+ "' and Epic__r.Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "' LIMIT 1" }),
    org.query({ query: "Select Id, Name, Body__c, Item__c, Created_by__c, CreatedDate_Formatted__c From Comment__c where Item__c = '" + req.params.id + "' and Item__r.Epic__r.Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "' and Private__c = false Order by CreatedDate desc"}),
    org.query({ query: "Select Id, Name, Description From Attachment where ParentId = '" + req.params.id + "' Order by CreatedDate desc"}),
    function(item, comments, attachments ) {
        res.render('itemdetail', { record: item.records[0], comments: comments.records, attachments: attachments.records });
  }).catch( function(e) {
    console.log(e);
    raygunClient.send(e);
    next(e);
  });
});




/****************************************************ITEM END**********************************************/

/****************************************************COMMENT START**********************************************/
/* Display new form */
router.get('/comment/new', requireSupport, requireLogin, function(req, res, next) {
  console.log('req.query.itemid--> ' + req.query.itemid);  
  res.render('commentnew' , { itemid: req.query.itemid });
});

/* Creates a new the record */
router.post('/comment/new', requireSupport, requireLogin, function(req, res, next) {
  console.log('req.body.itemid--> ' + req.body.itemid);
  var itid = req.body.itemid;    
  var comment = nforce.createSObject('Comment__c');
  comment.set('Body__c', req.body.commentbody);
  comment.set('Item__c', itid);
  comment.set('Contact__c', req.session.contactid);
  comment.set('Origem__c', 'Portal'); 
  console.log('New Comment--> ' + JSON.stringify(comment));

  org.insert({ sobject: comment })
    .then(function(item){
      res.redirect('/item/' + itid);
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });
});

/****************************************************COMMENT END**********************************************/

/****************************************************ATTACHMENT START**********************************************/
/* Display new form */
router.get('/attachment/new', requireLogin, function(req, res, next) {
  console.log('req.query.itemid--> ' + req.query.itemid);  
  res.render('attachmentnew' , { itemid: req.query.itemid });
});

/* Creates a new the record */
router.post('/attachment/new', requireLogin, upload.single('anexo'), function(req, res, next) {
  var description = req.body.description;
  var originalname = req.file.originalname;
  var itid = req.body.itemid;
  console.log('description--> ' + description);
  console.log('originalname--> ' + originalname);
  console.log('itid--> ' + itid);
  //res.json(req.file.buffer);   

  var att = nforce.createSObject('Attachment', {
    Name: originalname,
    Description: description,
    ParentId: itid,
    attachment: {
      fileName: originalname,      
      body: req.file.buffer
      }
    });

  org.insert({ sobject: att })
    .then(function(attachment){
      res.redirect('/item/' + itid);
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    }); 
 
});

router.get('/attachment/download', requireLogin, function(req, res, next){
  var attId = req.query.attid;
  var attname = req.query.attname;
  console.log('attId--> ' + attId); 
  console.log('attname--> ' + attname); 

  org.getAttachmentBody({ id: attId }, function(err, resp) {
      if(err) {
        console.log('temos um errooo!');
        console.error(err);
        throw(err);
      } else {
        //res.json(resp);
        res.setHeader('Content-disposition', 'attachment; filename='+attname);
        //res.download(resp);        
        //res.fileSend(resp);
        res.write(resp, 'binary');
        res.end();
      }
    }); 
});

/****************************************************ATTACHMENT END**********************************************/

/****************************************************FILEUPLOAD START**********************************************/
/* Display new form */
router.get('/fileupload/new', function(req, res, next) {
    
  res.render('fileupload');
});

/* Creates a new the record */
router.post('/fileupload/new',upload.single('anexo'), function(req, res, next) {
  var description = req.body.description;
  var originalname = req.file.originalname;
  console.log('description--> ' + description);
  console.log('originalname--> ' + originalname);
  //res.json(req.file.buffer);
    
  var itid = 'a0K1a000003hGBdEAM';  

  var att = nforce.createSObject('Attachment', {
    Name: originalname,
    Description: description,
    ParentId: itid,
    attachment: {
      fileName: originalname,      
      body: req.file.buffer
      }
    });

  org.insert({ sobject: att })
    .then(function(attachment){
      res.redirect('/item/' + itid);
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });
 
 
});

/****************************************************FILEUPLOAD END**********************************************/

/****************************************************SPRINT START**********************************************/
/* list page. */
router.get('/sprint/', requireLogin, function(req, res, next) {

  org.query({ query: "Select Id, Name, Start_Date_Formatted__c, Deploy_Date_Formatted__c, End_Date_Formatted__c From Sprint__c Where Id IN (Select Sprint__c From Sprint_Item__c Where Item__r.Epic__r.Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "') Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('sprintlist', { records: results.records });
    }).catch( function(e) {
      console.log(e);
      raygunClient.send(e);
      next(e);
    });

});

/* Record detail page */
router.get('/sprint/:id', requireLogin, function(req, res, next) {
  // query
  Promise.join(
    org.query({ query: "Select Name, Start_Date_Formatted__c, Deploy_Date_Formatted__c, End_Date_Formatted__c From Sprint__c Where Id = '" +req.params.id+ "' and Id IN (Select Sprint__c From Sprint_Item__c Where Item__r.Epic__r.Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "') LIMIT 1" }),
    org.query({ query: "Select Id, Item__c, Item_Name__c, Item_Subject__c, Status__c, Story_Points__c, Epic_Name__c, Project_Name__c From Sprint_Item__c where Sprint__c = '" + req.params.id + "' and Item__r.Epic__r.Topic__r.Project__r.Account__r.atoken__c = '" +atoken+ "' "}),
    function(sprint, itens ) {
        res.render('sprintdetail', { record: sprint.records[0], itens: itens.records });
  }).catch( function(e) {
    console.log(e);
    raygunClient.send(e);
    next(e);
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

  if (req.session.username) {
    html += '<br>Your username from your session is: ' + req.session.username;
  }
  if (req.session.msg) {
    html += '<br>Error: ' + req.session.msg;
  }

  res.send(html);*/

});

router.post('/login/', function(req, res, next){
  //var username, atoken;
  org.query({ query: "Select Id, Name, Account.Eligible_for_Support__c, Username__c, Account.aToken__c From Contact where Portal_User__c = true and username__c = '" + req.body.username + "'and password__c =  '" + req.body.password + "' LIMIT 1"})
    .then(function(result){      
      console.log('result-->' + JSON.stringify(result));
      console.log('result.records.length-->' + result.records.length);
      if (result.totalSize != 0){
        result3 = JSON.stringify(result);
        result3 = JSON.parse(result3);
        console.log('records[0].name -->' + result3.records[0].name); 
        req.session.atoken = result3.records[0].account.aToken__c;    
        req.session.username = result3.records[0].username__c;
        req.session.support = result3.records[0].account.Eligible_for_Support__c;
        req.session.contactid = result3.records[0].id;
        console.log('set session-->' + JSON.stringify(req.session));
        //req.session.msg = null;
        res.redirect('/item/');
      }else {
        req.session.atoken = null;
        req.session.username = null;
        req.session.support = null;
        req.session.contactid =  null;
        req.session.destroy;
        console.log('destroy session-->' + JSON.stringify(req.session));
        //req.session.msg = 'Username or password not valid';
        res.render('login',  { msg: 'Username or password not valid. If the problem persists contact Enigen Support by other means.' });
      }      
    }).catch(function(e){
      console.log(e);
      raygunClient.send(e);
      next(e);    
    });
});

router.get('/logout/', function(req, res){
  req.session.destroy;
  res.redirect('/login/');
});

/****************************************************LOGIN END**********************************************/


/****************************************************ACCOUNT START**********************************************/
/* home page. 
router.get('/', function(req, res, next) {

  org.query({ query: "Select Id, Name, Type, Industry From Account Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('index', { records: results.records });
    });

});
*/
/* Display new account form 
router.get('/new', function(req, res, next) {
  res.render('new');
});
*/
/* Creates a new the record 
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
*/

/* Record detail page 
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
*/
/* Display record update form 
router.get('/:id/edit', function(req, res, next) {
  org.getRecord({ id: req.params.id, type: 'Account'})
    .then(function(account){
      res.render('edit', { record: account });
    });
});
*/
/* Display record update form 
router.get('/:id/delete', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Id', req.params.id);

  org.delete({ sobject: acc })
    .then(function(account){
      res.redirect('/');
    });
});
*/
/* Updates the record 
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
*/
/****************************************************ACCOUNT END**********************************************/
/**************************************TEST START*****************************************************/
/*
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
*/
/**************************************TEST START*****************************************************/

/**************************************CASES START*****************************************************/
/* list page. 
router.get('/case/', requireLogin, function(req, res, next) {

  org.query({ query: "Select Id, CaseNumber, Subject From Case Order By LastModifiedDate DESC" })
    .then(function(results){
      res.render('caselist', { records: results.records });
    });

});
*/
/* Display new form 
router.get('/case/new', function(req, res, next) {
  res.render('newcase');
});
*/
/* Creates a new record
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
 */
/* Record detail page 
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
*/
/****************************************************CASES END**********************************************/


// Expose router
module.exports = router;
console.log('index.js--> end');