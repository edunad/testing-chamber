'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Component, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SocketManager } from '../managers/socketManager';
import { TestManager } from '../managers/testManager';
import { StorageManager } from '../managers/storageManager';

import { Util } from '../util/util';

const confetti: any = require('canvas-confetti');

/*
* Main app component
*/
@Component({
  selector: 'sg-testing-chamber',
  templateUrl: '../../views/components/app-view.html'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('frame') iframeWebsite: ElementRef;

  appInit: boolean;
  frameInit: boolean;

  deployUrl: string;
  showUpdate: boolean;

  deploymentStatus: any;
  onDeployUpdate: Subscription;

  constructor(private socketManager: SocketManager,
    private util: Util,
    private testManager: TestManager,
    private storageManager: StorageManager,
    private zone: NgZone) {

    this.appInit = false;
    this.frameInit = false;
    this.deployUrl = '';
    this.deploymentStatus = {};
  }

  /*
  * Implements OnInit
  */
  ngOnInit(): void {
    this.initializeApp();
    this.bindObservables();
  }

  /*
  * Implements OnDestroy
  */
  ngOnDestroy(): void {
    this.unbindObservables();
  }

  /*
  * Attempts a connection to the socket, if it succeeds
  * Grabs the required data and stores it
  * for later use. Finally it binds any observables.
  *
  * @return void
  */
  initializeApp(): void {
    if(this.appInit) return;

    // Buggy iframe.. -.-
    setTimeout(_ => {
      if(this.iframeWebsite != null){
        this.iframeWebsite.nativeElement.onload = () => {
          if(this.iframeWebsite.nativeElement.src == null) return;
          this.zone.run(() => {
            this.frameInit = true;

            // TODO : Append the iframe location to the app url using #
            // CORS is being a btch
            //console.log(this.iframeWebsite.nativeElement.contentWindow.location.href);
          });
        }
      }
    });

    this.socketManager.connect((socketErr) => {
      if(socketErr) return this.handleSetupFailure(socketErr);
      this.bindObservables();
      this.deployUrl = this.storageManager.getStoredVariable('DEPLOY_URL');

      this.zone.run(() => {
        this.appInit = true;
      });
    });
  }

  /*
  * Binds observables
  *
  * @return void
  */
  bindObservables(): void {
    this.onDeployUpdate = this.testManager.onDeployUpdate$.subscribe(value => {
      // Build done
      if(this.deploymentStatus.status == 2 && value.status == 0){
        confetti({
          particleCount: 100,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: 0.5,
            y: 0
          }
        });
      }

      this.deploymentStatus = value;
    });

    this.deploymentStatus = this.testManager.getDeployStatus();
  }

  /*
  * Unbinds observables
  *
  * @return void
  */
  unbindObservables(): void {
    this.onDeployUpdate.unsubscribe();
  }

  /*
  * If the socket init fails, throw a app error (TODO)
  *
  * @parameters {err} - The startup error that occured
  * @return void
  */
  handleSetupFailure(err: string): void {
    console.log('[ERR]' + err);
  }
}
