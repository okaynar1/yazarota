import React from 'react';
import { NotificationItem } from '../types';
import {
  Bell,
  X,
  CheckCircle,
  FileText,
  Sparkles,
  BookOpen,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectStory?: (storyId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectStory,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'revision':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'magazine':
        return <BookOpen className="w-4 h-4 text-teal-500" />;
      case 'submission':
        return <FileText className="w-4 h-4 text-sky-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Bildirimler</h3>
                <p className="text-[11px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} yeni okunmamış bildirim` : 'Tüm bildirimler okundu'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                >
                  Tümünü Oku
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <Bell className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium">Henüz bir bildiriminiz yok</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Öğretmen değerlendirmeleri ve dergi onayları burada görüntülenecektir.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.read) onMarkRead(item.id);
                      if (item.storyId && onSelectStory) {
                        onSelectStory(item.storyId);
                        onClose();
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      item.read
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'bg-teal-50/60 border-teal-200 text-slate-900 shadow-sm hover:bg-teal-50'
                    }`}
                  >
                    {!item.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-xs flex-shrink-0 mt-0.5">
                        {getIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0 pr-3 space-y-1">
                        <h4 className="text-xs font-bold leading-snug">{item.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-serif-literary">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(item.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {item.storyId && (
                            <span className="text-teal-600 font-semibold flex items-center gap-0.5 ml-auto">
                              Görüntüle <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
