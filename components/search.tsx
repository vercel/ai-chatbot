import { Client } from "@microsoft/microsoft-graph-client";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, EnrichedSession } from "@/auth";

import {
    DriveItem,
    ListItem,
    User,
    SharepointIds
  } from "@microsoft/microsoft-graph-types";
import { JSX, SVGProps } from "react";
  
  interface SearchResponse {
    value: SearchResult[];
  }
  
  interface SearchResult {
    searchTerms: string[];
    hitsContainers: HitsContainer[];
  }
  
  interface HitsContainer {
    hits: Hit[];
  }
  
  interface Hit {
    hitId: string;
    rank: number;
    summary: string;
    resource: DriveItem;
  }
  
//   // Extend the DriveItem interface to include additional properties not in the standard type
//   interface ExtendedDriveItem extends DriveItem {
//     listItem: ListItem;
//     createdBy: User;
//     lastModifiedBy: User;
//     parentReference: ExtendedParentReference;
//   }
  
//   // Extend the ParentReference interface to include additional properties
//   interface ExtendedParentReference extends DriveItem.ParentReference {
//     sharepointIds: SharepointIds;
//     siteId: string;
//   }
interface props {
    searchQuery: string;
};


export default async function Search(props: props) {
    console.log(props.searchQuery);
    const session = (await auth()) as EnrichedSession;
    // console.log('Session inside the route ', session);

    // if (!session) {
    // return new Response('Unauthorized', {
    //         status: 401,
    //     });
    // }


    // const { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } = process.env;
    // const clientId = AUTH_GOOGLE_ID;
    // const clientSecret = AUTH_GOOGLE_SECRET;
    const accessToken = session?.accessToken;
    const refreshToken = session?.refreshToken;



    const client = Client.init({
            authProvider: (done) =>
                    done(
                            null,
                            accessToken // WHERE DO WE GET THIS FROM?
                    ),
    });

    const searchRequest = {requests: [{entityTypes: ['driveItem'], query: {queryString: props.searchQuery}}]};

    let response: SearchResponse = await client.api('/search/query')
            .post(searchRequest);

    // extract hits from the response
    const hits: Hit[] = response.value[0].hitsContainers[0].hits;
    const files: DriveItem[] = hits.map(hit => hit.resource);

    const sortBy = "date";
    const filterBy = "all";
    const page = 10;
    const resultsPerPage = 10;

    const totalPages = 5

    if (!files) {
            return <div>Something went wrong</div>;
    } else {
            return (
                    <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <Input
                            type="search"
                            placeholder="Search files..."
                            value={props.searchQuery}
        //          onChange={(e) => setsearchQuery(e.target.value)}
                            className="flex-1"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="shrink-0">
                                    <ArrowUpDownIcon className="w-4 h-4 mr-2" />
                                    Sort by
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[200px]" align="end">
                                <DropdownMenuRadioGroup value={sortBy} >
                                    <DropdownMenuRadioItem value="date">Date modified</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="name">File name</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="type">File type</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="shrink-0">
                                    <FilterIcon className="w-4 h-4 mr-2" />
                                    Filter by
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[200px]" align="end">
                                <DropdownMenuRadioGroup value={filterBy} >
                                    <DropdownMenuRadioItem value="all">All file types</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Word Document">Word Documents</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="PowerPoint Presentation">PowerPoint Presentations</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Excel Spreadsheet">Excel Spreadsheets</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="PDF Document">PDF Documents</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                            <div className="overflow-auto border rounded-lg">
                                    <Table className="w-full">
                                            <TableHeader>
                                                    <TableRow>
                                                            <TableHead>File</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Last Modified</TableHead>
                                                    </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                    {files.map((file, index) => (
                                                            <TableRow key={index}>
                                                                    <TableCell className="font-medium">{file.name}</TableCell>
                                                                    <TableCell>{file.name}</TableCell>
                                                                    <TableCell>{file.lastModifiedDateTime}</TableCell>
                                                            </TableRow>
                                                    ))}
                                            </TableBody>
                                    </Table>
                            </div>
                            <div className="flex justify-end">
                                    <Pagination>
                                            <PaginationContent>
                                                    <PaginationItem>
                                                            <PaginationPrevious
                                                                    href={`?page=${page > 1 ? page - 1 : 1}&search=${props.searchQuery}&sort=${sortBy}&filter=${filterBy}`}
                                                            />
                                                    </PaginationItem>
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                            <PaginationItem key={p}>
                                                                    <PaginationLink
                                                                            href={`?page=${p}&search=${props.searchQuery}&sort=${sortBy}&filter=${filterBy}`}
                                                                            isActive={p === page}
                                                                    >
                                                                            {p}
                                                                    </PaginationLink>
                                                            </PaginationItem>
                                                    ))}
                                                    <PaginationItem>
                                                            <PaginationNext
                                                                    href={`?page=${page < totalPages ? page + 1 : totalPages}&search=${props.searchQuery}&sort=${sortBy}&filter=${filterBy}`}
                                                            />
                                                    </PaginationItem>
                                            </PaginationContent>
                                    </Pagination>
                            </div>
                    </div>
            );
    }
}

function ArrowUpDownIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m21 16-4 4-4-4" />
        <path d="M17 20V4" />
        <path d="m3 8 4-4 4 4" />
        <path d="M7 4v16" />
      </svg>
    )
  }
  
  
  function FileIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      </svg>
    )
  }
  
  
  function FileSpreadsheetIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M8 13h2" />
        <path d="M14 13h2" />
        <path d="M8 17h2" />
        <path d="M14 17h2" />
      </svg>
    )
  }
  
  
  function FilterIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    )
  }
  
  
  function XIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    )
  }