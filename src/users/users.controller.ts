import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getMyUser(@Param('id') id: string, @Req() req) {
    return this.usersService.getMyUser(id, req);
  }

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
