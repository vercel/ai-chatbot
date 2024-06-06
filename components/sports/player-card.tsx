import React from 'react';
import { Player } from '@/lib/types';


export interface PlayerCardProps {
    player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
    return (
        <div
            className="p-4 mb-4 bg-white w-full transition-shadow duration-300 flex flex-row"
        >
            <img 
                className="w-1/4 h-auto object-cover rounded-md border mr-4" 
                src={player.image} 
                alt={`${player.playerName}`} />
            <div className="p-2 w-3/4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{player.playerName}</h3>
                <p className="text-md text-gray-600 mb-1">Team: {player.team}</p>
                <p className="text-md text-gray-600 mb-1">Position: { player.position }</p>
                <p className="text-md text-gray-600 mb-1">Height: {player.height}</p>
                <p className="text-md text-gray-600 mb-1">Weight: {player.weight}</p>
                <p className="text-md text-gray-600 mb-1">College: {player.college}</p>
            </div>
        </div>
    );
}
