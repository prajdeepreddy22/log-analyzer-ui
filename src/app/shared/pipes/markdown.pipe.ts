import {
  Pipe,
  PipeTransform,
  inject
} from '@angular/core';

import {
  DomSanitizer,
  SafeHtml
} from '@angular/platform-browser';

import DOMPurify from 'dompurify';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe
  implements PipeTransform {

  private readonly sanitizer =
    inject(DomSanitizer);

  transform(
    value: string | null | undefined
  ): SafeHtml {

    const markdown =
      this.normalizeMarkdown(
        value || ''
      );

    const html =
      marked.parse(
        markdown,
        {
          async: false,
          breaks: true,
          gfm: true
        }
      ) as string;

    const clean =
      DOMPurify.sanitize(html);

    return this.sanitizer
      .bypassSecurityTrustHtml(clean);
  }

  private normalizeMarkdown(
    value: string
  ): string {

    return value
      .replace(/\r\n/g, '\n')
      .replace(
        /([.!?])(?=\d+\.[A-Z])/g,
        '$1\n\n'
      )
      .replace(
        /^(\s*)(\d+)\.(?=\S)/gm,
        '$1$2. '
      )
      .replace(
        /^(\s*)[-*](?=\S)/gm,
        '$1- '
      );
  }
}
