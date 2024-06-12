import { Player, NERResults } from '@/lib/types';
import { PlayerCard } from '@/components/sports/player-card';
import { CheckMyWork } from '@/components/sports/check-my-work';
import { UserMessage } from '@/components/stocks/message';
import { nanoid } from 'nanoid';
import { User } from 'lucide-react';

export interface ResultsPageProps {
    nerResults: NERResults;
    queryAnswer: string;
    querySummary: string;
    queryResult: string;
    sqlQuery: string;
    prompt: string;
}

export function ResultsPage({
    nerResults,
    queryAnswer,
    querySummary,
    queryResult,
    sqlQuery,
    prompt
}: ResultsPageProps) {
    return (
        <div>
              <p className="text-3xl">{prompt as string}</p>
              <div className="flex flex-col mb-5">
                <div className="flex mb-3">
                { nerResults.players.map((player: Player) => {
                  return (
                    <PlayerCard key={nanoid()} player={player} />
                  )
                  })
                }
                </div>
                <div className="mb-3 flex flex-col">
                    <p className="text-xl font-semibold flex flex-row items-center">
                    <span className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border border-muted shadow-sm">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.69667 0.0403541C8.90859 0.131038 9.03106 0.354857 8.99316 0.582235L8.0902 6.00001H12.5C12.6893 6.00001 12.8625 6.10701 12.9472 6.27641C13.0319 6.4458 13.0136 6.6485 12.8999 6.80001L6.89997 14.8C6.76167 14.9844 6.51521 15.0503 6.30328 14.9597C6.09135 14.869 5.96888 14.6452 6.00678 14.4178L6.90974 9H2.49999C2.31061 9 2.13748 8.893 2.05278 8.72361C1.96809 8.55422 1.98636 8.35151 2.09999 8.2L8.09997 0.200038C8.23828 0.0156255 8.48474 -0.0503301 8.69667 0.0403541ZM3.49999 8.00001H7.49997C7.64695 8.00001 7.78648 8.06467 7.88148 8.17682C7.97648 8.28896 8.01733 8.43723 7.99317 8.5822L7.33027 12.5596L11.5 7.00001H7.49997C7.353 7.00001 7.21347 6.93534 7.11846 6.8232C7.02346 6.71105 6.98261 6.56279 7.00678 6.41781L7.66968 2.44042L3.49999 8.00001Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </span>
                    <span className="ml-2">Answer</span>
                    </p>
                    <p className="mb-3 mt-1">{queryAnswer}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xl font-semibold flex flex-row items-center">
                  <span className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border border-muted shadow-sm">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.42503 3.44136C10.0561 3.23654 10.7837 3.2402 11.3792 3.54623C12.7532 4.25224 13.3477 6.07191 12.7946 8C12.5465 8.8649 12.1102 9.70472 11.1861 10.5524C10.262 11.4 8.98034 11.9 8.38571 11.9C8.17269 11.9 8 11.7321 8 11.525C8 11.3179 8.17644 11.15 8.38571 11.15C9.06497 11.15 9.67189 10.7804 10.3906 10.236C10.9406 9.8193 11.3701 9.28633 11.608 8.82191C12.0628 7.93367 12.0782 6.68174 11.3433 6.34901C10.9904 6.73455 10.5295 6.95946 9.97725 6.95946C8.7773 6.95946 8.0701 5.99412 8.10051 5.12009C8.12957 4.28474 8.66032 3.68954 9.42503 3.44136ZM3.42503 3.44136C4.05614 3.23654 4.78366 3.2402 5.37923 3.54623C6.7532 4.25224 7.34766 6.07191 6.79462 8C6.54654 8.8649 6.11019 9.70472 5.1861 10.5524C4.26201 11.4 2.98034 11.9 2.38571 11.9C2.17269 11.9 2 11.7321 2 11.525C2 11.3179 2.17644 11.15 2.38571 11.15C3.06497 11.15 3.67189 10.7804 4.39058 10.236C4.94065 9.8193 5.37014 9.28633 5.60797 8.82191C6.06282 7.93367 6.07821 6.68174 5.3433 6.34901C4.99037 6.73455 4.52948 6.95946 3.97725 6.95946C2.7773 6.95946 2.0701 5.99412 2.10051 5.12009C2.12957 4.28474 2.66032 3.68954 3.42503 3.44136Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                  </span>
                  <span className="ml-2">Query Summary</span>  
                  </p>
                  <p className="mt-1">{querySummary}</p>
                </div>
              </div>
            <CheckMyWork 
              sqlQuery={sqlQuery}
              queryResult={queryResult}
              queryAnswer={queryAnswer}
              nerResults={nerResults}/>
          </div>
    )
}