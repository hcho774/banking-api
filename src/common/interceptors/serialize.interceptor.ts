import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { plainToInstance } from 'class-transformer';

interface ClassType<T> {
  new (): T;
}

const SERIALIZE_OPTIONS = {
  excludeExtraneousValues: true,
  exposeUnsetFields: false,
  exposeDefaultValues: true,
  enableImplicitConversion: true,
};

@Injectable()
class SerializeInterceptor<T> implements NestInterceptor<Partial<T>, T> {
  constructor(private readonly classType: ClassType<T>) {}

  private serialize(data: any): any {
    return plainToInstance(this.classType, data, SERIALIZE_OPTIONS);
  }

  private transform(data: any): any {
    if (data === null || data === undefined) return data;

    // Array → serialize each item
    if (Array.isArray(data)) {
      return this.serialize(data);
    }

    // Paginated { items, meta } → serialize items, keep meta
    if (data.items && Array.isArray(data.items)) {
      return {
        ...data,
        items: this.serialize(data.items),
      };
    }

    // Single object
    return this.serialize(data);
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<Partial<T>>,
  ): Observable<T> {
    return next.handle().pipe(map((data) => this.transform(data)));
  }
}

/**
 * Decorator to serialize response data into a DTO class.
 * Handles all response structures:
 *
 * @example
 * // Single item → PersonDto
 * @Serialize(PersonDto)
 * findOne() { return this.service.findOne(id); }
 *
 * // Array → PersonDto[]
 * @Serialize(PersonDto)
 * findAll() { return this.service.findAll(); }
 *
 * // Paginated { items, meta } → { items: PersonDto[], meta }
 * @Serialize(PersonDto)
 * findAll() { return { items: [...], meta: { total, page, limit } }; }
 */
export function Serialize(classType: any) {
  return UseInterceptors(new SerializeInterceptor(classType));
}
