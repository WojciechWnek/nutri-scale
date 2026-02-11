import { Injectable } from '@nestjs/common';

type User = {
  id: string;
  name: string;
  email: string;
};

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

@Injectable()
export class UsersService {
  async findUserById(id: string): Promise<User | undefined> {
    return users.find((user) => user.id === id);
  }
}
