import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MemberOnly } from '../common/decorators/member-only.decorator';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /**
   * Dépôt des photos d'annonce (CDC §3.3) — 8 photos maximum.
   * Renvoie les chemins relatifs à enregistrer sur l'annonce, et les URL d'aperçu.
   */
  @MemberOnly()
  @Post('photos')
  @UseInterceptors(FilesInterceptor('files', 8))
  async uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('Nous n’avons reçu aucune photo.');
    }

    const stored = await this.uploads.savePhotos(files);

    return stored.map((file) => ({
      path: file.path,
      url: this.uploads.publicPhotoUrl(file.path),
    }));
  }
}
