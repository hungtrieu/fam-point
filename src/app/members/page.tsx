import { getChildren } from './actions';
import ChildrenClient from './client';

export const dynamic = 'force-dynamic';

export default function ChildrenPage() {
    return (
        <div className="container mx-auto py-10">
            <ChildrenClient initialData={[]} />
        </div>
    );
}
