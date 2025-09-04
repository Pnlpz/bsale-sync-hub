/**
 * Component to show database setup instructions when store creation fails
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, Copy } from 'lucide-react';
import { useState } from 'react';

const SQL_SCRIPT = `ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique_when_not_null
ON public.profiles (user_id) WHERE user_id IS NOT NULL;`;

export const DatabaseSetupInstructions = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Configuración de Base de Datos Requerida</AlertTitle>
        <AlertDescription>
          La creación de tiendas falló porque la base de datos necesita ser configurada.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Instrucciones de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Pasos a seguir:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Abre el SQL Editor de Supabase</li>
              <li>Copia y pega el script SQL de abajo</li>
              <li>Ejecuta el script</li>
              <li>Intenta crear la tienda nuevamente</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copiado!' : 'Copiar Script SQL'}
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Script SQL a ejecutar:</h4>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
              <code>{SQL_SCRIPT}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
