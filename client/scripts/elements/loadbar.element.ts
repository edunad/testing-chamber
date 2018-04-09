'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Component, ViewChild, Output, Input, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

/*
* A loadbar that uses Date.now() to display how much time left to the next Date.now()
*/
@Component({
  selector: 'sg-loadbar',
  template: `
    <div [style.width]='currentValue + "%"' style='transition: width 0.3s ease-in-out;' class='loadbar-container'></div>
  `
})
export class LoadbarElement implements OnInit, OnDestroy {
  @Input() maxTimeValue: number;
  @Input() tick: number;

  currentValue: number;
  interval: any;

  /*
  * OnInit implementation
  */
  ngOnInit(): void {
    this.interval = setInterval(() => {
      let timeRan = (this.maxTimeValue - Date.now()) / 1000;
      if(timeRan <= 0) return;

      this.currentValue = (timeRan * 100) / this.tick;
    },1000);
  }

  /*
  * OnDestroy implementation
  */
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
}
