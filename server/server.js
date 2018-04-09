'use strict';

var express = require('express');
var compression = require('compression');

var path = require('path');
var bodyParser = require('body-parser');

var fs = require('fs');
var http = require('http');
var https = require('https');

var app = express();

var colors = require('colors');

var JenkinsManager = require('./managers/JenkinsManager');
var DeployManager = require('./managers/DeployManager');
var SocketManager = require('./managers/SocketManager');

var config = require('./config.json');

var httpPort = process.env.PORT || 9900;
var httpsPort = process.env.PORT || 9905;

// Used for Gzipping all the resources
process.stdout.write("\u001b[2J\u001b[0;0H"); // Clear screen
console.log("  _____ ___ ___ _____ ___ _  _  ___          ___ _  _   _   __  __ ___ ___ ___");
console.log(" |_   _| __/ __|_   _|_ _| \\| |/ __|  ___   / __| || | /_\\ |  \\/  | _ ) __| _ \\");
console.log("   | | | _|\\__ \\ | |  | || .` | (_ | |___| | (__| __ |/ _ \\| |\\/| | _ \\ _||   /");
console.log("   |_| |___|___/ |_| |___|_|\\_|\\___|        \\___|_||_/_/ \\_\\_|  |_|___/___|_|_\\");
console.log("=================================================================================\n");

app.all('*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
  if (req.method.toLowerCase() === "options") return res.send(204);
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(compression());
app.use(express.static(path.join(__dirname, './static')));

// Server startup //
var privateKey;
var certificate;

try{
  privateKey = fs.readFileSync('/etc/letsencrypt/live/kromit.me/privkey.pem', 'utf8');
  certificate = fs.readFileSync('/etc/letsencrypt/live/kromit.me/cert.pem', 'utf8');
}catch(err){
  console.log('[SERVER]'.yellow +' Failed to find HTTPS certificate.'.magenta + ' [Disabled HTTPS]'.red);
}

// Start jenkins manager
process.stdout.write('[JenkinsManager]'.yellow + ' Initializing JenkinsManager..     '.magenta);
JenkinsManager.init(() => {
  console.log(colors.green('[OK]'));

  // INIT SERVER //
  var httpServer = http.createServer(app);
  httpServer.listen(httpPort, function() {
    console.log('[SERVER]'.yellow +' listening at port %d', httpPort);
  });

  if(privateKey != null && certificate != null){
    var httpsServer = https.createServer({key: privateKey, cert: certificate}, app);
    httpsServer.listen(httpsPort, function() {
      console.log('[SERVER HTTPS]'.yellow +' listening at port %d', httpsPort);
    });
  }
  // INIT SERVER //

  // INIT MANAGERS
  SocketManager.init(httpsServer || httpServer);
  DeployManager.init();
  // INIT MANAGERS //
});

// ON EXIT //
process.on('exit', function() {

});
// ON EXIT //
