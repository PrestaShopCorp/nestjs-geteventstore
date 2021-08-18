import { Controller, Get, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClientReservesRoomCommand } from './commands/impl/client-reserves-room.command';
import { ClientArrivesCommand } from './commands/impl/client-arrives.command';
import { PayBillCommand } from './commands/impl/pay-bill.command';
import CommandResponse from './commands/response/command.response';
import CheckoutRoomQuery from './queries/impl/checkout-room.query';
import QueryResponse from './queries/response/query.response';
import GetClientRoomQuery from './queries/impl/get-client-room.query';
import GetClientReceiptQuery from './queries/impl/get-client-receipt.query';
import GetHotelStateQuery from './queries/impl/get-hotel-state.query';
import { BuildNewHotelCommand } from './commands/impl/build-new-hotel.command';

@Controller('hotel-room')
export default class HotelRoomController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('reserves/:clientId')
  public async reserveRoom(
    @Param('clientId') clientId: string,
  ): Promise<CommandResponse> {
    return this.commandBus.execute(
      new ClientReservesRoomCommand(clientId, new Date(), new Date()),
    );
  }

  @Get('arrival/:clientId')
  public async clientArrives(
    @Param('clientId') clientId: string,
  ): Promise<CommandResponse> {
    return this.commandBus.execute(new ClientArrivesCommand(clientId));
  }

  @Get('getClientRoom/:clientId')
  public async getClientRoom(
    @Param('clientId') clientId: string,
  ): Promise<QueryResponse> {
    return this.queryBus.execute(new GetClientRoomQuery(clientId));
  }

  @Get('checkout/:roomNumber')
  public async roomCheckout(
    @Param('roomNumber') roomNumber: number,
  ): Promise<QueryResponse> {
    return this.queryBus.execute(new CheckoutRoomQuery(roomNumber));
  }

  @Get('payBill/:clientId/:checkoutResult')
  public async payBill(
    @Param('clientId') clientId: string,
    @Param('checkoutResult') checkoutResult: 'allIsOk' | 'towelsMissing',
  ): Promise<CommandResponse> {
    return this.commandBus.execute(
      new PayBillCommand(clientId, checkoutResult),
    );
  }

  @Get('receipt/:clientId')
  public async getReceipt(
    @Param('clientId') clientId: string,
  ): Promise<QueryResponse> {
    return this.queryBus.execute(new GetClientReceiptQuery(clientId));
  }

  @Get('hotelstate')
  public async getHotelState(): Promise<QueryResponse> {
    return this.queryBus.execute(new GetHotelStateQuery());
  }

  @Get('build/:nbRooms')
  public async buildNewHotel(
    @Param('nbRooms') nbRooms: number,
  ): Promise<CommandResponse> {
    return this.commandBus.execute(new BuildNewHotelCommand(nbRooms));
  }
}
