import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  /**
   * Copies rich text so it can be pasted into a document with its formatting,
   * falling back to plain text where `ClipboardItem` is unavailable.
   */
  async copyRichText(html: string, plainText: string): Promise<void> {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      await navigator.clipboard.writeText(plainText);
      return;
    }

    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
  }
}
