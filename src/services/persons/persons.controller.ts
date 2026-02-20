import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ApiKeyGuard } from 'src/common/guards/apiKey.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  PersonListResponseDto,
  PersonResponseDto,
} from './dto/person-response.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { PersonDto } from './dto/person.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('persons')
@ApiTags('persons')
@UseGuards(ApiKeyGuard)
export class PersonsController {
  private readonly logger = new Logger(PersonsController.name);
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a person', operationId: 'createPerson' })
  @ApiResponse({ status: 201, type: PersonResponseDto })
  @Serialize(PersonDto)
  createPerson(@Body() createPersonDto: CreatePersonDto) {
    return this.personsService.create(createPersonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all persons', operationId: 'findAllPersons' })
  @ApiResponse({ status: 200, type: PersonListResponseDto })
  @Serialize(PersonDto)
  findAllPersons(@Query() query: PaginationQueryDto) {
    return this.personsService.findAll(query);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Find one person', operationId: 'findOnePerson' })
  @ApiResponse({ status: 200, type: PersonResponseDto })
  @Serialize(PersonDto)
  findOnePerson(@Param('publicId') publicId: string) {
    return this.personsService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Update a person', operationId: 'updatePerson' })
  @ApiResponse({ status: 200, type: PersonResponseDto })
  @Serialize(PersonDto)
  updatePerson(
    @Param('publicId') publicId: string,
    @Body() updatePersonDto: UpdatePersonDto,
  ) {
    return this.personsService.update(publicId, updatePersonDto);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete a person', operationId: 'deletePerson' })
  @ApiResponse({ status: 200, type: PersonResponseDto })
  @Serialize(PersonDto)
  deletePerson(@Param('publicId') publicId: string) {
    return this.personsService.remove(publicId);
  }

  @Patch(':publicId/reactivate')
  @ApiOperation({
    summary: 'Reactivate a deleted person',
    operationId: 'reactivatePerson',
  })
  @ApiResponse({ status: 200, type: PersonResponseDto })
  @Serialize(PersonDto)
  reactivatePerson(@Param('publicId') publicId: string) {
    return this.personsService.reactivate(publicId);
  }
}
