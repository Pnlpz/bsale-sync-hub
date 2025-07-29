/**
 * Bsale API Client
 * Handles all interactions with the Bsale API
 */

// Bsale API Types
export interface BsaleProduct {
  id: number;
  name: string;
  description?: string;
  classification: number;
  ledgerAccount?: string;
  costCenter?: string;
  allowDecimal: boolean;
  stockControl: boolean;
  printDetailInInvoices: boolean;
  state: number;
  prestashopProductId?: string;
  presashopAttributeId?: string;
  product_type: {
    href: string;
    id: string;
  };
  variants: {
    href: string;
  };
}

export interface BsaleVariant {
  id: number;
  description: string;
  unlimitedStock: boolean;
  allowNegativeStock: boolean;
  state: number;
  barCode?: string;
  code?: string;
  imagestionCenterCost?: string;
  imagestionAccount?: string;
  imagestionConceptCod?: string;
  imagestionProyectCod?: string;
  imagestionCategoryCod?: string;
  imagestionProductId?: string;
  serialNumber?: boolean;
  prestashopCombinationId?: string;
  prestashopValueId?: string;
  product: {
    href: string;
    id: string;
  };
  attribute_values: any[];
  costs: {
    href: string;
  };
  stocks: {
    href: string;
  };
}

export interface BsaleStock {
  id: number;
  quantityAvailable: number;
  quantityReserved: number;
  quantityAvailableForSale: number;
  office: {
    href: string;
    id: string;
  };
  variant: {
    href: string;
    id: string;
  };
}

export interface BsaleDocument {
  id: number;
  emissionDate: number;
  expirationDate: number;
  generationDate: number;
  number: number;
  totalAmount: number;
  netAmount: number;
  taxAmount: number;
  state: number;
  commercialState: number;
  urlPdf: string;
  urlPublicView: string;
  token: string;
  document_type: {
    href: string;
    id: string;
  };
  office: {
    href: string;
    id: string;
  };
  client?: {
    href: string;
    id: string;
  };
  details: {
    href: string;
  };
}

export interface BsaleClient {
  id: number;
  firstName: string;
  lastName: string;
  code?: string;
  company?: string;
  note?: string;
  email?: string;
  phone?: string;
  address?: string;
  municipality?: string;
  city?: string;
  state: number;
}

// API Response wrapper
export interface BsaleApiResponse<T> {
  href: string;
  count: number;
  limit: number;
  offset: number;
  items: T[];
}

class BsaleApiClient {
  private baseUrl: string;
  private accessToken: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BSALE_API_URL || 'https://api.bsale.io/v1';
    this.accessToken = import.meta.env.VITE_BSALE_ACCESS_TOKEN;
    
    if (!this.accessToken) {
      throw new Error('Bsale access token is required. Please set VITE_BSALE_ACCESS_TOKEN in your environment variables.');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'access_token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bsale API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Products
  async getProducts(limit = 25, offset = 0): Promise<BsaleApiResponse<BsaleProduct>> {
    return this.makeRequest(`/products.json?limit=${limit}&offset=${offset}`);
  }

  async getProduct(id: number): Promise<BsaleProduct> {
    return this.makeRequest(`/products/${id}.json`);
  }

  async createProduct(productData: Partial<BsaleProduct>): Promise<BsaleProduct> {
    return this.makeRequest('/products.json', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  // Variants (Product variations)
  async getProductVariants(productId: number): Promise<BsaleApiResponse<BsaleVariant>> {
    return this.makeRequest(`/products/${productId}/variants.json`);
  }

  async getVariant(id: number): Promise<BsaleVariant> {
    return this.makeRequest(`/variants/${id}.json`);
  }

  // Stock
  async getVariantStocks(variantId: number): Promise<BsaleApiResponse<BsaleStock>> {
    return this.makeRequest(`/variants/${variantId}/stocks.json`);
  }

  async getStock(id: number): Promise<BsaleStock> {
    return this.makeRequest(`/stocks/${id}.json`);
  }

  // Documents (Sales, Invoices, etc.)
  async getDocuments(limit = 25, offset = 0): Promise<BsaleApiResponse<BsaleDocument>> {
    return this.makeRequest(`/documents.json?limit=${limit}&offset=${offset}`);
  }

  async getDocument(id: number): Promise<BsaleDocument> {
    return this.makeRequest(`/documents/${id}.json`);
  }

  async createDocument(documentData: any): Promise<BsaleDocument> {
    return this.makeRequest('/documents.json', {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
  }

  // Clients
  async getClients(limit = 25, offset = 0): Promise<BsaleApiResponse<BsaleClient>> {
    return this.makeRequest(`/clients.json?limit=${limit}&offset=${offset}`);
  }

  async getClient(id: number): Promise<BsaleClient> {
    return this.makeRequest(`/clients/${id}.json`);
  }

  async createClient(clientData: Partial<BsaleClient>): Promise<BsaleClient> {
    return this.makeRequest('/clients.json', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  // Search methods
  async searchProducts(name: string): Promise<BsaleApiResponse<BsaleProduct>> {
    const encodedName = encodeURIComponent(name);
    return this.makeRequest(`/products.json?name=${encodedName}`);
  }

  async searchClients(email?: string, firstName?: string): Promise<BsaleApiResponse<BsaleClient>> {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (firstName) params.append('firstName', firstName);
    
    return this.makeRequest(`/clients.json?${params.toString()}`);
  }
}

// Export singleton instance
export const bsaleClient = new BsaleApiClient();
export default bsaleClient;
