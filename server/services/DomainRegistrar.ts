
export interface DomainRegistrar {
  checkAvailability(domain: string): Promise<boolean>;
  registerDomain(domain: string, ownerDetails: any): Promise<any>;
}
