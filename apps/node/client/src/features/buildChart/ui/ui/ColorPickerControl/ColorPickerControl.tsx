import { Pipette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

import { isChartColor, normalizeChartColor } from '@/entities/chart';

import styles from './ColorPickerControl.module.scss';

type ColorPickerControlProps = {
    value: string;
    onChange: (value: string) => void;
};

export const ColorPickerControl = ({ value, onChange }: ColorPickerControlProps) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const color = normalizeChartColor(value);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={rootRef} className={styles['root']} data-stack="v" data-gap="xs">
            <span className={styles['label']}>Color</span>
            <button
                type="button"
                className={styles['trigger']}
                aria-label="Choose chart color"
                aria-expanded={open}
                onClick={() => setOpen(current => !current)}
            >
                <span
                    className={styles['swatch']}
                    style={{ backgroundColor: color }}
                    aria-hidden
                />
                <span>{color}</span>
                <Pipette size={18} aria-hidden />
            </button>

            {open && (
                <div className={styles['popover']} data-stack="v" data-gap="sm">
                    <HexColorPicker
                        className={styles['picker']}
                        color={color}
                        onChange={onChange}
                    />
                    <label className={styles['hex-input']} data-stack="v" data-gap="xs">
                        <span>Hex</span>
                        <HexColorInput
                            prefixed
                            color={color}
                            onChange={next => {
                                const candidate = next.startsWith('#')
                                    ? next
                                    : `#${next}`;
                                if (isChartColor(candidate)) {
                                    onChange(candidate.toLowerCase());
                                }
                            }}
                        />
                    </label>
                </div>
            )}
        </div>
    );
};
