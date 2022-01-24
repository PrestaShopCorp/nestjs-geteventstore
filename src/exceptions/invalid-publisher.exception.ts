import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidPublisherException<
  T extends object = Function,
> extends HttpException {
  constructor(publisher: T, method: keyof T) {
    super(
      `Invalid publisher: expected ${
        publisher.constructor.name + '::' + method
      } to be a function`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
