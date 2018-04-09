'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

/*
* Handles Jenkins
*/

var exports = module.exports = {};
var pThis = exports;

var jenkinsapi = require('jenkins-api');
var fs = require('fs');

var config = require('../config.json');

var deployManager = require('./DeployManager');
var socketManager = require('./SocketManager');
var schedule = require('node-schedule');

const UPDATE_ERROR_LIST = Object.freeze({
  INVALID_BRANCH: 1,
  NO_CHANGES: 2,
  FAILED_BUILD: 3,
  NULL_BUILD: 4
});

/* =========================
JENKINS ======================== */

/*
* Initializes the jenkins manager
*
* @parameters {callback} - the callback function
* @return void
*/
exports.init = function(callback){
  if(config['JENKINS_URL'] == null) throw '`JENKINS_URL` not present in config.json';
  if(config['JENKINS_PROJECT'] == null) throw '`JENKINS_PROJECT` not present in config.json';

  if(config['JENKINS_USER'] != null && config['JENKINS_USER'] != '')
    pThis.jenkins = jenkinsapi.init("http://"+config['JENKINS_USER'] + ":" + config['JENKINS_PASS'] + "@"+ config['JENKINS_URL']);
  else
    pThis.jenkins = jenkinsapi.init(config['JENKINS_URL']);

  pThis.currentJenkinsData = {};
  pThis.nextJenkinsCheck = null;

  pThis.getCache((data) => {
    pThis.jenkinsCache = data;
    pThis.assignCacheIfNull('jobs', {});

    pThis.update = schedule.scheduleJob('*/' + config['JENKINS_UPDATE_TIMER'] + ' * * * * *', () => {
      pThis.updateCheckAndReport();
    });

    pThis.updateCheckAndReport(() => {
      pThis.isReady = true;
      return callback();
    });
  });
}

/*
* Checks for new changelogs and sends that data to the connected sockets
*
* @parameters {callback} - the callback function
* @return void
*/
exports.updateCheckAndReport = function(callback = null){
  pThis.checkChangelog((err, data) => {
    pThis.nextJenkinsCheck = Date.now() + (config['JENKINS_UPDATE_TIMER'] * 1000);
    pThis.sendUpdateSocket();
    if(callback != null) return callback();
  });
}

/*
* Sends a jenkins update to the connected sockets
*
* @return void
*/
exports.sendUpdateSocket = function(){
  socketManager.emit(null, "jenkinsStatus", {
    jenkinsData: pThis.getJenkinsData(),
    nextJenkinsCheck: {next: pThis.nextJenkinsCheck, tick: config['JENKINS_UPDATE_TIMER']}
  });
}


/*
* Checks if the variable exists on cache, if not, assigns it
*
* @parameters {param} - the parameter
* @parameters {value} - the value
* @return void
*/
exports.assignCacheIfNull = function(param, value){
  if(pThis.jenkinsCache[param] != null) return;
  pThis.jenkinsCache[param] = value;
}

/*
* Gets the stored jenkins internal cache
*
* @parameters {callback} - the callback function
* @return void
*/
exports.getCache = function(callback){
  if (!fs.existsSync('./cache')) fs.mkdirSync('./cache');
  if (!fs.existsSync(`./cache/_JENKINS_CACHE.json`)) return callback({});
  return callback(JSON.parse(fs.readFileSync(`./cache/_JENKINS_CACHE.json`, 'utf8')));
}

/*
* Checks jenkins SUCCESS builds and generates a changelog for each
*
* @parameters {mainCallback} - the callback function
* @return void
*/
exports.checkChangelog = function(mainCallback){
  let max_changelog = config['JENKINS_MAX_CHANGELOG'] || 10;
  let changes = [];

  let recursiveCheck = (allBuildData, onDone) => {
    if(changes.length >= max_changelog || allBuildData.length <= 0) return onDone();
    let currentBuild = allBuildData.shift();
    if(currentBuild == null) return onDone();

    pThis.getJenkinsJob(currentBuild.id, function(err, jobData) {
      if(err) return recursiveCheck(allBuildData, onDone);
      pThis.parseJenkinsBuild(jobData, (err, parsedData) => {
        if(err || parsedData == null) return recursiveCheck(allBuildData, onDone);
        changes.push(parsedData);

        if(pThis.jenkinsCache.jobs[parsedData.buildID] == null){
          pThis.jenkinsCache.jobs[parsedData.buildID] = jobData;
          pThis.saveCache(() => recursiveCheck(allBuildData, onDone));
        }else{
          return recursiveCheck(allBuildData, onDone);
        }
      });
    });
  }

  pThis.jenkins.all_builds(config['JENKINS_PROJECT'], {depth: 2}, function(err, allBuildData) {
    if (err) return mainCallback(err);
    let last_success = pThis.getLastSuccessBuild(allBuildData);

    // Check if the changelog changed
    if(pThis.currentJenkinsData != null && last_success != null && pThis.currentJenkinsData['changelog'] != null &&
       pThis.currentJenkinsData['changelog'][0].buildID == last_success.id){
      return mainCallback(null, pThis.currentJenkinsData);
    }

    recursiveCheck(allBuildData, () => {
      pThis.currentJenkinsData = changes;
      return mainCallback(null, pThis.currentJenkinsData);
    });
  });
}

/*
* Gets the last successful build on jenkins
*
* @parameters {all_builds} - all the jenkins builds
* @return successbuild
*/
exports.getLastSuccessBuild = function(all_builds){
  let lastsuccess = null;
  all_builds.forEach((build) => {
    if(build.result == 'SUCCESS' && lastsuccess == null)
      lastsuccess = build;
  });
  return lastsuccess;
}

/*
* Gets a jenkins job from the api or from the cache
*
* @parameters {buildId} - the buildId to check
* @parameters {callback} - callback function
* @return void
*/
exports.getJenkinsJob = function(buildId, callback){
  if(pThis.jenkinsCache.jobs[buildId] == null){
    return pThis.jenkins.job_info(config['JENKINS_PROJECT'] + '/' + buildId, callback);
  }else{
    return callback(null, pThis.jenkinsCache.jobs[buildId]);
  }
}

/*
* Checks if the build has changesets
*
* @parameters {build_info} - the build info
* @return boolean
*/
exports.hasChangesets = function(build_info){
  return (build_info.changeSets != null && build_info.changeSets.length > 0) ||
          (build_info.changeSet != null && build_info.changeSet.items.length > 0); // OLD JENKINS API
}

/*
* Gets the changesets on the build (also uses old jenkins API)
*
* @parameters {build_info} - the build info
* @return array
*/
exports.getChangeset = function(build_info){
  if(build_info.changeSets != null) return build_info.changeSets[0].items;
  return build_info.changeSet.items; // OLD JENKINS API
}

/*
* Recursive check for changelog (jenkins doesnt propagade the changesets, so you have to do it manually)
*
* @parameters {build_info} - the build info
* @parameters {callback} - callback function
* @return void
*/
exports.extractDeepChangelog = function(build_info, callback){
  let replayID = pThis.getReplayBuildID(build_info);

  if(pThis.hasChangesets(build_info))
    return callback(pThis.getChangeset(build_info));

  // Check if it's a checkpoint build (no changelogs)
  if(replayID == null && !config['JENKINS_SKIP_EMPTY_CHANGESET'])
    return callback([]);

  // No changesets found, checking previous builds
  let prev_build = build_info.previousBuild;
  if(prev_build == null) return callback(null);

  if(prev_build.number != null && prev_build.url != null){
    pThis.getJenkinsJob(prev_build.number, function(err, jobData) {
      // If the build was a replay or if the previous build was not a success
      if(jobData.result != 'SUCCESS' || '#'+prev_build.number == replayID){
        return pThis.extractDeepChangelog(jobData, callback);
      }

      return pThis.getChangeset(null);
    });
  }
}


/*
* Attempt to get the replay ID from jenkins
*
* @parameters {build_info} - the build info
* @return string
*/
exports.getReplayBuildID = function(build_info){
  let causeAction = pThis.parseJenkinsAction(build_info.actions, 'hudson.model.CauseAction','causes');
  if(causeAction != null){
    let replayData = pThis.parseJenkinsAction(causeAction, 'org.jenkinsci.plugins.workflow.cps.replay.ReplayCause','shortDescription');
    if(replayData != null && replayData.indexOf('Replayed') != -1){
      return replayData.replace('Replayed','').trim();
    }
  }

  return null;
}

/*
* Parses the jenkins build request
*
* @parameters {build_info} - the build json data
* @parameters {deployed_version} - the deployed version
* @parameters {callback} - the callback function
* @return void
*/
exports.parseJenkinsBuild = function(build_info, callback){
  if(build_info == null)
    return callback(UPDATE_ERROR_LIST.NULL_BUILD);

  // Check the result
  if(build_info.result != 'SUCCESS')
    return callback(UPDATE_ERROR_LIST.FAILED_BUILD);

  // Parse branch data
  let branchData = pThis.parseJenkinsAction(build_info.actions, 'hudson.plugins.git.util.BuildData','lastBuiltRevision');
  if(branchData == null || branchData.branch.length <= 0 || (config['JENKINS_BRANCH'] != '' && branchData.branch[0].name != config['JENKINS_BRANCH'])){
    return callback(UPDATE_ERROR_LIST.INVALID_BRANCH);
  }

  // Check if there are any changes
  pThis.extractDeepChangelog(build_info, (rawLogData) => {
    if(rawLogData == null) return callback(UPDATE_ERROR_LIST.NO_CHANGES);

    let changelog = pThis.generateChangelog(rawLogData);
    let buildParams = pThis.parseJenkinsAction(build_info.actions, 'hudson.model.ParametersAction','parameters');
    let artifacts = pThis.parseArtifacts(build_info.artifacts);
    let branchName = branchData.branch[0].name;

    return callback(null, {
      buildID: build_info.id,
      branchname: branchName,
      changelog: changelog,
      artifacts: artifacts,
      displayName: changelog.length > 0 ? build_info.fullDisplayName : 'CHECK-POINT BUILD',
      buildDate: new Date(build_info.timestamp).toDateString()
    });
  });
}

/*
* Parses the artifacts on jenkins and attempts to get the build
*
* @parameters {artifacts} - the artifacts
* @return array{object}
*/
exports.parseArtifacts = function(artifacts){
  if(artifacts == null || artifacts.length <= 0) return null;
  let baseURL = config['JENKINS_URL'] + '/job/' + config['JENKINS_PROJECT'] + '/lastSuccessfulBuild/artifact/';
  let buildArtifacts = {};

  artifacts.forEach((artifact) => {
    let artifactName = artifact.fileName;

    if(config['JENKINS_DEPLOY_ARTIFACT_NAME'] != null &&
    config['JENKINS_DEPLOY_ARTIFACT_NAME'] != '' &&
    artifactName == config['JENKINS_DEPLOY_ARTIFACT_NAME']){
      artifactName = 'BUILD';
    }

    buildArtifacts[artifactName] = {
      name: artifactName,
      downloadPath: baseURL + artifact.relativePath
    };
  });

  return buildArtifacts;
}

/*
* Parses the jenkins actions and attempts to get the parameter
*
* @parameters {actions} - the actions
* @parameters {actionClass} - the action class
* @parameters {actionParam} - the action param
* @return object
*/
exports.parseJenkinsAction = function(actions, actionClass, actionParam){
  if(actions == null) return null;
  let fnd = null;
  actions.forEach((info_action) => {
    if(info_action._class != actionClass) return;
    fnd = info_action[actionParam];
    return true;
  })
  return fnd;
}

/*
* Generates a changelog
*
* @parameters {changeSetData} - the changed files
* @return object
*/
exports.generateChangelog = function(changeSetData){
  if(changeSetData == null) return null;
  if(changeSetData.length <= 0) return [];

  let changelog = [];
  changeSetData.forEach((changeSet) => {
    if(changeSet == null || changeSet.paths == null || changeSet.paths.length <= 0) return;
    changelog.push({
      changeMsg: changeSet.msg,
      filesChanged : changeSet.paths,
      author: (!changeSet.author || changeSet.author.fullName.indexOf('noreply') != -1 ? 'Unknown' : changeSet.author.fullName)
    });
  });
  return changelog;
}

/*
* Saves jenkins internal cache
*
* @parameters {callback} - the callback function
* @return void
*/
exports.saveCache = function(callback){
  fs.writeFile(`./cache/_JENKINS_CACHE.json`,JSON.stringify(pThis.jenkinsCache), callback);
}

/*
* Gets the cached jenkins data (parsed changelogs since the server started)
*
* @return object
*/
exports.getJenkinsData = function(){
  return pThis.currentJenkinsData;
}

/*
* Request a deployment and start the timer
*
* @parameters {deployID} - the deploy id
* @parameters {callback} - callback function on installed
* @return void
*/
exports.isBuildCached = function(build_id){
  if(pThis.jenkinsCache == null || pThis.jenkinsCache.jobs == null || Object.keys(pThis.jenkinsCache.jobs).length <= 0) return false;
  return pThis.jenkinsCache.jobs[build_id] != null && pThis.jenkinsCache.jobs[build_id].result == 'SUCCESS';
}

/*
* Get the stored changelog by buildID
*
* @parameters {build_id} - the build id
* @return object
*/
exports.getChangelogById = function(build_id){
  if(pThis.currentJenkinsData == null || pThis.currentJenkinsData['changelog'] == null || pThis.currentJenkinsData['changelog'].length <= 0) return null;
  let found = null;
  pThis.currentJenkinsData['changelog'].forEach((change) => {
    if(change.id == build_id) return found = change;
  });
  return found;
}

/*
* Get the deployment by build_id
*
* @parameters {build_id} - the build id
* @parameters {callback} - the callback function
* @return object
*/
exports.getDeployment = function(deploy_id, callback){
  // Check if deploy is cached
  if(!pThis.isBuildCached(deploy_id)) return callback('Build id not found');

  // Get download url
  let downloadURL = config['DEPLOY_DOWNLOAD_LOCATION'] + '/' + deploy_id + '.zip';

  // Is the deployment stored in jenkins artifacts?
  if(config['JENKINS_DEPLOYED']){
    let changelog = pThis.getChangelogById(deploy_id);
    if(changelog == null || changelog.artifacts['BUILD'] == null) return callback('Failed to locate BUILD on jenkins artifacts');
    downloadURL = changelog.artifacts['BUILD'].downloadPath;
  }

  return callback(null, downloadURL);
}
