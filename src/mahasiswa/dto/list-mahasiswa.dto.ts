import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { JURUSAN_VALUES } from './create-mahasiswa.dto';
import type { Jurusan } from './create-mahasiswa.dto';

export class ListMahasiswaQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  page?: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  limit?: number;

  // dynamic filters (optional)
  @IsString()
  @IsOptional()
  nim?: string;

  @IsString()
  @IsOptional()
  nama?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const raw = String(value).trim();
    const match = JURUSAN_VALUES.find((j) => j.toLowerCase() === raw.toLowerCase());
    return match ?? raw;
  })
  @IsIn([...JURUSAN_VALUES])
  @IsOptional()
  jurusan?: Jurusan;
}

