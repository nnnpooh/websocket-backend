import { OnModuleInit } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Request } from 'express';

@WebSocketGateway({
  // https://socket.io/docs/v4/server-options/
  cors: { origin: '*' },
  namespace: 'custom-namespace',
  serveClient: false,
  allowRequest(req: Request, callback: (err: Error, success: boolean) => void) {
    const headers = req.headers;
    callback(
      null,
      (req.headers.secret && req.headers.secret === '12345') || false,
    );
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    // server.on('connection', (socket) => {
    //   const origin = socket.handshake.headers.origin; // Undefined if coming from postman
    //   console.log('Connection from', socket.id, 'Origin', { origin });
    //   this.server.emit('onEnter', `Server: Connected to ${socket.id}`);
    //   if (origin) {
    //     socket.join('browserRoom');
    //   }
    // });

    server.use((socket: Socket, next) => {
      // validate auth is exist
      if (!socket.handshake.auth.userId || !socket.handshake.auth.role) {
        return next(new Error('Authentication error'));
      }
      return next();
    });
  }

  handleConnection(client: Socket, ...args: any[]) {
    const origin = client.handshake.headers.origin; // Undefined if coming from postman
    console.log('Connection from', client.id, 'Origin', { origin });
    this.server.emit('onEnter', `Server: Connected to ${client.id}`);
    if (origin) {
      client.join('browserRoom');
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Disconnect: ${client.id}`);
  }
  // onModuleInit() {
  //   this.server.on('connection', (socket) => {
  //     const origin = socket.handshake.headers.origin; // Undefined if coming from postman
  //     console.log('Connection from', socket.id, 'Origin', { origin });
  //     this.server.emit('onEnter', `Server: Connected to ${socket.id}`);
  //     if (origin) {
  //       socket.join('browserRoom');
  //     }
  //   });
  // }

  @SubscribeMessage('onChat')
  onMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log(data);
    // console.log({ client });
    // this.server.emit(
    //   'onChat',
    //   `Server: onChat: Client Id: ${client.id}: Data: ${JSON.stringify(data)}`,
    // );
    client.broadcast.emit(
      'onChat',
      `[${client.id}]: Data: ${JSON.stringify(data)}`,
    );

    this.server
      .to('browserRoom')
      .emit('onChat', `[Room] Data: ${JSON.stringify(data)}`);
  }

  @SubscribeMessage('onPrivate')
  onPrivate(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const privateMessage = data[0];
    const toId = data[1];
    client
      .to(toId)
      .emit(
        'onPrivate',
        `Server: from ${client.id} has message to you: ${privateMessage}`,
      );
  }
}
