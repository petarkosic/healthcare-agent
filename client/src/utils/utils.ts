export const formatDate = (dateStr: string) => {
	return new Date(dateStr).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
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
