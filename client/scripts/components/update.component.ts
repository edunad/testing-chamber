'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Component, OnInit, OnDestroy, NgZone, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { PersistData } from '../util/persistData';
import { Util } from '../util/util';

import { LottieRendererElement } from '../elements/lottie-render.element';

import { TestManager } from '../managers/testManager';
import { StorageManager } from '../managers/storageManager';

const LAST_RAWR_ANIM = Object.freeze({
  NONE: -1,
  ARM_UP: 0,
  ARM_DOWN: 1,
  GO_UP: 2,
  GO_DOWN: 3
});

const LAST_BUTTON_ANIM = Object.freeze({
  IDLE: 0,
  TRIGGER: 1,
  CANCEL: 2,
  PRESSED: 3
});

const DEPLOY_STATUS = Object.freeze({
  IDLE: 0,
  SCHEDULE: 1,
  DEPLOYING: 2
});

/*
* Update component, displays the chatbox menu and the character
*/
@Component({
  selector: 'sg-update',
  templateUrl: '../../views/components/update-view.html'
})
export class UpdateComponent implements OnInit, OnDestroy {
  @ViewChild('lottieRawr') lottieRawr: LottieRendererElement;
  @ViewChild('lottieButton') lottieButton: LottieRendererElement;

  showUpdate: boolean;
  isMouseHovering: boolean;
  activeTab: string;
  tickTimer: any;

  // ANIMATIONS //
  rawrLottie: any;
  buttonLottie: any;
  lastAnim: any;
  // ANIMATIONS //

  // DATA STUFF //
  jenkinsData: any;
  deploymentStatus: any;
  lastDeployMsg: any;
  deployedVersion: number;
  // DATA STUFF //

  // DEPLOY STUFF //
  deployRemainTime: number;
  selectedBuild: number;
  isBusy: boolean;
  // DEPLOY STUFF /

  // Subscription STUFF //
  onJenkinsUpdate: Subscription;
  onDeployUpdate: Subscription;
  onVersionUpdate: Subscription;
  // Subscription STUFF //

  constructor(private persist: PersistData,
  private testManager: TestManager,
  private storageManager: StorageManager,
  private util: Util,
  private zone: NgZone) {
    this.lastAnim = {
      'rawr': LAST_RAWR_ANIM.NONE,
      'button': LAST_BUTTON_ANIM.IDLE
    };

    this.rawrLottie = {
      autoplay: false,
      loop: false,
      path: 'animations/mythrawr_rawr_all.json'
    }

    this.buttonLottie = {
      autoplay: false,
      loop: false,
      path: 'animations/mythrawr_button_all.json'
    }

    // CORE VARS
    this.jenkinsData = {};
    this.deploymentStatus = {};
    this.lastDeployMsg = {};
    this.deployedVersion = -1;
    // CORE VARS

    this.activeTab = 'changelog';
    this.isBusy = false;

    this.deployRemainTime = 0;
    this.tickTimer = setInterval(_=>this.onTick(), 1000);
  }

  /*
  * Implements OnInit
  */
  ngOnInit(): void {
    this.getPersistData();
    this.bindObservables();
  }

  /*
  * Implements OnDestroy
  */
  ngOnDestroy(): void {
    this.onJenkinsUpdate.unsubscribe();
    this.onDeployUpdate.unsubscribe();
    this.onVersionUpdate.unsubscribe();

    clearInterval(this.tickTimer);
  }

  /*
  * Binds observables
  *
  * @return void
  */
  bindObservables(): void {
    this.onJenkinsUpdate = this.testManager.onJenkinsUpdate$.subscribe(value => {
      this.jenkinsData = value;
    });

    this.onDeployUpdate = this.testManager.onDeployUpdate$.subscribe(value => {
      this.deploymentStatus = value;

      if(this.deploymentStatus.status == DEPLOY_STATUS.IDLE){
        this.handleButtonAnimation(LAST_BUTTON_ANIM.IDLE);
      }
    });

    this.onVersionUpdate = this.testManager.onVersionUpdate$.subscribe(value => {
      this.deployedVersion = value;
    });

    this.jenkinsData = this.testManager.getJenkinsData();
    this.deploymentStatus = this.testManager.getDeployStatus();
    this.lastDeployMsg = this.testManager.getDeployMSGStatus();
    this.deployedVersion = this.testManager.getDeployedVersion();
  }

  /*
  * Every second, triggers the function
  *
  * @return void
  */
  onTick(): void {
    if(this.deploymentStatus == null || this.deploymentStatus.status != DEPLOY_STATUS.SCHEDULE || this.deploymentStatus.startTime == null) return;
    this.deployRemainTime = Math.round((this.deploymentStatus.startTime - Date.now()) / 1000);
  }

  /*
  * Gets the persisted variables on storage session
  *
  * @return void
  */
  getPersistData(): void {
    var togglePersist = this.persist.getPersistVar('showUpdate');
    this.showUpdate = togglePersist != null ? togglePersist: false;
  }

  /*
  * On build request change, store it for later assigment
  *
  * @parameters {buildId} - The buildId
  * @return void
  */
  onBuildChange(buildId: number) : void {
    if(buildId == -1) return this.selectedBuild = null;
    this.selectedBuild = buildId;
  }

  /*
  * Gets the build by buildID
  *
  * @parameters {buildId} - The buildId
  * @return object
  */
  getBuildIndexById(buildId: number): any {
    if(buildId == null || this.jenkinsData == null || this.jenkinsData.changelog == null) return null;
    let found = null;
    this.jenkinsData.changelog.forEach((build) => {
      if(build != null && build.buildID == buildId) return found = build;
    });
    return found;
  }

  /*
  * Requests a deployment, if it's already deploying, requests a cancel
  *
  * @return void
  */
  onDeployRequest(): void {
    if(this.isBusy || this.deploymentStatus.status == DEPLOY_STATUS.DEPLOYING) return;

    if(this.deploymentStatus.status == DEPLOY_STATUS.IDLE) {
      let build = this.getBuildIndexById(this.selectedBuild);
      if(build == null || build.buildID == this.deployedVersion) return;

      this.isBusy = true;
      this.testManager.requestDeployment(build.buildID, (err) => {
        this.isBusy = false;

        if(err) return console.warn('Failed deployment {'+err+'}'); // TODO: SHOW ERROR ON POPUP
        this.handleButtonAnimation(LAST_BUTTON_ANIM.TRIGGER);
      });

    }else if(this.deploymentStatus.status == DEPLOY_STATUS.SCHEDULE){
      this.isBusy = true;
      this.testManager.cancelDeployment((err) => {
        this.isBusy = false;

        if(err) return console.warn('Failed to cancel deployment {'+err+'}'); // TODO: SHOW ERROR ON POPUP
        this.handleButtonAnimation(LAST_BUTTON_ANIM.CANCEL);
      });
    }
  }

  /*
  * Sets the selected tabID active
  *
  * @parameters {tabId} - The tab to be active
  * @return void
  */
  setActiveTab(tabId:string): void {
    this.activeTab = tabId;
  }

  /*
  * Opens / Closes the update menu and stores it on persist data
  *
  * @return void
  */
  toggleUpdateMenu() : void{
    this.showUpdate = !this.showUpdate;
    this.setMenuStatus(this.showUpdate);
  }

  /*
  * Sets the current menu status and persists it
  *
  * @parameters {status} - The current status
  * @return void
  */
  setMenuStatus(status: boolean): void {
    this.persist.storeInPersist('showUpdate', status);

    if(status) return this.handleRawrAnimation(LAST_RAWR_ANIM.GO_UP);
    else return this.handleRawrAnimation(LAST_RAWR_ANIM.GO_DOWN);
  }

  /*
  * Closes the menu
  *
  * @return void
  */
  closeMenu(): void {
    this.showUpdate = false;
    this.setMenuStatus(this.showUpdate);
  }

  /*
  * On Rawr Character animation done
  *
  * @return void
  */
  onRawrAnimDone() : void {
    if(this.lastAnim['rawr'] != LAST_RAWR_ANIM.GO_DOWN) return;
    if(this.isMouseHovering)
      return this.handleRawrAnimation(LAST_RAWR_ANIM.ARM_UP);
    else
      return this.handleRawrAnimation(LAST_RAWR_ANIM.NONE);
  }

  /*
  * On Button animation loaded
  *
  * @return void
  */
  onButtonAnimLoaded(): void {
    if(this.deploymentStatus.status == DEPLOY_STATUS.SCHEDULE)
      this.handleButtonAnimation(LAST_BUTTON_ANIM.PRESSED);
    else
      this.handleButtonAnimation(LAST_BUTTON_ANIM.IDLE);
  }

  /*
  * On Rawr Character animation loaded
  *
  * @return void
  */
  onRawrAnimLoaded(): void {
    if(!this.showUpdate) return;
    this.handleRawrAnimation(LAST_RAWR_ANIM.GO_UP);
  }

  /*
  * Handles the requested Button animation number
  *
  * @parameters {anim} - The button animation
  * @return void
  */
  handleButtonAnimation(anim:number): void {
    if(this.lottieButton == null) return;
    switch(anim){
      case LAST_BUTTON_ANIM.IDLE:
        this.lottieButton.playAnimation(0, 1);
        break;
      case LAST_BUTTON_ANIM.TRIGGER:
        this.lottieButton.playAnimation(2, 50);
        break;
      case LAST_BUTTON_ANIM.CANCEL:
        this.lottieButton.playAnimation(50, 76);
        break;
      case LAST_BUTTON_ANIM.PRESSED:
        this.lottieButton.playAnimation(49, 50);
        break;
    }

    this.lastAnim['button'] = anim;
  }

  /*
  * Handles the requested Rawr animation number
  *
  * @parameters {anim} - The animation number
  * @return void
  */
  handleRawrAnimation(anim:number): void {
    if(this.lottieRawr == null || this.lastAnim['rawr'] == anim) return;

    switch(anim){
      case LAST_RAWR_ANIM.NONE:
        this.lottieRawr.playAnimation(0, 1);
        break;
      case LAST_RAWR_ANIM.GO_UP:
        this.lottieRawr.playAnimation(19, 79);
        break;
      case LAST_RAWR_ANIM.GO_DOWN:
        this.lottieRawr.playAnimation(79, 99);
        break;
      case LAST_RAWR_ANIM.ARM_UP:
        this.lottieRawr.playAnimation(1, 9);
        break;
      case LAST_RAWR_ANIM.ARM_DOWN:
        this.lottieRawr.playAnimation(9, 19);
        break;
    }

    this.lastAnim['rawr'] = anim;
  }

  /*
  * On Rawr character mouse
  *
  * @parameters {isHover} - If its hovering or not
  * @return void
  */
  onRawrMouse(isHover: boolean) : void {
    this.isMouseHovering = isHover;

    if(this.showUpdate || this.lastAnim['rawr'] == LAST_RAWR_ANIM.GO_DOWN) return;
    if(isHover) this.handleRawrAnimation(LAST_RAWR_ANIM.ARM_UP);
    else this.handleRawrAnimation(LAST_RAWR_ANIM.ARM_DOWN);
  }
}
