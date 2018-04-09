'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Component, ViewChild, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

/*
* A deployment warning displaying the remaining time before deployment (TODO: Later re-implement this to support other warnings)
*/
@Component({
  selector: 'sg-deploywarning',
  template: `
    <div class='deploywarning-img'>
      <svg width="100%" height="100%" viewBox="0 0 63 51" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <g id="#c0272dff">
          <path fill="#c0272d" stroke="#c0272d" opacity="1.00" d=" M 26.16 4.10 C 27.91 0.31 34.28 0.00 36.26 3.71 C 44.44 16.57 52.62 29.42 60.75 42.30 C 62.06 43.99 61.81 46.35 61.38 48.31 C 60.20 49.30 58.91 50.13 57.64 51.00 L 5.44 51.00 C 4.28 50.34 3.09 49.73 1.94 49.04 C 0.33 47.06 0.94 44.18 2.00 42.07 C 10.12 29.46 18.13 16.77 26.16 4.10 M 29.42 4.41 C 27.91 5.63 27.23 7.54 26.16 9.12 C 19.10 20.08 12.19 31.14 5.15 42.12 C 4.41 43.33 3.39 44.55 3.56 46.08 C 3.90 47.68 5.54 48.10 6.96 47.99 C 22.98 48.02 39.00 47.98 55.01 48.00 C 56.34 47.93 58.00 48.06 58.92 46.89 C 59.69 45.55 58.79 44.14 58.07 43.02 C 50.16 30.55 42.25 18.09 34.34 5.62 C 33.41 3.96 30.95 2.76 29.42 4.41 Z" />
        </g>
        <g id="#260809ff">
          <path fill="#260809" stroke="#260809" opacity="1.00" d=" M 29.42 4.41 C 30.95 2.76 33.41 3.96 34.34 5.62 C 42.25 18.09 50.16 30.55 58.07 43.02 C 58.79 44.14 59.69 45.55 58.92 46.89 C 58.00 48.06 56.34 47.93 55.01 48.00 C 39.00 47.98 22.98 48.02 6.96 47.99 C 5.54 48.10 3.90 47.68 3.56 46.08 C 3.39 44.55 4.41 43.33 5.15 42.12 C 12.19 31.14 19.10 20.08 26.16 9.12 C 27.23 7.54 27.91 5.63 29.42 4.41 M 29.06 18.04 C 28.82 23.07 29.05 28.13 29.87 33.10 C 30.69 33.12 32.32 33.16 33.14 33.18 C 34.07 28.21 34.09 23.09 33.95 18.05 C 32.32 17.93 30.68 17.93 29.06 18.04 M 29.48 35.36 C 28.53 36.64 29.12 38.46 29.03 39.96 C 30.60 40.04 32.23 40.19 33.76 39.72 C 33.70 38.34 33.98 36.85 33.38 35.57 C 32.09 35.37 30.78 35.32 29.48 35.36 Z" />
        </g>
        <g id="#c1272dff">
          <path fill="#c1272d" stroke="#c1272d" opacity="1.00" d=" M 29.06 18.04 C 30.68 17.93 32.32 17.93 33.95 18.05 C 34.09 23.09 34.07 28.21 33.14 33.18 C 32.32 33.16 30.69 33.12 29.87 33.10 C 29.05 28.13 28.82 23.07 29.06 18.04 Z" />
          <path fill="#c1272d" stroke="#c1272d" opacity="1.00" d=" M 29.48 35.36 C 30.78 35.32 32.09 35.37 33.38 35.57 C 33.98 36.85 33.70 38.34 33.76 39.72 C 32.23 40.19 30.60 40.04 29.03 39.96 C 29.12 38.46 28.53 36.64 29.48 35.36 Z" />
        </g>
      </svg>
    </div>
    <div class='deploywarning-info-container'>
      <div style='font-weight: bold;'>DEPLOYMENT SCHEDULED</div>
      <div style='font-size: 11px;'>SHUTTING DOWN IN <b style='color: #ffdc74;font-size: 14px;'>{{ remainingTime }}</b> SECONDS</div>
    </div>
  `
})
export class DeployWarningElement {
  @Input() remainingTime: string;

  constructor() {
    this.remainingTime = '-';
  }
}
