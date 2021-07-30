import { Body, Controller, Get, Param } from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { resolve } from 'path';
import { readFileSync } from 'fs';

@Controller('projection')
export default class ProjectionController {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get('create/oneTime')
  public async createOneTimeProjection(@Body() query: string): Promise<void> {
    return this.eventStoreService.createProjection(query, 'oneTime');
  }

  @Get('create/continuous/:name')
  public async createContinousProjection(@Param() name: string): Promise<void> {
    const queryPath: string = resolve(
      `${__dirname}/../projections/test-projection.js`,
    );
    const query: string = readFileSync(queryPath, 'utf8');

    return this.eventStoreService.createProjection(
      query,
      'continuous',
      name,
      {},
    );
  }

  @Get('state/:projectionname')
  public async updateProjection(
    @Param('projectionname') streamName: string,
  ): Promise<any> {
    return this.eventStoreService.getProjectionState(streamName);
  }

  // @Get('getstate/:streamname/:group')
  // public async getProjectionState(
  //   @Param('streamname') streamName: string,
  //   @Param('group') group: string,
  //   @Body() options: PersistentSubscriptionOptions,
  // ): Promise<void> {
  //   return this.eventStoreService.updatePersistentSubscription(
  //     streamName,
  //     group,
  //     options,
  //   );
  // }
}
