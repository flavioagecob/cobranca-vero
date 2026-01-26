

## Plano: Sistema de Gerenciamento de Instancias WhatsApp

### Visao Geral

Criar um sistema completo para gerenciar instancias de WhatsApp na pagina de Configuracoes. O sistema permitira:
- Criar novas instancias via webhook
- Conectar instancias existentes via webhook (gerar QR Code)
- Visualizar e gerenciar instancias cadastradas
- Armazenar dados das instancias no Supabase

---

### 1. Criar Tabela no Supabase

**Nova tabela `instances`:**

```sql
CREATE TABLE public.instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT NOT NULL UNIQUE,
    token TEXT NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT,
    status TEXT DEFAULT 'disconnected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_instances_updated_at
    BEFORE UPDATE ON public.instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies (apenas admins podem gerenciar)
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instances_admin_all" ON public.instances
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "instances_supervisor_select" ON public.instances
    FOR SELECT
    USING (has_role(auth.uid(), 'supervisor'::app_role));
```

**Colunas da tabela:**
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | ID interno (auto-gerado) |
| instance_id | text | ID da instancia retornado pelo webhook |
| token | text | Token da instancia |
| name | text | Nome amigavel da instancia |
| phone_number | text | Telefone conectado (nullable) |
| status | text | Status: disconnected, connecting, connected |
| created_at | timestamp | Data de criacao |
| updated_at | timestamp | Data de atualizacao |
| created_by | uuid | Usuario que criou |

---

### 2. Criar Edge Function para Webhooks

**Arquivo: `supabase/functions/instance-webhook/index.ts`**

Edge function que faz proxy para os webhooks externos:

```typescript
// Acoes suportadas:
// - create: Cria nova instancia
// - connect: Inicia conexao (retorna QR code ou status)
// - status: Verifica status da conexao
// - disconnect: Desconecta instancia
```

**Fluxo da Edge Function:**
1. Recebe requisicao com action (create/connect/status/disconnect)
2. Chama webhook externo correspondente
3. Processa resposta e atualiza banco se necessario
4. Retorna dados para o frontend

---

### 3. Criar Hook `useInstances`

**Arquivo: `src/hooks/useInstances.ts`**

```typescript
interface Instance {
  id: string;
  instance_id: string;
  token: string;
  name: string;
  phone_number: string | null;
  status: 'disconnected' | 'connecting' | 'connected';
  created_at: string;
}

interface UseInstancesReturn {
  instances: Instance[];
  isLoading: boolean;
  error: string | null;
  createInstance: (name: string) => Promise<CreateInstanceResult>;
  connectInstance: (instanceId: string) => Promise<ConnectResult>;
  checkStatus: (instanceId: string) => Promise<StatusResult>;
  deleteInstance: (id: string) => Promise<void>;
  refreshInstances: () => void;
}
```

---

### 4. Criar Componentes de UI

**4.1 `src/components/settings/InstanceList.tsx`**

Lista todas as instancias cadastradas com:
- Nome da instancia
- Status (conectado/desconectado)
- Telefone conectado (se houver)
- Botoes de acao (conectar, desconectar, excluir)

**4.2 `src/components/settings/CreateInstanceDialog.tsx`**

Modal para criar nova instancia:
- Campo: Nome da instancia
- Botao: Criar
- Loading state enquanto aguarda resposta do webhook
- Exibe resultado (sucesso com token ou erro)

**4.3 `src/components/settings/ConnectInstanceDialog.tsx`**

Modal para conectar instancia:
- Exibe QR Code retornado pelo webhook
- Polling para verificar status da conexao
- Atualiza automaticamente quando conectado

**4.4 `src/components/settings/InstanceCard.tsx`**

Card individual para cada instancia:
- Icone de status (verde=conectado, amarelo=conectando, vermelho=desconectado)
- Informacoes da instancia
- Acoes contextuais

---

### 5. Atualizar Pagina Settings

**Arquivo: `src/pages/Settings.tsx`**

Reorganizar a pagina com abas:
- **Instancias**: Gerenciamento de instancias WhatsApp
- **Templates**: Templates de mensagens (futuro)
- **Regua de Cobranca**: Configuracao de reguas (futuro)

```text
+------------------------------------------+
| Configuracoes                            |
+------------------------------------------+
| [Instancias] [Templates] [Regua]         |
+------------------------------------------+
|                                          |
|  +-- Card: Instancias WhatsApp --------+ |
|  |                                      | |
|  |  [+ Nova Instancia]                  | |
|  |                                      | |
|  |  +-- Instance Card 1 --------------+ | |
|  |  | WhatsApp Cobranca               | | |
|  |  | Status: Conectado               | | |
|  |  | Tel: +55 11 99999-9999         | | |
|  |  | [Desconectar] [Excluir]        | | |
|  |  +--------------------------------+ | |
|  |                                      | |
|  |  +-- Instance Card 2 --------------+ | |
|  |  | WhatsApp Suporte                | | |
|  |  | Status: Desconectado            | | |
|  |  | [Conectar] [Excluir]           | | |
|  |  +--------------------------------+ | |
|  |                                      | |
|  +--------------------------------------+ |
|                                          |
+------------------------------------------+
```

---

### 6. Estrutura de Arquivos

```text
src/
  components/
    settings/
      InstanceList.tsx        # Lista de instancias
      InstanceCard.tsx        # Card individual
      CreateInstanceDialog.tsx # Modal criar
      ConnectInstanceDialog.tsx # Modal conectar (QR Code)
  hooks/
    useInstances.ts           # Hook para gerenciar instancias
  pages/
    Settings.tsx              # Pagina atualizada
  types/
    instance.ts               # Tipos TypeScript

supabase/
  functions/
    instance-webhook/
      index.ts                # Edge function
```

---

### 7. Fluxo de Criacao de Instancia

```text
1. Usuario clica "Nova Instancia"
2. Modal abre pedindo nome
3. Usuario digita nome e clica "Criar"
4. Frontend chama Edge Function com action=create
5. Edge Function chama webhook externo
6. Webhook retorna: { instance_id, token }
7. Edge Function salva no banco e retorna dados
8. Modal exibe sucesso com token
9. Lista de instancias e atualizada
```

---

### 8. Fluxo de Conexao de Instancia

```text
1. Usuario clica "Conectar" em uma instancia
2. Modal abre e chama Edge Function com action=connect
3. Edge Function chama webhook que retorna QR Code (base64)
4. Modal exibe QR Code para usuario escanear
5. Frontend faz polling a cada 3s chamando action=status
6. Quando status=connected:
   - Edge Function atualiza phone_number no banco
   - Modal fecha automaticamente
   - Card atualiza para mostrar "Conectado"
```

---

### Detalhes Tecnicos

**Webhooks esperados (voce precisara fornecer as URLs):**

| Acao | Metodo | Payload | Resposta Esperada |
|------|--------|---------|-------------------|
| create | POST | `{ name }` | `{ instance_id, token }` |
| connect | POST | `{ instance_id, token }` | `{ qr_code_base64 }` |
| status | GET | `?instance_id=X&token=Y` | `{ status, phone_number? }` |
| disconnect | POST | `{ instance_id, token }` | `{ success: true }` |

**Estados de status:**
- `disconnected`: Instancia criada mas nao conectada
- `connecting`: Aguardando scan do QR Code
- `connected`: WhatsApp conectado e operacional

