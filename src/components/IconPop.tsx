import React, { useEffect, useState } from 'react';
import './IconPop.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStarShooting, faStar } from '@fortawesome/pro-solid-svg-icons';


const EMOJIS = [];
const ICONS = [faStarShooting, faStar];

const IONIC_COLORS = [
    'var(--ion-color-primary)',
    'var(--ion-color-secondary)',
    'var(--ion-color-tertiary)',
];

type PopItem = {
    id: number;
    isIcon: boolean;
    value: any;
    delay: number;
    size: number;
    offsetX: number;
    offsetY: number;
    rotate: number;
    color: string;
};

export const IconPop: React.FC<{
    trigger: boolean;
    position?: 'top-right' | 'center';
    emojis?: string[];
    icons?: any[];
    intensity?: 'normal' | 'big';
    onComplete?: () => void; 
}> = ({
    trigger,
    position = 'top-right',
    emojis = EMOJIS,
    icons = ICONS,
    intensity = 'normal',
    onComplete, 
}) => {
        const [pops, setPops] = useState<PopItem[]>([]);

        useEffect(() => {
            if (!trigger) return;

            const config = {
                burstCount: intensity === 'big' ? 30 : 14,
                spread: intensity === 'big' ? 800 : 240,
                sizeMin: intensity === 'big' ? 30 : 18,
                sizeMax: intensity === 'big' ? 50 : 30,
            };

            const burst: PopItem[] = Array.from({ length: config.burstCount }).map((_, i) => {
                const isIcon = Math.random() < 0.5 && icons.length > 0;
                const value = isIcon
                    ? icons[Math.floor(Math.random() * icons.length)]
                    : emojis[Math.floor(Math.random() * emojis.length)];

                return {
                    id: i,
                    isIcon,
                    value,
                    delay: Math.random() * 0.3,
                    size: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
                    offsetX: (Math.random() - 0.5) * config.spread,
                    offsetY: (Math.random() - 0.5) * config.spread,
                    rotate: -30 + Math.random() * 60,
                    color: IONIC_COLORS[Math.floor(Math.random() * IONIC_COLORS.length)],
                };
            });

            setPops(burst);
            const timer = setTimeout(() => {
                setPops([]);
                onComplete?.(); // ✅ fire the callback
              }, 2000);
            return () => clearTimeout(timer);
        }, [trigger, emojis, icons, intensity]);


        return (
            <div className={`icon-pop-root ${position}`}>
                {pops.map(({ id, isIcon, value, delay, size, offsetX, offsetY, rotate, color }) => (
                    <span
                        key={id}
                        className="emoji-pop"
                        style={{
                            animationDelay: `${delay}s`,
                            fontSize: `${size}px`,
                            '--x': `${offsetX}px`,
                            '--y': `${offsetY}px`,
                            '--r': `${rotate}deg`,
                            color,
                        } as React.CSSProperties}
                    >
                        {isIcon ? <FontAwesomeIcon icon={value} /> : value}
                    </span>
                ))}
            </div>
        );
    };
