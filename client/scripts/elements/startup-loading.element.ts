'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Component, ViewChild, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Util } from '../util/util';
import { LottieRendererElement } from './lottie-render.element';

/*
* The startup element with a random animation and quote
*/
@Component({
  selector: 'sg-startup-loading',
  template: `
    <div class='loading-logo'>
      <h1>TESTING-CHAMBER</h1>
    </div>
    <div class='loading-container'>
      <sg-lottie-renderer #lottieAnim (onAnimationDone)="playNextAnimation()" (onAnimationLoaded)="playNextAnimation()" [options]="loadingLottie"></sg-lottie-renderer>
    </div>
    <div class='loading-containerinfo'>
      <div class='loading-container-random'>{{ quote }}</div>
      <div class='loading-container-info'>Starting up..</div>
    </div>
  `
})

export class StartupLoadingElement {
  @ViewChild('lottieAnim') lottieAnim: LottieRendererElement;

  quote: string;
  randomQuotes: Array<string>;

  loadingLottie: any;
  animSegment: any;

  constructor(private util : Util) {
    this.randomQuotes = [
      'Loading shizzles!',
      "I DON'T WANT YOUR DARN LEMONS",
      "This true sentence is false!",
      "SPAAAAAAAAAAAAAAAAAACE",
      "This is the part where I kill you.",
      'Corruption at 50%',
      'Welcome to universe #42',
      'So long and thanks for all the fish',
      "Don't make me call the dance police",
      '<Insert quote here>',
      'Unforeseen Consequences',
      'Beings of pure salt, so salty',
      'Dammit! Stop imposting'
    ];

    let rndQuote = util.getRandomIntExclusive(0, this.randomQuotes.length);
    let rndLoading = util.getRandomIntInclusive(1, 2);

    this.quote = this.randomQuotes[rndQuote];
    this.loadingLottie = {
        autoplay: false,
        loop: false,
        path: 'animations/mythrawr_startups.json'
    };
  }

  /*
  * Picks a random animation frame
  *
  * @return void
  */
  pickAnimationFrame(): void {
    let rndLoading = this.util.getRandomIntInclusive(1, 5);
    switch(rndLoading){
      case 1:
        this.lottieAnim.playAnimation(0, 20);
      break;
      case 2:
        this.lottieAnim.playAnimation(20, 40);
      break;
      case 3:
        this.lottieAnim.playAnimation(40, 60);
      break;
      case 4:
        this.lottieAnim.playAnimation(60, 80);
      break;
      case 5:
        this.lottieAnim.playAnimation(80, 100);
      break;
    }
  }

  /*
  * Plays the next animation frame after one is done
  *
  * @return void
  */
  playNextAnimation(): void {
    this.pickAnimationFrame();
  }
}
