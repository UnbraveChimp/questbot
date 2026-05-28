import React from 'react';
import './button.css';
interface ButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    variant?: '1' | '2' ;
    children?: React.ReactNode;
    [x: string]: any;
}

export const Button: React.FC<ButtonProps> = ({
    onClick,
    disabled = false,
    variant = '1',
    children,
    ...rest
}) => {
    if (variant === '1') {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={'button1 flex flex-row'}
                {...rest}
            >
                {children}
            </button>
        );
    } else if (variant === '2') {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className='button2 flex flex-row'
                {...rest}
            >
                {children}
            </button>
        );
    }
    return null;
};