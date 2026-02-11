import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() authDto: AuthDto) {
    return this.authService.signup(authDto);
  }

  @Post('signin')
  signin(@Body() authDto: AuthDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signin(authDto, res);
  }

  @Post('signout')
  signout(@Res({ passthrough: true }) res: Response) {
    return this.authService.signout(res);
  }
}
