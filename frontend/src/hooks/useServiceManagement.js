import { useConnection } from "@/context/ConnectionContext";
import { useEffect, useState, useCallback } from "react";
import { toggleSelection } from '@/services/api-service';

export function useServiceManagement({
	fetchServices,
	addService,
	editService,
	deleteService,
	serviceTypeLabel,
	initialFormState,
	endpoint
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
			setError(`Failed to load ${serviceTypeLabel.toLowerCase()}: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Optimistically update service in the local state
	const updateServiceLocally = useCallback((id, updatedData) => {
		setServices(prevServices =>
			prevServices.map(service =>
				service._id === id ? { ...service, ...updatedData } : service
			)
		);
	}, []);

	// Optimistically remove service from the local state
	const removeServiceLocally = useCallback((id) => {
		setServices(prevServices =>
			prevServices.filter(service => service._id !== id)
		);
	}, []);

	const handleFormSubmit = async (e) => {
		e.preventDefault();

		const isIceServerForm = "type" in formData;

		// Get required fields based on form type
		let requiredFields = Object.entries(formData)
			.filter(([key, _]) => initialFormState.hasOwnProperty(key))
			.filter(([key, value]) => {
				// Special handling for ICE servers
				if (isIceServerForm) {
					// For STUN servers, username and credential are not required
					if (
						formData.type === "stun" &&
						(key === "username" || key === "credential")
					) {
						return false;
					}
				}
				return !value;
			})
			.map(([key]) => key);

		if (requiredFields.length > 0) {
			setError(`${requiredFields.join(", ")} are required`);
			return;
		}

		try {
			setLoading(true);
			if (editing) {
				// Update optimistically
				updateServiceLocally(editing, formData);
				await editService(editing, formData);
			} else {
				const newService = await addService(formData);
				// Add the new service to the list without a full reload
				setServices(prev => [...prev, newService]);
			}

			setFormData({ ...initialFormState });
			setEditing(null);
			setShowForm(false);
		} catch (error) {
			setError(
				`Failed to ${editing ? "update" : "add"} ${serviceTypeLabel.toLowerCase()}: ${error.message}`
			);
			// Revert optimistic update on error
			loadServices();
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

	const handleDelete = async (id) => {
		try {
			setLoading(true);
			removeServiceLocally(id);
			await deleteService(id);
		} catch (error) {
			// If delete fails, reload the services
			setError(`Failed to delete ${serviceTypeLabel.toLowerCase()}: ${error.message}`);
			loadServices();
		} finally {
			setLoading(false);
		}
	};

	const handleSelect = async (service, callback = null) => {
		try {
			// Optimistically update the UI
			updateServiceLocally(service._id, { selected: !service.selected });

			await toggleSelection(endpoint, service._id);

			// Callback after successful selection
			if (callback && typeof callback === 'function') {
				await callback(service);
			}

			return true;
		} catch (error) {
			// If toggle fails, reload the services
			setError(`Failed to update selection: ${error.message}`);
			loadServices();
			return false;
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
		startEdit,
		cancelEdit,
		loadServices,
		handleDelete,
		handleSelect,
		updateServiceLocally
	};
}