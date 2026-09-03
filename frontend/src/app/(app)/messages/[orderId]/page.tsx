'use client';

import type { MessageDto, OrderDto } from '@nissa/shared';
import { ArrowLeft, Package, Send } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RequireMember } from '@/components/guards';
import { Alert, Button, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

/** Fil de discussion lié à une commande — CDC §2.2. */
function ThreadContent() {
  const { orderId } = useParams<{ orderId: string }>();

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [thread, orderData] = await Promise.all([
        api.get<MessageDto[]>(`/messages/${orderId}`),
        api.get<OrderDto>(`/orders/${orderId}`),
      ]);
      setMessages(thread);
      setOrder(orderData);
      setError(null);
    } catch (exception) {
      setError(
        exception instanceof ApiError ? exception.message : 'Cette conversation est introuvable.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Rafraîchissement périodique : suffisant pour une messagerie de commande, et
  // sans l'infrastructure temps réel qu'exigerait un WebSocket (hors périmètre V1).
  useEffect(() => {
    const timer = setInterval(() => {
      api
        .get<MessageDto[]>(`/messages/${orderId}`)
        .then(setMessages)
        .catch(() => undefined);
    }, 15_000);
    return () => clearInterval(timer);
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setIsSending(true);
    setError(null);
    try {
      const message = await api.post<MessageDto>(`/messages/${orderId}`, { body: trimmed });
      setMessages((previous) => [...previous, message]);
      setBody('');
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : 'Envoi impossible.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <Spinner label="Chargement de la conversation…" />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col min-h-[70vh]">
      <Link
        href="/messages"
        className="text-sm inline-flex items-center gap-2 mb-4 text-brunProfond hover:text-orDore"
      >
        <ArrowLeft size={16} />
        Toutes mes conversations
      </Link>

      {order && (
        <Link
          href={`/commande/${order.id}`}
          className="flex items-center gap-3 bg-white border border-sable rounded-sm p-3 mb-4 hover:border-orDore transition-colors"
        >
          <Package size={18} className="text-orDore shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-brunProfond truncate">
              {order.listing.title}
            </span>
            <span className="block text-xs text-taupe">
              {order.reference} ·{' '}
              {order.viewerRole === 'BUYER' ? order.sellerPseudo : order.buyerPseudo}
            </span>
          </span>
        </Link>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-taupe text-center py-12">
            Aucun message pour l’instant. Écrivez le premier — restez courtoise et bienveillante, cette
            conversation peut être consultée par l’administratrice en cas de litige.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-sm px-4 py-2.5 ${
                  message.isMine
                    ? 'bg-orDore text-white'
                    : 'bg-white border border-sable text-brunProfond'
                }`}
              >
                {!message.isMine && (
                  <p className="text-[0.65rem] uppercase tracking-wider text-taupe mb-1">
                    {message.senderPseudo}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={`text-[0.65rem] mt-1 ${message.isMine ? 'text-white/70' : 'text-taupe'}`}
                >
                  {new Date(message.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sur mobile la barre de navigation fixe occupe les 4 rem du bas : le
          champ de saisie se cale juste au-dessus pour ne pas passer dessous. */}
      <form
        onSubmit={send}
        className="flex gap-2 sticky bottom-16 md:bottom-0 bg-beigeClair py-2"
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            // Entrée envoie, Maj+Entrée saute une ligne.
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send(event);
            }
          }}
          rows={2}
          maxLength={2000}
          placeholder="Écrivez votre message…"
          aria-label="Message"
          className="flex-1 p-3 bg-white border border-sable rounded-sm text-sm resize-none focus:outline-none focus:border-orDore"
        />
        <Button
          type="submit"
          fullWidth={false}
          className="px-4"
          isLoading={isSending}
          disabled={!body.trim()}
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}

export default function ThreadPage() {
  return (
    <RequireMember>
      <ThreadContent />
    </RequireMember>
  );
}
