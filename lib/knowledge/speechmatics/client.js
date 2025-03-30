/**
 * Speechmatics API client for transcription
 * 
 * Based on Speechmatics documentation: https://docs.speechmatics.com/
 */

class SpeechmaticsClient {
  constructor() {
    this.apiKey = process.env.SPEECHMATICS_API_KEY;
    this.baseUrl = 'https://asr.api.speechmatics.com/v2';
  }

  /**
   * Transcribe an audio file using Speechmatics batch API
   * 
   * @param {Buffer|Blob} audioData - The audio file data
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeAudio(audioData, options = {}) {
    if (!this.apiKey) {
      throw new Error('Speechmatics API key is not configured');
    }

    // Prepare the form data
    const formData = new FormData();
    
    // Add the audio file
    if (audioData instanceof Buffer) {
      // For Node.js Buffer
      const blob = new Blob([audioData]);
      formData.append('data_file', blob, options.filename || 'audio.mp3');
    } else {
      // For browser File/Blob
      formData.append('data_file', audioData, options.filename || 'audio.mp3');
    }

    // Prepare config for transcription
    const config = {
      type: 'transcription',
      transcription_config: {
        language: options.language || 'en',
        operating_point: 'enhanced', // Use the enhanced model for better accuracy
        diarization: 'speaker' // Enable speaker diarization
      }
    };

    // Add the configuration as a JSON string
    formData.append('config', JSON.stringify(config));

    try {
      // Submit the job
      console.log('[SPEECHMATICS] Submitting transcription job');
      console.log('[SPEECHMATICS] API URL:', `${this.baseUrl}/jobs`);
      console.log('[SPEECHMATICS] Form data keys:', Array.from(formData.keys()));
      
      const submitResponse = await fetch(`${this.baseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        console.error('[SPEECHMATICS] Job submission error:', errorData);
        throw new Error(`Speechmatics job submission failed: ${errorData.detail || submitResponse.statusText}`);
      }

      const jobData = await submitResponse.json();
      const jobId = jobData.id;
      console.log(`[SPEECHMATICS] Job submitted, ID: ${jobId}`);

      // Poll for job completion
      return await this.pollForCompletion(jobId);
    } catch (error) {
      console.error('[SPEECHMATICS] Transcription error:', error);
      throw error;
    }
  }

  /**
   * Poll for job completion
   * 
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} - Transcription result
   */
  async pollForCompletion(jobId) {
    console.log(`[SPEECHMATICS] Starting polling for job: ${jobId}`);
    
    // Maximum wait time: 15 minutes
    const maxAttempts = 90; // At 10-second intervals
    const pollingInterval = 10000; // 10 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Check job status
        const statusResponse = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          console.error(`[SPEECHMATICS] Job status check error (attempt ${attempt+1}):`, errorData);
          throw new Error(`Speechmatics status check failed: ${errorData.detail || statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        console.log(`[SPEECHMATICS] Job status (attempt ${attempt+1}): ${statusData.job.status}`);

        // If job is done, get the transcript
        if (statusData.job.status === 'done') {
          return await this.getTranscript(jobId);
        }
        
        // If job failed, throw an error
        if (statusData.job.status === 'failed') {
          throw new Error(`Speechmatics job failed: ${statusData.job.failure_reason || 'Unknown reason'}`);
        }
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      } catch (error) {
        console.error(`[SPEECHMATICS] Polling error (attempt ${attempt+1}):`, error);
        // Wait before retrying after an error
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      }
    }
    
    throw new Error('Speechmatics transcription timed out after 15 minutes');
  }

  /**
   * Get the transcript for a completed job
   * 
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} - Transcription result
   */
  async getTranscript(jobId) {
    console.log(`[SPEECHMATICS] Fetching transcript for job: ${jobId}`);
    
    try {
      const transcriptResponse = await fetch(`${this.baseUrl}/jobs/${jobId}/transcript?format=json-v2`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        console.error('[SPEECHMATICS] Transcript fetch error:', errorData);
        throw new Error(`Speechmatics transcript fetch failed: ${errorData.detail || transcriptResponse.statusText}`);
      }

      const transcriptData = await transcriptResponse.json();
      console.log(`[SPEECHMATICS] Transcript fetched: ${transcriptData.results?.length || 0} results`);
      
      return transcriptData;
    } catch (error) {
      console.error('[SPEECHMATICS] Transcript fetch error:', error);
      throw error;
    }
  }

  /**
   * Format transcript into a readable text format with speakers
   * 
   * @param {Object} transcript - The transcript data from Speechmatics
   * @returns {string} - Formatted transcript
   */
  formatTranscript(transcript) {
    if (!transcript.results || transcript.results.length === 0) {
      return 'No transcript available';
    }

    let formattedText = '';
    let currentSpeaker = null;
    let currentUtterance = '';

    // Process each result
    for (const item of transcript.results) {
      if (item.type === 'word' || item.type === 'punctuation') {
        const speaker = item.alternatives[0].speaker;
        const content = item.alternatives[0].content;

        // Start a new speaker section if speaker changes
        if (speaker !== currentSpeaker && item.type === 'word') {
          // Add the previous utterance if exists
          if (currentUtterance.trim()) {
            formattedText += `${currentUtterance}\n\n`;
          }
          
          // Start new utterance with speaker
          currentSpeaker = speaker;
          currentUtterance = `Speaker ${speaker}: ${content}`;
        } else {
          // Continue current utterance
          if (item.type === 'punctuation' && item.attaches_to === 'previous') {
            currentUtterance += content;
          } else {
            currentUtterance += ` ${content}`;
          }
        }
      }
    }

    // Add the last utterance
    if (currentUtterance.trim()) {
      formattedText += `${currentUtterance}\n`;
    }

    return formattedText;
  }
}

// Export a singleton instance
const speechmaticsClient = new SpeechmaticsClient();
export default speechmaticsClient;