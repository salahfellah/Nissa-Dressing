import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { AUTH_THROTTLE, SIGNUP_THROTTLE } from '../config/runtime';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type MeDto,
  type ResetPasswordInput,
} from '@nissa/shared';
import type { Request, Response } from 'express';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { zodBody } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE, TokenService } from './token.service';

/** Les champs d'un envoi multipart arrivent en chaînes : on rétablit les booléens. */
const asBoolean = (value: unknown): unknown =>
  value === 'true' || value === true ? true : value === 'false' || value === false ? false : value;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Dépôt de candidature (CDC §3.1) — multipart : champs du formulaire + audio de serment.
   * Aucune session n'est ouverte : la candidate doit d'abord être acceptée puis payer.
   */
  @Public()
  @Throttle(SIGNUP_THROTTLE)
  @Post('signup')
  @UseInterceptors(FileInterceptor('audio'))
  async signup(
    @Body() body: Record<string, unknown>,
    @UploadedFile() audio: Express.Multer.File,
  ) {
    const parsed = signupSchema.safeParse({
      ...body,
      isVeiled: asBoolean(body.isVeiled),
      acceptsTerms: asBoolean(body.acceptsTerms),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.') || '_';
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      throw new BadRequestException({ message: 'Quelques champs demandent ton attention.', fieldErrors });
    }

    return this.auth.signup(parsed.data, audio);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(200)
  @Post('login')
  async login(
    @Body(zodBody(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MeDto> {
    const user = await this.auth.login(body);
    await this.tokens.issue(res, user);
    return this.auth.toMeDto(user);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<MeDto> {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    const userId = await this.tokens.rotate(res, cookies?.[REFRESH_COOKIE]);
    return this.auth.me(userId);
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    await this.tokens.revoke(cookies?.[REFRESH_COOKIE]);
    this.tokens.clear(res);
    return { message: 'Déconnexion effectuée.' };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<MeDto> {
    return this.auth.me(user.id);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body(zodBody(forgotPasswordSchema)) body: ForgotPasswordInput) {
    return this.auth.requestPasswordReset(body.email);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(200)
  @Post('reset-password')
  resetPassword(@Body(zodBody(resetPasswordSchema)) body: ResetPasswordInput) {
    return this.auth.resetPassword(body.token, body.password);
  }
}
