import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const password_hash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    const user = await this.users.create({
      email: dto.email,
      phone: dto.phone,
      nickname: dto.nickname,
      password_hash,
    });
    return this.signTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailOrPhone(dto.account);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.password_hash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.signTokens(user.id, user.email, user.role);
  }

  private signTokens(sub: string, email: string | null, role: string) {
    const payload = { sub, email: email ?? undefined, role };
    return {
      access_token: this.jwt.sign(payload),
      token_type: 'Bearer',
    };
  }
}
