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
- **Workspace**: Seleção de pasta pelo diálogo nativo do sistema, sem digitar caminhos
- **Auto-save**: Salvamento automático em todos os módulos
- **File Watcher**: Monitoramento de mudanças em tempo real
- **Templates**: Sistema de templates para novos projetos
- **Temas**: Suporte a modo claro e escuro
- **Multi-plataforma**: Roda no Windows, macOS e Linux

### Templates para desenvolvimento de games

Os modelos de games aparecem primeiro em cada tipo de arquivo, tanto na Home
quanto no Explorer. Os modelos genéricos continuam disponíveis. É possível
buscar pelo nome, descrição ou tags, como `gdd`, `playtest`, `qa` e `gameplay`.

| Tipo | Modelo | Objetivo |
|------|--------|----------|
| Markdown | Game Design Document | Definir fantasia do jogador, pilares, core loop, escopo e critérios de validação |
| Markdown | Gameplay Mechanic Specification | Especificar regras, estados, feedback, parâmetros e casos de borda |
| Markdown | Playtest Report | Registrar build, observações, bugs, evidências e ações de reteste |
| Kanban | Game Production Board | Organizar um marco jogável entre Backlog, Ready, In Development, Playtest e Done |
| Kanban | Game Bug Triage | Acompanhar relatos entre Reported, Triaged, Fixing, Verification e Resolved |
| Canvas | Core Gameplay Loop | Conectar objetivo, ação, desafio, recompensa, progressão e uma pergunta de playtest |

Os documentos contêm perguntas orientadoras, não decisões de design prontas.
Os quadros incluem tarefas iniciais ou um guia de relato, que podem ser editados
ou removidos. Cada criação recebe dados independentes; editar um arquivo não
altera o modelo nem outros arquivos. Não há mudança nos formatos existentes.

Para abrir ou trocar de workspace, use **Selecionar Pasta / Trocar Pasta** no
Explorer. O diálogo começa na pasta atual quando houver uma. Cancelar ou
selecionar uma pasta inacessível não substitui o workspace atual; erros são
exibidos em um alerta. A última pasta selecionada continua sendo restaurada
ao abrir o aplicativo.

### Evolução planejada

- [x] Seletor nativo de workspace e catálogo inicial de templates de games.
- [ ] Próximo PR: criar, renomear, ordenar e remover colunas do board, definindo
  explicitamente o destino dos cards antes de remover uma coluna com conteúdo.
- [ ] PR seguinte: modelos reutilizáveis de cards no canvas e visualização do
  conteúdo completo em modal por duplo clique, com alternativa por teclado.
- [ ] Futuro, fora do escopo atual: preferências de cores, fontes e aparência
  global, com contraste acessível e opção de restaurar os padrões.

Antes de ampliar a personalização, priorizar validação e versionamento dos
arquivos persistidos, migrações compatíveis e testes de salvar/reabrir. Separar
preferências do aplicativo das configurações de cada board/canvas evita que
alterações globais modifiquem o conteúdo de projetos existentes.

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

- **Node.js** 22.12+ na linha 22, 24.x ou 26+ (compatível com o Vitest atual; CI usa a linha 22)
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

# Testes de regressão do frontend
npm test

# Preview do build
npm run preview

# Tauri development
npm run tauri:dev

# Tauri build para produção
npm run tauri:build
```

### Verificação do workspace

```bash
# Instalação reproduzível das dependências
npm ci

# Verificação TypeScript e build do frontend
npm run build

# Templates, seleção de pasta e estado do modal
npm test

# Testes da preparação de releases
node --test .github/scripts/prepare-release.test.mjs

# Auditoria das dependências de produção
npm audit --omit=dev
```

Os testes de frontend usam Vitest e Testing Library. A seleção de pasta é
testada com mocks das APIs nativas; isso não substitui a verificação do diálogo
no desktop. O workflow **Frontend checks** executa testes, TypeScript/build e os
testes da preparação de releases em cada PR. Ainda não há script de lint.

Para verificar os fluxos desktop, execute `npm run tauri:dev` e confira:

- Abra o seletor de pasta no Explorer, selecione uma pasta e confira a árvore de arquivos.
- Abra o seletor novamente e cancele: o workspace deve permanecer inalterado.
- Troque de pasta, reinicie o app e confira a restauração; em caso de falha de acesso, confira o alerta.
- Crie um GDD, um Game Production Board e um Core Gameplay Loop pela Home e pelo Explorer.
- Busque templates por tags, alterne os tipos e reabra o modal: não deve haver seleção de um tipo anterior.
- Edite e reabra os arquivos criados; crie outro arquivo com o mesmo modelo e confira que ele não herdou as edições.
- Alterne entre os módulos: cada um deve restaurar seu próprio último arquivo; módulos sem arquivo devem mostrar o estado vazio.
- Volte à Home: a seção de continuidade deve mostrar os últimos arquivos abertos em cada módulo, sem dados de exemplo.
- Renomeie ou exclua um arquivo no Explorer e confira as sessões; excluir outro arquivo não deve fechar o documento ativo.
- Recolha e expanda o Explorer, reinicie o aplicativo e confira a preferência.
- Alterne entre os temas claro e escuro e confira a navegação por teclado e o layout em janelas menores.
- Edite, salve e reabra os arquivos para conferir a persistência de cada módulo.

`npm run dev` permite conferir o visual no navegador, mas operações de arquivos
e monitoramento dependem do runtime Tauri. No Linux, instale também os
[pré-requisitos nativos do Tauri](https://v2.tauri.app/start/prerequisites/),
incluindo as bibliotecas de desenvolvimento GTK/GLib e WebKitGTK, antes de
executar `cargo test --manifest-path src-tauri/Cargo.toml --locked` ou compilar o aplicativo desktop.

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

### Releases automáticas no GitHub

O workflow `.github/workflows/release.yml` instala as ferramentas e dependências,
compila o frontend e o backend e publica uma **pré-release** com instaladores:

- **Windows x64**: `.exe` (NSIS) e `.msi`.
- **macOS Intel e Apple Silicon**: `.dmg` universal.
- **Linux x64**: `.deb` e `.AppImage`.

Para publicar uma versão de teste:

1. Prepare a versão no código. `package.json`, `src-tauri/tauri.conf.json` e
   `src-tauri/Cargo.toml` devem ter o mesmo número no formato `X.Y.Z`; atualize
   também `package-lock.json` e `src-tauri/Cargo.lock` quando alterar a versão.
   Por exemplo, `npm version 0.1.1 --no-git-tag-version` atualiza os arquivos
   do npm sem criar commit nem tag. Edite as versões do Tauri e do Cargo e
   atualize o lockfile Rust com:

   ```bash
   cargo update --workspace --manifest-path src-tauri/Cargo.toml
   ```

   Confira e envie os cinco arquivos de versão em um commit. A Action valida
   que as versões dos dois lockfiles também correspondem.
2. Com o workflow atualizado na branch padrão, abra
   **Actions → Desktop release → Run workflow**. Em **Use workflow from**,
   selecione a branch que contém o código a publicar. Deixe **tag** vazio para
   usar `v` + a versão dessa branch, ou informe `0.1.1` ou `v0.1.1`.
3. Execute o workflow. Se a tag não existir, a Action a cria no commit
   selecionado. Se já existir, usa o commit da tag, e não o código mais recente
   da branch. As versões são validadas nesse mesmo commit.
4. Acompanhe os jobs `prepare`, `build` e `publish`. A pré-release só fica
   pública quando os três builds terminarem com sucesso.

Como alternativa, com o commit de versão já enviado, crie e envie uma tag:

```bash
git tag v0.1.1
git push origin v0.1.1
```

Esse push também inicia o workflow; não é preciso criar uma release manualmente.
A automação não escolhe nem incrementa a versão. Tags com e sem `v` são aceitas,
mas são nomes distintos; prefira `vX.Y.Z` para novas versões. Use versões
`X.Y.Z` sem zeros iniciais. A classificação como pré-release é configurada no
GitHub, sem exigir sufixo `-beta`.

| Job | Responsabilidade |
| --- | --- |
| `prepare` | Valida tag, versões e lockfiles; resolve o commit; cria a tag quando necessário; cria ou reutiliza um rascunho e retorna seu ID. |
| `build` | Compila Windows, macOS e Linux em paralelo no mesmo commit e anexa os instaladores ao rascunho. |
| `publish` | Publica a pré-release somente se todos os builds tiverem sucesso, sem marcá-la como a release estável mais recente. |

As execuções são serializadas para evitar alterações simultâneas na mesma
release. Os builds usam `npm ci` e Cargo `--locked`; o cache do npm reduz os
downloads em execuções futuras. Se um build falhar por um problema transitório,
use **Re-run failed jobs** na execução original; se reiniciar o workflow para a
mesma tag, o rascunho será reutilizado. Uma release publicada nunca é
sobrescrita: use uma nova versão.

O workflow usa o `GITHUB_TOKEN` automático com permissão de escrita em conteúdo;
não exige um token pessoal. As políticas do repositório/organização e eventuais
proteções de tags precisam permitir que o GitHub Actions crie releases e tags.
Se uma proteção bloquear a criação automática, crie a tag pelo processo
autorizado e informe-a ao workflow.

Para testar, o usuário baixa o instalador do seu sistema nos **Assets** da
pré-release, sem instalar Node.js ou Rust. No Linux, podem ser necessárias
bibliotecas do sistema, como WebKitGTK; AppImages também podem exigir FUSE.
Esses builds não têm assinatura digital nem notarização: Windows e macOS podem
exibir alertas ou bloquear a execução. Assinatura/notarização exigem certificados
e credenciais próprios, não incluídos neste workflow. Não há atualização automática
do aplicativo; novas versões são baixadas pela página de releases.

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