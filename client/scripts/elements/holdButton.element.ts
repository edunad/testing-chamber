'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Component, ViewChild, Output, Input, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

/*
* A button that you have to hold down to trigger
*/
@Component({
  selector: 'sg-holdbtn',
  template: `
    <div class='btn' [ngClass]='{"disabled": disabled}' (mouseup)='cancelHoldAction()' (mousedown)='handleActionClick()'>
      <div class='btn-text' *ngIf='clickTimer == null'>{{ text }}</div>
      <div *ngIf='clickTimer != null && holdTime != null'>
        <div class='beingPressed-text'>{{ holdText }}</div>
        <div class='beingPressed' [style.animation-duration]='holdTime +"ms"| sgSafe:"style"'></div>
      </div>
    </div>
  `
})
export class HoldButtonElement {
  @Input() text: string;
  @Input() holdText: string;
  @Input() holdTime: number;

  @Input() disabled: boolean;
  @Output() onClick: any = new EventEmitter();

  clickTimer: any;

  constructor() {
    this.disabled = false;
    this.holdTime = 5;
  }

  /*
  * Start the action holding timer
  *
  * @parameters {action} - the tag being holded
  * @return void
  */
  handleActionClick(action: any): void {
    if(this.disabled) return;

    if(this.holdTime != null){
      this.clickTimer = setTimeout(_ => {
        this.clickTimer = null;
        this.onClick.next();
      },this.holdTime);
    }else{
      this.onClick.next();
    }
  }

  /*
  * Cancel holding
  *
  * @return void
  */
  cancelHoldAction(): void {
    if(this.clickTimer == null) return;
    clearTimeout(this.clickTimer);
    this.clickTimer = null;
  }
}
