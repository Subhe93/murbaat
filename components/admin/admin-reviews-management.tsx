'use client';

import { useState, useEffect } from 'react';
import { Star, Eye, Check, X, Flag, MessageSquare, AlertTriangle, Search, Filter, Calendar, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewDetailsModal } from '@/components/admin/review-details-modal';
import { ReportDetailsModal } from '@/components/admin/report-details-modal';

interface Review {
  id: string;
  userName: string;
  userEmail?: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  isApproved: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  company: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    imageUrl: string;
  }>;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface ReviewReport {
  id: string;
  reason: string;
  description: string;
  reporterEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  review: Review;
}

export function AdminReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Load reviews and reports
  useEffect(() => {
    loadReviews();
    loadReports();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // This would be a real API call
      const mockReviews: Review[] = [
        {
          id: '1',
          userName: 'أحمد محمد',
          userEmail: 'ahmed@example.com',
          rating: 5,
          title: 'خدمة ممتازة',
          comment: 'تعاملت مع هذه الشركة وكانت التجربة رائعة جداً.',
          createdAt: '2024-01-15T10:30:00Z',
          isApproved: false,
          helpfulCount: 0,
          notHelpfulCount: 0,
          company: {
            id: '1',
            name: 'شركة ABC التقنية',
            slug: 'abc-tech'
          },
          images: [],
          user: {
            id: '1',
            name: 'أحمد محمد'
          }
        },
        {
          id: '2',
          userName: 'فاطمة علي',
          rating: 4,
          title: 'جودة عالية',
          comment: 'العمل المنجز ذو جودة عالية.',
          createdAt: '2024-01-14T14:20:00Z',
          isApproved: true,
          helpfulCount: 5,
          notHelpfulCount: 1,
          company: {
            id: '2',
            name: 'مؤسسة الخدمات المتميزة',
            slug: 'premium-services'
          },
          images: [],
          user: {
            id: '2',
            name: 'فاطمة علي'
          }
        }
      ];
      setReviews(mockReviews);
    } catch (error) {
      console.error('خطأ في تحميل التقييمات:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      // This would be a real API call
      const mockReports: ReviewReport[] = [
        {
          id: '1',
          reason: 'FAKE_REVIEW',
          description: 'هذا التقييم يبدو مزيف',
          reporterEmail: 'reporter@example.com',
          status: 'PENDING',
          createdAt: '2024-01-16T09:15:00Z',
          review: {
            id: '3',
            userName: 'محمد خالد',
            rating: 1,
            title: 'خدمة سيئة جداً',
            comment: 'أسوأ تجربة في حياتي.',
            createdAt: '2024-01-15T16:45:00Z',
            isApproved: true,
            helpfulCount: 0,
            notHelpfulCount: 8,
            company: {
              id: '1',
              name: 'شركة ABC التقنية',
              slug: 'abc-tech'
            },
            images: [],
            user: {
              id: '3',
              name: 'محمد خالد'
            }
          }
        }
      ];
      setReports(mockReports);
    } catch (error) {
      console.error('خطأ في تحميل البلاغات:', error);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      // API call to approve review
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, isApproved: true }
          : review
      ));
    } catch (error) {
      console.error('خطأ في الموافقة على التقييم:', error);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      // API call to reject/delete review
      setReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('خطأ في رفض التقييم:', error);
    }
  };

  const handleReportAction = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      // API call to handle report
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
          : report
      ));
    } catch (error) {
      console.error('خطأ في معالجة البلاغ:', error);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (searchTerm && !review.title.includes(searchTerm) && !review.company.name.includes(searchTerm)) {
      return false;
    }
    if (statusFilter === 'pending' && review.isApproved) return false;
    if (statusFilter === 'approved' && !review.isApproved) return false;
    if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) return false;
    return true;
  });

  const pendingReviews = reviews.filter(r => !r.isApproved);
  const pendingReports = reports.filter(r => r.status === 'PENDING');

  const getStatusBadge = (isApproved: boolean) => {
    return isApproved ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        موافق عليه
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        في انتظار المراجعة
      </Badge>
    );
  };

  const getReasonText = (reason: string) => {
    const reasonTexts = {
      SPAM: 'رسائل مزعجة',
      INAPPROPRIATE_LANGUAGE: 'لغة غير لائقة',
      FAKE_REVIEW: 'تقييم مزيف',
      HARASSMENT: 'تحرش',
      COPYRIGHT_VIOLATION: 'انتهاك حقوق الطبع',
      OTHER: 'أخرى'
    };
    return reasonTexts[reason as keyof typeof reasonTexts] || reason;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التقييمات</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">في انتظار المراجعة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingReviews.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">البلاغات المعلقة</CardTitle>
            <Flag className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pendingReports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الموافقة</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reviews.length > 0 ? Math.round((reviews.filter(r => r.isApproved).length / reviews.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reviews">التقييمات</TabsTrigger>
          <TabsTrigger value="reports" className="relative">
            البلاغات
            {pendingReports.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-600">
                {pendingReports.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث في التقييمات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">في انتظار المراجعة</option>
                  <option value="approved">موافق عليه</option>
                </select>

                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">جميع التقييمات</option>
                  <option value="5">5 نجوم</option>
                  <option value="4">4 نجوم</option>
                  <option value="3">3 نجوم</option>
                  <option value="2">2 نجوم</option>
                  <option value="1">1 نجمة</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 space-x-reverse flex-1">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.user?.avatar} />
                        <AvatarFallback>
                          {review.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {review.userName}
                            </h4>
                            {getStatusBadge(review.isApproved)}
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(review.createdAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            في {review.company.name}
                          </span>
                        </div>

                        <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                          {review.title}
                        </h5>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {review.comment}
                        </p>

                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                          <span>👍 {review.helpfulCount}</span>
                          <span>👎 {review.notHelpfulCount}</span>
                          {review.images.length > 0 && (
                            <span>📷 {review.images.length} صور</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReview(review)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {!review.isApproved && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveReview(review.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectReview(review.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Badge variant="destructive">
                            {getReasonText(report.reason)}
                          </Badge>
                          <Badge 
                            className={
                              report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              report.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {report.status === 'PENDING' ? 'معلق' :
                             report.status === 'APPROVED' ? 'مقبول' : 'مرفوض'}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {report.description}
                      </p>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-start space-x-3 space-x-reverse">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < report.review.rating
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex-1">
                            <h6 className="font-medium text-sm">{report.review.title}</h6>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              بواسطة {report.review.userName} في {report.review.company.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {report.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAction(report.id, 'approve')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReportAction(report.id, 'reject')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedReview && (
        <ReviewDetailsModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onApprove={handleApproveReview}
          onReject={handleRejectReview}
        />
      )}

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onAction={handleReportAction}
        />
      )}
    </div>
  );
}
