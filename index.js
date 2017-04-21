var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var express = require('express');
var app = express();
var googleAuth = require('google-auth-library');
var auth = new googleAuth();
var urlDecoder = require('base64-url');

var YOUR_CLIENT_ID = "114086584296-3um4j3ne41m27qtcqg4bupc10lqnk1mn.apps.googleusercontent.com";
var YOUR_CLIENT_SECRET = "NFXIFTuqMS74Crid-CiiD9N_";
var YOUR_REDIRECT_URL = "http://cattolica.crispybacon.us:5000/oauth2callback";
var oauth2Client = new auth.OAuth2(YOUR_CLIENT_ID, YOUR_CLIENT_SECRET, YOUR_REDIRECT_URL);

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send'
];

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

app.get('/', function (req, res) {
  console.log(url);
  res.statusCode = 302;
  res.setHeader("Location", url);
  res.end();
});

app.get('/oauth2callback', function (req, res) {
  console.log("CODE=> "+ req.query.code);
  oauth2Client.getToken(req.query.code, function (err, tokens) {
    console.log("TOKENS=> "+tokens);
    if (!err) {
      console.log('tokens=>  '+ JSON.stringify(tokens));
      oauth2Client.setCredentials(tokens);
      res.end(JSON.stringify(tokens));
    }
  });
});

app.get('/auth/10', function(req,res){
  var gmail = google.gmail('v1');
  gmail.users.messages.list({
    auth: oauth2Client,
    userId: 'me',
    maxResults: 1
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      res.json({result:"error", data:err});
    }
    console.log("RESPONSE => " + JSON.stringify(response));
    var messages = response.messages;
    if (messages.length == 0) {
      console.log('No messages found.');
    } else {
      console.log('Messages:');
      for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        console.log('- %s', message.id);
        var message = messages[i];
        gmail.users.messages.get({
          auth: oauth2Client,
          userId: 'me',
          id: message.id,
          format: "raw"
        }, function(err, messageResponse) {
          console.log("SNIPPET=> "+JSON.stringify(messageResponse.snippet));
          console.log("LabelsIDs=> "+JSON.stringify(messageResponse.labelIds));
          //console.log("MESSAGE=> "+JSON.stringify(messageResponse));
          var result = urlDecoder.decode(messageResponse.raw);
          console.log(result);
          res.json({result:"success"});
        });
      }
    }
  });
});

app.get('/auth', function (req, res) {
  var code = req.query.code;
  oauth2Client.getToken(req.query.code, function (err, tokens) {
    console.log("TOKENS=> "+tokens);
    if (!err) {
      console.log('tokens=>  '+ JSON.stringify(tokens));
      oauth2Client.setCredentials(tokens);
      var gmail = google.gmail('v1');
      gmail.users.messages.list({
        auth: oauth2Client,
        userId: 'me',
        maxResults: 1
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          res.json({result:"error", data:err});
        }
        console.log("RESPONSE => " + JSON.stringify(response));
        var messages = response.messages;
        if (messages.length == 0) {
          console.log('No messages found.');
        } else {
          console.log('Messages:');
          for (var i = 0; i < messages.length; i++) {
            var message = messages[i];
            console.log('- %s', message.id);
            var message = messages[i];
            gmail.users.messages.get({
              auth: oauth2Client,
              userId: 'me',
              id: message.id,
              format: "raw"
            }, function(err, messageResponse) {
              console.log("SNIPPET=> "+JSON.stringify(messageResponse.snippet));
              console.log("LabelsIDs=> "+JSON.stringify(messageResponse.labelIds));
              //console.log("MESSAGE=> "+JSON.stringify(messageResponse));
              var result = urlDecoder.decode(messageResponse.raw);
              console.log(result);
              res.json({result:"success"});
            });
          }
        }
      });
    }else{
      console.log(err);
    }
  });
});

var onesignal = require('node-opensignal-api');
var onesignal_client = onesignal.createClient();
var restApiKey = 'Y2U0Mjg5YmEtY2U5NC00NzQyLTgzNWUtOWNjOTY0OWFhOGE4';

app.get("/send",function(req,res){
  sendNotification("",function(response){
    res.end(response);
  });
});

function sendNotification(message,callback){
  var params = {
      app_id: 'f95c5a82-2a74-40d2-9f77-47177bf782f8',
      included_segments:["All"],
      headings: {
          "en": "English Title",
          "es": "Spanish Title",
          "it": "Italian title"
        },
      contents: {
          'en': 'Notification body',
          'es': 'Cuerpo de la notificación',
          'it': 'Corpo della notifica'
      }
  };
  onesignal_client.notifications.create(restApiKey, params, function (err, response) {
      if (err) {
      	console.log('Encountered error', err);
        callback(response);
    	} else {
      	console.log(response);
        callback("");
    	}
  });
}

app.listen(5000, function () {

});
