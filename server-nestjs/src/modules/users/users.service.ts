import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PgService } from '../../database/pg.service';

export interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  password_hash: string | null;
  role: string;
  status: string;
  city: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly db: PgService) {}

  async create(input: {
    email?: string;
    phone?: string;
    nickname?: string;
    password_hash: string;
  }): Promise<UserRow> {
    if (!input.email && !input.phone) {
      throw new ConflictException('email or phone required');
    }
    const row = await this.db.one<UserRow>(
      `INSERT INTO users (email, phone, nickname, password_hash)
       VALUES ($1,$2,$3,$4)
       RETURNING id, email, phone, nickname, password_hash, role, status, city`,
      [input.email ?? null, input.phone ?? null, input.nickname ?? null, input.password_hash],
    );
    if (!row) throw new ConflictException('Cannot create user');
    return row;
  }

  async findById(id: string): Promise<UserRow> {
    const r = await this.db.one<UserRow>(
      `SELECT id,email,phone,nickname,password_hash,role,status,city
       FROM users WHERE id=$1 AND deleted_at IS NULL`,
      [id],
    );
    if (!r) throw new NotFoundException();
    return r;
  }

  async findByEmailOrPhone(account: string): Promise<UserRow | null> {
    return this.db.one<UserRow>(
      `SELECT id,email,phone,nickname,password_hash,role,status,city
       FROM users WHERE (email=$1 OR phone=$1) AND deleted_at IS NULL`,
      [account],
    );
  }

  async update(id: string, patch: Partial<Pick<UserRow, 'nickname' | 'city'>>) {
    return this.db.one<UserRow>(
      `UPDATE users SET nickname=COALESCE($2,nickname), city=COALESCE($3,city), updated_at=now()
       WHERE id=$1 RETURNING id,email,phone,nickname,role,status,city`,
      [id, patch.nickname ?? null, patch.city ?? null],
    );
  }
}
