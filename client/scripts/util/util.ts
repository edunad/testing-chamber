'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Injectable } from '@angular/core';

/*
* Helper utils
*/

@Injectable()
export class Util {
  constructor() {}

  /*
  * Gets as random EXCLUSIVE
  *
  * @parameters {min} - the min number
  * @parameters {max} - the max number
  * @return number
  */
  getRandomIntExclusive(min: number, max:number) : number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /*
  * Gets as random INCLUSIVE
  *
  * @parameters {min} - the min number
  * @parameters {max} - the max number
  * @return number
  */
  getRandomIntInclusive(min: number, max:number) : number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /*
  * Sets the URL
  *
  * @parameters {url} - the url to set
  * @return void
  */
  setNavigationURL(url: string): void {
    window.history.pushState('','', '#' + url);
  }
}
