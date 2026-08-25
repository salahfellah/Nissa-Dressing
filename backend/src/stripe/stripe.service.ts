import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import Stripe from 'stripe';
import type { AppConfig } from '../config/configuration';

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface OrderCheckoutResult {
  /** Identifiant de session Checkout (cs_…), seul disponible avant paiement. */
  sessionId: string;
  /** URL à ouvrir pour régler la commande (Checkout en réel, page simulée en mock). */
  url: string;
}

/** Identifiants résolus une fois le paiement effectué. */
export interface SettledPayment {
  paymentIntentId: string | null;
  /** Requis par transfers.create(source_transaction) au moment de libérer le séquestre. */
  chargeId: string | null;
}

/**
 * Intégration Stripe Connect — CDC §4.2.
 *
 * Modèle retenu : « separate charges and transfers ». La plateforme encaisse la
 * totalité du paiement de l'acheteuse ; les fonds restent sur le compte plateforme
 * (séquestre) et ne sont transférés vers le compte connecté de la vendeuse qu'à la
 * confirmation de réception du colis (CDC §3.6, mécanique type Vinted).
 *
 * Sans STRIPE_SECRET_KEY, le service bascule en mode `mock` : il produit des
 * identifiants factices et redirige vers une page de paiement simulée du front.
 * Tout le parcours (frais d'accès, commande, séquestre, reversement, boost,
 * remboursement) reste alors jouable de bout en bout en local.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;
  private readonly cfg: AppConfig['stripe'];
  private readonly webOrigin: string;

  constructor(config: ConfigService) {
    this.cfg = config.getOrThrow<AppConfig['stripe']>('stripe');
    this.webOrigin = config.getOrThrow<string>('webOrigin');

    if (this.cfg.mode === 'live') {
      this.stripe = new Stripe(this.cfg.secretKey);
      this.logger.log('Stripe actif (clé secrète détectée)');
    } else {
      this.stripe = null;
      this.logger.warn(
        'STRIPE_SECRET_KEY absente : paiements simulés (mode mock). Le parcours complet reste testable.',
      );
    }
  }

  get isMock(): boolean {
    return this.stripe === null;
  }

  private mockId(prefix: string): string {
    return `${prefix}_mock_${randomBytes(9).toString('hex')}`;
  }

  private mockUrl(intent: string, reference: string, amountCents: number): string {
    const params = new URLSearchParams({
      intent,
      ref: reference,
      montant: String(amountCents),
    });
    return `${this.webOrigin}/paiement-simule?${params.toString()}`;
  }

  // ————— Frais d'accès de 5 € (CDC §3.1) —————

  async createAccessFeeCheckout(params: {
    userId: string;
    email: string;
    amountCents: number;
  }): Promise<CheckoutSession> {
    if (!this.stripe) {
      return {
        id: this.mockId('cs'),
        url: this.mockUrl('acces', params.userId, params.amountCents),
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.email,
      client_reference_id: params.userId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: params.amountCents,
            product_data: {
              name: 'Accès à vie à Nissa Dressing',
              description: 'Participation unique — accès à vie + 1 mois de boost offert',
            },
          },
        },
      ],
      metadata: { kind: 'access_fee', userId: params.userId },
      success_url: `${this.webOrigin}/bienvenue?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.webOrigin}/paiement?annule=1`,
    });

    return { id: session.id, url: session.url ?? `${this.webOrigin}/paiement` };
  }

  // ————— Onboarding vendeuse (CDC §3.2) —————

  /** Crée le compte connecté de la vendeuse. Aucune donnée bancaire ne transite par l'API. */
  async createConnectedAccount(params: { email: string; userId: string }): Promise<string> {
    if (!this.stripe) return this.mockId('acct');

    const account = await this.stripe.accounts.create({
      type: 'express',
      email: params.email,
      country: 'FR',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { userId: params.userId },
    });

    return account.id;
  }

  async createOnboardingLink(accountId: string): Promise<string> {
    if (!this.stripe) {
      return this.mockUrl('connect', accountId, 0);
    }

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${this.webOrigin}/configuration-compte?refresh=1`,
      return_url: `${this.webOrigin}/configuration-compte?retour=1`,
    });

    return link.url;
  }

  /** Le compte connecté peut-il recevoir des transferts ? */
  async isAccountReady(accountId: string): Promise<boolean> {
    if (!this.stripe) return true;

    const account = await this.stripe.accounts.retrieve(accountId);
    return Boolean(account.charges_enabled && account.payouts_enabled && account.details_submitted);
  }

  async createLoginLink(accountId: string): Promise<string | null> {
    if (!this.stripe) return null;
    const link = await this.stripe.accounts.createLoginLink(accountId);
    return link.url;
  }

  // ————— Commande : encaissement puis séquestre (CDC §3.6) —————

  async createOrderCheckout(params: {
    orderId: string;
    reference: string;
    email: string;
    title: string;
    totalCents: number;
  }): Promise<OrderCheckoutResult> {
    if (!this.stripe) {
      return {
        sessionId: this.mockId('cs'),
        url: this.mockUrl('commande', params.orderId, params.totalCents),
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.email,
      client_reference_id: params.orderId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: params.totalCents,
            product_data: {
              name: params.title,
              description: `Commande ${params.reference} — frais de port et commission inclus`,
            },
          },
        },
      ],
      // Les fonds restent sur le compte plateforme : c'est le séquestre.
      // Le transfert vers la vendeuse est déclenché par releaseEscrow().
      payment_intent_data: {
        metadata: { kind: 'order', orderId: params.orderId },
      },
      metadata: { kind: 'order', orderId: params.orderId },
      success_url: `${this.webOrigin}/commande/${params.orderId}?paiement=ok`,
      cancel_url: `${this.webOrigin}/commande/${params.orderId}?paiement=annule`,
    });

    // `session.payment_intent` est null à ce stade : il n'existe qu'une fois
    // l'acheteuse passée en caisse. On ne conserve donc que l'id de session.
    return {
      sessionId: session.id,
      url: session.url ?? `${this.webOrigin}/commande/${params.orderId}`,
    };
  }

  /**
   * Résout les identifiants réels d'un paiement abouti.
   *
   * Stripe distingue le PaymentIntent (pi_…) de la charge (ch_…) : le
   * remboursement s'appuie sur le premier, le transfert vers la vendeuse
   * (`source_transaction`) sur la seconde. Les confondre échoue en production.
   */
  async settlePayment(paymentIntentId: string | null): Promise<SettledPayment> {
    if (!this.stripe) {
      // En mode simulé on fabrique les deux identifiants, pour que la commande
      // porte les mêmes champs qu'en production et que les étapes suivantes
      // (remboursement, transfert) empruntent le même chemin de code.
      return {
        paymentIntentId: paymentIntentId ?? this.mockId('pi'),
        chargeId: this.mockId('ch'),
      };
    }
    if (!paymentIntentId) {
      return { paymentIntentId: null, chargeId: null };
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    const latestCharge = intent.latest_charge;

    return {
      paymentIntentId: intent.id,
      chargeId: typeof latestCharge === 'string' ? latestCharge : (latestCharge?.id ?? null),
    };
  }

  /**
   * Libère le séquestre : transfère à la vendeuse sa part, la commission restant
   * acquise à la plateforme. Appelé à la confirmation de réception (CDC §3.6).
   */
  async releaseEscrow(params: {
    destinationAccountId: string;
    amountCents: number;
    orderId: string;
    reference: string;
    chargeId?: string | null;
  }): Promise<string> {
    if (!this.stripe) return this.mockId('tr');

    const transfer = await this.stripe.transfers.create({
      amount: params.amountCents,
      currency: 'eur',
      destination: params.destinationAccountId,
      transfer_group: params.orderId,
      ...(params.chargeId ? { source_transaction: params.chargeId } : {}),
      metadata: { orderId: params.orderId, reference: params.reference },
    });

    return transfer.id;
  }

  /** Rembourse l'acheteuse — retour accepté (CDC §3.7). */
  async refund(params: { paymentIntentId: string; amountCents?: number }): Promise<string> {
    if (!this.stripe) return this.mockId('re');

    const refund = await this.stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      ...(params.amountCents ? { amount: params.amountCents } : {}),
    });

    return refund.id;
  }

  // ————— Boost mensuel (CDC §3.5) —————

  async createBoostCheckout(params: {
    listingId: string;
    email: string;
    title: string;
    priceCents: number;
  }): Promise<CheckoutSession> {
    if (!this.stripe) {
      return {
        id: this.mockId('cs'),
        url: this.mockUrl('boost', params.listingId, params.priceCents),
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: params.email,
      client_reference_id: params.listingId,
      line_items: this.cfg.boostPriceId
        ? [{ price: this.cfg.boostPriceId, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: 'eur',
                unit_amount: params.priceCents,
                recurring: { interval: 'month' },
                product_data: { name: `Mise en avant — ${params.title}` },
              },
            },
          ],
      metadata: { kind: 'boost', listingId: params.listingId },
      success_url: `${this.webOrigin}/mes-annonces?boost=ok`,
      cancel_url: `${this.webOrigin}/mes-annonces?boost=annule`,
    });

    return { id: session.id, url: session.url ?? `${this.webOrigin}/mes-annonces` };
  }

  async cancelBoostSubscription(subscriptionId: string): Promise<void> {
    if (!this.stripe) return;
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  // ————— Webhooks —————

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Webhook Stripe reçu alors que Stripe est en mode simulé.');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, this.cfg.webhookSecret);
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    if (!this.stripe) return null;
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }
}
