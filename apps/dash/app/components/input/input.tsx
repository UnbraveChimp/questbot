import type React from 'react';
import './input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	variant?: '1';
	error?: boolean;
	width?: React.CSSProperties['width'];
}

export const Input: React.FC<InputProps> = ({ variant = '1', error = false, className, width, style, ...rest }) => {
	const variantClass = variant === '1' ? 'input1' : '';
	const classes = [variantClass, error && 'error', className].filter(Boolean).join(' ');

	return <input className={classes} style={{ ...style, width }} {...rest} />;
};
