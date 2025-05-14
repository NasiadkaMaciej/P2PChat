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

		if (!formData.name || !formData.url) {
			setError('Name and URL are required');
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

	return {
		services,
		formData,
		setFormData,
		loading,
		showForm,
		setShowForm,
		editing,
		handleFormSubmit,
		startEdit: (service) => {
			setFormData({ ...initialFormState, ...service });
			setEditing(service._id);
			setShowForm(true);
		},
		cancelEdit: () => {
			setEditing(null);
			setFormData({ ...initialFormState });
			setShowForm(false);
		},
		loadServices
	};
}