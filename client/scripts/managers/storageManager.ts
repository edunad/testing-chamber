'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

/*
* Stores any variable for app usage
*/
@Injectable()
export class StorageManager {
  storedVariables:any;

  constructor() {
    this.storedVariables = {};
  }

  /*
  * Gets a stored variable
  *
  * @parameters {key} - the key
  * @return object
  */
  getStoredVariable(key: string): any {
    return this.storedVariables[key];
  }

  /*
  * Sets a variable to be stored
  *
  * @parameters {key} - the key to store as
  * @parameters {value} - the value to store
  * @return void
  */
  setStoredVariable(key: string, value: any): void {
    this.storedVariables[key] = value;
  }

  /*
  * Clears all the stored variables
  *
  * @return void
  */
  clearStoredVariables(): void {
    this.storedVariables = {};
  }
}
