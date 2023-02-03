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
})
export class EventsGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    console.log('init');
    this.server.on('connection', (socket) => {
      this.server.emit('onEnter', {
        id: socket.id,
      });
      console.log(socket.id);
    });
  }

  @SubscribeMessage('newMessage')
  onNewMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log(data);
    // console.log({ client });
    this.server.emit('onMessage', {
      name: 'hello',
    });
    return 'Hello world!';
  }

  @SubscribeMessage('newMessage2')
  onNewMessage2(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log('message2');
    console.log(data);
    // console.log({ client });
    return 'Hello world!';
  }
}
