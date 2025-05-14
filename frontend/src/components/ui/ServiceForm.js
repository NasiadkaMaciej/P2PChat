// components/ui/ServiceForm.js
import React from 'react';
import Button from './Button';

function ServiceForm({ formData, onChange, onSubmit, onCancel, fields, isEditing, isLoading, title }) {
	return (
		<div className="p-4 bg-gray-800/70 border border-gray-700 rounded-md">
			<h3 className="text-lg font-medium text-white mb-4">
				{isEditing ? `Edit ${title}` : `Add New ${title}`}
			</h3>

			<form onSubmit={onSubmit} className="space-y-3">
				{fields.map((field) => {
					// Skip rendering if this is a conditional field that shouldn't be shown
					if (field.condition && !field.condition(formData)) {
						return null;
					}

					return (
						<div key={field.name}>
							<label className="block text-sm text-gray-300 mb-1">{field.label}</label>
							{field.type === 'select' ? (
								<select
									value={formData[field.name] || ''}
									onChange={(e) => onChange({ ...formData, [field.name]: e.target.value })}
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
								>
									{field.options.map(opt => (
										<option key={opt.value} value={opt.value}>{opt.label}</option>
									))}
								</select>
							) : (
								<input
									type={field.type || 'text'}
									value={formData[field.name] || ''}
									onChange={(e) => onChange({ ...formData, [field.name]: e.target.value })}
									className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
									placeholder={field.placeholder}
								/>
							)}
						</div>
					);
				})}

				<div className="flex justify-end gap-2 mt-4">
					<Button type="button" onClick={onCancel} variant="secondary" size="sm">
						Cancel
					</Button>
					<Button type="submit" variant="primary" size="sm" disabled={isLoading}>
						{isLoading ? 'Processing...' : isEditing ? 'Update' : 'Add'}
					</Button>
				</div>
			</form>
		</div>
	);
}

export default ServiceForm;