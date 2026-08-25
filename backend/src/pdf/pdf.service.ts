import { Injectable } from '@nestjs/common';
import { PACKAGE_FORMAT_LABELS, formatPrice, type PackageFormat } from '@nissa/shared';
import PDFDocument from 'pdfkit';

export interface PartyAddress {
  recipientName: string;
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone?: string | null;
}

export interface WaybillData {
  reference: string;
  createdAt: Date;
  from: PartyAddress;
  to: PartyAddress;
  itemTitle: string;
  packageFormat: PackageFormat;
  /** Bordereau de retour : l'expéditrice et la destinataire sont inversées. */
  isReturn?: boolean;
  totalCents?: number;
}

const GOLD = '#C8A96A';
const BROWN = '#4A4136';
const SAND = '#E8E1D6';

/**
 * Génération des bordereaux d'envoi et de retour — CDC §3.6 et §3.7.
 *
 * Le document reprend les coordonnées des deux parties telles qu'elles ont été
 * figées à la commande. Il est destiné à être imprimé et collé sur le colis ;
 * il ne remplace pas une étiquette transporteur prépayée, explicitement hors
 * périmètre V1 (CDC §2.3).
 */
@Injectable()
export class PdfService {
  generateWaybill(data: WaybillData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.render(doc, data);
      doc.end();
    });
  }

  private render(doc: PDFKit.PDFDocument, data: WaybillData): void {
    const title = data.isReturn ? 'BORDEREAU DE RETOUR' : 'BORDEREAU D’ENVOI';
    const pageWidth = doc.page.width - 80;

    // En-tête
    doc.rect(40, 40, pageWidth, 70).fill(BROWN);
    doc
      .fillColor(GOLD)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('NISSA', 56, 58, { characterSpacing: 6 });
    doc
      .fillColor('#F6F1E8')
      .fontSize(9)
      .font('Helvetica')
      .text('DRESSING', 56, 84, { characterSpacing: 4 });
    doc
      .fillColor('#FFFFFF')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(title, 40, 68, { width: pageWidth - 16, align: 'right' });

    doc.fillColor(BROWN);

    // Référence
    let y = 132;
    doc.rect(40, y, pageWidth, 46).fillAndStroke(SAND, SAND);
    doc
      .fillColor(BROWN)
      .fontSize(9)
      .font('Helvetica')
      .text('RÉFÉRENCE DE COMMANDE', 56, y + 10);
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(data.reference, 56, y + 22);
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(
        `Émis le ${data.createdAt.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}`,
        40,
        y + 26,
        { width: pageWidth - 16, align: 'right' },
      );

    // Expéditrice / Destinataire
    y += 68;
    const boxWidth = (pageWidth - 16) / 2;

    this.addressBox(doc, 40, y, boxWidth, 'EXPÉDITRICE', data.from, false);
    this.addressBox(doc, 40 + boxWidth + 16, y, boxWidth, 'DESTINATAIRE', data.to, true);

    // Détail du colis
    y += 168;
    doc
      .fillColor(BROWN)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('DÉTAIL DU COLIS', 40, y);
    doc.moveTo(40, y + 16).lineTo(40 + pageWidth, y + 16).strokeColor(GOLD).lineWidth(1.5).stroke();

    y += 28;
    this.detailRow(doc, y, 'Article', data.itemTitle);
    y += 20;
    this.detailRow(
      doc,
      y,
      'Format du colis',
      `${PACKAGE_FORMAT_LABELS[data.packageFormat]} — ${this.formatHelp(data.packageFormat)}`,
    );
    if (data.totalCents !== undefined) {
      y += 20;
      this.detailRow(doc, y, 'Montant de la commande', formatPrice(data.totalCents));
    }

    // Consignes
    y += 44;
    doc.rect(40, y, pageWidth, data.isReturn ? 96 : 82).fillAndStroke('#FDFBF7', SAND);
    doc
      .fillColor(BROWN)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(data.isReturn ? 'COMMENT RENVOYER TON COLIS' : 'COMMENT ENVOYER TON COLIS', 56, y + 12);

    const steps = data.isReturn
      ? [
          '1. Remets l’article dans son emballage d’origine, avec toutes ses étiquettes.',
          '2. Imprime ce bordereau et colle-le bien à plat sur le colis.',
          '3. Dépose le colis au bureau de poste ou en point relais.',
          '4. Ton remboursement est déclenché dès que le retour est confirmé.',
        ]
      : [
          '1. Emballe soigneusement l’article.',
          '2. Imprime ce bordereau et colle-le bien à plat sur le colis.',
          '3. Dépose le colis au bureau de poste ou en point relais.',
          '4. Indique « Colis expédié » sur le site pour prévenir l’acheteuse.',
        ];

    doc.fontSize(8.5).font('Helvetica');
    steps.forEach((step, index) => {
      doc.text(step, 56, y + 28 + index * 14, { width: pageWidth - 32 });
    });

    // Pied de page
    const footerY = doc.page.height - 62;
    doc
      .fontSize(7.5)
      .fillColor('#B8ADA0')
      .text(
        'Nissa Dressing — marketplace entre sœurs. Les frais de port sont à la charge de l’acheteuse. ' +
          'Le paiement est conservé en séquestre et reversé à la vendeuse à la confirmation de réception.',
        40,
        footerY,
        { width: pageWidth, align: 'center' },
      );
  }

  private addressBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    label: string,
    address: PartyAddress,
    highlight: boolean,
  ): void {
    const height = 152;
    doc.rect(x, y, width, height).fillAndStroke('#FFFFFF', highlight ? GOLD : SAND);
    if (highlight) doc.rect(x, y, width, 3).fill(GOLD);

    doc
      .fillColor(highlight ? GOLD : '#B8ADA0')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(label, x + 14, y + 16, { characterSpacing: 1.5 });

    const lines = [
      address.recipientName,
      address.line1,
      address.line2 || null,
      `${address.postalCode} ${address.city}`,
      address.country,
      address.phone ? `Tél. ${address.phone}` : null,
    ].filter((line): line is string => Boolean(line));

    doc.fillColor(BROWN).fontSize(highlight ? 12 : 10.5).font('Helvetica');
    lines.forEach((line, index) => {
      doc.font(index === 0 ? 'Helvetica-Bold' : 'Helvetica').text(line, x + 14, y + 38 + index * 17, {
        width: width - 28,
        ellipsis: true,
      });
    });
  }

  private detailRow(doc: PDFKit.PDFDocument, y: number, label: string, value: string): void {
    doc.fillColor('#B8ADA0').fontSize(9).font('Helvetica').text(label, 56, y, { width: 150 });
    doc
      .fillColor(BROWN)
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .text(value, 210, y, { width: doc.page.width - 260, ellipsis: true });
  }

  private formatHelp(format: PackageFormat): string {
    switch (format) {
      case 'PETIT':
        return 'tient dans une grande enveloppe';
      case 'MOYEN':
        return 'tient dans une boîte à chaussures';
      case 'GRAND':
        return 'tient dans un carton de déménagement';
    }
  }
}
