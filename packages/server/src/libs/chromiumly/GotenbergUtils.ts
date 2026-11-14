import * as FormData from 'form-data';
import { Axios } from 'axios';

export class GotenbergUtils {
  public static assert(condition: boolean, message: string): asserts condition {
    if (!condition) {
      throw new Error(message);
    }
  }

  public static async fetch(endpoint: string, data: FormData): Promise<Buffer> {
    const response = await new Axios({
      headers: {
        ...data.getHeaders(),
      },
      timeout: 5000,
      responseType: 'arraybuffer',
    }).post(endpoint, data);

    if (response.status >= 400 || !response.data) {
      throw new Error(`Gotenberg returned HTTP ${response.status}`);
    }
    const buf = Buffer.isBuffer(response.data)
      ? response.data
      : Buffer.from(response.data);
    if (buf.length < 4 || buf.subarray(0, 4).toString('utf8') !== '%PDF') {
      throw new Error('Gotenberg response was not a valid PDF');
    }
    return buf;
  }
}
