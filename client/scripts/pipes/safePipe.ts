'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

/*
* Handles XSS angular prevention
*/

@Pipe({
	name: 'sgSafe'
})
export class SafePipe implements PipeTransform {
	constructor(protected _sanitizer: DomSanitizer) {}

	/*
	* Implements PipeTransform
	*
	* @parameters {value} - the value to be allowed
	* @parameters {type} - the value type
	* @return void
	*/
	public transform(value: string, type: string = 'style'): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
		switch (type) {
			case 'html': return this._sanitizer.bypassSecurityTrustHtml(value);
			case 'style': return this._sanitizer.bypassSecurityTrustStyle(value);
			case 'script': return this._sanitizer.bypassSecurityTrustScript(value);
			case 'url': return this._sanitizer.bypassSecurityTrustUrl(value);
			case 'resourceUrl': return this._sanitizer.bypassSecurityTrustResourceUrl(value);
			default: throw new Error(`Invalid safe type specified: ${type}`);
		}
	}
}
