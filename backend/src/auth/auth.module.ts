import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { AppConfig } from '../config/configuration';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.getOrThrow<AppConfig['jwt']>('jwt');
        return {
          secret: jwt.accessSecret,
          signOptions: { expiresIn: jwt.accessTtl as JwtSignOptions['expiresIn'] },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
