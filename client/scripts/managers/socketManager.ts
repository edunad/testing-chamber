'use strict';

/*
* Copyright © Mythical Rawr 2014-2017
* Authors: Eduardo de Sousa Fernandes
* Website: www.failcake.me
*/

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

const config: any = require('./../../client_config.json');
import { TestManager } from './testManager';

/* NODE IMPORTS */
import * as io from 'socket.io-client';
/* NODE IMPORTS */

const SOCKET_MESSAGE_TYPE = Object.freeze({
  INFO: 0,
  ERROR: 1,
  CRITICAL: 2
});

/*
* Handles the socket-io connection and data transfer
*/
@Injectable()
export class SocketManager {
  connectionSocket:any;

  // Observable string sources
  onSocketUpdate = new Subject<any>();
  onSocketUpdate$ = this.onSocketUpdate.asObservable();

  constructor(private testManager: TestManager) {}

  /*
  * Connects the socket
  *
  * @parameters {callback} - The callback function
  * @return void
  */
  connect(callback: any): void {
    if (this.isConnected()) return callback('Already connected to the server');
    if (config['TOKEN'] == null) return callback('Failed to authenticate');

    var socket = io.connect(window.location.host + '/', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax : 5000,
      reconnectionAttempts: Infinity,
      timeout: 1000
    });

    socket.on('reconnecting', (reconnectTries) => {
      if (reconnectTries === 3 && this.connectionSocket == null) {
        return this.handleSocketMessage('Failed to contact server', SOCKET_MESSAGE_TYPE.CRITICAL);
      }
      return this.handleSocketMessage('Lost connection with server', SOCKET_MESSAGE_TYPE.ERROR);
    });

    socket.on('connect', () => {
      socket.emit('authentication',
      {
        token: config['TOKEN']
      }, () => {});

      socket.on('authenticated',(data) => {
        if(data == null) return callback('Invalid authentication response data');
        this.testManager.onSocketServerConnection(data);
        this.registerConnectedSocket(socket);

        return callback(null);
      });

      socket.on('unauthorized', (err) => {
        socket.disconnect();
        return callback(err);
      });
    });
  }

  /*
  * Disconnects from the socket server
  *
  * @return void
  */
  disconnectFromServer(): void {
    if(this.connectionSocket == null) return;
    this.connectionSocket.disconnect();
    this.connectionSocket = null;
  }

  /*
  * Emit data to the server
  *
  * @parameters {event} - The socket event
  * @parameters {data} - The data
  * @parameters {callback} - The response callback
  * @return void
  */
  emit(event: string, data: any = {}, callback: any = null): void {
    if(this.connectionSocket == null || !this.connectionSocket.connected || event == null) return;
    this.connectionSocket.emit(event, data, callback);
  }

  /*
  * Handles socket errors
  *
  * @parameters {msg} - The socket message
  * @parameters {msgType} - The socket type (Info, Warning, Error)
  * @return void
  */
  handleSocketMessage(msg: string, msgType: number): void {
    if(msgType == SOCKET_MESSAGE_TYPE.CRITICAL) return this.disconnectFromServer();
    this.onSocketUpdate.next({
      msg: msg,
      msgType: msgType
    });
  }

  /*
  * Checks if the user socket is connected to the server
  *
  * @return boolean
  */
  isConnected(): boolean {
    return this.connectionSocket != null;
  }

  /*
  * On connection authorized attatch socket events
  *
  * @parameters {socket} - The socket to attach the events to
  * @return void
  */
  registerConnectedSocket(socket: any): void {
    if(this.connectionSocket != null) return;
    this.connectionSocket = socket;

    // Register events
    socket.on('disconnect', (err) => {
      if(err == 'io server disconnect'){
        this.handleSocketMessage('Kicked from server',SOCKET_MESSAGE_TYPE.CRITICAL);
      }else{
        this.handleSocketMessage('Lost connection with server',SOCKET_MESSAGE_TYPE.ERROR);
      }
    });

    socket.on('reconnect', () => {
      this.handleSocketMessage('Reconnected to the server!',SOCKET_MESSAGE_TYPE.INFO);
    });

    // UPDATE MESSAGES //
    socket.on('jenkinsStatus', (data) => {
      if(data == null) return;
      this.testManager.setJenkinsData(data);
    });

    // DEPLOYMENT MESSAGES //
    socket.on('deployStatus', (data) => {
      if(data == null) return;
      this.testManager.setDeployStatus(data);
    });

    socket.on('deployedID', (data) => {
      if(data == null) return;
      this.testManager.setDeployedVersion(data);
    });

    socket.on('deployMsg', (data) => {
      if(data == null) return;
      this.testManager.setDeployMSGStatus(data);
    });
  }
}
