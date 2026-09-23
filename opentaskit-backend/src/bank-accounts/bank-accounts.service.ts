import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Every saved account is the default for now (single-account UX) - a new
  // one simply replaces the previous default.
  async create(userId: string, dto: CreateBankAccountDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.bankAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      return tx.bankAccount.create({
        data: { ...dto, userId, isDefault: true },
      });
    });
  }

  async remove(id: string, userId: string) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }
    if (account.userId !== userId) {
      throw new ForbiddenException('You do not own this bank account');
    }
    await this.prisma.bankAccount.delete({ where: { id } });
    return { message: 'Bank account removed' };
  }
}
