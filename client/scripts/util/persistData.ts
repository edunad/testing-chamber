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
* Helper service for sessionStorage
*/

@Injectable()
export class PersistData {
  constructor() {}

  /*
  * Stores the data in sessionStorage, by appending or overwriting it
  *
  * @parameters {key} - the data key to be stored
  * @parameters {value} - the value to be stored
  * @return void
  */
  storeInPersist(key: string, value: any): void {
    var data = this.getPersist();
    if(data == null){
      let temp = {};
      temp[key] = value;
      sessionStorage.setItem('persistData',JSON.stringify(temp));
    }else{
      data[key] = value;
      sessionStorage.setItem('persistData',JSON.stringify(data));
    }
  }

  /*
  * Gets the data using the key from sessionStorage
  *
  * @parameters {key} - the data key to get the data from
  * @return object
  */
  getPersistVar(key: string): any {
    var data = this.getPersist();
    if(data == null) return null;
    return data[key];
  }

  /*
  * Gets all the persist data and checks PersistData integrity
  *
  * @return object
  */
  private getPersist(): any {
    try{
      var rawData = sessionStorage.getItem('persistData');
      if(rawData == null || rawData == '') return null;
      return JSON.parse(rawData);
    }catch(err){
      console.warn('[PersistData] Malformed data, clearing..');
      sessionStorage.removeItem('persistData');
      return null;
    }
  }
}
