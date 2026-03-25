import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto, PaginatedResponseDto } from '../dto/api-response.dto';
import { Serialize } from '../interceptors/serialize.interceptor';

type ApiSerializedResponseOptions = {
  status: number;
  dataType: Type<object>;
  paginated?: boolean;
};

export function ApiSerializedResponse({
  status,
  dataType,
  paginated = false,
}: ApiSerializedResponseOptions) {
  const envelopeType = paginated ? PaginatedResponseDto : ApiResponseDto;

  return applyDecorators(
    ApiExtraModels(envelopeType, dataType),
    ApiResponse({
      status,
      schema: {
        allOf: [
          { $ref: getSchemaPath(envelopeType) },
          {
            properties: {
              data: paginated
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(dataType) },
                  }
                : { $ref: getSchemaPath(dataType) },
            },
          },
        ],
      },
    }),
    Serialize(dataType),
  );
}
