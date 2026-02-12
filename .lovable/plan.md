

# Corrigir tela branca no Login apos limpar cache

## Problema

Apos limpar o cache do navegador, o sistema exibe uma tela branca na URL `/login`. Isso geralmente acontece porque:

1. **Assets antigos em cache** - O navegador pode manter versoes antigas dos arquivos JavaScript/CSS em cache do Service Worker ou cache HTTP, causando conflito com a versao atual
2. **Erros nao tratados** - Se qualquer erro JavaScript ocorre durante a renderizacao, o React "morre" silenciosamente e mostra tela branca

## Solucao

### 1. Adicionar Error Boundary global

Criar um componente `ErrorBoundary` que captura erros de renderizacao do React e exibe uma mensagem amigavel com botao para recarregar, em vez de mostrar tela branca.

**Novo arquivo: `src/components/ErrorBoundary.tsx`**

### 2. Adicionar tratamento de erros asincronos

No `App.tsx`, adicionar um listener global para `unhandledrejection` que captura promises rejeitadas (ex: falha na conexao com Supabase) e evita que o app quebre silenciosamente.

### 3. Adicionar meta tags anti-cache no `index.html`

Incluir headers HTTP via meta tags para garantir que o navegador sempre busque a versao mais recente dos arquivos:

```text
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 4. Envolver o App com o ErrorBoundary

No `src/main.tsx`, envolver o componente `App` com o `ErrorBoundary` para que qualquer erro seja capturado e exiba uma tela de recuperacao em vez de tela branca.

## Detalhes tecnicos

**`src/components/ErrorBoundary.tsx`** (novo arquivo)
- Componente de classe React que implementa `componentDidCatch` e `getDerivedStateFromError`
- Quando um erro e capturado, exibe uma tela com mensagem "Ocorreu um erro" e um botao "Recarregar Sistema"
- O botao limpa o localStorage, sessionStorage e caches do navegador antes de recarregar

**`src/main.tsx`**
- Importar e envolver `<App />` com `<ErrorBoundary>`

**`src/App.tsx`**
- Adicionar `useEffect` com listener para `unhandledrejection` como rede de seguranca

**`index.html`**
- Adicionar meta tags anti-cache no `<head>`

