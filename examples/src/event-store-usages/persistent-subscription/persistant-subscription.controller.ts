import { Controller, Get } from '@nestjs/common';

@Controller('persistent-subscription')
export default class PersistantSubscriptionController {
  @Get()
  async test(): Promise<string> {
    return 'toto';
  }
}
