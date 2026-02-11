import { Injectable } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';

const fakeUsers = [
  {
    id: 1,
    username: 'testuser',
    password: 'testpassword',
  },
  {
    id: 2,
    username: 'anotheruser',
    password: 'anotherpassword',
  },
];

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  validateUser(authPayload: AuthPayloadDto) {
    const { username, password } = authPayload;
    const user = fakeUsers.find((u) => u.username === username);
    if (!user) return null;

    if (user.password === password) {
      const { password, ...userWithoutPassword } = user;
      return this.jwtService.sign(userWithoutPassword);
    }
  }

  async signup() {
    return 'signup endpoint - not implemented yet';
  }

  async signin() {
    return 'signin endpoint - not implemented yet';
  }

  async signout() {
    return 'signout endpoint - not implemented yet';
  }
}
