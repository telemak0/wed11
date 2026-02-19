import { render, screen, fireEvent } from '../setup';
import { describe, it, expect, vi } from 'vitest';
import { PitchView } from '../../src/components/ui/PitchView';
import { Player } from '../../src/types';
import { Timestamp } from 'firebase/firestore'; 

// Mock Timestamp for test objects
const mockTimestamp = { seconds: 0, nanoseconds: 0 } as Timestamp;

describe('PitchView', () => {
    const mockRedTeam: Player[] = [
        { id: 'r1', name: 'Red 1', createdAt: mockTimestamp },
        { id: 'r2', name: 'Red 2', createdAt: mockTimestamp },
        { id: 'r3', name: 'Red 3', createdAt: mockTimestamp },
    ];
    const mockWhiteTeam: Player[] = [
        { id: 'w1', name: 'White 1', createdAt: mockTimestamp },
    ];

    it('renders players on the pitch', () => {
        render(
            <PitchView 
                teamRed={mockRedTeam} 
                teamWhite={mockWhiteTeam} 
                onRemovePlayer={vi.fn()} 
            />
        );

        expect(screen.getByText('Red 1')).toBeInTheDocument();
        expect(screen.getByText('Red 2')).toBeInTheDocument();
        expect(screen.getByText('Red 3')).toBeInTheDocument();
        expect(screen.getByText('White 1')).toBeInTheDocument();
    });

    it('calls onRemovePlayer when a player is clicked', () => {
        const handleRemove = vi.fn();
        render(
            <PitchView 
                teamRed={mockRedTeam} 
                teamWhite={[]} 
                onRemovePlayer={handleRemove} 
            />
        );

        const playerNode = screen.getByText('Red 1');
        fireEvent.click(playerNode);

        expect(handleRemove).toHaveBeenCalledWith('r1');
    });

    it('renders correct number of nodes', () => {
        const { container } = render(
            <PitchView 
                teamRed={mockRedTeam} 
                teamWhite={mockWhiteTeam} 
                onRemovePlayer={vi.fn()} 
            />
        );

        // 3 Red players + 1 White Player = 4 Circles
        const circles = container.querySelectorAll('circle');
        // SVG pitch has markings (center circle) so we count player circles specifically if possible, 
        // or we check texts. Text elements are safer.
        const texts = container.querySelectorAll('text');
        expect(texts).toHaveLength(4);
    });
});
