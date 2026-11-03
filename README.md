# 📖 LoreDex

> **LoreDex** é uma plataforma moderna para amantes de mangás, novels e webnovels gerenciarem sua própria biblioteca de leituras, descobrirem novas obras de forma inteligente e acompanharem o progresso de seus capítulos.

---

## 🚀 Funcionalidades

### 📚 Biblioteca Pessoal
- **Acervo Individual por Usuário:** Cada conta possui sua biblioteca exclusiva. O usuário adiciona e remove obras da sua lista sem interferir na biblioteca de outros usuários.
- **Busca e Filtros Avançados:** Filtre seu acervo por título, sinopse, formato (Mangá, Novel, Webnovel), estado (Em Lançamento, Concluído, etc.) e múltiplos gêneros simultaneamente.
- **Ordenação:** Organize suas obras por ordem padrão, A–Z, Z–A ou as adicionadas recentemente.
- **Filtro de Conteúdo +18:** Alternância rápida para exibir ou ocultar títulos adultos/ecchi.

### 🎲 Recomendação Aleatória de Obras (via AniList)
- **Sorteio no Catálogo Global:** Não sabe o que ler? Um sistema de sorteio inteligente busca obras populares diretamente da API oficial do AniList.
- **Controle de Conteúdo:** Opção de sortear com ou sem obras adultas (+18).
- **Filtro por Gênero:** Permite limitar o sorteio a gêneros selecionados ou sortear em qualquer categoria.
- **Evita Repetições:** Prioriza obras que você ainda não tem na biblioteca e nunca repete a recomendação atual.
- **Adição em 1 Clique:** Salve a obra sorteada diretamente na sua biblioteca pessoal com download automatizado de metadados e tradução de sinopse.

### 🌐 Integrações & Metadados Automáticos
- **Pesquisa Integrada com AniList:** Adicione obras pesquisando em tempo real no AniList.
- **Preenchimento Automático:** Capa de alta resolução, total de capítulos, formato, status e gêneros identificados automaticamente.
- **Fallback Inteligente de Capítulos:** Consulta secundária em APIs externas (Jikan/MyAnimeList e MangaDex) caso o AniList não forneça o número de capítulos.
- **Tradução Automática de Sinopse:** Tradução instantânea das sinopses em inglês para Português (PT-BR).
- **Cadastro Manual:** Formulário completo para inclusão manual de qualquer obra com campos customizáveis.

### 💬 Capítulos & Avaliações
- Acompanhamento de capítulos e links de leitura.
- Sistema de reviews e notas por critérios para cada obra.

### 🛡️ Painel Administrativo
- **Visão Geral e Estatísticas:** Métricas de usuários cadastrados, administradores e obras registradas.
- **Gerenciamento de Acesso:** Promover ou rebaixar papéis de usuários (Cliente / Administrador).
- **Gestão do Catálogo Geral:**
  - **Bloqueio Temporário:** Oculta uma obra com problemas de todas as bibliotecas e bloqueia novas adições. Ao desbloquear, a obra reaparece normalmente para quem a tinha.
  - **Exclusão Permanente:** Remove a obra em definitivo de todo o sistema.

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **[PHP 8.2+](https://www.php.net/)**
- **[Laravel 11 / 12](https://laravel.com/)**
- **[Laravel Sanctum](https://laravel.com/docs/sanctum):** Autenticação SPA baseada em tokens.
- **MySQL:** Banco de dados relacional.

### Frontend
- **[React 19](https://react.dev/)**
- **[Vite](https://vite.dev/):** Ferramenta de build ultrarrápida.
- **CSS3 Moderno:** Layout responsivo, carrosséis customizados com scroll snap, temas escuros com suporte a blur e gradientes.

### APIs Externas
- **[AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/)**: Catálogo de obras, autores e capas.
- **[Jikan API (MyAnimeList)](https://jikan.moe/)**: Busca de capítulos e volumes.
- **[MangaDex API](https://api.mangadex.org/)**: Contagem de capítulos e agregador.
- **Google Translate API**: Tradução de sinopses para português.

---

## 📦 Instalação e Execução Local

### Pré-requisitos
- **PHP** >= 8.2 com extensões PDO, OpenSSL, cURL e Mbstring ativas (disponível via Laragon, Herd ou XAMPP)
- **Composer**
- **Node.js** >= 18.x e **NPM**
- **MySQL**

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/LoreDex.git
   cd LoreDex
   ```

2. **Instale as dependências do PHP:**
   ```bash
   composer install
   ```

3. **Instale as dependências do Frontend:**
   ```bash
   npm install
   ```

4. **Configure o arquivo de ambiente:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure o banco de dados no `.env`:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=novel_app
   DB_USERNAME=root
   DB_PASSWORD=
   ```

6. **Execute as migrações do banco:**
   ```bash
   php artisan migrate
   ```

7. **Inicie os servidores de desenvolvimento:**
   - Em um terminal, inicie o backend do Laravel:
     ```bash
     php artisan serve
     ```
   - Em outro terminal, inicie o Vite para o frontend:
     ```bash
     npm run dev
     ```

8. **Acesse no navegador:**
   - Abra [http://localhost:8000](http://localhost:8000) (ou pelo host configurado no Laragon/virtual host).

---

## 🗂️ Estrutura do Projeto

```text
LoreDex/
├── app/
│   ├── Http/Controllers/
│   │   ├── AdminController.php         # Estatísticas, gestão de usuários e bloqueio de obras
│   │   ├── AuthController.php          # Login, registro e dados da sessão
│   │   ├── ChapterController.php       # Gestão de capítulos e leitura
│   │   ├── WorkController.php          # Catálogo e biblioteca pessoal do usuário
│   │   └── WorkReviewController.php    # Avaliações e comentários
│   └── Models/
│       ├── User.php                    # Usuário e relacionamento com obras da biblioteca
│       ├── Work.php                    # Catálogo global de obras
│       └── Chapter.php, WorkReview.php
├── database/migrations/                # Histórico de estrutura do banco de dados
├── resources/
│   ├── css/
│   │   ├── admin.css                   # Estilização do painel administrativo
│   │   ├── home.css                    # Estilos da home, cards, filtros e recomendação
│   │   └── login.css, capitulos.css
│   └── js/
│       ├── components/
│       │   ├── App.jsx                 # Tela principal da aplicação
│       │   ├── UserMenu.jsx            # Menu do usuário e navegação
│       │   └── WorkRecommendation.jsx  # Componente de recomendação aleatória (AniList)
│       ├── pages/
│       │   ├── AdminPanel.jsx          # Interface do painel de administração
│       │   ├── Login.jsx               # Autenticação (Login / Cadastro)
│       │   └── TelaCapitulos.jsx       # Detalhes, leitura e avaliações
│       └── services/
│           └── api.js                  # Camada de comunicação com a API Laravel
└── routes/
    ├── api.php                         # Rotas REST autenticadas (Sanctum)
    └── web.php                         # Renderização da SPA
```

---

## 👥 Contribuidores

- **Luiz Benevides** (Desenvolvimento Geral & Adaptações de Engenharia)
- **Gian** (Concepção e Desenvolvimento do Módulo de Recomendação de Obras)
- **Equipe LoreDex**

---

## 📄 Licença

Este projeto é desenvolvido para fins educacionais e de entretenimento sob a licença [MIT](LICENSE).
