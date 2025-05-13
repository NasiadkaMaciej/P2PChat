'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { interactive } from '../../utils/animation-utils';

function Button({
	children,
	onClick,
	className = "",
	type = "button",
	disabled = false,
	variant = "primary" // primary, secondary, danger, success
}) {
	const getVariantClasses = () => {
		switch (variant) {
			case "secondary":
				return "bg-gray-600 hover:bg-gray-700";
			case "danger":
				return "bg-red-600 hover:bg-red-700";
			case "success":
				return "bg-green-600 hover:bg-green-700";
			default:
				return "bg-blue-600 hover:bg-blue-700";
		}
	};

	return (
		<motion.button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`px-4 py-2 ${getVariantClasses()} text-white rounded disabled:opacity-50 ${className}`}
			{...interactive(disabled)}
		>
			{children}
		</motion.button>
	);
}

export default Button;