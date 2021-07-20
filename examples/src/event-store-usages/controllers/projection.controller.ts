import { Controller, Get, Inject, Param } from '@nestjs/common';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import {
  EVENT_STORE_SERVICE,
  IEventStoreService,
} from '@nestjs-geteventstore/event-store/services/event-store.service.interface';

@Controller('projection')
export default class ProjectionController {
  constructor(
    @Inject(EVENT_STORE_SERVICE)
    private readonly eventStoreService: IEventStoreService,
  ) {}

  @Get('create/oneTime')
  public async createOneTimeProjection(): Promise<void> {
    const query = readFileSync(
      resolve(`${__dirname}/../projections/test-projection.js`),
      'utf8',
    );
    return this.eventStoreService.createProjection(query, 'oneTime');
  }

  @Get('create/continuous/:name')
  public async createContinousProjection(@Param() name: string): Promise<void> {
    return this.eventStoreService.assertProjections([
      {
        name: 'some-projection-continuous-2',
        file: resolve(`${__dirname}/../projections/test-projection.js`),
        mode: 'continuous',
        enabled: true,
        checkPointsEnabled: true,
        emitEnabled: true,
      },
    ]);
  }

  @Get('create/transient/:name')
  public async createTransientProjection(@Param() name: string): Promise<void> {
    return this.eventStoreService.assertProjections([
      {
        name: 'some-projection-transient-1',
        file: resolve(`${__dirname}/../projections/test-projection.js`),
        mode: 'transient',
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
