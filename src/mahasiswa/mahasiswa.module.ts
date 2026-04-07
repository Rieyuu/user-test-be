import { Module } from '@nestjs/common';
import { MahasiswaService } from './mahasiswa.service';
import { MahasiswaController } from './mahasiswa.controller';

@Module({
  providers: [MahasiswaService],
  controllers: [MahasiswaController],
})
export class MahasiswaModule {}

