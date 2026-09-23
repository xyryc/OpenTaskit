import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';

@ApiTags('Bank Accounts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @ApiOperation({ summary: "Get the authenticated user's saved bank accounts" })
  @Get('me')
  findMine(@CurrentUser('id') userId: string) {
    return this.bankAccountsService.findMine(userId);
  }

  @ApiOperation({ summary: 'Save a bank account for withdrawals' })
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBankAccountDto) {
    return this.bankAccountsService.create(userId, dto);
  }

  @ApiOperation({ summary: 'Remove a saved bank account' })
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bankAccountsService.remove(id, userId);
  }
}
