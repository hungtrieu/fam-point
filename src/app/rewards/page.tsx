'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Gift, Coins, Package, ShoppingCart, Star, X, CheckCircle2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { getChildren } from '@/app/members/actions';

interface Reward {
  _id: string;
  title: string;
  description?: string;
  points: number;
  stock: number; // -1 for unlimited
  familyId: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

interface Child {
  _id: string;
  name: string;
  role: string;
  points?: number;
}

export default function RewardsPage() {
  const { user, login } = useAuth();
  const isParent = user?.role === 'parent';
  const { toast } = useToast();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<Partial<Reward>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // New state for parent redemption
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [selectedRewardToRedeem, setSelectedRewardToRedeem] = useState<Reward | null>(null);

  useEffect(() => {
    setMounted(true);
    if (user?.familyId) {
      fetchRewards();
      if (isParent) {
        fetchChildren();
      }
    }
  }, [user?.familyId, isParent]);

  const fetchChildren = async () => {
    if (!user?.familyId) return;
    try {
      const res = await getChildren(user.familyId);
      if (res.success) {
        setChildren(res.data.filter((m: any) => m.role === 'child'));
      }
    } catch (error) {
      console.error('Failed to fetch children', error);
    }
  };

  const fetchRewards = async () => {
    if (!user?.familyId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rewards?familyId=${user?.familyId}`);
      if (!res.ok) throw new Error('Failed to fetch rewards');
      const data = await res.json();
      setRewards(data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách phần thưởng',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRewardStatus = async (reward: Reward, status: 'approved' | 'rejected', newPoints?: number) => {
    try {
      const res = await fetch(`/api/rewards/${reward._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          points: newPoints !== undefined ? newPoints : reward.points
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast({
        title: 'Thành công',
        description: status === 'approved' ? 'Đã duyệt món quà này vào cửa hàng' : 'Đã từ chối nguyện vọng này',
      });
      fetchRewards();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái món quà',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing && currentReward._id ? `/api/rewards/${currentReward._id}` : '/api/rewards';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...currentReward,
        points: Number(currentReward.points),
        stock: Number(currentReward.stock) || -1,
        familyId: user?.familyId,
        createdBy: user?.id,
        status: isParent ? (currentReward.status || 'approved') : 'pending'
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Operation failed');

      toast({
        title: 'Thành công',
        description: `Phần thưởng đã được ${isEditing ? 'cập nhật' : 'tạo'}`,
      });
      setIsDialogOpen(false);
      fetchRewards();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu phần thưởng',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phần thưởng này?')) return;
    try {
      const res = await fetch(`/api/rewards/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: 'Thành công', description: 'Đã xóa phần thưởng' });
      fetchRewards();
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa phần thưởng', variant: 'destructive' });
    }
  };

  const openCreateDialog = () => {
    setCurrentReward({ points: 50, stock: -1, title: '', description: '' });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (reward: Reward) => {
    setCurrentReward(reward);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const openRedeemDialog = (reward: Reward) => {
    setSelectedRewardToRedeem(reward);
    setIsRedeemDialogOpen(true);
  };

  const handleRedeem = async (reward: Reward) => {
    if (user && user.points! < reward.points) {
      toast({
        title: 'Không đủ điểm',
        description: `Bạn cần thêm ${reward.points - user.points!} điểm nữa để đổi phần thưởng này.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, rewardId: reward._id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Update local points in auth context
      login({ ...user!, points: data.updatedPoints });

      toast({
        title: 'Đổi quà thành công! 🎉',
        description: `Bạn đã đổi thành công: ${reward.title}. Chúc bạn tận hưởng phần quà của mình!`,
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRedeemForChild = async (childId: string) => {
    if (!selectedRewardToRedeem) return;

    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: childId, rewardId: selectedRewardToRedeem._id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast({
        title: 'Đổi quà thành công! 🎁',
        description: `Đã đổi quà ${selectedRewardToRedeem.title} cho con thành công.`,
      });
      setIsRedeemDialogOpen(false);
      fetchChildren(); // Refresh children points
      fetchRewards(); // Refresh stock
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const approvedRewards = rewards
    .filter(r => r.status === 'approved')
    .sort((a, b) => {
      if (a.stock === 0 && b.stock !== 0) return 1;
      if (a.stock !== 0 && b.stock === 0) return -1;
      return 0;
    });
  const proposedRewards = rewards
    .filter(r => r.status === 'pending' || r.status === 'rejected')
    .sort((a, b) => {
      if (a.status === 'pending' && b.status === 'rejected') return -1;
      if (a.status === 'rejected' && b.status === 'pending') return 1;
      return 0;
    });

  if (!mounted) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6 px-4 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Cửa hàng phần thưởng</h1>
          <p className="text-muted-foreground mt-2">
            {isParent ? 'Quản lý các phần thưởng mà con có thể đổi được.' : 'Sử dụng điểm của bạn để đổi những phần thưởng hấp dẫn.'}
          </p>
        </div>
        {isParent ? (
          <Button onClick={openCreateDialog} className="shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-none shrink-0">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Thêm phần thưởng</span>
          </Button>
        ) : (
          <Button onClick={openCreateDialog} className="shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-none shrink-0">
            <Star className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Đề xuất quà</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Proposed and Rejected Rewards Section */}
          {proposedRewards.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Nguyện vọng quà tặng
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {proposedRewards.map((reward) => (
                  <Card key={reward._id} className={`overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 ${reward.status === 'rejected' ? 'grayscale opacity-70 border-t-slate-400 bg-slate-50' : 'bg-amber-50/50 dark:bg-amber-900/10 border-t-amber-400'} border-t-4`}>
                    <CardHeader className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`px-3 py-1 bg-white/80 dark:bg-black/20 ${reward.status === 'rejected' ? 'text-slate-600 border-slate-300' : 'text-amber-700 border-amber-200'}`}>
                          {reward.status === 'pending' ? 'Chờ duyệt' : 'Đã từ chối'}
                        </Badge>
                        <div className={`flex items-center ${reward.status === 'rejected' ? 'text-slate-500' : 'text-amber-600'} font-extrabold bg-white/80 dark:bg-black/20 px-3 py-1 rounded-full text-sm shadow-sm`}>
                          <Coins className="h-4 w-4 mr-1" />
                          {reward.points}
                        </div>
                      </div>
                      <CardTitle className={`text-xl font-bold uppercase tracking-tight ${reward.status === 'rejected' ? 'text-slate-600' : ''}`}>{reward.title}</CardTitle>
                      {reward.description && (
                        <CardDescription className="line-clamp-2 text-sm mt-2 italic">"{reward.description}"</CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter className="bg-muted/30 p-4 flex gap-2">
                      {isParent ? (
                        <>
                          {reward.status !== 'rejected' ? (
                            <>
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
                                onClick={() => handleUpdateRewardStatus(reward, 'approved')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Duyệt
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 font-bold"
                                onClick={() => handleUpdateRewardStatus(reward, 'rejected')}
                              >
                                <X className="h-4 w-4 mr-2" /> Từ chối
                              </Button>
                            </>
                          ) : (
                            <Button
                              className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 font-bold"
                              variant="outline"
                              onClick={() => handleDelete(reward._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Xóa đề xuất
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(reward)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground italic w-full text-center py-2">
                          {reward.status === 'pending' ? 'Bố mẹ đang xem xét đề xuất này...' : 'Đề xuất này chưa phù hợp lúc này.'}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Approved Rewards Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <ShoppingCart className="h-5 w-5 text-rose-500" /> Cửa hàng quà tặng
            </h2>
            {approvedRewards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
                <div className="bg-muted/50 p-4 rounded-full mb-4">
                  <Gift className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Cửa hàng đang trống</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  {isParent ? 'Hãy duyệt các nguyện vọng hoặc thêm quà mới!' : 'Hãy đề xuất món quà bạn thích nhé!'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {approvedRewards.map((reward) => (
                  <Card key={reward._id} className={`overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-card/50 backdrop-blur-sm border-t-4 border-t-rose-400 ${reward.stock === 0 ? 'grayscale opacity-60' : ''}`}>
                    <CardHeader className="bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-900/20 dark:to-pink-900/20 p-6">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`px-3 py-1 bg-white/80 dark:bg-black/20 text-rose-700 border-rose-200 ${reward.stock === 0 ? 'bg-slate-100 text-slate-500 border-slate-200' : ''}`}>
                          <Package className="h-3 w-3 mr-1" />
                          {reward.stock === -1 ? 'Vô hạn' : reward.stock === 0 ? 'Hết hàng' : `Còn ${reward.stock}`}
                        </Badge>
                        <div className="flex items-center text-amber-600 font-extrabold bg-white/80 dark:bg-black/20 px-3 py-1 rounded-full text-sm shadow-sm">
                          <Coins className="h-4 w-4 mr-1" />
                          {reward.points}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-rose-600 transition-colors uppercase tracking-tight">{reward.title}</CardTitle>
                      {reward.description && (
                        <CardDescription className="line-clamp-2 text-sm mt-2 text-gray-600 dark:text-gray-400 italic">"{reward.description}"</CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter className="bg-muted/30 p-4 flex justify-between items-center">
                      {!isParent ? (
                        <Button
                          className={`w-full font-bold shadow-md ${reward.stock === 0 ? 'bg-slate-400 hover:bg-slate-400' : 'bg-rose-500 hover:bg-rose-600'}`}
                          onClick={() => handleRedeem(reward)}
                          disabled={reward.stock === 0}
                        >
                          {reward.stock === 0 ? 'Hết hàng' : 'Đổi quà ngay'}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1 mr-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 font-bold w-full"
                              onClick={() => openRedeemDialog(reward)}
                              disabled={reward.stock === 0}
                            >
                              <Gift className="h-4 w-4 mr-1" /> Tặng quà
                            </Button>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400" onClick={() => openEditDialog(reward)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400" onClick={() => handleDelete(reward._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Sửa phần thưởng' : 'Thêm phần thưởng mới'}</DialogTitle>
            <DialogDescription>
              Tạo các món quà hấp dẫn để tạo động lực cho con.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tên phần thưởng</Label>
              <Input
                id="title"
                value={currentReward.title}
                onChange={(e) => setCurrentReward({ ...currentReward, title: e.target.value })}
                required
                placeholder="Ví dụ: Xem TV 30p, Đi ăn kem..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={currentReward.description}
                onChange={(e) => setCurrentReward({ ...currentReward, description: e.target.value })}
                placeholder="Mô tả món quà này..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Số điểm cần đổi</Label>
                <Input
                  id="points"
                  type="number"
                  value={currentReward.points}
                  onChange={(e) => setCurrentReward({ ...currentReward, points: Number(e.target.value) })}
                  required
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Số lượng ( -1 = Vô hạn )</Label>
                <Input
                  id="stock"
                  type="number"
                  value={currentReward.stock}
                  onChange={(e) => setCurrentReward({ ...currentReward, stock: Number(e.target.value) })}
                  required
                  min={-1}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600">
                {isEditing ? 'Lưu thay đổi' : 'Tạo phần thưởng'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Redeem for Child Dialog */}
      <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Tặng quà cho con</DialogTitle>
            <DialogDescription>
              Chọn thành viên bạn muốn đổi quà &quot;{selectedRewardToRedeem?.title}&quot;.
              <br />
              (Số điểm sẽ được trừ trực tiếp từ tài khoản của người nhận)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {children.length === 0 ? (
              <p className="text-center text-muted-foreground italic">Không tìm thấy thành viên (con cái) nào.</p>
            ) : (
              <div className="grid gap-3">
                {children.map(child => (
                  <div key={child._id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-rose-100 p-2 rounded-full text-rose-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold">{child.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          Hiện có: <span className="font-bold text-amber-600 ml-1">{child.points || 0}</span> <Coins className="h-3 w-3 ml-0.5 text-amber-600" />
                        </p>
                      </div>
                    </div>
                    {selectedRewardToRedeem && (child.points || 0) < selectedRewardToRedeem.points ? (
                      <Button size="sm" disabled variant="outline" className="text-xs text-muted-foreground">
                        Thiếu {selectedRewardToRedeem.points - (child.points || 0)} điểm
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-rose-500 hover:bg-rose-600 font-bold"
                        onClick={() => handleRedeemForChild(child._id)}
                      >
                        Tặng ngay
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedeemDialogOpen(false)}>Hủy bỏ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
