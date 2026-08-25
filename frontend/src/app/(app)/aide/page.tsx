'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactInput } from '@nissa/shared';
import { ChevronDown, LifeBuoy, Send } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Card, Input, SectionTitle, Textarea } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/**
 * FAQ statique — CDC §3.8.
 * Les contenus définitifs sont fournis par la maîtrise d'ouvrage ; ceux-ci
 * décrivent le fonctionnement réel de la plateforme et servent de base.
 */
const FAQ = [
  {
    question: 'Qui peut s’inscrire sur Nissa Dressing ?',
    answer:
      'La plateforme est réservée aux femmes musulmanes voilées, francophones et majeures. L’inscription passe par une question d’éligibilité, un formulaire, puis un enregistrement audio dans lequel tu prêtes serment. Chaque candidature est examinée manuellement par l’administratrice.',
  },
  {
    question: 'Pourquoi 5 € à l’inscription ?',
    answer:
      'Cette participation unique donne un accès à vie à la plateforme, ainsi qu’un mois de mise en avant d’annonce offert. Elle contribue au fonctionnement du site et limite les inscriptions non sérieuses. Il n’y a aucun abonnement ensuite.',
  },
  {
    question: 'Comment mon argent est-il protégé quand j’achète ?',
    answer:
      'Le montant est débité à la commande mais conservé en sécurité par notre prestataire de paiement Stripe. Il n’est reversé à la vendeuse qu’une fois que tu as confirmé la bonne réception du colis. Si l’article ne correspond pas, tu peux ouvrir une demande de retour avant de confirmer.',
  },
  {
    question: 'Quand suis-je payée pour mes ventes ?',
    answer:
      'Dès que l’acheteuse confirme la réception de son colis, ta part est transférée sur ton compte Stripe. Le virement vers ton compte bancaire suit ensuite le calendrier habituel de Stripe.',
  },
  {
    question: 'Pourquoi mon annonce doit-elle être validée ?',
    answer:
      'Chaque annonce est relue avant publication afin de garantir la conformité des articles proposés. Tu reçois un e-mail dès qu’une décision est prise ; en cas de refus, le motif t’est communiqué et tu peux corriger puis soumettre à nouveau.',
  },
  {
    question: 'Quelles photos ai-je le droit de publier ?',
    answer:
      'Les photos ne doivent pas être prises portées sur toi ou sur une tierce personne, sauf pour les vêtements couvrants (abaya, khimar, hijab, jilbeb, sittar, niqab, gants). Tout vêtement comportant une représentation d’âme (être animé) est refusé.',
  },
  {
    question: 'Qui paie les frais de port ?',
    answer:
      'Les frais de port sont à la charge de l’acheteuse. Leur montant dépend du format de colis choisi par la vendeuse (petit, moyen ou grand) et s’affiche avant le paiement.',
  },
  {
    question: 'Comment envoyer mon colis ?',
    answer:
      'Après la vente, télécharge le bordereau d’envoi depuis la page de ta commande, imprime-le, colle-le sur le colis et dépose-le au bureau de poste ou en point relais. Indique ensuite « Colis expédié » sur le site pour prévenir l’acheteuse.',
  },
  {
    question: 'L’article reçu ne correspond pas, que faire ?',
    answer:
      'Ouvre une demande de retour depuis la page de ta commande, avec des photos de l’article et du problème. L’administratrice examine ta demande ; si elle est acceptée, un bordereau de retour t’est fourni et tu es remboursée dès le retour confirmé.',
  },
  {
    question: 'Que devient mon enregistrement audio ?',
    answer:
      'Il est stocké de façon confidentielle et n’est écouté que par l’administratrice, dans le seul but de valider ton inscription. Si ta candidature n’est pas retenue, il est supprimé immédiatement. Tu peux demander son effacement à tout moment.',
  },
];

export default function HelpPage() {
  const { user } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  // Pré-remplit avec les informations de la membre connectée.
  useEffect(() => {
    if (user) reset({ email: user.email, pseudo: user.pseudo, message: '' });
  }, [user, reset]);

  const onSubmit = async (data: ContactInput) => {
    setError(null);
    try {
      await api.post('/support/contact', data);
      setSent(true);
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'Envoi impossible.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <SectionTitle subtitle="Une question ? La réponse est peut-être déjà là.">
        Centre d’aide
      </SectionTitle>

      {/* ————— FAQ ————— */}
      <ul className="space-y-2 mb-12">
        {FAQ.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <li key={item.question} className="bg-white border border-sable rounded-sm">
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-4 text-left"
              >
                <span className="text-sm font-medium text-brunProfond">{item.question}</span>
                <ChevronDown
                  size={18}
                  className={`text-taupe shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="px-4 pb-4 text-sm text-brunProfond leading-relaxed">{item.answer}</p>
              )}
            </li>
          );
        })}
      </ul>

      {/* ————— Formulaire de contact (CDC §3.8) ————— */}
      <Card>
        <h2 className="font-playfair text-xl text-brunProfond mb-1 flex items-center gap-2">
          <LifeBuoy size={20} className="text-orDore" />
          Nous écrire
        </h2>
        <p className="text-sm text-taupe mb-5">
          Ta question n’est pas dans la liste ? Décris ton problème, nous te répondrons par e-mail.
        </p>

        {sent ? (
          <Alert variant="success" title="Message envoyé">
            Ton message a bien été transmis à l’administratrice. Tu recevras une réponse par e-mail
            dans les meilleurs délais, in cha Allah.
          </Alert>
        ) : (
          <>
            {error && <Alert variant="error">{error}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input
                label="Adresse e-mail"
                type="email"
                autoComplete="email"
                required
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Pseudo ou kunya"
                required
                error={errors.pseudo?.message}
                {...register('pseudo')}
              />
              <Textarea
                label="Décris ton problème"
                rows={6}
                placeholder="Explique ta situation le plus précisément possible : référence de commande, pseudo concerné, dates…"
                required
                error={errors.message?.message}
                {...register('message')}
              />

              <Button type="submit" isLoading={isSubmitting}>
                <Send size={16} />
                Envoyer mon message
              </Button>
            </form>
          </>
        )}
      </Card>

      <p className="text-xs text-taupe text-center mt-8">
        Pour tout ce qui concerne tes données personnelles, consulte notre{' '}
        <Link href="/legal/rgpd" className="underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
