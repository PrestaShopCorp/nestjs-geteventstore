import { IBaseEvent } from '../interfaces';

export const EventVersion =
  (version: number): any =>
  <T extends { new (...args: any[]): IBaseEvent }>(BaseEvent: T) => {
    const newClass = class extends BaseEvent implements IBaseEvent {
      constructor(...args: any[]) {
        super(...args);
        this.metadata.version = version;
      }
    };
    Object.defineProperty(newClass, 'name', {
      value: BaseEvent.name,
    });
    return newClass;
  };
