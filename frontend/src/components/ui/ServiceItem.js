import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animation-utils';
import Button from './Button';

export default function ServiceItem({
	service,
	onConnect,
	onSelect,
	onEdit,
	onDelete,
	connecting,
	connected,
	selected,
	showTypeLabel = false,
	customLabels = []
}) {
	return (
		<motion.div
			className={`p-3 rounded-md border ${selected || connected
				? 'border-green-500 bg-gray-800/80'
				: 'border-gray-700 bg-gray-800/50'
				}`}
			{...fadeIn}
		>
			<div className="flex justify-between items-center">
				<div>
					<div className="flex items-center gap-2">
						<h4 className="font-medium text-white">{service.name}</h4>
						{showTypeLabel && service.type && (
							<span className={`text-xs px-2 py-1 rounded ${service.type === 'stun'
								? 'bg-blue-900/50 text-blue-200'
								: 'bg-purple-900/50 text-purple-200'
								}`}>
								{service.type.toUpperCase()}
							</span>
						)}
						{service.isDefault && (
							<span className="text-xs px-2 py-1 rounded bg-gray-600/50 text-gray-300">
								Default
							</span>
						)}
						{selected && (
							<span className="text-xs px-2 py-1 rounded bg-green-900/50 text-green-200">
								Selected
							</span>
						)}
						{customLabels.map((label, index) => (
							<span key={index} className={`text-xs px-2 py-1 rounded ${label.bgColor} ${label.textColor}`}>
								{label.text}
							</span>
						))}
					</div>
					<p className="text-sm text-gray-400">{service.url}</p>
					{service.type === 'turn' && service.username && (
						<p className="text-xs text-gray-500 mt-1">
							Username: {service.username}
						</p>
					)}
				</div>
				<div className="flex gap-2">
					{onConnect && (
						<Button
							onClick={onConnect}
							variant={connected ? "secondary" : "primary"}
							size="xs"
							disabled={connected || connecting}
						>
							{connecting ? 'Connecting...' : (connected ? 'Connected' : 'Connect')}
						</Button>
					)}
					{onSelect && (
						<Button
							onClick={onSelect}
							variant={selected ? "secondary" : "primary"}
							size="xs"
							disabled={selected}
						>
							{selected ? 'Selected' : 'Select'}
						</Button>
					)}
					{!service.isDefault && (
						<>
							<Button onClick={onEdit} variant="secondary" size="xs">
								Edit
							</Button>
							<Button onClick={onDelete} variant="danger" size="xs">
								Delete
							</Button>
						</>
					)}
				</div>
			</div>
		</motion.div>
	);
}