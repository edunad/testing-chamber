'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Injectable, Component, Input, HostListener, Output, ViewChild, ElementRef, EventEmitter, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

const lottie: any = require('lottie-web/build/player/lottie.js');

/*
* Handles LottieJS and creates a render container
*/
@Component({
  selector: 'sg-lottie-renderer',
  template: `
  <div #lottieContainer
    [ngStyle]="{'width': width, 'height': height, 'overflow': 'hidden', 'margin': '0 auto'}">
  </div>
  `
})
export class LottieRendererElement implements OnInit {
  @Input() options: any;

  @Input() width: string = '100%';
  @Input() height: string = '100%';

  @Output() onAnimationLoaded: any = new EventEmitter();
  @Output() onAnimationDone: any = new EventEmitter();

  @ViewChild('lottieContainer') container: ElementRef;

  viewWidth: string;
  viewHeight: string;

  _options: any;
  _currentAnim: any;

  /*
  * OnInit implementation
  */
  ngOnInit(): void {
    this._options = {
        container: this.container.nativeElement,
        renderer: 'svg',
        loop: this.options.loop !== false,
        autoplay: this.options.autoplay !== false,
        autoloadSegments: false,
        animationData: this.options.animationData || null,
        rendererSettings: {
          progressiveLoad: false,
          hideOnTransparent: true
        },
        path: this.options.path,
        prerender: true
    };

    this.setAnimation();
  }

  /*
  * Sets the current animation to play
  *
  * @return void
  */
  setAnimation(): void {
    this._currentAnim = lottie.loadAnimation(this._options);
      lottie.setQuality('low');

      this._currentAnim.onComplete = () => {
      this.onAnimationDone.emit();
    };

    this._currentAnim.onLoopComplete = () => {
      this.onAnimationDone.emit();
    };

    this._currentAnim.addEventListener('data_ready',() => {
      this.onAnimationLoaded.emit();
    });
  }

  /*
  * Plays a animation from the frame start to the frame end
  *
  * @parameters {framestart} - The frame to start
  * @parameters {frameEnd} - The frame to end
  * @return void
  */
  playAnimation(frameStart:number, frameEnd: number): void {
    if(this._currentAnim == null) return;
    this._currentAnim.playSegments([frameStart,frameEnd], true);
  }
}
