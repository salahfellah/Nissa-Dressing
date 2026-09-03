import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import sharp from 'sharp';
import type { AppConfig } from '../config/configuration';

const PHOTO_MIME = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/heic', '.heic'],
  ['image/heif', '.heif'],
]);

const AUDIO_MIME = new Map<string, string>([
  ['audio/webm', '.webm'],
  ['video/webm', '.webm'], // MediaRecorder étiquette parfois ainsi un flux audio seul
  ['audio/ogg', '.ogg'],
  ['audio/mpeg', '.mp3'],
  ['audio/mp4', '.m4a'],
  ['audio/x-m4a', '.m4a'],
  ['audio/wav', '.wav'],
  ['audio/x-wav', '.wav'],
]);

export interface StoredFile {
  /** Chemin relatif au répertoire d'upload — c'est ce qui est stocké en base. */
  path: string;
}

/**
 * Stockage des fichiers déposés.
 *
 * Deux zones distinctes, volontairement :
 *  - `photos/` est servi statiquement (les visuels d'annonce sont publics) ;
 *  - `audio/` ne l'est jamais. L'audio de serment est une donnée vocale sensible
 *    (CDC §3.1) : il n'est lisible que par l'administratrice, via une route
 *    authentifiée, et il est supprimé au refus définitif d'une candidature.
 */
@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly cfg: AppConfig['uploads'];
  private readonly apiPublicUrl: string;

  constructor(config: ConfigService) {
    this.cfg = config.getOrThrow<AppConfig['uploads']>('uploads');
    this.apiPublicUrl = config.getOrThrow<string>('apiPublicUrl');
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.photosDir, { recursive: true });
    await mkdir(this.audioDir, { recursive: true });
  }

  get photosDir(): string {
    return join(this.cfg.dir, 'photos');
  }

  get audioDir(): string {
    return join(this.cfg.dir, 'audio');
  }

  /** URL absolue d'une photo, à partir du chemin relatif stocké en base. */
  publicPhotoUrl(relativePath: string): string {
    if (/^https?:\/\//.test(relativePath)) return relativePath;
    return `${this.apiPublicUrl.replace(/\/$/, '')}/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  publicPhotoUrls(paths: string[]): string[] {
    return paths.map((p) => this.publicPhotoUrl(p));
  }

  /**
   * Normalise et enregistre une photo d'annonce.
   *
   * Les images sont réencodées en WebP : cela réduit le poids, uniformise le format
   * (les iPhone envoient du HEIC) et supprime au passage les métadonnées EXIF —
   * notamment la géolocalisation, que personne ne souhaite publier avec sa photo.
   */
  async savePhoto(file: Express.Multer.File): Promise<StoredFile> {
    if (!PHOTO_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Ce format d’image n’est pas pris en charge. Une photo JPEG, PNG, WebP ou HEIC fera l’affaire.',
      );
    }
    if (file.size > this.cfg.maxPhotoBytes) {
      throw new BadRequestException(
        `Cette photo est un peu lourde (${Math.round(this.cfg.maxPhotoBytes / 1024 / 1024)} Mo maximum).`,
      );
    }

    const name = `${Date.now()}-${randomBytes(8).toString('hex')}.webp`;
    const absolute = join(this.photosDir, name);

    try {
      await sharp(file.buffer)
        .rotate() // applique l'orientation EXIF avant de la supprimer
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(absolute);
    } catch (error) {
      this.logger.error(`Traitement image impossible : ${(error as Error).message}`);
      throw new BadRequestException('Cette image n’a pas pu être traitée. Essayez avec une autre photo.');
    }

    return { path: `photos/${name}` };
  }

  async savePhotos(files: Express.Multer.File[]): Promise<StoredFile[]> {
    return Promise.all(files.map((file) => this.savePhoto(file)));
  }

  /** Enregistre l'audio de serment (CDC §3.1) dans la zone privée. */
  async saveAudio(file: Express.Multer.File): Promise<StoredFile> {
    const extension = AUDIO_MIME.get(file.mimetype) ?? extname(file.originalname).toLowerCase();
    if (!AUDIO_MIME.has(file.mimetype) && !['.webm', '.mp3', '.m4a', '.ogg', '.wav'].includes(extension)) {
      throw new BadRequestException(
        'Ce format audio n’est pas pris en charge. Enregistrez depuis le site, ou dépose un MP3, M4A, WAV ou WebM.',
      );
    }
    if (file.size > this.cfg.maxAudioBytes) {
      throw new BadRequestException(
        `Cet enregistrement est un peu lourd (${Math.round(this.cfg.maxAudioBytes / 1024 / 1024)} Mo maximum).`,
      );
    }

    const name = `${Date.now()}-${randomBytes(8).toString('hex')}${extension}`;
    await writeFile(join(this.audioDir, name), file.buffer);

    return { path: `audio/${name}` };
  }

  /**
   * Chemin absolu d'un fichier stocké, avec garde anti-traversée : un chemin
   * remontant hors du répertoire d'upload est refusé.
   */
  absolutePath(relativePath: string): string {
    const base = resolve(this.cfg.dir);
    const target = resolve(base, normalize(relativePath));
    if (target !== base && !target.startsWith(base + sep)) {
      throw new BadRequestException('Ce chemin de fichier n’est pas valide.');
    }
    return target;
  }

  async remove(relativePath: string): Promise<void> {
    try {
      await unlink(this.absolutePath(relativePath));
    } catch {
      // Fichier déjà absent : rien à faire.
    }
  }

  async removeMany(relativePaths: string[]): Promise<void> {
    await Promise.all(relativePaths.map((p) => this.remove(p)));
  }
}
