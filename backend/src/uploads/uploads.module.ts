import { Global, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Global()
@Module({
  imports: [
    // Stockage en mémoire : les fichiers sont réencodés (photos) ou écrits
    // explicitement (audio) par UploadsService, jamais posés tels quels sur disque.
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024, files: 8 },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
