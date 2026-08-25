import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Applique un schéma Zod partagé (packages/shared) à un corps de requête.
 * Les messages d'erreur renvoyés sont exactement ceux affichés par le front.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || '_';
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }

      throw new BadRequestException({
        message: 'Quelques champs demandent ton attention.',
        fieldErrors,
      });
    }

    return result.data;
  }
}

/** Sucre syntaxique : `@Body(zodBody(listingSchema))`. */
export const zodBody = <T>(schema: ZodType<T>) => new ZodValidationPipe(schema);
