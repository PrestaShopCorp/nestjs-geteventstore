import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidEventException extends HttpException {
  constructor(errors: Error[]) {
    super(errors, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
