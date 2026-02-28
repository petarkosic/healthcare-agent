export const formatDate = (dateStr: string) => {
	return new Date(dateStr).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

export const formatDateTimeLocal = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const calculateAge = (dob: string) => {
	const diff = Date.now() - new Date(dob).getTime();
	const ageDate = new Date(diff);

	return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// Helper function to get initials from full name
export const getInitials = (name: string) => {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.substring(0, 2)
		.toUpperCase();
};

export const secondsToRoundedMinutes = (seconds: number): number => {
	const minutes = seconds / 60;

	return Math.ceil(minutes / 5) * 5;
};
