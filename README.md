# Game Dev Hub

Uma aplicação desktop moderna para game developers que combina ferramentas essenciais de produtividade em uma interface unificada. Construída com Tauri, React e TypeScript.

## 🎯 Sobre o Projeto

O **Game Dev Hub** é uma suíte de ferramentas de produtividade especialmente projetada para desenvolvedores de jogos. A aplicação oferece quatro módulos principais integrados:

- **📝 Editor Markdown**: Editor avançado com preview em tempo real e sintaxe highlighting
- **📋 Kanban Board**: Sistema de gestão de tarefas com drag-and-drop
- **🌐 Mind Canvas**: Canvas visual para mapas mentais e diagramas
- **🏠 Dashboard**: Tela inicial com acesso rápido e arquivos recentes

## ✨ Funcionalidades

### Editor Markdown
- Editor de código avançado com CodeMirror 6
- Preview em tempo real side-by-side
- Sintaxe highlighting para Markdown
- Auto-save automático
- Suporte a temas claro/escuro
- Toolbar com ações rápidas (negrito, itálico, cabeçalhos, listas, etc.)
- Menu de contexto customizado

### Kanban Board
- Colunas personalizáveis
- Cards com título, descrição e prioridades
- Sistema de drag-and-drop para reorganização
- Tags coloridas para categorização
- Persistência automática de dados
- Interface responsiva e intuitiva

### Mind Canvas
- Canvas visual baseado em ReactFlow
- Nós customizados com conteúdo Markdown
- Conexões entre ideias com setas
- Zoom e pan infinitos
- Minimap para navegação
- Grid de alinhamento
- Auto-save das posições e conteúdo

### Recursos Gerais
- **Sistema de Arquivos**: Explorador de arquivos integrado
- **Auto-save**: Salvamento automático em todos os módulos
- **File Watcher**: Monitoramento de mudanças em tempo real
- **Templates**: Sistema de templates para novos projetos
- **Temas**: Suporte a modo claro e escuro
- **Multi-plataforma**: Roda no Windows, macOS e Linux

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Zustand** - Gerenciamento de estado
- **CodeMirror 6** - Editor de código avançado
- **ReactFlow** - Canvas interativo para mind maps
- **DND Kit** - Drag and drop para Kanban
- **Lucide React** - Ícones modernos
- **Marked** - Parser de Markdown

### Backend
- **Tauri 2.0** - Framework para aplicações desktop
- **Rust** - Backend nativo de alta performance
- **Notify** - File system watcher
- **Serde** - Serialização JSON

### Styling
- **CSS Modules** - Estilização componentizada
- **CSS Custom Properties** - Sistema de temas

## 🚀 Como Executar

### Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Rust** (1.70 ou superior)
- **Tauri CLI**

### Instalação do Rust e Tauri

```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Instalar Tauri CLI
cargo install tauri-cli
```

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/kiwizitos/new-game-hub.git
cd new-game-hub
```

2. **Instale as dependências**
```bash
npm install
```

## 🔧 Desenvolvimento

### Executar em modo desenvolvimento

```bash
# Inicia o servidor de desenvolvimento do Vite + Tauri
npm run tauri:dev
```

Este comando irá:
- Iniciar o servidor Vite na porta 1420
- Compilar o backend Rust
- Abrir a aplicação desktop
- Habilitar hot-reload para mudanças no frontend

### Scripts disponíveis

```bash
# Frontend apenas (para desenvolvimento web)
npm run dev

# Build do frontend
npm run build

# Preview do build
npm run preview

# Tauri development
npm run tauri:dev

# Tauri build para produção
npm run tauri:build
```

## 📦 Build para Produção

### Build completo da aplicação

```bash
npm run tauri:build
```

Este comando irá:
1. Executar `npm run build` para compilar o frontend
2. Compilar o backend Rust em modo release
3. Gerar os executáveis para a plataforma atual
4. Criar instaladores (MSI no Windows, DMG no macOS, AppImage no Linux)

### Arquivos gerados

Os arquivos de build serão criados em:
- **Executáveis**: `src-tauri/target/release/`
- **Instaladores**: `src-tauri/target/release/bundle/`

### Configurações de build

As configurações de build podem ser ajustadas em:
- `src-tauri/tauri.conf.json` - Configurações do Tauri
- `vite.config.ts` - Configurações do Vite
- `tsconfig.json` - Configurações do TypeScript

## 📁 Estrutura do Projeto

```
new-game-hub/
├── src/                          # Frontend React
│   ├── components/               # Componentes React
│   │   ├── canvas/              # Módulo Canvas/Mind Map
│   │   ├── editor/              # Módulo Editor Markdown
│   │   ├── kanban/              # Módulo Kanban Board
│   │   ├── layout/              # Layouts da aplicação
│   │   ├── navigation/          # Navegação principal
│   │   └── ...
│   ├── contexts/                # React Contexts
│   ├── hooks/                   # Custom hooks
│   ├── services/                # Serviços e APIs
│   ├── stores/                  # Stores Zustand
│   ├── types/                   # Definições TypeScript
│   └── utils/                   # Utilitários
├── src-tauri/                   # Backend Rust
│   ├── src/                     # Código Rust
│   ├── capabilities/            # Capacidades Tauri
│   ├── icons/                   # Ícones da aplicação
│   └── target/                  # Arquivos compilados
├── public/                      # Assets públicos
└── dist/                        # Build do frontend
```

## 🎨 Customização

### Temas
Os temas podem ser customizados em `src/styles/global.css` através das CSS custom properties.

### Adicionar novos módulos
1. Crie os componentes em `src/components/[nome-modulo]/`
2. Adicione o tipo em `src/types/app.ts`
3. Registre no roteamento em `src/App.tsx`
4. Adicione à navegação em `src/components/navigation/Navigation.tsx`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Kiwizitos**
- GitHub: [@kiwizitos](https://github.com/kiwizitos)

---

**Game Dev Hub** - Unificando as ferramentas essenciais para game developers em uma aplicação moderna e eficiente.