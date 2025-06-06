'use client';
import React from 'react';
import GenericServiceManager from '../ui/GenericServiceManager';
import { iceServerConfig } from '@/services/service-configs';

function IceServerManager() {
	return <GenericServiceManager {...iceServerConfig} />;
}

export default IceServerManager;