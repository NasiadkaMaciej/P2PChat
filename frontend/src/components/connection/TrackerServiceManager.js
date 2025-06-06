'use client';
import React from 'react';
import GenericServiceManager from '../ui/GenericServiceManager';
import { trackerServiceConfig } from '@/services/service-configs';

function TrackerServiceManager() {
	return <GenericServiceManager {...trackerServiceConfig} />;
}

export default TrackerServiceManager;