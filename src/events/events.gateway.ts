import { OnModuleInit } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'custom-namespace',
})
export class EventsGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      const origin = socket.handshake.headers.origin; // Undefined if coming from postman
      console.log('Connection from', socket.id, 'Origin', { origin });
      this.server.emit('onEnter', `Server: Connected to ${socket.id}`);
      if (origin) {
        socket.join('browserRoom');
      }
    });
  }

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
