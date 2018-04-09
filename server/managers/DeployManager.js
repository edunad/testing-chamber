"use strict";

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

/*
* Handles Deployment
*/

var exports = module.exports = {};
var pThis = exports;

var fs = require('fs-extra');
var path = require('path');
var request = require('request');
var colors = require('colors');
var readline = require('readline');
var {spawn} = require('child_process');
var extract = require('extract-zip');

var config = require('../config.json');

var socketManager = require('./SocketManager');
var jenkinsManager = require('./JenkinsManager');

/* =========================
Deployment ======================== */
const DEPLOY_STATUS = Object.freeze({
  IDLE: 0,
  SCHEDULE: 1,
  DEPLOYING: 2
});

/*
* Initialize the deploy manager
*
* @return void
*/
exports.init = function(){
  if (!fs.existsSync('./temp'))
    fs.mkdirSync('./temp');

  pThis.deployTimer = null;
  pThis.deploymentStatus = {
    status: DEPLOY_STATUS.IDLE,
    deployID: null,
    startTime: null
  };

  pThis.lastDesployMsg = null;
  pThis.checkServerPermissions((isAdmin) => {
    if(!isAdmin) throw 'Please start the nodejs server with admin permissions';
    if(!pThis.isDeployLocationValid()) throw 'Please set a deployment location';
    if (!fs.existsSync( config['DEPLOY_LOCATION'])) fs.mkdirSync(config['DEPLOY_LOCATION']);

    pThis.hasStarted = true;
  });
}

exports.printDeployMessage = function(mgs, isSchedule = false, isError = false){
  readline.cursorTo(process.stdout, 0, 12);
  readline.clearScreenDown(process.stdout);

  if(!isSchedule){
    if(isError){
      console.log("     ____              ____ ".cyan);
      console.log("    |    |            |    |".cyan);
      console.log("  .'|) ( . )    ,  ( ,|    )   ( .".red);
      console.log(". , ( .__|(  ) ( , ') |_.'_|(  ,    )".red);
      console.log("=@(_,)=.=),@)@_)@_,')=@=(,=)@'.=)=@,.=('@)=".red);
      console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^".red);
      console.log("=========== "+"DEPLOYMENT FAILED".red + " =============");
    }else{
      console.log("     ____              ____ ".cyan);
      console.log("    |    |            |    |".cyan);
      console.log("    |    |            |    |".cyan);
      console.log("    |____|            |____|".cyan);
      console.log("=@=@=@=@=@=@=@=@=@=@=@=@=@=@=@=@=@=@=@=@=".white);
      console.log(" |         |         |         |         ".gray);
      console.log("=========== "+"DEPLOYING BUILD".cyan+" ==============");
    }
  }else{
    console.log("          ________ ");
    console.log("         |       , |");
    console.log("         |     ,'  |");
    console.log("         |    *    |");
    console.log("         |     `.  |");
    console.log("         |____  ___|\n");
    console.log("=== "+"SCHEDULED DEPLOYMENT".cyan+" ===");
  }
  console.log("== " + mgs);
}

/*
* Request a deployment and start the timer
*
* @parameters {deployID} - the deploy id
* @parameters {callback} - callback function on installed
* @return void
*/
exports.scheduleDeployment = function(deployID, callback){
  if(pThis.deploymentStatus.status != DEPLOY_STATUS.IDLE) return callback('Already deploying');
  if(pThis.deployTimer != null) clearTimeout(pThis.deployTimer);

  let deployedVersion = pThis.getDeployedVersion();
  if(deployedVersion != null && deployedVersion == deployID) return callback('Version {' + deployID + '} already deployed');

  // CHECK IF THE DEPLOY ID EXISTS
  jenkinsManager.getDeployment(deployID, (err, deployurl) => {
    if(err || deployurl.trim() == '') return callback('Deployment {' + deployID + '} not found!');

    // Check if zip is present
    pThis.deployZipExists(deployurl, (exists) => {
      if(!exists) return callback('The requested deployID {' + deployID + '} .zip does not exist');

      pThis.printDeployMessage('[Deploy-scheduled]'.yellow +' Requested version ' + deployID.magenta, true);
      pThis.printDeployMessage('[Deploy-scheduled]'.yellow +' Created timer', true);
      pThis.emitDeployStatus({
        status: DEPLOY_STATUS.SCHEDULE,
        deployID: deployID,
        startTime: Date.now() + (config['DEPLOY_SCHEDULE_SECONDS'] * 1000)
      });

      // SCHEDULE IT (WARN CLIENTS)
      pThis.deployTimer = setTimeout(_ => {
        pThis.printDeployMessage('[Deploy-scheduled]'.yellow +' Timer done! Deploying time.', true);
        pThis.deployBuild(deployurl, deployID, (err) => {
          pThis.resetSchedule();
          pThis.emitDeployedID();
        });
      }, config['DEPLOY_SCHEDULE_SECONDS'] * 1000);

      return callback();
    });
  });
}

/*
* Cancels and resets the deployment timer
*
* @parameters {callback} - callback function
* @return void
*/
exports.cancelSchedule = function(callback){
  if(pThis.deploymentStatus.status != DEPLOY_STATUS.SCHEDULE || pThis.deployTimer == null) return callback('No deployment scheduled');
  pThis.printDeployMessage('[Deploy-scheduled]'.yellow +' Deployment canceled!', true, true);
  pThis.resetSchedule();
  return callback();
}

/*
* Resets the deployment timer
*
* @parameters {callback} - callback function
* @return void
*/
exports.resetSchedule = function(){
  clearTimeout(pThis.deployTimer);
  pThis.deployTimer = null;

  pThis.emitDeployStatus({
    status: DEPLOY_STATUS.IDLE,
    deployID: null
  });
}

/*
* Emits the current deployment status to the connected clients
*
* @parameters {data} - the data to transmit
* @return void
*/
exports.emitDeployStatus = function(data){
  pThis.deploymentStatus = data;
  socketManager.emit(null, 'deployStatus', data);
}

/*
* Emits the deployed id to the connected clients
*
* @return void
*/
exports.emitDeployedID = function(){
  let id = pThis.getDeployedVersion();
  if(id == null) id = 'None';
  socketManager.emit(null,'deployedID', id);
}

/*
* Emits the current deployment status message to connected clients
*
* @parameters {msg} - the message
* @parameters {isError} - is the message an error
* @return void
*/
exports.emitDeployMessage = function(msg, isError = false){
  let msgData = {
    msg: msg,
    isError: isError
  };

  pThis.lastDesployMsg = msgData;
  socketManager.emit(null, 'deployMsg', msgData);
}

/*
* Checks if nodejs is running with admin permissions
*
* @parameters {callback} - the callback function
* @return void
*/
exports.checkServerPermissions = function(callback){
  let batch = require.resolve('../batch_scripts/base/permissions.bat');
  let isAdmin = false;

  pThis.executeCmd(batch,[], (output) => {
    isAdmin = parseInt(output.trim()) == 0;
  }, null, (code) => {
    return callback(isAdmin);
  });
}

/*
* Gets and parses the batch scripts on the config file
*
* @parameters {type} - the config batch type (PRE / POST)
* @return void
*/
exports.getInstallScripts = function(type){
  if(config[type] == null || config[type].length <= 0) return [];
  return config[type].split(';');
}

/*
* Gets the deploy location
*
* @return string
*/
exports.isDeployLocationValid = function(){
  return config['DEPLOY_LOCATION'] != null
  && config['DEPLOY_LOCATION'] != ''
}

/*
* Gets the current deployed version
*
* @return void
*/
exports.getDeployedVersion = function(){
  if(!fs.existsSync(config['DEPLOY_LOCATION'] + '/_DEPLOYED_VERSION.json')) return null;
  let json = JSON.parse(fs.readFileSync(config['DEPLOY_LOCATION'] + '/_DEPLOYED_VERSION.json', 'utf8'));
  if(json == null) return null;
  return json['VERSION'];
}

/*
* Sets the new deployed version
*
* @parameters {version} - the callback function
* @parameters {callback} - the callback function
* @return void
*/
exports.setDeployedVersion = function(version, callback){
  fs.writeFile(config['DEPLOY_LOCATION'] + '/_DEPLOYED_VERSION.json',JSON.stringify({VERSION: version}), callback);
}

/*
* Deploys the given build, if it fails, it reverts back to the original
*
* @parameters {deployed_url} - the url location of the deployment
* @parameters {deploy_version} - the version of the deployment
* @parameters {callback} - callback function
* @return void
*/
exports.deployBuild = function(deployed_url, deploy_version, callback){
  if(!pThis.hasStarted || pThis.isUpdating)
    return callback('DeployManager has not started yet');

  let tempPath = path.resolve('./temp');
  let deployPath = path.resolve(config['DEPLOY_LOCATION']);
  let extraPath = path.resolve('./copy_extraconfigs');
  let zipFolderPath = config['DEPLOY_ZIP_FOLDER'];

  let postScripts = pThis.getInstallScripts('DEPLOY_POST_INSTALL_SCRIPTS');
  let preScripts = pThis.getInstallScripts('DEPLOY_PRE_INSTALL_SCRIPTS');
  let preDeploymentScripts = pThis.getInstallScripts('DEPLOY_PRE_DEPLOYMENT_SCRIPTS');
  let postDeploymentScripts = pThis.getInstallScripts('DEPLOY_POST_DEPLOYMENT_SCRIPTS');

  // Set the website to updating mode
  pThis.emitDeployStatus({
    status: DEPLOY_STATUS.DEPLOYING,
    deployID: deploy_version
  });

  pThis.emitDeployMessage('Deploying version ' + deploy_version);
  pThis.printDeployMessage('[Deploy]'.yellow +' Deploying version ' + deploy_version.magenta);

  // =========================
  // Promise-san, the final boss
  // ==========================
  new Promise((resolve, reject) => {
    pThis.emitDeployMessage('Executing pre-deployment scripts');
    pThis.printDeployMessage('[Deploy]'.yellow +' Executing pre-deployment scripts');

    pThis.executeBatches(preDeploymentScripts, (errors) => {
      if(errors && errors.length > 0) return reject(errors);
      return resolve();
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Cleaning temp folder');
      pThis.printDeployMessage('[Deploy]'.yellow +' Cleaning temp folder');

      pThis.cleanFolder(tempPath, (err) => {
        if(err) return reject('Failed to cleanup the temp deployment folder');
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Downloading deployment');
      pThis.printDeployMessage('[Deploy]'.yellow +' Downloading deployment');

      pThis.downloadDeployment(deployed_url, './temp', (err) => {
        if(err) return reject('Failed to download the deployment');
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Extracting deployment');
      pThis.printDeployMessage('[Deploy]'.yellow +' Extracting deployment');

      extract('./temp/deploy.zip', {dir: tempPath + '/extracted'}, function (err) {
        if(err && err.message.indexOf('lstat') != -1) return reject('Failed to extract the deployment');
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Moving old deployment');
      pThis.printDeployMessage('[Deploy]'.yellow +' Moving old deployment');

      fs.move(deployPath, tempPath + '/old_build', (err) => {
        if(err) return reject('Failed to move old deployment');
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Executing pre-install batches');
      pThis.printDeployMessage('[Deploy]'.yellow +' Executing pre-install batches');

      pThis.executeBatches(preScripts, (errors) => {
        if(errors && errors.length > 0) return reject(errors);
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Installing deployment');
      pThis.printDeployMessage('[Deploy]'.yellow +' Installing deployment');

      fs.move(tempPath + '/extracted/' + zipFolderPath, deployPath, { overwrite: true }, (err) => {
        if(err && err.message.indexOf('lstat') == -1) return reject('Failed to install deployment');
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Executing post-install batches');
      pThis.printDeployMessage('[Deploy]'.yellow +' Executing post-install batches');

      pThis.executeBatches(postScripts, (errors) => {
        if(errors && errors.length > 0) return reject(errors);
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Updating deployment version');
      pThis.printDeployMessage('[Deploy]'.yellow +' Updating deployment version');

      pThis.setDeployedVersion(deploy_version, (err) => {
        if(err) return reject('Failed to update the deploy version');
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Executing post-deployment scripts');
      pThis.printDeployMessage('[Deploy]'.yellow +' Executing post-deployment scripts');

      pThis.executeBatches(postDeploymentScripts, (errors) => {
        if(errors && errors.length > 0) return reject(errors);
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Deleting old build');
      pThis.printDeployMessage('[Deploy]'.yellow +' Deleting old build');

      pThis.cleanFolder(tempPath + '/old_build', (err) => {
        return resolve();
      });
    });
  }).then((result) => {
    pThis.emitDeployMessage('Deploy finished');
    pThis.printDeployMessage('[Deploy]'.green + ' Deploy finished');

    return callback(null);
  }).catch((err) => {
    return pThis.revertAndError(err, callback);
  });
}

/*
* Cleans the given folder
*
* @parameters {location} - the folder location
* @parameters {callback} - callback function
* @return void
*/
exports.cleanFolder = function(location, callback){
  fs.emptyDir(location, callback);
}

/*
* Copies files from a folder into another
*
* @parameters {location} - the folder location
* @parameters {destination} - the destination folder
* @parameters {callback} - callback function
* @return void
*/
exports.copyFiles = function(location, destination, callback){
  fs.copy(location, destination + '/deploy.zip', err => {
    if(err) return callback(`Failed to copy files [${err.message}]`);
    return callback(null);
  });
}

/*
* Checks if the file to deploy exists
*
* @parameters {url} - the url to download
* @parameters {callback} - callback function
* @return void
*/
exports.deployZipExists = function(url, callback){
  if(config['DEPLOY_NETWORKED']){
    return callback(fs.existsSync(url));
  }else{
    let downloadRequest = request.get(url);
    downloadRequest.on('response', function(response) {
      return callback(response.statusCode == 200);
    }).on('error', function (err) {
      return callback(false);
    });
  }
}

/*
* If the deploy is networked, it will copy the files. Else it will attempt to download from jenkins
*
* @parameters {url} - the download location
* @parameters {location} - the folder to place the download in
* @parameters {callback} - callback function
* @return void
*/
exports.downloadDeployment = function(url, location, callback){
  if(config['DEPLOY_NETWORKED']){
    return pThis.copyFiles(url, location, callback);
  }

  let writeStream = fs.createWriteStream(location);
  let downloadRequest = request.get(url);

  // Check response
  downloadRequest.on('response', function(response) {
    if (response.statusCode != 200) {
      return callback(`Failed to download deployment {Err ${response.statusCode}}`);
    }
  }).on('error', function (err) {
    fs.unlink(location);
    return callback(`Failed to download deployment [${err.message}]`);
  });

  // Pipe the file
  downloadRequest.pipe(writeStream);

  writeStream.on('finish', function() {
    writeStream.close(callback);
  }).on('error', function(err) {
    fs.unlink(location);
    return callback(`Failed to download deployment [${err.message}]`);
  });
}

/*
* If the deployment fails, it will attempt to revert the build
*
* @parameters {errMsg} - the error
* @parameters {callback} - callback function
* @return void
*/
exports.revertAndError = function(errMsg, callback){
  let tempPath = path.resolve('./temp');
  let deployPath = path.resolve(config['DEPLOY_LOCATION']);
  let postDeploymentScripts = pThis.getInstallScripts('DEPLOY_POST_DEPLOYMENT_SCRIPTS');

  let printError = () => {
    console.log("\n==== DEPLOYMENT ERROR LIST ====");
    if(typeof errMsg == [])
      errMsg.forEach((err) => console.log('[Deplot-ERR] '.red + err));
    else
      console.log('[Deplot-ERR] '.red + errMsg);
  }

  // TODO : Add missing scripts
  new Promise((resolve, reject) => {
    pThis.printDeployMessage('[REVERT-Deploy]'.red +' Cleaning attempted deployment', false, true);
    pThis.emitDeployMessage('Cleaning attempted deployment', true);

    pThis.cleanFolder(deployPath, (err) => {
      if(err) return reject('Failed to update and revert the server');
      return resolve();
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.printDeployMessage('[REVERT-Deploy]'.red +' Recovering old deployment', false, true);
      pThis.emitDeployMessage('Recovering old deployment', true);

      fs.move(tempPath + '/old_build', deployPath, { overwrite: true }, (err) => {
        if(err) return reject('Failed to update and revert the server');
        return resolve();
      });
    });
  }).then(_ => {
    return new Promise((resolve, reject) => {
      pThis.emitDeployMessage('Executing post-deployment scripts', true);
      pThis.printDeployMessage('[REVERT-Deploy]'.red +' Executing post-deployment scripts', false, true);

      pThis.executeBatches(postDeploymentScripts, (errors) => {
        if(errors && errors.length > 0) return reject(errors);
        return resolve();
      });
    });
  }).then(_ => {
    pThis.emitDeployMessage('Revert complete!');
    pThis.printDeployMessage('[REVERT-Deploy]'.red +' Revert complete', false, true);
    printError();

    return callback(null);
  }).catch((err) => {
    pThis.emitDeployMessage('FAILED TO REVERT', true);
    pThis.printDeployMessage('[REVERT-Deploy]'.red +' Failed to revert', false, true);
    printError();

    return callback(err);
  });
}

/*
* Executes a command on the console
*
* @parameters {cmd} - the command
* @parameters {params} - the command parameters
* @parameters {onOutput} - on console output function
* @parameters {onError} - on console error function
* @parameters {onClose} - on console close function
* @return void
*/
exports.executeCmd = function(cmd, params = [], onOutput = null, onError = null, onClose = null){
  let deployPath = path.resolve(config['DEPLOY_LOCATION']);
  console.log('[ExecuteCMD] '.cyan + cmd);

  let process = spawn(cmd, params, {
    env: {
      'DEPLOY_LOCATION': deployPath,
      'ROOT': path.dirname(require.main.filename)
    }
  });

  process.stdout.on('data', data => {
    if(onOutput) onOutput(data.toString());
  });

  process.stderr.on('data', data => {
    if(onError) onError(data.toString());
  });

  process.on('close', code => {
    if(onClose) onClose(code);
  });
}

/*
* Executes batches in the given order (SYNC, not ASYNC)
*
* @parameters {batches} - a list with batches
* @parameters {callback} - the callbakc function
* @return void
*/
exports.executeBatches = function(batches, callback){
  if(batches == null || batches.length <= 0) return callback(null);
  let batchesclone = batches.slice(0);
  let errors = [];

  let onBatchDone = () => {
    if(batchesclone.length <= 0) return callback(errors);
    else processBatch();
  }

  let processBatch = () => {
    let batchname = batchesclone.shift();
    if(batchname == null || batchname.trim() == '') return onBatchDone();

    let batch = require.resolve('../' + batchname);
    pThis.executeCmd(batch, [], null, null, (code) => {
      if(parseInt(code) != 0) errors.push(`Failed to execute batch [${batchname}]`);
      return onBatchDone();
    });
  };

  processBatch(); // start it
}
