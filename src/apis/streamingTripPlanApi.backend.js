/**
 * Streaming Trip Plan API Module (Secure Backend Version)
 * Handles trip plan generation via secure backend streaming endpoint
 * Uses Server-Sent Events to receive streamed responses
 */

/**
 * Generate a trip plan using streaming for real-time updates via secure backend
 * @param {Object} data - Collected trip data
 * @param {Object} data.weather - Weather data
 * @param {Object} data.flights - Flight data
 * @param {Object} data.hotels - Hotel data
 * @param {Object} data.tripData - Original trip form data
 * @param {Function} onUpdate - Callback for partial updates
 * @returns {Promise<Object>} Generated trip plan
 */
export async function generateTripPlanStreaming(data, onUpdate) {
    try {
        console.log('Generating trip plan with streaming via secure backend...');

        const { weather, flights, hotels, tripData } = data;

        // ✅ NO API KEY in frontend code - calling secure backend
        const response = await fetch('/api/trip-plan-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                weather,
                flights,
                hotels,
                tripData
            })
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        // Check if response is Server-Sent Events
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/event-stream')) {
            throw new Error('Expected SSE stream but received: ' + contentType);
        }

        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let finalResult = null;

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages (separated by \n\n)
            const messages = buffer.split('\n\n');
            buffer = messages.pop() || ''; // Keep incomplete message in buffer

            for (const message of messages) {
                if (!message.trim() || !message.startsWith('data: ')) {
                    continue;
                }

                // Extract JSON data from SSE message
                const jsonStr = message.substring(6); // Remove 'data: ' prefix

                try {
                    const event = JSON.parse(jsonStr);

                    if (event.type === 'chunk') {
                        // Accumulate text chunks
                        fullText += event.content;

                        // Try to parse partial JSON and send updates
                        if (onUpdate && typeof onUpdate === 'function') {
                            const partialData = tryParsePartialJSON(fullText);
                            onUpdate({
                                streaming: true,
                                partialLength: fullText.length,
                                partialData: partialData
                            });
                        }
                    } else if (event.type === 'complete') {
                        // Received complete result
                        finalResult = event.data;
                        console.log('Successfully received complete trip plan via streaming');
                    } else if (event.type === 'error') {
                        throw new Error(event.error || 'Streaming error');
                    }
                } catch (parseError) {
                    console.warn('Failed to parse SSE event:', parseError);
                }
            }
        }

        if (!finalResult) {
            throw new Error('Stream ended without complete result');
        }

        return finalResult;

    } catch (error) {
        console.error('Error generating trip plan with streaming:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

/**
 * Try to parse partial JSON from streaming response
 * Attempts to extract complete objects as they become available
 * @param {string} text - Partial JSON text
 * @returns {Object|null} Parsed partial data or null
 */
function tryParsePartialJSON(text) {
    try {
        // Remove markdown code blocks if present
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Try to find valid JSON by looking for opening brace and attempting parse
        if (!jsonText.startsWith('{')) {
            const braceIndex = jsonText.indexOf('{');
            if (braceIndex === -1) return null;
            jsonText = jsonText.substring(braceIndex);
        }

        // Attempt to parse as-is first
        try {
            return JSON.parse(jsonText);
        } catch {
            // If it fails, try to close incomplete objects/arrays
            // Look for complete sections (summary, destination, selectedFlight, etc.)
            const partial = {};

            // Extract summary if complete
            const summaryMatch = jsonText.match(/"summary"\s*:\s*"([^"]+)"/);
            if (summaryMatch) {
                partial.summary = summaryMatch[1];
            }

            // Extract destination if complete
            const destMatch = jsonText.match(/"destination"\s*:\s*"([^"]+)"/);
            if (destMatch) {
                partial.destination = destMatch[1];
            }

            // Extract trip duration if complete
            const durationMatch = jsonText.match(/"tripDuration"\s*:\s*(\d+)/);
            if (durationMatch) {
                partial.tripDuration = parseInt(durationMatch[1], 10);
            }

            // Extract selected flight if section is complete
            const flightMatch = jsonText.match(/"selectedFlight"\s*:\s*(\{[^}]*\})/);
            if (flightMatch) {
                try {
                    partial.selectedFlight = JSON.parse(flightMatch[1]);
                } catch {
                    // Incomplete flight object
                }
            }

            // Extract selected hotel if section is complete
            const hotelMatch = jsonText.match(/"selectedHotel"\s*:\s*(\{[^}]*\})/);
            if (hotelMatch) {
                try {
                    partial.selectedHotel = JSON.parse(hotelMatch[1]);
                } catch {
                    // Incomplete hotel object
                }
            }

            // Extract daily itinerary items if available
            if (jsonText.includes('"dailyItinerary"')) {
                // Try to extract complete day objects
                const dayMatches = jsonText.match(/"day"\s*:\s*\d+[^}]*\}/g);
                if (dayMatches && dayMatches.length > 0) {
                    partial.dailyItineraryCount = dayMatches.length;
                }
            }

            // Only return if we have at least one field
            return Object.keys(partial).length > 0 ? partial : null;
        }
    } catch {
        return null;
    }
}
