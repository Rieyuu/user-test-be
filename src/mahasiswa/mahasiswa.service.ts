import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { KnexService } from '../database/knex.service';
import { CreateMahasiswaDto } from './dto/create-mahasiswa.dto';
import { UpdateMahasiswaDto } from './dto/update-mahasiswa.dto';
import { ListMahasiswaQueryDto } from './dto/list-mahasiswa.dto';

type MahasiswaRow = {
  id: number;
  nim: string;
  nama: string;
  email: string | null;
  jurusan: string;
  tanggal_lahir: Date | null;
  created_at: Date;
  updated_at: Date;
};

function isPgUniqueViolation(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  );
}

@Injectable()
export class MahasiswaService {
  constructor(private readonly knexService: KnexService) {}

  async create(dto: CreateMahasiswaDto): Promise<MahasiswaRow> {
    try {
      const rows = await this.knexService
        .connection<MahasiswaRow>('data_mhs')
        .insert({
          nim: dto.nim,
          nama: dto.nama,
          email: dto.email ?? null,
          jurusan: dto.jurusan,
          tanggal_lahir: dto.tanggal_lahir ? new Date(dto.tanggal_lahir) : null,
          created_at: new Date(),
          updated_at: new Date(),
        } as any)
        .returning('*');
      return rows[0];
    } catch (err) {
      if (isPgUniqueViolation(err) && err.code === '23505') {
        throw new ConflictException('nim/email already exists');
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateMahasiswaDto): Promise<MahasiswaRow> {
    const patch: Partial<MahasiswaRow> = {
      updated_at: new Date(),
    };
    if (dto.nim !== undefined) patch.nim = dto.nim;
    if (dto.nama !== undefined) patch.nama = dto.nama;
    if (dto.email !== undefined) patch.email = dto.email ?? null;
    if (dto.jurusan !== undefined) patch.jurusan = dto.jurusan;
    if (dto.tanggal_lahir !== undefined) {
      patch.tanggal_lahir = dto.tanggal_lahir ? new Date(dto.tanggal_lahir) : null;
    }

    try {
      const rows = await this.knexService
        .connection<MahasiswaRow>('data_mhs')
        .where({ id })
        .update(patch as any)
        .returning('*');

      const row = rows[0];
      if (!row) throw new NotFoundException('mahasiswa not found');
      return row;
    } catch (err) {
      if (isPgUniqueViolation(err) && err.code === '23505') {
        throw new ConflictException('nim/email already exists');
      }
      throw err;
    }
  }

  async remove(id: number): Promise<void> {
    const count = await this.knexService
      .connection<MahasiswaRow>('data_mhs')
      .where({ id })
      .del();

    if (count === 0) throw new NotFoundException('mahasiswa not found');
  }

  async findAll(query: ListMahasiswaQueryDto): Promise<{ data: MahasiswaRow[]; meta: { page: number; limit: number; total: number } }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const allowedFilters: Array<keyof Pick<ListMahasiswaQueryDto, 'nim' | 'nama' | 'email' | 'jurusan'>> = [
      'nim',
      'nama',
      'email',
      'jurusan',
    ];

    const base = this.knexService.connection<MahasiswaRow>('data_mhs');

    for (const key of allowedFilters) {
      const val = query[key];
      if (!val) continue;

      if (key === 'nama') {
        base.whereILike('nama', `%${val}%`);
      } else {
        base.where(key, val);
      }
    }

    const [{ count }] = await base.clone().count<{ count: string }[]>({ count: '*' });
    const total = Number(count ?? 0);

    const data = await base
      .clone()
      .select('*')
      .orderBy('id', 'asc')
      .limit(limit)
      .offset(offset);

    return { data, meta: { page, limit, total } };
  }
}

