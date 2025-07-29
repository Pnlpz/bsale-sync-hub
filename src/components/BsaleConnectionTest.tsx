import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Wifi } from 'lucide-react';
import { bsaleClient } from '@/lib/bsale-client';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

const BsaleConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test basic connection by fetching a few products
      const response = await bsaleClient.getProducts(5, 0);
      
      setResult({
        success: true,
        message: `Conexión exitosa! Se encontraron ${response.count} productos en total.`,
        data: {
          totalProducts: response.count,
          productsReturned: response.items.length,
          firstProduct: response.items[0]?.name || 'N/A',
        }
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Error al conectar con Bsale API',
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wifi className="h-5 w-5 mr-2" />
          Test de Conexión Bsale
        </CardTitle>
        <CardDescription>
          Verifica que la conexión con la API de Bsale esté funcionando correctamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Estado de la API</p>
            <p className="text-sm text-muted-foreground">
              Token configurado: {import.meta.env.VITE_BSALE_ACCESS_TOKEN ? 'Sí' : 'No'}
            </p>
            <p className="text-sm text-muted-foreground">
              URL: {import.meta.env.VITE_BSALE_API_URL}
            </p>
          </div>
          <Button 
            onClick={testConnection}
            disabled={testing}
            variant={result?.success ? "default" : "outline"}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Probando...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Probar Conexión
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "Éxito" : "Error"}
              </Badge>
            </div>
            
            <p className="text-sm mb-2">{result.message}</p>
            
            {result.success && result.data && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Total de productos: {result.data.totalProducts}</p>
                <p>• Productos obtenidos: {result.data.productsReturned}</p>
                <p>• Primer producto: {result.data.firstProduct}</p>
              </div>
            )}
            
            {result.error && (
              <div className="text-xs text-red-600 mt-2">
                <p className="font-medium">Error detallado:</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Información del token:</p>
          <p>• Token: {import.meta.env.VITE_BSALE_ACCESS_TOKEN ? 
            `${import.meta.env.VITE_BSALE_ACCESS_TOKEN.substring(0, 8)}...` : 
            'No configurado'
          }</p>
          <p>• Ambiente: {import.meta.env.VITE_BSALE_API_URL?.includes('bsale.io') ? 'Sandbox' : 'Producción'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BsaleConnectionTest;
