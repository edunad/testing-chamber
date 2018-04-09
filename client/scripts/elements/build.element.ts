'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Injectable, Component, Input, HostListener, Output, ViewChild, ElementRef, EventEmitter, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Util } from '../util/util';
import { StorageManager } from '../managers/storageManager';

import toMaterialStyle from 'material-color-hash';

/*
* Displays the build and it's info. Also handles opening and closing
*/
@Component({
  selector: 'sg-build',
  template: `
  <div class='changelog-info' [ngClass]="{ 'changelog-cursor': buildData.changelog != null && buildData.changelog.length > 0 }" (click)='toggleOpen()'>
    <div class='changelog-info-buildID' [ngStyle]="{'background-color': buildData.buildID == currentBuild ? '#27ae60' : '#2d2d2d'}">#{{ buildData.buildID }}</div>
    <div class='changelog-info-buildname'>[{{ buildData.buildDate }}] {{ buildData.displayName }}</div>
    <div class='changelog-info-toggle' *ngIf='buildData.changelog != null && buildData.changelog.length > 0'>
      <img *ngIf='isOpen' src='./img/small-up.svg' style='width: 100%;height: 100%;'/>
      <img *ngIf='!isOpen' src='./img/small-down.svg' style='width: 100%;height: 100%;'/>
    </div>
  </div>

  <div *ngIf='isOpen' class='changelog-hidder'>
    <div *ngFor='let change of buildData.changelog' class='changelog-content'>
      <div class='changelog-files' [ngStyle]="{ 'border': 'solid 2px ' + getAuthorColor(change.author).main }">{{ change.filesChanged.length }}</div>
      <div class='changelog-content-line' [ngStyle]="{ 'border-bottom': 'solid 2px ' + getAuthorColor(change.author).main, 'border-left': 'solid 2px ' + getAuthorColor(change.author).main }"></div>
      <div class='changelog-content-line-wall' [ngStyle]="{ 'border-left': 'solid 2px ' + getAuthorColor(change.author).main }"></div>
      <div class='changelog-content-info' [ngStyle]="{ 'background-color': getAuthorColor(change.author).main, 'border-left': 'solid 4px ' + getAuthorColor(change.author).main}">
        <div class='changelog-content-author' [ngStyle]="{ 'background-color': getAuthorColor(change.author).mainDark }">{{ change.author }}</div>
        <div class='changelog-content-msg tooltiped' [attr.hint]='change.changeMsg'>{{ change.changeMsg }}</div>
      </div>

      <div *ngFor='let files of change.filesChanged' class='changelog-content-changeset'>
        <div class='changelog-content-changeset-mode' [ngStyle]="{'color': getEditColor(files.editType)}">{{ files.editType }}</div>
        <div class='changelog-content-changeset-file tooltiped' [attr.hint]='files.file'>{{ files.file }}</div>
      </div>
    </div>
  </div>
  `
})
export class BuildElement implements OnInit {
  @Input() buildData: any;
  @Input() currentBuild: string;

  isOpen: boolean;
  colors: any;

  constructor(private util: Util, private storage: StorageManager) {
    this.colors = {};
  }

  /*
  * Implements OnInit
  */
  ngOnInit(): void {
    let open = this.storage.getStoredVariable('build_' + this.buildData.buildID);
    if(open == null) this.storage.setStoredVariable('build_' + this.buildData.buildID, this.buildData.buildID == this.currentBuild);
    this.isOpen = open;
  }

  /*
  * Generates a material-ui color using the author name and buildID, if cached, just uses the cached.
  *
  * @parameters {author} - The author to get the color from
  * @return string
  */
  getAuthorColor(author:string): string {
    if(this.colors[author] == null){
      let namehash = author + this.buildData.buildID;
      this.colors[author] = {
        main: toMaterialStyle(namehash, '700').backgroundColor,
        mainDark: toMaterialStyle(namehash, '900').backgroundColor
      }
    }

    return this.colors[author];
  }

  /*
  * Gets the color for the current file edit type
  *
  * @parameters {type} - The file edit type
  * @return string
  */
  getEditColor(type: string): string {
    switch(type.toLowerCase()){
      case 'add':
        return '#27ae60';
      case 'delete':
        return '#c0392b';
      case 'edit':
        return '#e67e22';
    }
  }

  /*
  * Toggles opening and closing the build
  *
  * @return void
  */
  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    this.storage.setStoredVariable('build_' + this.buildData.buildID, this.isOpen);
  }
}
