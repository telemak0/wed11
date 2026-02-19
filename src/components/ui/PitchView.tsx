import React from 'react';
import { Player } from '../../types';

interface PitchProps {
  teamRed: Player[];
  teamWhite: Player[];
  onRemovePlayer?: (playerId: string) => void;
  interactive?: boolean;
}

export const PitchView: React.FC<PitchProps> = ({ teamRed, teamWhite, onRemovePlayer, interactive = true }) => {
  // Helper to render a player circle
  const renderPlayer = (player: Player | undefined, x: number, y: number, colorClass: string, textColorClass: string, strokeColorClass: string = "stroke-white") => {
    if (!player) {return null;}
    return (
      <g 
        key={player.id} 
        onClick={() => interactive && onRemovePlayer && onRemovePlayer(player.id)} 
        className={interactive ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
      >
        <rect 
            x={x - 12} 
            y={y - 6} 
            width="24" 
            height="12" 
            rx="4"
            className={`${colorClass} ${strokeColorClass} stroke-1`} 
        />
        <text 
            x={x} 
            y={y + 1.5} 
            textAnchor="middle" 
            className={`text-[4px] font-bold ${textColorClass} drop-shadow-sm select-none pointer-events-none`}
        >
            {player.name}
        </text>
      </g>
    );
  };

  const getFormation = (count: number) => {
    if (count <= 5) {return [Math.ceil(count/2), Math.floor(count/2), 0];} // Fallback for small usage
    if (count === 6) {return [2, 2, 2];}
    if (count === 7) {return [3, 2, 2];}
    if (count === 8) {return [3, 3, 2];}
    if (count === 9) {return [3, 3, 3];}
    if (count === 10) {return [4, 3, 3];}
    return [4, 4, 3]; // 11
  };

  const getPositions = (count: number, isTop: boolean) => {
      const formation = getFormation(count); // e.g. [3, 2, 2] -> [Def, Mid, Att]
      const positions: {x: number, y: number}[] = [];
      
      // Y-levels: [Def, Mid, Att]
      // Top team: Def(15), Mid(45), Att(65)
      // Bottom team: Def(135), Mid(105), Att(85)
      const yLevels = isTop ? [15, 45, 65] : [135, 105, 85];
      
      formation.forEach((rowCount, rowIndex) => {
          if (rowCount === 0) {return;}
          const y: number = yLevels[rowIndex] ?? 50; // Fallback to midfield
          
          // Distribute players evenly
          // 1 -> 50
          // 2 -> 35, 65
          // 3 -> 20, 50, 80
          // 4 -> 20, 40, 60, 80 (approx spacing)
          const step = 100 / (rowCount + 1);
          
          for(let i=1; i<=rowCount; i++) {
              let x = step * i;
              let currentY: number = y;
              
              // Custom adjustment for the defensive line of 3 (Row 0)
              if (rowIndex === 0 && rowCount === 3) {
                  // If it's the 1st player (Left) or 3rd player (Right)
                  if (i === 1) { // Left
                      x -= 6; // Move wider
                      currentY = currentY + (isTop ? 10 : -10); // Move towards midfield
                  } else if (i === 3) { // Right
                      x += 6; // Move wider
                      currentY = currentY + (isTop ? 10 : -10); // Move towards midfield
                  }
              }

              positions.push({ x, y: currentY });
          }
      });
      return positions;
  };

  const redPositions = getPositions(teamRed.length, true);
  const whitePositions = getPositions(teamWhite.length, false);

  return (
    <div className="w-full max-w-md mx-auto aspect-[2/3] bg-green-600 rounded-lg shadow-xl relative overflow-hidden border-4 border-white">
      <svg viewBox="0 0 100 150" className="w-full h-full">
        {/* Pitch Markings */}
        <line x1="0" y1="75" x2="100" y2="75" stroke="white" strokeWidth="1" />
        <circle cx="50" cy="75" r="10" stroke="white" strokeWidth="1" fill="none" />
        <rect x="25" y="0" width="50" height="15" stroke="white" strokeWidth="1" fill="none" />
        <rect x="25" y="135" width="50" height="15" stroke="white" strokeWidth="1" fill="none" />

        {/* Team Red */}
        {teamRed.map((player, index) => {
            const pos = redPositions[index];
            if (!pos) {return null;}
            return renderPlayer(player, pos.x, pos.y, "fill-red-600", "fill-white", "stroke-black");
        })}

        {/* Team White */}
        {teamWhite.map((player, index) => {
             const pos = whitePositions[index];
             if (!pos) {return null;}
             return renderPlayer(player, pos.x, pos.y, "fill-white", "fill-black", "stroke-white");
        })}
      </svg>
    </div>
  );
};
