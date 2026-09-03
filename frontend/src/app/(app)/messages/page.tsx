'use client';

import { ORDER_STATUS_LABELS, type ConversationDto } from '@nissa/shared';
import { ImageOff, MessagesSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireMember } from '@/components/guards';
import { Alert, Badge, ButtonLink, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import { api } from '@/lib/api';

/** Liste des conversations — une par commande (CDC §2.2). */
function ConversationsContent() {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ConversationDto[]>('/messages')
      .then(setConversations)
      .catch(() => setError('Vos conversations n’ont pas pu être chargées.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner label="Chargement de vos messages…" />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <SectionTitle subtitle="Chaque conversation est rattachée à une commande.">
        Messages
      </SectionTitle>

      {error && <Alert variant="error">{error}</Alert>}

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare size={36} />}
          title="Aucune conversation"
          description="Une conversation s’ouvre automatiquement dès qu’un achat ou une vente est confirmé."
          action={<ButtonLink href="/recherche" fullWidth={false}>Parcourir le catalogue</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {conversations.map((conversation) => (
            <li key={conversation.orderId}>
              <Link
                href={`/messages/${conversation.orderId}`}
                className="flex gap-4 items-center bg-white border border-sable rounded-sm p-4 hover:border-orDore transition-colors"
              >
                <span className="w-14 h-16 shrink-0 bg-sable rounded-sm overflow-hidden">
                  {conversation.listingPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conversation.listingPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-taupe">
                      <ImageOff size={18} />
                    </span>
                  )}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-brunProfond truncate">
                      {conversation.otherPartyPseudo}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge>{conversation.unreadCount}</Badge>
                    )}
                  </span>

                  <span className="block text-xs text-taupe truncate mt-0.5">
                    {conversation.listingTitle}
                  </span>

                  <span className="block text-sm text-brunProfond truncate mt-1">
                    {conversation.lastMessage ?? (
                      <span className="italic text-taupe">Aucun message pour l’instant</span>
                    )}
                  </span>

                  <span className="block text-[0.7rem] text-taupe mt-1">
                    {conversation.reference} · {ORDER_STATUS_LABELS[conversation.orderStatus]}
                    {conversation.lastMessageAt &&
                      ` · ${new Date(conversation.lastMessageAt).toLocaleDateString('fr-FR')}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <RequireMember>
      <ConversationsContent />
    </RequireMember>
  );
}
