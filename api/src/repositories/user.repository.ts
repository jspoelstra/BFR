import type { User, UserCreateInput, UserUpdateInput, UserWhereInput, UserOrderByWithRelationInput } from '../types.js';
import { prisma } from '../database.js';
import type { IUserRepository } from './interfaces.js';

export class UserRepository implements IUserRepository {
  async create(data: UserCreateInput): Promise<User> {
    return await prisma.user.create({
      data,
    });
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, data: UserUpdateInput): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: UserWhereInput;
    orderBy?: UserOrderByWithRelationInput;
  } = {}): Promise<User[]> {
    const { skip, take, where, orderBy } = params;
    
    return await prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }
}