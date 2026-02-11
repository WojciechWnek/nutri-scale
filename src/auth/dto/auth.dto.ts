import { IsNotEmpty, IsString, IsEmail, Length } from 'class-validator';

export class AuthDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 100, { message: 'Password must be at least 8 characters long' })
  password: string;
}
