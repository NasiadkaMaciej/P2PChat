'use client';
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '../../context/ConnectionContext';
import {
	createOffer,
	handleOfferAndCreateAnswer,
} from '../../services/webrtc-service';
import { handleAnswer } from '@/services/signaling-service';
import CopyableText from '../ui/CopyableText';
import ConnectionStep from './ConnectionStep';
import { fadeIn } from '../../utils/animation-utils';

function OfferAnswerExchange() {
	const { connectionState, setError } = useConnection();
	const [offerToShare, setOfferToShare] = useState('');
	const [answerToShare, setAnswerToShare] = useState('');
	const [receivedOffer, setReceivedOffer] = useState('');
	const [receivedAnswer, setReceivedAnswer] = useState('');
	const [isInitiator, setIsInitiator] = useState(false);

	// Reset states when connection state changes
	React.useEffect(() => {
		if (connectionState === 'disconnected' || connectionState === 'failed') {
			resetStates();
		}
	}, [connectionState]);

	const resetStates = () => {
		setOfferToShare('');
		setAnswerToShare('');
		setReceivedOffer('');
		setReceivedAnswer('');
		setIsInitiator(false);
	};

	// Create offer as connection initiator
	const handleCreateOffer = useCallback(async () => {
		setError('');
		setOfferToShare('');
		setAnswerToShare('');
		setIsInitiator(true);

		try {
			setOfferToShare(await createOffer());
		} catch (err) {
			console.error(err);
			setError(`Failed to create offer: ${err.message}`);
			setIsInitiator(false);
		}
	}, [setError]);

	// Handle received offer and create answer
	const handleUseOffer = useCallback(async () => {
		if (!receivedOffer.trim()) {
			setError('Please paste the received offer first.');
			return;
		}

		setError('');
		resetStates();

		try {
			const answer = await handleOfferAndCreateAnswer(receivedOffer);
			setAnswerToShare(answer);
		} catch (err) {
			console.error(err);
			setError(`Failed to handle offer/create answer: ${err.message}`);
		}
	}, [receivedOffer, setError]);

	// Use received answer to complete connection
	const handleUseAnswer = useCallback(async () => {
		if (!receivedAnswer.trim()) {
			setError('Please paste the received answer first.');
			return;
		}

		setError('');
		try {
			await handleAnswer(receivedAnswer);
			setReceivedAnswer('');
		} catch (err) {
			console.error(err);
			setError(`Failed to handle answer: ${err.message}`);
		}
	}, [receivedAnswer, setError]);

	if (connectionState !== 'disconnected' && connectionState !== 'connecting' && connectionState !== 'failed') {
		return null;
	}

	return (
		<motion.div
			className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
			{...fadeIn}
		>
			<div className="p-4 border-b border-gray-700 bg-gray-800">
				<h3 className="text-xl font-medium text-white">
					Connection Manager
				</h3>
			</div>

			<div className="p-4">
				{/* Step 1: Create Offer */}
				{!offerToShare && !answerToShare && (
					<ConnectionStep
						stepNumber={1}
						buttonText="Create Connection Offer"
						onClick={handleCreateOffer}
					/>
				)}

				{/* Show generated offer */}
				{offerToShare && (
					<CopyableText
						value={offerToShare}
						label="Copy and send this offer to your peer:"
						buttonText="Copy Offer"
						highlightColor="blue"
					/>
				)}

				{/* Step 2: Use Received Offer */}
				{!offerToShare && !answerToShare && (
					<>
						<hr className="my-4 border-gray-700" />
						<ConnectionStep
							stepNumber={2}
							title="Or, if you received an offer, paste it here:"
							buttonText="Use Offer & Create Answer"
							onClick={handleUseOffer}
							disabled={!receivedOffer.trim()}
							inputValue={receivedOffer}
							setInputValue={setReceivedOffer}
							showInput={true}
							placeholder="Paste received offer here..."
						/>
					</>
				)}

				{/* Show generated answer */}
				{answerToShare && (
					<CopyableText
						value={answerToShare}
						label="Copy and send this answer back to the initiating peer:"
						buttonText="Copy Answer"
						highlightColor="green"
					/>
				)}

				{/* Step 3: Use Received Answer */}
				{isInitiator && offerToShare && (
					<ConnectionStep
						stepNumber={3}
						title="Paste answer received from peer:"
						buttonText="Use Answer"
						onClick={handleUseAnswer}
						disabled={!receivedAnswer.trim()}
						inputValue={receivedAnswer}
						setInputValue={setReceivedAnswer}
						showInput={true}
						placeholder="Paste received answer here..."
					/>
				)}
			</div>
		</motion.div>
	);
}

export default OfferAnswerExchange;