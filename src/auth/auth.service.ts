import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  SignUpDto,
  SignInDto,
  ResendVerificationEmailDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { EmailService } from './email.service';
import type { Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signup(signUpDto: SignUpDto) {
    const { email, password } = signUpDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        hashedPassword,
      },
    });

    const token = await this.createVerificationToken(user.id);
    await this.emailService.sendVerificationEmail(email, token);

    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
    };
  }

  async signin(signInDto: SignInDto, res: Response) {
    const { email, password } = signInDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      throw new BadRequestException('Wrong credentials');
    }

    const isMatch = await this.comparePasswords(
      password,
      existingUser.hashedPassword,
    );

    if (!isMatch) {
      throw new BadRequestException('Wrong credentials');
    }

    if (!existingUser.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in',
      );
    }

    const token = await this.signToken(existingUser.id, existingUser.email);

    if (!token) {
      throw new ForbiddenException();
    }

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return {
      message: 'User signed in successfully',
    };
  }

  signout(res: Response) {
    res.clearCookie('access_token');
    return {
      message: 'User signed out successfully',
    };
  }

  async verifyEmail(token: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    if (verificationToken.user.emailVerified) {
      return {
        message: 'Email is already verified',
      };
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await this.prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async resendVerificationEmail(dto: ResendVerificationEmailDto) {
    const { email } = dto;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    const token = await this.createVerificationToken(user.id);
    await this.emailService.sendVerificationEmail(email, token);

    return {
      message: 'Verification email sent successfully',
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const { email } = dto;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = await this.createPasswordResetToken(user.id);
    await this.emailService.sendPasswordResetEmail(email, token);

    return {
      message: 'Password reset email sent successfully',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, password } = dto;

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await this.hashPassword(password);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { hashedPassword },
    });

    await this.prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return {
      message: 'Password reset successfully',
    };
  }

  private async createPasswordResetToken(userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private async createVerificationToken(userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.verificationToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  }

  async signToken(userId: string, email: string): Promise<string> {
    const payload = { id: userId, email };
    return this.jwtService.signAsync(payload);
  }
}
