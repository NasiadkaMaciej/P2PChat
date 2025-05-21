'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import { fadeIn } from '@/utils/animation-utils';

/**
 * Reusable component for managing services (ICE servers or DHT services)
 */
export default function ServiceManager({
	title,
	services,
	loading,
	showAddForm,
	onAdd,
	onCancelEdit,
	renderForm,
	renderServiceItem,
}) {
	return (
		<motion.div
			className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4"
			{...fadeIn}
		>
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-medium text-white">{title}</h3>
				{!showAddForm ? (
					<Button onClick={onAdd} variant="primary" size="sm">
						Add {title.slice(0, -1)} {/* Remove the 's' from title */}
					</Button>
				) : (
					<Button onClick={onCancelEdit} variant="secondary" size="sm">
						Cancel
					</Button>
				)}
			</div>

			{showAddForm && (
				<>
					{/* Custom form fields */}
					{renderForm && renderForm()}

				</>
			)}

			{loading && !showAddForm ? (
				<div className="text-center py-4">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
				</div>
			) : (
				<div className="space-y-3">
					{services.length === 0 ? (
						<p className="text-gray-400 text-sm">No {title.toLowerCase()} found. Add one to get started.</p>
					) : (
						<>
							<div className="text-sm text-gray-400 mb-2">
								{services.length} {services.length === 1 ? title.slice(0, -1).toLowerCase() : title.toLowerCase()} available
							</div>

							{
								Array.isArray(services) ? services.map(service => (
									<React.Fragment key={service.url}>
										{renderServiceItem(service)}
									</React.Fragment>
								)) : <div>No services available</div>
							}
						</>
					)}
				</div>
			)
			}
		</motion.div >
	);
}