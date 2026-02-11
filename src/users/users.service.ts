import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyUser(id: string, req: Request) {
    const myUser = await this.prisma.user.findUnique({
      select: { id: true, email: true, createdAt: true, updatedAt: true },
      where: {
        id,
      },
    });

    if (!myUser) {
      throw new NotFoundException('User not found');
    }

    const decodedUser = req.user as { userId: string; email: string };

    if (myUser.id !== decodedUser.userId) {
      throw new ForbiddenException('User not found');
    }

    return myUser;
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true },
    });
    return users;
  }
}
