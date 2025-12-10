import { Injectable } from '@nestjs/common';
import { Readable } from 'node:stream';

@Injectable()
export class MessagesService {
  async generateStream(content: string): Promise<Readable> {
    const words = content.split(' ');
    let index = 0;

    return new Readable({
      async read() {
        if (index >= words.length) {
          this.push(null);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.push(words[index] + ' ');
        index++;
      }
    })
  }
}
