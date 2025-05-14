import { useState, useEffect } from 'react';
import { useConnection } from '@/context/ConnectionContext';

export function useServiceManagement({
	fetchServices,
	addService,
	editService,
	deleteService,
	serviceTypeLabel,
	initialFormState
}) {
	const { setError } = useConnection();
	const [services, setServices] = useState([]);
	const [editing, setEditing] = useState(null);
	const [formData, setFormData] = useState(initialFormState);
	const [loading, setLoading] = useState(false);
	const [showForm, setShowForm] = useState(false);

	// Load services on component mount
	useEffect(() => {
		loadServices();
	}, []);

	const loadServices = async () => {
		try {
			setLoading(true);
			const loadedServices = await fetchServices();
			setServices(loadedServices);
		} catch (error) {
			setError(`Failed to load ${serviceTypeLabel}: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleFormSubmit = async (e) => {
		e.preventDefault();

		const requiredFields = Object.entries(formData)
			.filter(([key, _]) => initialFormState.hasOwnProperty(key))
			.filter(([_, value]) => !value);

		if (requiredFields.length > 0) {
			setError(`${requiredFields.map(([key]) => key).join(', ')} are required`);
			return;
		}

		try {
			setLoading(true);
			await (editing ? editService(editing, formData) : addService(formData));
			setFormData({ ...initialFormState });
			setEditing(null);
			setShowForm(false);
			loadServices();
		} catch (error) {
			setError(`Failed to ${editing ? 'update' : 'add'} ${serviceTypeLabel}: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	const startEdit = (service) => {
		setFormData({ ...initialFormState, ...service });
		setEditing(service._id);
		setShowForm(true);
	};

	const cancelEdit = () => {
		setEditing(null);
		setFormData({ ...initialFormState });
		setShowForm(false);
	};

	return {
		services,
		formData,
		setFormData,
		loading,
		showForm,
		setShowForm,
		editing,
		handleFormSubmit,
		startEdit,
		cancelEdit,
		loadServices
	};
}