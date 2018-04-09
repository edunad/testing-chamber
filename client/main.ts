/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { NgModule, enableProdMode } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

//======= ELEMENTS =======//
import { StartupLoadingElement } from './scripts/elements/startup-loading.element';
import { LottieRendererElement } from './scripts/elements/lottie-render.element';
import { ToolbarElement } from './scripts/elements/toolbar.element';
import { BuildElement } from './scripts/elements/build.element';
import { LoadbarElement } from './scripts/elements/loadbar.element';
import { HoldButtonElement } from './scripts/elements/holdButton.element';
import { DeployWarningElement } from './scripts/elements/deploywarning.element';

//======= COMPONENTS =======//
import { AppComponent } from './scripts/components/app.component';
import { UpdateComponent } from './scripts/components/update.component';
import { DeploymentComponent } from './scripts/components/deployment.component';

//======= Services =======//
import { SocketManager } from './scripts/managers/socketManager';
import { TestManager } from './scripts/managers/testManager';
import { StorageManager } from './scripts/managers/storageManager';

//======= UTIL =======//
import { Util } from './scripts/util/util';
import { XSSUtil } from './scripts/util/xssUtil';
import { PersistData } from './scripts/util/persistData';

//======= PIPES =======//
import { SafePipe } from './scripts/pipes/safePipe';
import { SkipBuildPipe } from './scripts/pipes/skipBuildPipe';

@NgModule({
    imports: [
        BrowserModule,
        HttpClientModule
    ],
    providers: [
      // SERVICES //
      TestManager,
      SocketManager,
      StorageManager,

      // UTIL //
      Util,
      XSSUtil,
      PersistData
    ],
    declarations: [
      // ELEMENTS //
      StartupLoadingElement,
      LottieRendererElement,
      ToolbarElement,
      BuildElement,
      LoadbarElement,
      HoldButtonElement,
      DeployWarningElement,

      // COMPONENTS //
      AppComponent,
      UpdateComponent,
      DeploymentComponent,

      // PIPE //
      SafePipe,
      SkipBuildPipe
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

//enableProdMode(); // Enable production mode
const platform = platformBrowserDynamic();
platform.bootstrapModule(AppModule);
