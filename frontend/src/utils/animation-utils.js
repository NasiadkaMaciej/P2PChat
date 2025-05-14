/**
 * Simplified animation presets to use with Framer Motion
 */

// Core animation types that cover most use cases
export const fadeIn = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
	transition: { duration: 0.3 }
};

// Combined slide animations with direction parameter
export const slideIn = (direction = 'up', distance = 20) => {
	const directionMap = {
		up: { y: distance },
		down: { y: -distance },
		left: { x: distance },
		right: { x: -distance }
	};

	return {
		initial: { opacity: 0, ...directionMap[direction] },
		animate: { opacity: 1, x: 0, y: 0 },
		exit: { opacity: 0, ...directionMap[direction] },
		transition: { duration: 0.3 }
	};
};

// Simple scale animation for elements that need emphasis
export const scaleIn = {
	initial: { opacity: 0, scale: 0.9 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.9 },
	transition: { duration: 0.3 }
};

// Interactive animations for buttons and clickable elements
export const interactive = (disabled = false) => disabled ? {} : {
	whileHover: { scale: 1.03 },
	whileTap: { scale: 0.97 }
};

// Status indicator animations (connection states, etc)
export const statusIndicator = {
	connecting: {
		backgroundColor: "#facc15",
		transition: { duration: 0.3 }
	},
	connected: {
		backgroundColor: "#4ade80",
		boxShadow: "0 0 10px 2px rgba(74, 222, 128, 0.5)",
		transition: { duration: 0.3 }
	},
	disconnected: {
		backgroundColor: "#9ca3af",
		transition: { duration: 0.3 }
	},
	failed: {
		backgroundColor: "#ef4444",
		boxShadow: "0 0 10px 2px rgba(239, 68, 68, 0.5)",
		transition: { duration: 0.3 }
	}
};

// Text color animation based on state
export const textColorAnimation = (colorMap, state) => ({
	animate: {
		color: colorMap[state] || colorMap.default,
		transition: { duration: 0.3 }
	}
});

// For list items that need staggered animation
export const listItem = (index = 0) => ({
	initial: { opacity: 0, y: 10 },
	animate: {
		opacity: 1,
		y: 0,
		transition: { delay: index * 0.05, duration: 0.3 }
	},
	exit: { opacity: 0, y: 10 }
});