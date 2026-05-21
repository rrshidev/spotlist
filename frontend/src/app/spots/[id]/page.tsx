'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { Spot, Comment } from '@/types';
import { SpotMap } from '@/components/Map';
import SaveButton from '@/components/SaveButton';
import { MapPin, Clock, User, ArrowLeft, Edit, Trash2, Flag, Image as ImageIcon, Loader2, Send, X, Reply, Heart, Video, ShieldCheck, ShieldX, ShieldAlert, ShieldQuestion } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
function getAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return '';
  const av = avatar as string;
  if (av.startsWith('http')) return av;
  const baseUrl = API_URL.replace('/api/v1', '');
  return baseUrl + av;
}

export default function SpotPage() {
  const params = useParams();
  const router = useRouter();
  const spotId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();

  const [spot, setSpot] = useState<Spot | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [spotLiked, setSpotLiked] = useState(false);
  const [spotLikesCount, setSpotLikesCount] = useState(0);
  const [isSpotLiking, setIsSpotLiking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean; likes_count: number }>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
        if (isAuthenticated) {
          try {
            const { saved: isSaved } = await api.wishlist.check(spotId);
            setSaved(isSaved);
          } catch { /* ignore */ }
        }
      } catch {
        addToast(t('spotDetail.notFound'), 'error');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [spotId, isAuthenticated]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.comments.create(spotId, newComment, replyingTo || undefined) as Comment;
      setComments([comment, ...comments]);
      setNewComment('');
      setReplyingTo(null);
      addToast(t('spotDetail.commentAdded'), 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : t('spotDetail.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSpot = async () => {
    if (!confirm(t('spotDetail.confirmDeleteSpot'))) return;
    try {
      await api.spots.delete(spotId);
      addToast(t('spotDetail.spotDeleted'), 'success');
      router.push('/');
    } catch (error) {
      addToast(error instanceof Error ? error.message : t('spotDetail.error'), 'error');
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      await api.comments.report(commentId, t('spotDetail.reportReason'));
      addToast(t('spotDetail.reportSent'), 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : t('spotDetail.error'), 'error');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const updated = await api.spots.updateStatus(spotId, status) as Spot;
      setSpot(prev => prev ? { ...prev, status: updated.status, last_status_at: updated.last_status_at } : null);
      addToast(t('spotDetail.statusUpdatedMsg'), 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : t('spotDetail.error'), 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLikeSpot = async () => {
    if (!isAuthenticated) {
      addToast(t('spotDetail.loginToLike'), 'error');
      return;
    }
    if (isSpotLiking) return;
    setIsSpotLiking(true);
    try {
      await api.likes.toggle(spotId);
      setSpotLiked(!spotLiked);
      setSpotLikesCount(prev => spotLiked ? prev - 1 : prev + 1);
    } catch {
      addToast(t('spotDetail.likeError'), 'error');
    } finally {
      setIsSpotLiking(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const result = await api.likes.toggleComment(commentId) as { liked: boolean; likes_count: number };
      setCommentLikes({ ...commentLikes, [commentId]: result });
    } catch (error) {
      addToast(error instanceof Error ? error.message : t('spotDetail.error'), 'error');
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
          {t('spotDetail.back')}
        </button>

        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl overflow-hidden">
          {spot.media && spot.media.length > 0 ? (
            <div className="h-48 bg-[#0a0a0f] cursor-pointer" onClick={() => setLightboxUrl(getAvatarUrl(spot.media[0]))}>
              <img
                src={getAvatarUrl(spot.media[0])}
                alt={spot.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : spot.screenshot ? (
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
                  {t('categories.' + spot.category) || spot.category}
                </span>
                {spot.obstacles && spot.obstacles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {spot.obstacles.map((obs, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#0a0a0f] rounded text-xs text-white/70 border border-[#1f1f2e]">
                        {obs.type}{obs.count ? ` (${obs.count})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <SaveButton spotId={spotId} initialSaved={saved} onToggle={setSaved} size="md" />
                {isOwner && (
                <>
                  <button
                    onClick={() => router.push(`/spots/${spotId}/edit`)}
                    className="p-2 rounded-lg bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14]/30 transition-colors"
                    title={t('spotDetail.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteSpot}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
                )}
              </div>
            </div>

            {spot.description && (
              <p className="mt-4 text-white/80">{spot.description}</p>
            )}

            {spot.ride_types && spot.ride_types.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-white/60 mb-2">{t('spotDetail.rideTypes')}</p>
                <div className="flex flex-wrap gap-2">
                  {spot.ride_types.map((rt) => (
                    <span key={rt} className="px-3 py-1 rounded-lg bg-[#0a0a0f] border border-[#1f1f2e] text-sm text-white/80">
                      {t('rideTypes.' + rt)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {spot.media && spot.media.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {spot.media.map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-[#0a0a0f] cursor-pointer" onClick={() => setLightboxUrl(getAvatarUrl(url))}>
                    <img
                      src={getAvatarUrl(url)}
                      alt={`${spot.name} фото ${i + 1}`}
                      className="w-full h-32 object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
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

            {spot.video && (
              <div className="mt-4">
                {spot.video.match(/youtube\.com|youtu\.be|youtube\.com\/shorts/) ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={spot.video
                        .replace(/\/shorts\//, '/embed/')
                        .replace(/watch\?v=/, 'embed/')
                        .split('&')[0]
                      }
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video
                    src={spot.video}
                    controls
                    className="w-full rounded-xl max-h-64 bg-black"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}

            <div className="mt-4 p-4 bg-[#0a0a0f] rounded-xl">
              <p className="text-sm text-white/60 mb-2">{t('spotDetail.status')}</p>
              <div className="flex items-center gap-2 mb-3">
                {spot.status === 'active' ? (
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                ) : spot.status === 'bust' ? (
                  <ShieldX className="w-5 h-5 text-red-400" />
                ) : spot.status === 'risky' ? (
                  <ShieldAlert className="w-5 h-5 text-yellow-400" />
                ) : (
                  <ShieldQuestion className="w-5 h-5 text-white/40" />
                )}
                <span className="text-white text-sm">
                  {t(spot.status === 'active' ? 'spotDetail.statusAllGood' : spot.status === 'bust' ? 'spotDetail.statusBust' : spot.status === 'risky' ? 'spotDetail.statusRisky' : 'spotDetail.statusUnknown')}
                </span>
              </div>
              {isAuthenticated && (
                <div className="flex flex-wrap gap-2">
                  {(['active', 'risky', 'bust', 'unknown'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s)}
                      disabled={updatingStatus || spot.status === s}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 ${
                        spot.status === s
                          ? 'bg-[#1f1f2e] text-white'
                          : 'bg-[#12121a] text-white/60 hover:bg-[#1f1f2e] hover:text-white'
                      }`}
                    >
                      {t(s === 'active' ? 'spotDetail.statusAllGood' : s === 'bust' ? 'spotDetail.statusBust' : s === 'risky' ? 'spotDetail.statusRisky' : 'spotDetail.statusUnknown')}
                    </button>
                  ))}
                </div>
              )}
              {spot.last_status_at && (
                <p className="text-xs text-white/40 mt-2">
                  {t('spotDetail.statusUpdated')}: {new Date(spot.last_status_at).toLocaleString('ru-RU')}
                </p>
              )}
            </div>

            {spot.address && (
              <div className="mt-4 p-4 bg-[#0a0a0f] rounded-xl">
                <p className="text-sm text-white/60">{t('spotDetail.address')}</p>
                <p className="text-white">{spot.address}</p>
              </div>
            )}

            <p className="text-xs text-white/40 mt-2">
              {t('spotDetail.addedBy')}: {spot.author_username || t('spotDetail.unknown')}
              {!spot.is_checked && (
                <span className="ml-2 text-yellow-400">{t('spotDetail.unchecked')}</span>
              )}
            </p>
          </div>

          <div className="h-64 border-t border-[#1f1f2e]">
            <SpotMap spots={[spot]} center={[spot.latitude, spot.longitude]} zoom={15} />
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6 mt-4">
          <h2 className="text-lg font-bold text-white mb-4">{t('spotDetail.comments')} ({comments.length})</h2>

          {isAuthenticated && (
            <div className="flex gap-2 mb-6">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-[#39ff14] bg-[#39ff14]/10 px-3 py-1 rounded-lg">
                  <span>{t('spotDetail.replyTo')} {comments.find(c => c.id === replyingTo)?.username}</span>
                  <button onClick={() => { setReplyingTo(null); setNewComment(''); }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? t('spotDetail.replyPlaceholder') : t('spotDetail.commentPlaceholder')}
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
                        {comment.updated_at && t('spotDetail.edited')}
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
                              title={t('spotDetail.reply')}
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReportComment(comment.id)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                              title={t('spotDetail.report')}
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
                            addToast(t('spotDetail.commentDeleted'), 'success');
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
                          addToast(t('spotDetail.commentUpdated'), 'success');
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

      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <img src={lightboxUrl} alt="" className="max-w-full max-h-[90vh] object-contain rounded-2xl" />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}