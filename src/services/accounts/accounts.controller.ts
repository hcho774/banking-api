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
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { ApiKeyGuard } from 'src/common/guards/apiKey.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountResponseDto } from './dto/account-response.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { AccountDto } from './dto/account.dto';

@Controller('accounts')
@ApiTags('accounts')
@UseGuards(ApiKeyGuard)
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an account', operationId: 'createAccount' })
  @ApiResponse({ status: 201, type: AccountResponseDto })
  @Serialize(AccountDto)
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Post(':accountId/deposit')
  @ApiOperation({
    summary: 'Deposit funds into an account',
    operationId: 'deposit',
  })
  @ApiResponse({ status: 201, type: AccountResponseDto })
  @Serialize(AccountDto)
  deposit(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() depositDto: DepositDto,
  ) {
    return this.accountsService.deposit(accountId, depositDto);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(+id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(+id);
  }
}

