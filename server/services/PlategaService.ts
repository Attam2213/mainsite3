import axios from 'axios';
import * as crypto from 'crypto';

interface PaymentDetails {
  amount: number;
  currency: string;
}

interface CreatePaymentRequest {
  paymentMethod: number; // 2 = SBP, 10 = Cards
  paymentDetails: PaymentDetails;
  description: string;
  return: string; // Success URL
  failedUrl: string; // Fail URL
  payload?: string; // Custom data (order ID)
}

interface CreatePaymentResponse {
  success: boolean;
  data?: {
    url: string;
    transactionId: string;
  };
  error?: string;
}

export class PlategaService {
  private merchantId: string;
  private secret: string;
  private baseUrl: string;

  constructor() {
    this.merchantId = process.env.PLATEGA_MERCHANT_ID || '';
    this.secret = process.env.PLATEGA_SECRET || '';
    this.baseUrl = 'https://app.platega.io'; 
  }

  public async createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/transaction/process`, req, {
        headers: {
          'X-MerchantId': this.merchantId,
          'X-Secret': this.secret,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.redirect) {
        return {
          success: true,
          data: {
            url: response.data.redirect,
            transactionId: response.data.transactionId || response.data.id
          }
        };
      }

      return { success: false, error: 'No redirect URL in response' };
    } catch (error: any) {
      console.error('Platega create payment error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Payment creation failed' 
      };
    }
  }

  public async checkStatus(transactionId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/transaction/status/${transactionId}`, {
        headers: {
          'X-MerchantId': this.merchantId,
          'X-Secret': this.secret
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Platega check status error:', error.response?.data || error.message);
      return null;
    }
  }

  public verifyWebhookSignature(rawBody: string | Buffer, signatureHeader?: string | string[]): boolean {
    if (!signatureHeader) return false;
    const sig = Array.isArray(signatureHeader) ? signatureHeader[0] : String(signatureHeader);
    if (!sig || !this.secret) return false;
    try {
      const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));
      const expected = crypto
        .createHmac('sha256', this.secret)
        .update(bodyBuf)
        .digest('hex')
        .toLowerCase();
      return expected === sig.trim().toLowerCase();
    } catch (e) {
      console.error('Platega verifyWebhookSignature error:', e);
      return false;
    }
  }
}

export const plategaService = new PlategaService();