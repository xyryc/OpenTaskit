import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { SmsModule } from './sms/sms.module';
import { CategoriesModule } from './categories/categories.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { OffersModule } from './offers/offers.module';
import { UploadsModule } from './uploads/uploads.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DisputesModule } from './disputes/disputes.module';
import { KycModule } from './kyc/kyc.module';
import { PlatformConfigModule } from './platform-config/platform-config.module';
import { WalletModule } from './wallet/wallet.module';
import { PaymentsModule } from './payments/payments.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { PayoutsModule } from './payouts/payouts.module';
import { MessagesModule } from './messages/messages.module';
import { LegalModule } from './legal/legal.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 6000,
        limit: 60,
      },
    ]),
    PrismaModule,
    MailModule,
    SmsModule,
    AuthModule,
    KycModule,
    CategoriesModule,
    TasksModule,
    UsersModule,
    OffersModule,
    ReviewsModule,
    NotificationsModule,
    UploadsModule,
    DisputesModule,
    PlatformConfigModule,
    WalletModule,
    PaymentsModule,
    BankAccountsModule,
    PayoutsModule,
    MessagesModule,
    LegalModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
