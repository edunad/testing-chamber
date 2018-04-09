'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Pipe, PipeTransform } from '@angular/core';

/*
* Removes the deployed build from the list
*/
@Pipe({
	name: 'sgSkipBuild'
})
export class SkipBuildPipe implements PipeTransform {
	constructor() {}

	/*
	* Implements PipeTransform
	*
	* @parameters {value} - the value to be allowed
	* @parameters {type} - the value type
	* @return object
	*/
	public transform(value: any, skipId: string): any  {
    return value.filter((build: any) => {
      return build.buildID != skipId;
    });
	}
}
