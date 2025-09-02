'use client';

import { useState } from 'react';
import { Star, User, MessageSquare, Camera, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AddReviewFormProps {
  companyName: string;
  onClose: () => void;
  onSubmit: (reviewData: {
    userName: string;
    userEmail?: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }) => void;
}

export function AddReviewForm({ companyName, onClose, onSubmit }: AddReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !title || !comment || !userName) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    
    // محاكاة إرسال التقييم
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newReviewData = {
      userName,
      userEmail: userEmail || undefined,
      rating,
      title,
      comment,
      images: photos.length > 0 ? photos : undefined,
    };

    onSubmit(newReviewData);
    setIsSubmitting(false);
    onClose();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // محاكاة رفع الصور
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setPhotos([...photos, ...newPhotos.slice(0, 3 - photos.length)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'سيء جداً';
      case 2: return 'سيء';
      case 3: return 'متوسط';
      case 4: return 'جيد';
      case 5: return 'ممتاز';
      default: return 'اختر التقييم';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              إضافة تقييم
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              شارك تجربتك مع {companyName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              التقييم العام *
            </label>
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transform hover:scale-125 transition-transform duration-200"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors duration-200 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getRatingText(hoverRating || rating)}
            </p>
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                الاسم *
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسمك الكامل"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              عنوان التقييم *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: خدمة ممتازة وفريق محترف"
              required
            />
          </div>

          {/* Review Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              تفاصيل التقييم *
            </label>
            <div className="relative">
              <MessageSquare className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="شارك تجربتك مع هذه الشركة بالتفصيل..."
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comment.length}/500 حرف
            </p>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              إضافة صور (اختياري)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4">
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`صورة ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {photos.length < 3 && (
                <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    اضغط لإضافة صور (حتى 3 صور)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              إرشادات كتابة التقييم:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• كن صادقاً وموضوعياً في تقييمك</li>
              <li>• اذكر تفاصيل محددة عن تجربتك</li>
              <li>• تجنب استخدام لغة غير لائقة</li>
              <li>• ركز على جودة الخدمة والمنتج</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 space-x-reverse pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !rating || !title || !comment || !userName}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الإرسال...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="h-4 w-4 ml-2" />
                  نشر التقييم
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}