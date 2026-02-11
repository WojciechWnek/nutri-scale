import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyUser(id: string) {
    const myUser = await this.prisma.user.findUnique({
      select: { id: true, email: true, createdAt: true, updatedAt: true },
      where: {
        id,
      },
    });

    return myUser;
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true },
    });
    return users;
  }
}
