import { Injectable, Logger } from '@nestjs/common';
import { ClientNotifier } from '../domain/ports/client-notifier';
import { CommandBus } from '@nestjs/cqrs';
import { NotifyClientCommand } from '../commands/impl/notify-client.command';

@Injectable()
export default class ClientNotifierAdapter implements ClientNotifier {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly commandBus: CommandBus) {}

  public async notifyClientByEmail(
    clientId: string,
    arrival: Date,
    checkout: Date,
  ): Promise<void> {
    this.logger.log('Async ClientNotifierHandler notifyClientByEmail...');
    return this.commandBus.execute(
      new NotifyClientCommand(clientId, arrival, checkout),
    );
  }
}
