'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Component, ViewChild, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

/*
* Toolbar Element (contains the title of the app, the version and a X )
*/

@Component({
  selector: 'sg-toolbar',
  template: `
    <div class='toolbar-container'>
      <div class='toolbar-title'>TESTING-CHAMBER - Version 0.0.2</div>
      <div class='toolbar-close' (click)='requestClose()'>
        <svg width="32pt" height="32pt" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" style="height: 100%;width: 100%;">
          <g id="#e8e8e8e8" stroke="#e8e8e8">
            <path fill="#e8e8e8" opacity="1" d=" M 8.22 9.60 C 8.71 9.11 9.20 8.62 9.70 8.13 C 11.70 10.46 13.57 12.83 16.06 14.58 C 18.18 12.24 20.79 10.42 22.30 7.58 C 22.62 8.07 23.26 9.05 23.58 9.54 C 21.33 11.52 19.23 13.66 17.18 15.85 C 19.43 18.19 21.25 20.34 23.95 22.24 C 23.47 22.74 23.00 23.24 22.52 23.74 C 20.51 21.34 18.20 19.23 15.99 17.03 C 13.74 19.23 11.45 21.40 9.35 23.75 C 9.04 23.38 8.41 22.63 8.09 22.26 C 10.46 20.30 12.64 18.13 14.72 15.87 C 12.70 13.63 10.56 11.50 8.22 9.60 Z" />
          </g>
        </svg>
      </div>
    </div>
  `
})
export class ToolbarElement {
  @Output() onClose: any = new EventEmitter();

  /*
  * On X button click, trigger onClose event
  *
  * @return void
  */
  requestClose(): void {
    this.onClose.emit();
  }
}
