import { useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';

export function useAsyncAction() {
	const [loading, setLoading] = useState(false);
	const { setError } = useConnection();

	const execute = async (action, actionName, successCallback = null) => {
		try {
			setLoading(true);
			const result = await action();
			if (successCallback) successCallback(result);
			return result;
		} catch (error) {
			setError(`Failed to ${actionName}: ${error.message}`);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	return {
		loading,
		execute
	};
}