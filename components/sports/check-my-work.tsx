'use client'

import React, { useState } from 'react';
import { IconCheck } from "@/components/ui/icons";
import { MemoizedReactMarkdown } from "@/components/markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { CodeBlock } from "@/components/ui/codeblock";

export interface CheckMyWorkProps {
    sqlQuery: string;
    queryResult: string;
    columnsReferenced: string;
    nerResults: any;
}

export function CheckMyWork({ sqlQuery, queryResult, columnsReferenced, nerResults }: CheckMyWorkProps) {
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
                <p className="text-zinc-500 dark:text-zinc-100 text-sm mb-3">
                    Please check my work as we make progress on the beta version of the Huddlevision chatbot.
                </p>
                <button
                    onClick={toggleCollapse}
                    className="text-left text-sky-500 hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-500 text-sm mb-3"
                >
                    {isCollapsed ? 'Show Details' : 'Hide Details'}
                </button>
                {!isCollapsed && (
                    <div className="border rounded-md p-3 dark:bg-neutral-950 mb-3">
                        {/* Table showing the NER results; column for player/team, name, match score, player_position. */}
                        {/* nerResults is an object, with keys of identified_players and identified_teams */}
                        { nerResults.identified_players.length > 0 ? (
                        <><h3 className="text-sky-800 dark:text-sky-100 text-sm mb-2">Identified Players in Prompt:</h3>
                        <table className="border-collapse border border-slate-500 rounded-md mb-2">
                            <thead>
                                <tr>
                                    <th className="border text-sm rounded-md p-1">Player</th>
                                    <th className="border text-sm rounded-md p-1">NER Match</th>
                                    <th className="border text-sm rounded-md p-1">Player ID</th>
                                    <th className="border text-sm rounded-md p-1">Player ID Match</th>
                                    <th className="border text-sm rounded-md p-1">Position</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nerResults.identified_players.map((player, index) => (
                                    <tr key={index}>
                                        <td className="text-center text-sm border p-1">{player.name}</td>
                                        <td className="text-center text-sm border p-1">{(player.ner_score * 100).toFixed(2)}%</td>
                                        <td className="text-center text-sm border p-1">{player.player_id}</td>
                                        {
                                            player.player_id_score > 0.5 ? 
                                            <td className="text-green-500 text-sm border p-1 text-center">{(player.player_id_score * 100).toFixed(2)}%</td> : 
                                            <td className="text-red-500 border text-sm p-1 text-center">{(player.player_id_score * 100).toFixed(2)}%</td>
                                        }
                                        <td className="text-center text-sm border p-1">{player.player_position}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></>) : null}
                        { nerResults.identified_teams.length > 0 ? (
                        <><h3 className="text-sky-800 dark:text-sky-100 text-sm mt-4 mb-2">Identified Teams in Prompt:</h3>
                        <table className="border-collapse border border-slate-500 rounded-md">
                            <thead>
                                <tr>
                                    <th className="border text-sm rounded-md p-1">Team Name</th>
                                    <th className="border text-sm rounded-md p-1">NER Match</th>
                                    <th className="border text-sm rounded-md p-1">Team ID</th>
                                    <th className="border text-sm rounded-md p-1">Team ID Match</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nerResults.identified_teams.map((team, index) => (
                                    <tr key={index}>
                                        <td className="text-center text-sm border p-1">{team.name}</td>
                                        <td className="text-center text-sm border p-1">{(team.ner_score * 100).toFixed(2)}%</td>
                                        <td className="text-center text-sm border p-1">{ " " }</td>
                                        <td className="text-center text-sm border p-1">{ " " }</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></>) : null}
                        
                        <h3 className="text-sky-800 dark:text-sky-100 text-sm mb-2">Generated SQL Query:</h3>
                        <CodeBlock 
                            language={".sql"}
                            value={sqlQuery}
                        />

                        <h3 className="text-sky-800 dark:text-sky-100 text-sm mt-2 mb-1">Query Result:</h3>
                        <CodeBlock 
                            language={".js"}
                            value={JSON.stringify(queryResult)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
