'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

/*
* Handles socket.io
*/

var exports = module.exports = {};
var pThis = exports;

var config = require('../config.json');
var deployManager = require('./DeployManager');
var jenkinsManager = require('./JenkinsManager');

/*
* Initialize socket.io server and attach events
*
* @parameters {server} - http server
* @return void
*/
exports.init = function(server) {
  pThis.io = require('socket.io')(server, {
    pingInterval: 10000,
    pingTimeout: 5000,
    serveClient: false,
    cookie: false
  });

  require('socketio-auth')(pThis.io, {
    authenticate: pThis.authenticate,
    timeout: 1500 // Connection timeout
  });
}

/*
* Authenticates the client connecting
*
* @parameters {socket} - the connecting socket
* @parameters {data} - the connecting data
* @parameters {callback} - callback function
* @return void
*/
exports.authenticate = function(connectingSocket, data, callback){
  if(data == null || data.token == null) return callback('Missing connection params');
  if(config['SOCKET_IO_AUTHTOKEN'] != null && config['SOCKET_IO_AUTHTOKEN'].trim() != '' && data.token != config['SOCKET_IO_AUTHTOKEN']) return callback('Missing connection params');

  // Attach other socket events
  pThis.attachSocketEvents(connectingSocket);

  // Send connection info
  let deployId = deployManager.getDeployedVersion();
  if(deployId == null) deployId = 'None';

  // Send initial setup
  return callback(null, {
    jenkinsData: jenkinsManager.getJenkinsData(),
    deploymentStatus: deployManager.deploymentStatus,
    lastDeployMsg: deployManager.lastDesployMsg,
    deployUrl: config['DEPLOY_URL'],
    nextJenkinsCheck: {next: jenkinsManager.nextJenkinsCheck, tick: config['JENKINS_UPDATE_TIMER']},
    deployedBuild: deployId
  });
}

/*
* Attaches events to the socket
*
* @parameters {socket} - the socket
* @return void
*/
exports.attachSocketEvents = function(socket){
  // DEPLOYMENT EVENTS //
  socket.on('requestDeployment', (data, response) => {
    if(data == null || data.buildID == null) return;
    deployManager.scheduleDeployment(data.buildID, (err) => {
      return response({err: err});
    })
  });

  socket.on('cancelDeployment', (data, response) => {
    deployManager.cancelSchedule((err) => {
      return response({err: err});
    });
  });
}

/*
* Emits info to all the connected sockets or just the passed socket
*
* @parameters {socket} - the socket to sent to
* @parameters {event} - the socket event
* @parameters {data} - the socket data to send
* @return void
*/
exports.emit = function(socket, event, data){
  if(pThis.io == null) return;
  if(socket == null) return pThis.io.emit(event, data);
  socket.emit(event, data);
}
