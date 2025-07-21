import express from 'express';
import cors from 'cors';
import { graph } from './src/index.js';

const app = express();
const PORT = process.env.PORT || 51497;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// LangGraph Studio/Cloud API compatibility endpoints
app.post('/assistants', (req, res) => {
  // Mock assistant creation
  res.json({ id: 'stockbroker', graphId: 'stockbroker' });
});

app.post('/threads', (req, res) => {
  // Mock thread creation
  const threadId = 'thread_' + Math.random().toString(36).substring(2);
  res.json({ id: threadId });
});

app.get('/threads/:threadId/state', (req, res) => {
  // Mock thread state
  res.json({ 
    threadId: req.params.threadId,
    state: { messages: [] }
  });
});

app.patch('/threads/:threadId/state', (req, res) => {
  // Mock state update
  res.json({ success: true });
});

// Main streaming endpoint that the frontend expects
app.post('/runs/stream', async (req, res) => {
  try {
    const { threadId, assistantId, input, config } = req.body;
    
    console.log('Received stream request:', { threadId, assistantId, input });
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Start the graph with the input messages
    const stream = await graph.stream(input);
    
    for await (const chunk of stream) {
      const chunkData = {
        type: 'chunk',
        data: chunk
      };
      res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
    }
    
    // Send end marker
    res.write(`data: {"type": "end"}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Error in stream endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fallback invoke endpoint
app.post('/invoke', async (req, res) => {
  try {
    const result = await graph.invoke(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error invoking graph:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 LangGraph server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Stream endpoint: http://localhost:${PORT}/runs/stream`);
}); 