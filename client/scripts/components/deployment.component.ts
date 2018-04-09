'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Component, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { TestManager } from '../managers/testManager';
import { StorageManager } from '../managers/storageManager';

import { LottieRendererElement } from '../elements/lottie-render.element';

const LAST_DEPLOY_ANIM = Object.freeze({
  NORMAL: 0,
  FIRE_INTRO: 1,
  FIRE: 2
});


/*
* The deployment component (displays a deploy animation and the current progress)
*/
@Component({
  selector: 'sg-deployment',
  templateUrl: '../../views/components/deployment-view.html'
})
export class DeploymentComponent implements OnInit, OnDestroy {
  @ViewChild('lottieDeploy') lottieDeploy: LottieRendererElement;
  deployLottie: any;

  deploymentStatus: any;
  lastDeployMsg: any;
  lastAnim: any;

  // Subscription STUFF //
  onDeployUpdate: Subscription;
  onDeployMSGUpdate: Subscription;
  // Subscription STUFF //

  constructor(private testManager: TestManager,
    private storageManager: StorageManager,
    private zone: NgZone) {
      this.deploymentStatus = {};
      this.lastDeployMsg = {};
      this.lastAnim = {};
      this.deployLottie = {
        autoplay: false,
        loop: true,
        path: 'animations/mythrawr_deploy_all.json'
      }
  }

  /*
  * Implements OnInit
  */
  ngOnInit(): void {
    this.bindObservables();
  }

  /*
  * Implements OnDestroy
  */
  ngOnDestroy(): void {
    this.unbindObservables();
  }

  /*
  * Binds observables
  *
  * @return void
  */
  bindObservables(): void {
    this.onDeployUpdate = this.testManager.onDeployUpdate$.subscribe(value => {
      this.deploymentStatus = value;
    });

    this.onDeployMSGUpdate = this.testManager.onDeployMSGUpdate$.subscribe(value => {
      this.lastDeployMsg = value;

      if(value.isError && this.lastAnim['deploy'] == LAST_DEPLOY_ANIM.NORMAL){
        this.handleDeployAnimation(LAST_DEPLOY_ANIM.FIRE_INTRO);
      }
    });


    this.deploymentStatus = this.testManager.getDeployStatus();
    this.lastDeployMsg = this.testManager.getDeployMSGStatus();
  }

  /*
  * Unbinds observables
  *
  * @return void
  */
  unbindObservables(): void {
    this.onDeployUpdate.unsubscribe();
    this.onDeployMSGUpdate.unsubscribe();
  }

  /*
  * On deploy animation done, transition to the fire one if it was on fireintro
  *
  * @return void
  */
  onDeployAnimDone(): void {
    if(this.lastAnim['deploy'] != LAST_DEPLOY_ANIM.FIRE_INTRO) return;
    this.handleDeployAnimation(LAST_DEPLOY_ANIM.FIRE);
  }

  /*
  * On deploy animation loaded
  *
  * @return void
  */
  onDeployAnimLoaded(): void {
    if(this.lastDeployMsg != null && this.lastDeployMsg.isError)
      this.handleDeployAnimation(LAST_DEPLOY_ANIM.FIRE);
    else
      this.handleDeployAnimation(LAST_DEPLOY_ANIM.NORMAL);
  }

  /*
  * Handle the deploy animation anim number
  *
  * @parameters {anim} - The animation number
  * @return void
  */
  handleDeployAnimation(anim:number): void {
    if(this.lottieDeploy == null) return;

    switch(anim){
      case LAST_DEPLOY_ANIM.NORMAL:
        this.lottieDeploy.playAnimation(0, 60);
        break;
      case LAST_DEPLOY_ANIM.FIRE_INTRO:
        this.lottieDeploy.playAnimation(60, 120);
        break;
      case LAST_DEPLOY_ANIM.FIRE:
        this.lottieDeploy.playAnimation(120, 178);
        break;
    }

    this.lastAnim['deploy'] = anim;
  }
}
