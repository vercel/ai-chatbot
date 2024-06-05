import React from 'react';

export interface PlayerCardProps {
    playerInfo: {
        player_name: string;
        team: string;
        position: string;
        height: string;
        weight: string;
        college: string;
        headshot_url: string;
    };
}

export function PlayerCard({ playerInfo }: PlayerCardProps) {
    console.log('player info: ', playerInfo)
    return (
        <div
            className="p-4 mb-4 bg-white w-full transition-shadow duration-300 flex flex-row"
        >
            <img 
                className="w-1/4 h-auto object-cover rounded-md border mr-4" 
                src={playerInfo.headshot_url} 
                alt={`${playerInfo.player_name}`} />
            <div className="p-2 w-3/4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{playerInfo.player_name}</h3>
                <p className="text-md text-gray-600 mb-1">Team: {playerInfo.team}</p>
                <p className="text-md text-gray-600 mb-1">Position: { playerInfo.position }</p>
                <p className="text-md text-gray-600 mb-1">Height: {playerInfo.height}</p>
                <p className="text-md text-gray-600 mb-1">Weight: {playerInfo.weight}</p>
                <p className="text-md text-gray-600 mb-1">College: {playerInfo.college}</p>
            </div>
        </div>
    );
}
