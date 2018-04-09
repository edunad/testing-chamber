'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Injectable, Injector } from '@angular/core';
import { Subject, Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

import { StorageManager } from './storageManager';
import { SocketManager } from './socketManager';

const DEPLOY_STATUS = Object.freeze({
  IDLE: 0,
  SCHEDULE: 1,
  DEPLOYING: 2
});

/*
* Testing manager, contains all the information (jenkins, builds, etc)
*/
@Injectable()
export class TestManager {
  socketManager: SocketManager;

  jenkinsData: any;
  deploymentStatus: any;
  lastDeployMsg: any;
  deployedVersion: number;

  onJenkinsUpdate = new Subject<any>();
  onJenkinsUpdate$ = this.onJenkinsUpdate.asObservable();

  onDeployUpdate = new Subject<any>();
  onDeployUpdate$ = this.onDeployUpdate.asObservable();

  onDeployMSGUpdate = new Subject<any>();
  onDeployMSGUpdate$ = this.onDeployMSGUpdate.asObservable();

  onVersionUpdate = new Subject<any>();
  onVersionUpdate$ = this.onVersionUpdate.asObservable();

  constructor(private storageManager: StorageManager, private injector: Injector) {
    this.jenkinsData = {};
    this.deploymentStatus = {};
    this.lastDeployMsg = {}
    this.deployedVersion = -1;

    // 2 WAY BINDING SERVICES, socketManager uses testManager. Testmanager uses socketManager
    setTimeout(_ => {
      this.socketManager = this.injector.get(SocketManager);
    })
  }

  /*
  * On socket connection set the recieved data
  *
  * @parameters {data} - The data
  * @return void
  */
  onSocketServerConnection(data: any): void {
    if(data == null) return;
    // SET JENKINS DATA //
    this.setJenkinsData(data);
    // SET DEPLOY DATA //
    this.setDeployStatus(data.deploymentStatus);
    // SET MSG DATA //
    this.setDeployMSGStatus(data.lastDeployMsg);
    // SET OTHER DATA //
    this.setOTHERStatus(data);
    // SET DEPLOY DATA //
    this.setDeployedVersion(data.deployedBuild);
  }

  /*
  * Set OTHER status (such as deploy_url)
  *
  * @parameters {data} - The data
  * @return void
  */
  setOTHERStatus(data: any): void {
    if(data == null || data.deployUrl == null) return;
    this.storageManager.setStoredVariable('DEPLOY_URL', data.deployUrl);
  }

  /*
  * Set the current jenkins data (changelog and when the next jenkinscheck is)
  *
  * @parameters {data} - The data
  * @return void
  */
  setJenkinsData(data:any): void {
    if(data == null || data.jenkinsData == null || data.nextJenkinsCheck == null) return;
    this.jenkinsData['changelog'] = data.jenkinsData;
    this.jenkinsData['nextJenkinsCheck'] = data.nextJenkinsCheck;
    this.onJenkinsUpdate.next(this.jenkinsData);
  }

  /*
  * Set the current deployment status
  *
  * @parameters {data} - The data
  * @return void
  */
  setDeployStatus(data: any): void {
    if(data == null) return;
    this.deploymentStatus = data;
    this.onDeployUpdate.next(data);
  }

  /*
  * Set the last deployment message
  *
  * @parameters {data} - The data
  * @return void
  */
  setDeployMSGStatus(data: any): void {
    if(data == null) return;
    this.lastDeployMsg = data;
    this.onDeployMSGUpdate.next(data);
  }

  /*
  * Set the current deployed version
  *
  * @parameters {version} - The deployed version
  * @return void
  */
  setDeployedVersion(version: number): void {
    if(version == null) return;
    this.deployedVersion = version;
    this.onVersionUpdate.next(version);
  }

  /*
  * Request a deployment
  *
  * @parameters {data} - The data
  * @return void
  */
  requestDeployment(buildID: number, callback: any): void {
    if(buildID == null || this.deploymentStatus == null || this.deploymentStatus.status != DEPLOY_STATUS.IDLE) return;
    this.socketManager.emit('requestDeployment', {buildID: buildID}, (data) => {
      return callback(data.err);
    })
  }

  /*
  * Cancel a deployment request
  *
  * @parameters {data} - The data
  * @return void
  */
  cancelDeployment(callback: any): void {
    if( this.deploymentStatus == null || this.deploymentStatus.status != DEPLOY_STATUS.SCHEDULE) return;
    this.socketManager.emit('cancelDeployment', {}, (data) => {
      return callback(data.err);
    })
  }

  /*
  * Get the current deployment status
  *
  * @return object
  */
  getDeployStatus(): any {
    return this.deploymentStatus;
  }

  /*
  * Get the current lsat deployment message
  *
  * @return object
  */
  getDeployMSGStatus(): any {
    return this.lastDeployMsg;
  }

  /*
  * Get the current deployed version
  *
  * @return number
  */
  getDeployedVersion(): number  {
    return this.deployedVersion;
  }

  /*
  * Get the current jenkins data
  *
  * @return object
  */
  getJenkinsData(): any {
    return this.jenkinsData;
  }
}
