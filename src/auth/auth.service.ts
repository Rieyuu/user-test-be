import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { compare, hash } from 'bcrypt';
import { KnexService } from '../database/knex.service';
import type { StringValue } from 'ms';

type RefreshTokenRow = {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly knexService: KnexService,
  ) {}

  private get accessSecret() {
    return this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'change_me';
  }

  private get refreshSecret() {
    return this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'change_me';
  }

  private get accessExpiresIn() {
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
  }

  private get refreshExpiresIn() {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findActiveAuthUserByEmail(email);

    if (!user.password) throw new UnauthorizedException('invalid credentials');
    const ok = await compare(password, user.password);
    if (!ok) throw new UnauthorizedException('invalid credentials');

    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.parseExpiresForJwt(this.accessExpiresIn),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.parseExpiresForJwt(this.refreshExpiresIn),
    });

    const tokenHash = await hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + this.parseExpiresToMs(this.refreshExpiresIn));

    await this.knexService
      .connection<RefreshTokenRow>('user_refresh_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      } as any);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: number; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('invalid refresh token');
    }

    const rows = await this.knexService
      .connection<RefreshTokenRow>('user_refresh_tokens')
      .where({ user_id: payload.sub })
      .whereNull('revoked_at')
      .andWhere('expires_at', '>', new Date())
      .orderBy('id', 'desc')
      .limit(50);

    const matches = await this.findMatchingRefreshRow(rows, refreshToken);
    if (!matches) throw new ForbiddenException('refresh token revoked');

    const accessToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email },
      { secret: this.accessSecret, expiresIn: this.parseExpiresForJwt(this.accessExpiresIn) },
    );

    return { accessToken };
  }

  async logout(refreshToken: string) {
    let payload: { sub: number; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      return;
    }

    const rows = await this.knexService
      .connection<RefreshTokenRow>('user_refresh_tokens')
      .where({ user_id: payload.sub })
      .whereNull('revoked_at')
      .andWhere('expires_at', '>', new Date())
      .orderBy('id', 'desc')
      .limit(50);

    const match = await this.findMatchingRefreshRow(rows, refreshToken);
    if (!match) return;

    await this.knexService
      .connection<RefreshTokenRow>('user_refresh_tokens')
      .where({ id: match.id })
      .update({ revoked_at: new Date() } as any);
  }

  private async findMatchingRefreshRow(
    rows: RefreshTokenRow[],
    token: string,
  ): Promise<RefreshTokenRow | null> {
    for (const r of rows) {
      const ok = await compare(token, r.token_hash);
      if (ok) return r;
    }
    return null;
  }

  private parseExpiresToMs(expiresIn: string): number {
    const m = /^(\d+)\s*([smhd])$/.exec(expiresIn.trim());
    if (!m) return 7 * 24 * 60 * 60 * 1000;
    const n = Number(m[1]);
    const unit = m[2];
    const mult =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60 * 1000
          : unit === 'h'
            ? 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
    return n * mult;
  }

  private parseExpiresForJwt(expiresIn: string): number | StringValue {
    const trimmed = expiresIn.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    // Accept common JWT time strings like 15m, 7d, 1h, 30s
    if (/^\d+\s*[smhd]$/.test(trimmed)) return trimmed as StringValue;
    return '15m';
  }
}

