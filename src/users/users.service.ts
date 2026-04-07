import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto'; // diambil dari create-user.dto.ts
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { KnexService } from '../database/knex.service';
import { hash } from 'bcrypt';

type UserRow = {
  id: number;
  email: string;
  name: string;
  password: string | null;
  is_active: boolean;
  register_date: Date | null;
  deleted_at: Date | null;
};

type UserPublicRow = Pick<
  UserRow,
  'id' | 'email' | 'name' | 'is_active' | 'register_date'
>;

function isPgUniqueViolation(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  );
}

@Injectable()
export class UsersService {
  constructor(private readonly knexService: KnexService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const email = createUserDto.email;
    const name = createUserDto.name;
    const password = createUserDto.password;
    const is_active = createUserDto.is_active;
    const register_date = createUserDto.register_date;

    // Hash password
    const hashedPassword = await hash(password, 10);

    let users: UserRow[];
    try {
      users = await this.knexService
        .connection<UserRow>('users')
        .insert({
          email,
          name,
          password: hashedPassword,
          is_active: is_active ?? true,
          register_date: register_date ?? new Date(),
        })
        .returning('*');
    } catch (err) {
      if (isPgUniqueViolation(err) && err.code === '23505') {
        throw new ConflictException('email already exists');
      }
      throw err;
    }

    // Remove password from response
    const user = users[0];
    return this.mapToResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.knexService
      .connection<UserRow>('users')
      .select(['id', 'email', 'name', 'is_active', 'register_date'])
      .whereNull('deleted_at')
      .orderBy('id', 'asc');

    return users.map((u) => this.mapToResponseDto(u));
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.knexService
      .connection<UserRow>('users')
      .select(['id', 'email', 'name', 'is_active', 'register_date'])
      .where({ id })
      .whereNull('deleted_at')
      .first();

    if (!user) throw new NotFoundException('user not found');
    return this.mapToResponseDto(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.knexService
      .connection<UserRow>('users')
      .select(['id', 'email', 'name', 'is_active', 'register_date'])
      .where({ email })
      .whereNull('deleted_at')
      .first();

    if (!user) throw new NotFoundException('user not found');
    return this.mapToResponseDto(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    const patch: Partial<UserRow> = {};

    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.is_active !== undefined) patch.is_active = dto.is_active;
    if (dto.password !== undefined) patch.password = await hash(dto.password, 10);

    let users: UserRow[];
    try {
      users = await this.knexService
        .connection<UserRow>('users')
        .where({ id })
        .whereNull('deleted_at')
        .update(patch)
        .returning('*');
    } catch (err) {
      if (isPgUniqueViolation(err) && err.code === '23505') {
        throw new ConflictException('email already exists');
      }
      throw err;
    }

    const user = users[0];
    if (!user) throw new NotFoundException('user not found');
    return this.mapToResponseDto(user);
  }

  async remove(id: number): Promise<UserResponseDto> {
    const users = await this.knexService
      .connection<UserRow>('users')
      .where({ id })
      .whereNull('deleted_at')
      .update({
        deleted_at: new Date(),
        is_active: false,
      })
      .returning('*');

    const user = users[0];
    if (!user) throw new NotFoundException('user not found');
    return this.mapToResponseDto(user);
  }

  private mapToResponseDto(user: UserPublicRow): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      is_active: user.is_active,
      register_date: user.register_date,
    };
  }
}
