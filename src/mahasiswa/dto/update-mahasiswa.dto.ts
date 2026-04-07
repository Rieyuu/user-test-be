import { IsDateString, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { JURUSAN_VALUES } from './create-mahasiswa.dto';
import type { Jurusan } from './create-mahasiswa.dto';

export class UpdateMahasiswaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @IsOptional()
  nim?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  nama?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsIn([...JURUSAN_VALUES])
  @IsOptional()
  jurusan?: Jurusan;

  @IsDateString()
  @IsOptional()
  tanggal_lahir?: string;
}

