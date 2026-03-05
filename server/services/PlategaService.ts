import axios from 'axios';

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
    this.baseUrl = 'https://app.platega.io/api'; // Assuming /api prefix
  }

  public async createPayment(req: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/payment/create`, req, {
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
      const response = await axios.get(`${this.baseUrl}/payment/status/${transactionId}`, {
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
}

export const plategaService = new PlategaService();