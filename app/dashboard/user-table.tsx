'use client';

import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table
} from '@/components/Table';
import { Button } from '@/components/ui/button';
// import { SelectUser } from '@/lib/db';
// import { deleteUser } from './actions';
import { useRouter } from 'next/navigation';

export function UsersTable({
    users,
    // offset="0"
}: {
 users: any;
  offset: number | null;
}) {
  const router = useRouter();

//   function onClick() {
//     router.replace(`/?offset=${offset}`);
//   }

  return (
    <>
      <form className="border shadow-sm rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-[150px]">Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Username</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <UserRow key={user.id} user={user} />
            ))}
          </TableBody>
        </Table>
      </form>
      {/* {offset !== null && (
        <Button
          className="mt-4 w-40"
          variant="secondary"
          onClick={() => onClick()}
        >
          Next Page
        </Button>
      )} */}
    </>
  );
}

function UserRow({ user }: { user: any }) {
  const userId = user.id;
//   const deleteUserWithId = deleteUser.bind(null, userId);

  return (
    <TableRow>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell className="hidden md:table-cell">{user.email}</TableCell>
      <TableCell>{user.username}</TableCell>
      <TableCell>
        <Button
          className="w-full"
          size="sm"
          variant="outline"
        //   formAction={deleteUserWithId}
          disabled
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
}