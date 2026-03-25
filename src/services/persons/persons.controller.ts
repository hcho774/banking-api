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
  Query,
} from '@nestjs/common';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ApiKeyGuard } from 'src/common/guards/apiKey.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PersonDto } from './dto/person.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ApiSerializedResponse } from 'src/common/decorators/api-serialized-response.decorator';

@Controller('persons')
@ApiTags('persons')
@UseGuards(ApiKeyGuard)
export class PersonsController {
  private readonly logger = new Logger(PersonsController.name);
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a person', operationId: 'createPerson' })
  @ApiSerializedResponse({
    status: 201,
    dataType: PersonDto,
  })
  createPerson(@Body() createPersonDto: CreatePersonDto) {
    return this.personsService.create(createPersonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all persons', operationId: 'findAllPersons' })
  @ApiSerializedResponse({
    status: 200,
    dataType: PersonDto,
    paginated: true,
  })
  findAllPersons(@Query() query: PaginationQueryDto) {
    return this.personsService.findAll(query);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Find one person', operationId: 'findOnePerson' })
  @ApiSerializedResponse({
    status: 200,
    dataType: PersonDto,
  })
  findOnePerson(@Param('publicId') publicId: string) {
    return this.personsService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Update a person', operationId: 'updatePerson' })
  @ApiSerializedResponse({
    status: 200,
    dataType: PersonDto,
  })
  updatePerson(
    @Param('publicId') publicId: string,
    @Body() updatePersonDto: UpdatePersonDto,
  ) {
    return this.personsService.update(publicId, updatePersonDto);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete a person', operationId: 'deletePerson' })
  @ApiSerializedResponse({
    status: 200,
    dataType: PersonDto,
  })
  deletePerson(@Param('publicId') publicId: string) {
    return this.personsService.remove(publicId);
  }

  @Patch(':publicId/reactivate')
  @ApiOperation({
    summary: 'Reactivate a deleted person',
    operationId: 'reactivatePerson',
  })
  @ApiSerializedResponse({
    status: 200,
    dataType: PersonDto,
  })
  reactivatePerson(@Param('publicId') publicId: string) {
    return this.personsService.reactivate(publicId);
  }
}
