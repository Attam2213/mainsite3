
import axios from 'axios';
import { DomainRegistrar } from './DomainRegistrar';

interface WebnamesConfig {
  username: string;
  password?: string; // Optional if using API key, though docs mention user/pass
  apiKey?: string;   // Some docs mention API Key
  testMode?: boolean;
}

export class WebnamesRegistrar implements DomainRegistrar {
  private config: WebnamesConfig;
  private baseUrl: string;

  constructor(config: WebnamesConfig) {
    this.config = config;
    this.baseUrl = 'https://www.webnames.ru:81/RegTimeSRS.pl';
  }

  async checkAvailability(domain: string): Promise<boolean> {
    try {
      // Documentation says: send a POST request with parameters
      // We'll need to adjust exact parameters based on full docs
      const params = new URLSearchParams();
      params.append('username', this.config.username);
      params.append('password', this.config.password || '');
      params.append('thisPage', 'pispCheckDomain'); // Assumed operation based on naming convention
      params.append('domain', domain);

      const response = await axios.post(this.baseUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Parse response - Webnames usually returns plain text or simple XML-like structure
      // For now, assuming success if response contains "Available" or code 1
      // This is a placeholder logic
      console.log('Webnames check response:', response.data);
      
      // In a real implementation, we would parse the response properly
      return true; 
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return false;
    }
  }

  async registerDomain(domain: string, ownerDetails: any): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('username', this.config.username);
      params.append('password', this.config.password || '');
      params.append('thisPage', 'pispRegistration');
      params.append('domain_name', domain);
      params.append('period', '1'); // 1 year
      
      // Add owner details (simplified mapping)
      // Real API requires many fields: phone, email, passport, address, etc.
      params.append('phone', ownerDetails.phone);
      params.append('email', ownerDetails.email);
      params.append('p_addr', ownerDetails.address);
      
      // Add DNS servers (our nameservers)
      params.append('nserver1', 'ns1.nameself.com'); // Example from docs
      params.append('nserver2', 'ns2.nameself.com');

      if (this.config.testMode) {
        console.log('[TEST MODE] Registering domain:', domain, 'with params:', params.toString());
        return { success: true, message: 'Domain registered in test mode' };
      }

      const response = await axios.post(this.baseUrl, params, {
         headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Webnames register response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error registering domain:', error);
      throw error;
    }
  }
}
