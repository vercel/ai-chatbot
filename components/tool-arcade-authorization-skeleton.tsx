import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Skeleton } from './ui/skeleton';

export const ToolArcadeAuthorizationSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="justify-center items-center flex flex-col gap-4">
        <div className="text-center space-y-1.5">
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-3 w-40 mx-auto" />
        </div>
        <Skeleton className="h-8 w-48" />
      </CardContent>
      <CardFooter className="justify-center">
        <Skeleton className="h-4 w-48" />
      </CardFooter>
    </Card>
  );
};
