import { inject, Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Renders markdown to HTML. The source is a user-supplied CSV, so the result
   * is run through Angular's sanitizer rather than trusted outright.
   */
  toSafeHtml(markdown: string): string {
    if (!markdown.trim()) {
      return '';
    }
    const html = marked.parse(markdown, { async: false }) as string;
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }
}
