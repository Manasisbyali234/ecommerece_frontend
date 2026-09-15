"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Check,
  X,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Video,
  Camera,
  Play,
  Eye,
  MessageSquare,
  ShieldCheck,
  Package,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { type ProductReview } from "@/lib/mock-data";
import { api } from "@/lib/api";

interface AdminReviewItem extends ProductReview {
  productId: string;
  productName: string;
  productImage: string;
  status: "approved" | "pending" | "rejected";
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [reviewMediaModal, setReviewMediaModal] = useState<{ type: "image" | "video"; url: string; title?: string } | null>(null);

  useEffect(() => { api<{ items: Array<Record<string, unknown>> }>("/admin/reviews").then(({ items }) => setReviews(items.map((review) => { const product = review.product as Record<string, string> | undefined; return { id: String(review.id), productId: String(product?.id || ""), productName: product?.name || "Product", productImage: product?.image || "", author: String(review.author), rating: Number(review.rating), title: String(review.title || ""), comment: String(review.comment), images: review.images as string[] | undefined, videoUrl: review.videoUrl as string | undefined, status: review.status as AdminReviewItem["status"], date: new Date(String(review.createdAt)).toLocaleDateString("en-IN") }; }))).catch(() => toast.error("Unable to load reviews")); }, []);

  // Filtered Reviews
  const filtered = useMemo(() => {
    return reviews.filter((rev) => {
      const matchSearch =
        !searchQuery ||
        rev.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rev.title && rev.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        rev.comment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusTab === "all" || rev.status === statusTab;
      return matchSearch && matchStatus;
    });
  }, [reviews, searchQuery, statusTab]);

  // Statistics
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const rejectedCount = reviews.filter((r) => r.status === "rejected").length;

  const handleApprove = async (id: string) => {
    try { await api(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status: "approved" }) });
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r))
    );
    toast.success("Review approved & published to storefront!");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to approve review"); }
  };

  const handleReject = async (id: string) => {
    try { await api(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) });
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r))
    );
    toast.info("Review marked as rejected");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to reject review"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Reviews & Moderation"
        description="Approve, reject, and publish customer product reviews and media unboxings for your storefront."
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Reviews</span>
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground pt-1">{reviews.length}</p>
        </Card>

        <Card className="p-4 border border-amber-500/20 bg-amber-500/5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Pending Approval</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 pt-1">{pendingCount}</p>
        </Card>

        <Card className="p-4 border border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Published Live</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 pt-1">{approvedCount}</p>
        </Card>

        <Card className="p-4 border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Storefront Rating</span>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground pt-1">4.9 ★</p>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={statusTab === "all" ? "default" : "outline"}
            onClick={() => setStatusTab("all")}
            className="text-xs font-bold h-8"
          >
            All Reviews ({reviews.length})
          </Button>

          <Button
            size="sm"
            variant={statusTab === "pending" ? "default" : "outline"}
            onClick={() => setStatusTab("pending")}
            className={`text-xs font-bold h-8 relative ${
              statusTab === "pending"
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                : "border-amber-500/30 text-amber-600 dark:text-amber-400"
            }`}
          >
            <Clock className="h-3.5 w-3.5 mr-1" /> Pending Moderation ({pendingCount})
          </Button>

          <Button
            size="sm"
            variant={statusTab === "approved" ? "default" : "outline"}
            onClick={() => setStatusTab("approved")}
            className="text-xs font-bold h-8"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Live Approved ({approvedCount})
          </Button>

          <Button
            size="sm"
            variant={statusTab === "rejected" ? "default" : "outline"}
            onClick={() => setStatusTab("rejected")}
            className="text-xs font-bold h-8"
          >
            <XCircle className="h-3.5 w-3.5 mr-1 text-rose-500" /> Rejected ({rejectedCount})
          </Button>
        </div>

        {/* Search Field & View Mode Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search reviews or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40 shrink-0">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              className={`h-7 px-2 text-xs gap-1.5 ${viewMode === "grid" ? "shadow-2xs font-bold" : "text-muted-foreground"}`}
              onClick={() => setViewMode("grid")}
              title="Grid View (2 Cards per row)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Grid</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              className={`h-7 px-2 text-xs gap-1.5 ${viewMode === "table" ? "shadow-2xs font-bold" : "text-muted-foreground"}`}
              onClick={() => setViewMode("table")}
              title="Table / List View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden md:inline">List</span>
            </Button>
          </div>
        </div>
      </div>      {/* Review Moderation Content (Grid vs Table View) */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center bg-muted/20">
          <p className="text-sm font-semibold text-muted-foreground">No customer reviews match your search filter.</p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((rev) => (
            <Card key={rev.id} className="border shadow-xs hover:border-primary/20 transition-all flex flex-col justify-between">
              <CardContent className="p-5 space-y-4">
                {/* Header Row: Product Link + Review Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <Link href={`/products/${rev.productId}`} className="flex items-center gap-3 group min-w-0">
                    <img
                      src={rev.productImage}
                      alt={rev.productName}
                      className="h-10 w-10 rounded-lg object-cover border shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                        {rev.productName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Product ID: {rev.productId}</span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    {rev.status === "pending" && (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold px-2 py-0.5">
                        ⏳ Pending Moderation
                      </Badge>
                    )}
                    {rev.status === "approved" && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold px-2 py-0.5">
                        ✓ Approved &amp; Live
                      </Badge>
                    )}
                    {rev.status === "rejected" && (
                      <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-bold px-2 py-0.5">
                        ✕ Rejected
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Body Row: Author Info & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {rev.avatarUrl ? (
                      <img
                        src={rev.avatarUrl}
                        alt={rev.author}
                        className="h-9 w-9 rounded-full object-cover border shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {rev.author.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{rev.author}</span>
                        {rev.verifiedBuyer && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            Verified Buyer
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{rev.date}</span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < rev.rating ? "fill-current" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-foreground ml-1.5">{rev.rating}.0 / 5.0</span>
                  </div>
                </div>

                {/* Review Headline & Content */}
                <div className="space-y-1 bg-muted/20 p-3 rounded-xl border">
                  {rev.title && <h4 className="font-bold text-xs text-foreground">{rev.title}</h4>}
                  <p className="text-xs text-muted-foreground leading-relaxed">"{rev.comment}"</p>
                </div>

                {/* Attached Customer Photos & Videos */}
                {((rev.images && rev.images.length > 0) || rev.videoUrl) && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-muted-foreground block">Customer Attached Media:</span>
                    <div className="flex flex-wrap items-center gap-3">
                      {rev.images?.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setReviewMediaModal({ type: "image", url: img, title: `${rev.author}'s Photo` })}
                          className="relative h-16 w-16 rounded-xl overflow-hidden border bg-slate-950 group cursor-pointer shrink-0 hover:ring-2 ring-primary/50 transition-all"
                        >
                          <img src={img} alt="Customer Photo" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </button>
                      ))}

                      {rev.videoUrl && (
                        <button
                          onClick={() => setReviewMediaModal({ type: "video", url: rev.videoUrl!, title: `${rev.author}'s Video Review` })}
                          className="relative h-16 w-24 rounded-xl overflow-hidden border bg-slate-950 group cursor-pointer shrink-0 hover:ring-2 ring-primary/50 transition-all flex items-center justify-center"
                        >
                          {rev.videoPoster && (
                            <img src={rev.videoPoster} alt="Video Poster" className="h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="h-7 w-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Moderation Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-[11px] text-muted-foreground">
                    Action required to publish on product page
                  </div>

                  <div className="flex items-center gap-1.5">
                    {rev.status !== "approved" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              onClick={() => handleApprove(rev.id)}
                              className="h-8 w-8 bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Approve &amp; Publish Review</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {rev.status !== "rejected" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleReject(rev.id)}
                              className="h-8 w-8 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reject Review</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Table / List View */
        <Card className="border shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs font-bold">Product</TableHead>
                <TableHead className="text-xs font-bold">Customer</TableHead>
                <TableHead className="text-xs font-bold">Rating</TableHead>
                <TableHead className="text-xs font-bold">Review &amp; Media</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rev) => (
                <TableRow key={rev.id} className="hover:bg-muted/20">
                  {/* Product */}
                  <TableCell>
                    <Link href={`/products/${rev.productId}`} className="flex items-center gap-2.5 group">
                      <img
                        src={rev.productImage}
                        alt={rev.productName}
                        className="h-9 w-9 rounded-md object-cover border shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 max-w-[180px]">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block truncate">
                          {rev.productName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">ID: {rev.productId}</span>
                      </div>
                    </Link>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {rev.avatarUrl ? (
                        <img src={rev.avatarUrl} alt={rev.author} className="h-7 w-7 rounded-full object-cover border shrink-0" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                          {rev.author.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-foreground">{rev.author}</span>
                          {rev.verifiedBuyer && (
                            <Badge variant="outline" className="text-[8px] py-0 px-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Rating */}
                  <TableCell>
                    <div className="flex items-center text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < rev.rating ? "fill-current" : "text-muted-foreground/30"}`}
                        />
                      ))}
                      <span className="text-xs font-bold text-foreground ml-1">{rev.rating}.0</span>
                    </div>
                  </TableCell>

                  {/* Review & Media */}
                  <TableCell className="max-w-[260px]">
                    <div className="space-y-1">
                      {rev.title && <p className="font-bold text-xs text-foreground truncate">{rev.title}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-2">"{rev.comment}"</p>
                      {((rev.images && rev.images.length > 0) || rev.videoUrl) && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {rev.images?.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setReviewMediaModal({ type: "image", url: img, title: `${rev.author}'s Photo` })}
                              className="h-6 w-6 rounded border overflow-hidden shrink-0 hover:ring-1 ring-primary"
                            >
                              <img src={img} alt="Photo" className="h-full w-full object-cover" />
                            </button>
                          ))}
                          {rev.videoUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReviewMediaModal({ type: "video", url: rev.videoUrl!, title: `${rev.author}'s Video` })}
                              className="h-5 px-1.5 text-[9px] font-bold gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            >
                              <Play className="h-2.5 w-2.5 fill-current" /> Video
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {rev.status === "pending" && (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold px-2 py-0.5 whitespace-nowrap">
                        ⏳ Pending
                      </Badge>
                    )}
                    {rev.status === "approved" && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 whitespace-nowrap">
                        ✓ Live
                      </Badge>
                    )}
                    {rev.status === "rejected" && (
                      <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold px-2 py-0.5 whitespace-nowrap">
                        ✕ Rejected
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {rev.status !== "approved" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                onClick={() => handleApprove(rev.id)}
                                className="h-7 w-7 bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Approve &amp; Publish</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {rev.status !== "rejected" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleReject(rev.id)}
                                className="h-7 w-7 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reject Review</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Media Inspection Lightbox Modal */}
      <Dialog open={Boolean(reviewMediaModal)} onOpenChange={(open) => !open && setReviewMediaModal(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
          <DialogHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {reviewMediaModal?.type === "video" ? <Video className="h-4 w-4 text-amber-400" /> : <Camera className="h-4 w-4 text-emerald-400" />}
              {reviewMediaModal?.title || "Customer Review Attachment"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 flex items-center justify-center min-h-[350px] max-h-[70vh]">
            {reviewMediaModal?.type === "video" ? (
              <video
                src={reviewMediaModal.url}
                controls
                autoPlay
                className="max-h-[60vh] w-full rounded-xl object-contain bg-black"
              />
            ) : (
              <img
                src={reviewMediaModal?.url}
                alt="Customer Upload"
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
