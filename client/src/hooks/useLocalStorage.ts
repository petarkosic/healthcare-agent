import { useState } from 'react';

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
): [T, (value: T | null) => void] {
	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			const raw = localStorage.getItem(key);
			return raw ? (JSON.parse(raw) as T) : initialValue;
		} catch {
			return initialValue;
		}
	});

	const setValue = (value: T | null) => {
		if (value === null) {
			localStorage.removeItem(key);
			setStoredValue(initialValue);
		} else {
			localStorage.setItem(key, JSON.stringify(value));
			setStoredValue(value);
		}
	};

	return [storedValue, setValue];
}
