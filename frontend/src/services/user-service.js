"use client";

// Default username with random number
let myName = "User_" + Math.floor(Math.random() * 1000);

/**
 * Get current username
 */
export function useUserName() {
	return myName;
}

/**
 * Update username
 */
export function updateUserName(name) {
	myName = name;
	if (typeof window !== 'undefined') {
		window.localStorage.setItem('userName', name);
	}
}

/**
 * Initialize username from localStorage if available
 */
export function initializeUsername() {
	if (typeof window !== 'undefined') {
		const savedName = window.localStorage.getItem('userName');
		if (savedName) {
			myName = savedName;
		}
	}
	return myName;
}