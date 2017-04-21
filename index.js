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


// var oauth2Client = new OAuth2(
//   YOUR_CLIENT_ID,
//   YOUR_CLIENT_SECRET,
//   YOUR_REDIRECT_URL
// );

var oauth2Client = new auth.OAuth2(YOUR_CLIENT_ID, YOUR_CLIENT_SECRET, YOUR_REDIRECT_URL);

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send'
];

var url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',
  // If you only need one scope you can pass it as a string
  scope: scopes,
  // Optional property that passes state parameters to redirect URI
  // state: { foo: 'bar' }
});

app.get('/', function (req, res) {
  //res.send('hey cattolica guys');
  console.log(url);
  // res.redirect(url);
  // res.end();
  res.statusCode = 302;
  res.setHeader("Location", url);
  res.end();
});


app.get('/oauth2callback', function (req, res) {
  console.log("CODE=> "+ req.query.code);
  oauth2Client.getToken(req.query.code, function (err, tokens) {
    console.log("TOKENS=> "+tokens);
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      oauth2Client.setCredentials(tokens);
      res.end(JSON.stringify(tokens));
    }
  });
});

app.get('/auth', function (req, res) {
  var accessToken = req.query.token;
  var refreshToken = req.query.refresh_token;
  // console.log('at => '+accessToken);
  // console.log('rt => '+refreshToken);

  // var accessToken = req.params.token;
  // var refreshToken = req.params.refresh_token;
  console.log('at => '+accessToken);
  console.log('rt => '+refreshToken);

  var credentials = {
      access_token: accessToken,
      refresh_token: refreshToken
  };
  oauth2Client.setCredentials(credentials);
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
          // var mR = JSON.stringify(messageResponse.payload.body);
          // var bodyString = new Buffer(mR.data, 'base64').toString("ascii");
          // console.log("BODY=> "+bodyString);
        });
      }
    }
  });
});

app.listen(5000, function () {

});
