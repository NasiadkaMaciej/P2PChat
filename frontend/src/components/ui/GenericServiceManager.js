import React from 'react';
import { useServiceManagement } from '@/hooks/useServiceManagement';
import ServiceForm from './ServiceForm';
import ServiceManager from './ServiceManager';
import ServiceItem from './ServiceItem';

export default function GenericServiceManager({
	title,
	serviceTypeLabel,
	endpoint,
	initialFormState,
	fetchServices,
	addService,
	editService,
	deleteService,
	onConnect,
	onSelect,
	formFields,
	additionalContent,
	connected,
	connecting,
	connectedId,
	isSelected,
	helpContent,
	enableSelection = false,
}) {
	const {
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
	} = useServiceManagement({
		fetchServices,
		addService,
		editService,
		deleteService,
		serviceTypeLabel,
		initialFormState,
		endpoint
	});

	const renderForm = () => (
		<ServiceForm
			formData={formData}
			onChange={setFormData}
			onSubmit={handleFormSubmit}
			onCancel={cancelEdit}
			fields={formFields}
			isEditing={!!editing}
			isLoading={loading}
			title={serviceTypeLabel}
		/>
	);

	const handleServiceSelect = async (service) => {
		return handleSelect(service, onSelect);
	};

	const renderServiceItem = (service) => (
		<ServiceItem
			key={service._id}
			service={service}
			onConnect={onConnect ? () => onConnect(service) : undefined}
			onEdit={() => startEdit(service)}
			onDelete={() => handleDelete(service._id)}
			onSelect={enableSelection && (onSelect || endpoint) ? () => handleServiceSelect(service) : undefined}
			connecting={connecting && connectedId === service._id}
			connected={connected === service._id}
			selected={isSelected ? isSelected(service) : service.selected}
		/>
	);

	return (
		<>
			<ServiceManager
				title={title}
				helpContent={helpContent}
				services={services}
				loading={loading}
				showAddForm={showForm}
				formValues={{ editing: !!editing }}
				onAdd={() => {
					setShowForm(true);
					setFormData(initialFormState);
				}}
				onCancelEdit={cancelEdit}
				renderForm={renderForm}
				renderServiceItem={renderServiceItem}
			/>
			{additionalContent}
		</>
	);
}