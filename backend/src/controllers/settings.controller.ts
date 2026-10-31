import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';

export class SettingsController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.updateSettings(req.body);
      res.json({ success: true, data: settings, message: 'Business settings updated.' });
    } catch (err) {
      next(err);
    }
  }
}
