'use client';
import type { User, Reward } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Star, Gift } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useDoc, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, doc, Timestamp, increment, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

export default function RewardsPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'child';
  const { firestore } = useFirebase();
  const { user: authUser, isUserLoading } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const rewardsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'rewards');
  }, [firestore]);
  
  const { data: user, isLoading: userLoading } = useDoc<User>(userDocRef);
  const { data: rewards, isLoading: rewardsLoading } = useCollection<Reward>(rewardsQuery);


  const getRewardImage = (imageId: string) => {
    const image = PlaceHolderImages.find(p => p.id === imageId);
    return image ? image.imageUrl : "https://picsum.photos/seed/placeholder/600/400";
  }

  const handleRedeem = (reward: Reward) => {
    if (!firestore || !user || !authUser?.uid) return;

    if ((user.points || 0) < reward.costInPoints) {
        toast({ title: "Không đủ điểm", description: "Con chưa đủ điểm để đổi phần thưởng này.", variant: "destructive" });
        return;
    }

    const batch = writeBatch(firestore);
    
    // Deduct points from user
    const userRef = doc(firestore, 'users', authUser.uid);
    batch.update(userRef, { points: increment(-reward.costInPoints) });

    // Create redemption record
    const redemptionRef = doc(collection(firestore, `users/${authUser.uid}/redemptions`));
    batch.set(redemptionRef, {
        id: redemptionRef.id,
        userId: authUser.uid,
        rewardId: reward.id,
        description: `Đổi phần thưởng: ${reward.name}`,
        pointsRedeemed: -reward.costInPoints,
        redemptionDate: Timestamp.now(),
    });
    
    batch.commit().then(() => {
      toast({ title: "Đổi quà thành công!", description: `Con đã đổi "${reward.name}".` });
    }).catch(e => {
        console.error(e);
        toast({ title: 'Lỗi!', description: 'Không thể đổi quà.', variant: 'destructive'});
    });
  }

  const isLoading = isUserLoading || userLoading || rewardsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4].map(i => (
             <Card key={i}>
                <Skeleton className="aspect-video w-full" />
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full" /></CardContent>
                <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
             </Card>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (role === 'parent') {
    // Parent view can be implemented here to manage rewards
    return <div>Chức năng quản lý phần thưởng cho phụ huynh đang được phát triển.</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift /> Cửa hàng phần thưởng
        </CardTitle>
        <CardDescription>
          Dùng điểm của con để đổi những phần quà hấp dẫn!
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(rewards || []).map((reward) => (
          <Card key={reward.id}>
            <div className="relative aspect-video w-full">
              <Image
                src={getRewardImage(reward.imageUrl || 'placeholder')}
                alt={reward.name}
                fill
                className="rounded-t-lg object-cover"
                data-ai-hint="reward gift"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-base">{reward.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{reward.description}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={(user?.points || 0) < reward.costInPoints} onClick={() => handleRedeem(reward)}>
                <Star className="mr-2 h-4 w-4" />
                Đổi {reward.costInPoints} điểm
              </Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
