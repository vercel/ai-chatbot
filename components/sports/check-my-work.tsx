'use client'

import React, { useState } from 'react';
import { NERResults, Player } from '@/lib/types';
import { IconCheck } from "@/components/ui/icons";
import { CodeBlock } from "@/components/ui/codeblock";

export interface CheckMyWorkProps {
    sqlQuery: string;
    queryResult: string;
    queryAnswer: string;
    nerResults: NERResults;
}

export function CheckMyWork({ sqlQuery, queryAnswer, nerResults }: CheckMyWorkProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="flex mt-4 max-w-full">
            <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-primary text-primary-foreground shadow-sm">
                <IconCheck />
            </div>
            <div className="ml-4 flex flex-col">
                <p className="text-zinc-500 text-sm mb-3">
                    Please check my work as we make progress on the beta version of the Huddlevision chatbot.
                </p>
                <button
                    onClick={toggleCollapse}
                    className="text-left text-sky-500 hover:text-sky-700 text-sm mb-3"
                >
                    {isCollapsed ? 'Show Details' : 'Hide Details'}
                </button>
                {!isCollapsed && (
                    <div className="border rounded-md p-3 mb-3">
                        {/* Table showing the NER results; column for player/team, name, match score, player_position. */}
                        {/* nerResults is an object, with keys of identified_players and identified_teams */}
                        { nerResults.players.length > 0 ? (
                        <><h3 className="text-sky-800 text-sm mb-2">Identified Players in Prompt:</h3>
                        <table className="border-collapse border border-slate-500 rounded-md mb-2">
                            <thead>
                                <tr>
                                    <th className="border text-sm rounded-md p-1">Player</th>
                                    <th className="border text-sm rounded-md p-1">Player ID</th>
                                    <th className="border text-sm rounded-md p-1">Confidence</th>
                                    <th className="border text-sm rounded-md p-1">Position</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nerResults.players.map((player: Player, index: number) => (
                                    <tr key={index}>
                                        <td className="text-center text-sm border p-1">{player.playerName}</td>
                                        <td className="text-center text-sm border p-1">{player.playerId}</td>                                        {
                                            player.idScore > 0.5 ? 
                                            <td className="text-green-500 text-sm border p-1 text-center">{(player.idScore * 100).toFixed(2)}%</td> : 
                                            <td className="text-red-500 border text-sm p-1 text-center">{(player.idScore * 100).toFixed(2)}%</td>
                                        }
                                        <td className="text-center text-sm border p-1">{player.position}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></>) : null}
                        <h3 className="text-sky-800 text-sm mb-2">Generated SQL Query:</h3>
                        <CodeBlock 
                            language={".sql"}
                            value={sqlQuery}
                        />

                        <h3 className="text-sky-800 text-sm mt-2 mb-1">Query Result:</h3>
                        <p className="text-sm text-zinc-900">{ queryAnswer }</p>
                    </div>
                )}
            </div>
        </div>
    );
}
