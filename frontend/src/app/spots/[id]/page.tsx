'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Spot, Comment } from '@/types';
import { SpotMap } from '@/components/Map';
import { MapPin, Clock, User, ArrowLeft, Edit, Trash2, Flag, Image as ImageIcon, Loader2, Send, X, Reply, Heart } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return '';
  const av = avatar as string;
  if (av.startsWith('http')) return av;
  const baseUrl = API_URL.replace('/api/v1', '');
  return baseUrl + av;
}

const categoryLabels: Record<string, string> = {
  park: 'Парк',
  street: 'Стрит',
  roller: 'Роллер-дром',
  routes: 'Маршруты',
};

export default function SpotPage() {
  const params = useParams();
  const router = useRouter();
  const spotId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [spot, setSpot] = useState<Spot | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [spotLiked, setSpotLiked] = useState(false);
  const [spotLikesCount, setSpotLikesCount] = useState(0);
  const [isSpotLiking, setIsSpotLiking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean; likes_count: number }>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [spotData, commentsData] = await Promise.all([
          api.spots.get(spotId),
          api.comments.list(spotId),
        ]);
        const s = spotData as Spot;
        setSpot(s);
        setSpotLiked(s.liked);
        setSpotLikesCount(s.likes_count || 0);
        setComments(commentsData as Comment[]);
      } catch {
        addToast('Спот не найден', 'error');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [spotId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.comments.create(spotId, newComment, replyingTo || undefined) as Comment;
      setComments([comment, ...comments]);
      setNewComment('');
      setReplyingTo(null);
      addToast('Комментарий добавлен', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Ошибка', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSpot = async () => {
    if (!confirm('Удалить спот?')) return;
    try {
      await api.spots.delete(spotId);
      addToast('Спот удалён', 'success');
      router.push('/');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Ошибка', 'error');
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      await api.comments.report(commentId, 'Спам/нарушение');
      addToast('Жалоба отправлена', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Ошибка', 'error');
    }
  };

  const handleLikeSpot = async () => {
    if (!isAuthenticated) {
      addToast('Войди, чтобы ставить лайки', 'error');
      return;
    }
    if (isSpotLiking) return;
    setIsSpotLiking(true);
    try {
      await api.likes.toggle(spotId);
      setSpotLiked(!spotLiked);
      setSpotLikesCount(prev => spotLiked ? prev - 1 : prev + 1);
    } catch {
      addToast('Ошибка при лайке', 'error');
    } finally {
      setIsSpotLiking(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const result = await api.likes.toggleComment(commentId) as { liked: boolean; likes_count: number };
      setCommentLikes({ ...commentLikes, [commentId]: result });
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Ошибка', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
      </div>
    );
  }

  if (!spot) return null;

  const isOwner = user?.id === spot.author_id;

  return (
    <div className="flex-1 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl overflow-hidden">
          {spot.screenshot ? (
            <div className="h-48 bg-[#0a0a0f]">
              <img
                src={getAvatarUrl(spot.screenshot)}
                alt={spot.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-[#39ff14]/20 to-[#00f5ff]/20 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-[#39ff14]/30" />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{spot.name}</h1>
                <p className="text-white/60 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4 text-[#39ff14]" />
                  {spot.city}
                </p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full bg-gradient-to-r ${spot.category === 'park' ? 'from-green-600 to-green-400' : spot.category === 'street' ? 'from-blue-600 to-blue-400' : spot.category === 'roller' ? 'from-purple-600 to-purple-400' : 'from-orange-600 to-orange-400'} text-xs font-semibold text-white`}>
                  {categoryLabels[spot.category] || spot.category}
                </span>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/spots/${spotId}/edit`)}
                    className="p-2 rounded-lg bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14]/30 transition-colors"
                    title="Редактировать"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteSpot}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {spot.description && (
              <p className="mt-4 text-white/80">{spot.description}</p>
            )}

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={handleLikeSpot}
                disabled={isSpotLiking}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  spotLiked
                    ? 'bg-red-500/20 text-red-500'
                    : 'bg-[#0a0a0f] text-white/60 hover:text-red-500 hover:bg-red-500/20'
                }`}
              >
                <Heart className={`w-5 h-5 ${spotLiked ? 'fill-current' : ''}`} />
                <span className="font-semibold">{spotLikesCount}</span>
              </button>
            </div>

            {spot.address && (
              <div className="mt-4 p-4 bg-[#0a0a0f] rounded-xl">
                <p className="text-sm text-white/60">Адрес</p>
                <p className="text-white">{spot.address}</p>
              </div>
            )}

            <p className="text-xs text-white/40 mt-2">
              Добавил: {spot.author_username || 'Неизвестно'}
              {!spot.is_checked && (
                <span className="ml-2 text-yellow-400">(на проверке)</span>
              )}
            </p>
          </div>

          <div className="h-64 border-t border-[#1f1f2e]">
            <SpotMap spots={[spot]} center={[spot.latitude, spot.longitude]} zoom={15} />
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6 mt-4">
          <h2 className="text-lg font-bold text-white mb-4">Комментарии ({comments.length})</h2>

          {isAuthenticated && (
            <div className="flex gap-2 mb-6">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-[#39ff14] bg-[#39ff14]/10 px-3 py-1 rounded-lg">
                  <span>Ответ {comments.find(c => c.id === replyingTo)?.username}</span>
                  <button onClick={() => { setReplyingTo(null); setNewComment(''); }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Написать ответ..." : "Написать комментарий..."}
                className="flex-1 px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white placeholder:text-white/40 focus:border-[#39ff14] focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
                className="px-4 py-3 rounded-xl bg-[#39ff14] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-[#0a0a0f] rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center overflow-hidden">
                      {comment.user_avatar ? (
                        <img src={getAvatarUrl(comment.user_avatar)} alt={comment.username} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-white">{comment.username}</span>
                      <span className="text-xs text-white/40 ml-2">
                        {new Date(comment.created_at).toLocaleString('ru-RU')}
                        {comment.updated_at && ' (ред.)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {user && (
                      <>
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-colors ${
                            commentLikes[comment.id]?.liked
                              ? 'text-red-500 bg-red-500/20'
                              : 'text-white/60 hover:text-red-500 hover:bg-red-500/20'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${commentLikes[comment.id]?.liked ? 'fill-current' : ''}`} />
                          {(commentLikes[comment.id]?.likes_count || 0) > 0 && (
                            <span>{commentLikes[comment.id].likes_count}</span>
                          )}
                        </button>
                        {comment.user_id !== user.id && (
                          <>
                            <button
                              onClick={() => {
                                setReplyingTo(comment.id);
                                setNewComment(`@${comment.username} `);
                              }}
                              className="p-1.5 rounded-lg text-white/40 hover:text-[#39ff14] hover:bg-[#39ff14]/20 transition-colors"
                              title="Ответить"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReportComment(comment.id)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Пожаловаться"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {user && (comment.user_id === user.id || user.role === 'admin') && (
                      <>
                        <button
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="p-1.5 rounded-lg text-white/40 hover:text-[#39ff14] hover:bg-[#39ff14]/20 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => api.comments.delete(comment.id).then(() => {
                            setComments(comments.filter(c => c.id !== comment.id));
                            addToast('Комментарий удалён', 'success');
                          })}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingComment === comment.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg text-white"
                    />
                    <button
                      onClick={() => {
                        api.comments.update(comment.id, editContent).then(updated => {
                          setComments(comments.map(c => c.id === comment.id ? updated as Comment : c));
                          setEditingComment(null);
                          addToast('Комментарий обновлён', 'success');
                        });
                      }}
                      className="px-3 py-2 rounded-lg bg-[#39ff14] text-black"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-white/80">{comment.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}