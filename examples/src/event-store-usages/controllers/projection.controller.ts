import { Body, Controller, Get, Param } from '@nestjs/common';
import { EventStoreService } from '@nestjs-geteventstore/event-store';
import { resolve } from 'path';

@Controller('projection')
export default class ProjectionController {
  constructor(private readonly eventStoreService: EventStoreService) {}

  @Get('create/oneTime')
  public async createOneTimeProjection(@Body() query: string): Promise<void> {
    return this.eventStoreService.createProjection(query, 'oneTime');
  }

  @Get('create/continuous/:name')
  public async createContinousProjection(@Param() name: string): Promise<void> {
    return this.eventStoreService.assertProjections([
      {
        name: 'some-projection-continuous2',
        file: resolve(`${__dirname}/../projections/test-projection.js`),
        mode: 'continuous',
        enabled: true,
        checkPointsEnabled: true,
        emitEnabled: true,
      },
    ]);
  }

  @Get('state/:projectionname')
  public async getProjectionState(
    @Param('projectionname') streamName: string,
  ): Promise<any> {
    return this.eventStoreService.getProjectionState(streamName);
  }

  @Get('update/')
  public async updateProjectionState(): Promise<void> {
    return this.eventStoreService.updateProjections([
      {
        name: 'some-projection-continuous2',
        mode: 'continuous',
        enabled: true,
        checkPointsEnabled: true,
        emitEnabled: true,
        file: resolve(`${__dirname}/../projections/test-projection.js`),
      },
    ]);
  }
}
