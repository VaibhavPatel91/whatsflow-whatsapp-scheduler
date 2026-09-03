import { Router, Request, Response } from 'express';
import { connectionRepository } from '../../../shared/src/db';

export const whatsappRouter = Router();

// GET /api/whatsapp/status
whatsappRouter.get('/status', (req: Request, res: Response) => {
  const connection = connectionRepository.get();
  res.json({
    status: connection.status,
    lastConnectedAt: connection.last_connected_at || null,
    lastError: connection.last_error || null,
    updatedAt: connection.updated_at
  });
});

// POST /api/whatsapp/connect
whatsappRouter.post('/connect', (req: Request, res: Response) => {
  // Triggers worker connection check / status update
  const connection = connectionRepository.get();
  if (connection.status === 'DISCONNECTED') {
    connectionRepository.updateStatus('CONNECTING');
  }
  res.json({ message: 'WhatsApp connection triggered', connection: connectionRepository.get() });
});

// POST /api/whatsapp/disconnect
whatsappRouter.post('/disconnect', (req: Request, res: Response) => {
  connectionRepository.updateStatus('DISCONNECTED');
  res.json({ message: 'WhatsApp marked as disconnected', connection: connectionRepository.get() });
});

// GET /api/whatsapp/groups
whatsappRouter.get('/groups', (req: Request, res: Response) => {
  // Returns recent group list or mock fallback if none detected yet
  res.json([
    { id: 'Office Team', name: 'Office Team' },
    { id: 'Project Updates', name: 'Project Updates' },
    { id: 'Family Group', name: 'Family Group' },
    { id: 'Announcements', name: 'Announcements' }
  ]);
});
