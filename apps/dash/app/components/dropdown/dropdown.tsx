import React from 'react';
import './dropdown.css';

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    variant?: '1';
    error?: boolean;
    width?: React.CSSProperties['width'];
}

export const Dropdown: React.FC<DropdownProps> = ({
    variant = '1',
    error = false,
    className,
    width,
    style,
    children,
    ...rest
}) => {
    const classes = [variant === '1' ? 'dropdown1' : '', error && 'error', className].filter(Boolean).join(' ');
    return (
        <select className={classes} style={{ ...style, width }} {...rest}>
            {children}
        </select>
    );
};
