import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { ApiKeyGuard } from 'src/common/guards/apiKey.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AccountResponseDto,
  AccountListResponseDto,
} from './dto/account-response.dto';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { StatementResponseDto } from './dto/statement-response.dto';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { AccountDto } from './dto/account.dto';
import { BalanceDto } from './dto/balance.dto';
import { TransactionDto } from './dto/transaction.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { StatementQueryDto } from './dto/statement-query.dto';

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

  @Get(':accountId/balance')
  @ApiOperation({
    summary: 'Get account balance',
    operationId: 'getBalance',
  })
  @ApiResponse({ status: 200, type: BalanceResponseDto })
  @Serialize(BalanceDto)
  getBalance(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return this.accountsService.getBalance(accountId);
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

  @Post(':accountId/withdraw')
  @ApiOperation({
    summary: 'Withdraw funds from an account',
    operationId: 'withdraw',
  })
  @ApiResponse({ status: 201, type: AccountResponseDto })
  @Serialize(AccountDto)
  withdraw(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() withdrawDto: WithdrawDto,
  ) {
    return this.accountsService.withdraw(accountId, withdrawDto);
  }

  @Get(':accountId/statements')
  @ApiOperation({
    summary: 'Get account statements',
    operationId: 'getStatements',
  })
  @ApiResponse({ status: 200, type: StatementResponseDto })
  @Serialize(TransactionDto)
  getStatements(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query() query: StatementQueryDto,
  ) {
    return this.accountsService.getStatements(accountId, query);
  }

  @Patch(':accountId/block')
  @ApiOperation({
    summary: 'Block an account',
    operationId: 'blockAccount',
  })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  @Serialize(AccountDto)
  blockAccount(@Param('accountId', ParseUUIDPipe) accountId: string) {
    return this.accountsService.blockAccount(accountId);
  }

  @Patch(':accountId')
  @ApiOperation({
    summary: 'Update an account',
    operationId: 'updateAccount',
  })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  @Serialize(AccountDto)
  updateAccount(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(accountId, updateAccountDto);
  }
}
