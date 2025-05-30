import React from 'react';
import { useServiceManagement } from '@/hooks/useServiceManagement';
import ServiceForm from './ServiceForm';
import ServiceManager from './ServiceManager';
import ServiceItem from './ServiceItem';

export default function GenericServiceManager({
	title,
	serviceTypeLabel,
	initialFormState,
	fetchServices,
	addService,
	editService,
	deleteService,
	onConnect,
	onSelect,
	showTypeLabel,
	formFields,
	additionalContent,
	connected,
	connecting,
	connectedId,
	isSelected,
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
		loadServices
	} = useServiceManagement({
		fetchServices,
		addService,
		editService,
		deleteService,
		serviceTypeLabel,
		initialFormState
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

	const renderServiceItem = (service) => (
		<ServiceItem
			service={service}
			onConnect={onConnect ? () => onConnect(service) : undefined}
			onEdit={() => startEdit(service)}
			onDelete={async () => {
				try {
					await deleteService(service._id);
					loadServices();
				} catch (error) {
					console.error(`Failed to delete: ${error.message}`);
				}
			}}
			onSelect={onSelect ? () => onSelect(service) : undefined}
			connecting={connecting && connectedId === service._id}
			connected={connected === service._id}
			selected={isSelected ? isSelected(service) : service.selected}
			showTypeLabel={showTypeLabel}
		/>
	);

	return (
		<>
			<ServiceManager
				title={title}
				services={services}
				loading={loading}
				showAddForm={showForm}
				formValues={{ editing: !!editing }}
				onAdd={() => {
					setShowForm(true);
					setFormData(initialFormState);
				}}
				onCancelEdit={cancelEdit}
				onFormSubmit={handleFormSubmit}
				renderForm={renderForm}
				renderServiceItem={renderServiceItem}
			/>
			{additionalContent}
		</>
	);
}