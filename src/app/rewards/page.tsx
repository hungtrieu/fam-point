import { users, rewards } from '@/lib/data';
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

export default function RewardsPage({
  searchParams,
}: {
  searchParams: { role?: 'parent' | 'child' };
}) {
  const role = searchParams.role || 'child';

  // For now, we only have a child view for this page.
  // We can add a parent view later.
  const childUser = users.find((u) => u.role === 'child');
  if (!childUser) return <div>Không tìm thấy người dùng.</div>;

   const getRewardImage = (imageId: string) => {
    return PlaceHolderImages.find(p => p.id === imageId)?.imageUrl || "https://picsum.photos/seed/placeholder/600/400";
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
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <div className="relative aspect-video w-full">
              <Image
                src={getRewardImage(reward.image)}
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
              <Button className="w-full" disabled={childUser.points! < reward.points}>
                <Star className="mr-2 h-4 w-4" />
                Đổi {reward.points} điểm
              </Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
