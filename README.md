# 2. Padrões Arquiteturais

> **📚 [← Voltar ao Índice Principal](https://github.com/ernanegit/00-arquitetura-software-index)** | **[← Tutorial Anterior: Fundamentos](https://github.com/ernanegit/01-fundamentos-arquitetura-software)** | **[Próximo Tutorial: Microsserviços →](https://github.com/ernanegit/03-microservicos-pratica)**

Sistema de e-commerce desenvolvido para demonstrar na prática os principais **padrões arquiteturais** usando TypeScript, Clean Architecture e Design Patterns.

## 🎯 Objetivos de Aprendizado

Ao completar este tutorial, você será capaz de:

- ✅ **Implementar Arquitetura em Camadas** (Layered Architecture)
- ✅ **Aplicar MVC Pattern** na prática
- ✅ **Construir Arquitetura Hexagonal** (Ports & Adapters)
- ✅ **Usar Repository Pattern** para abstração de dados
- ✅ **Implementar Dependency Injection** para baixo acoplamento
- ✅ **Aplicar Domain-Driven Design** básico
- ✅ **Criar testes unitários** com alta cobertura

## 🏗️ O que vamos construir

Um **sistema de e-commerce completo** aplicando diferentes padrões arquiteturais:

- 🛒 **Gestão de Produtos** (CRUD com validações)
- 👤 **Gestão de Usuários** (Autenticação e autorização)
- 🛍️ **Carrinho de Compras** (Sessões e estado)
- 📦 **Processamento de Pedidos** (Workflow complexo)
- 💳 **Gateway de Pagamento** (Integração externa)

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Controllers │  │   Routes    │  │ Middlewares │  │   DTOs   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   Services  │  │  Use Cases  │  │   Domain    │  │ Entities │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │Repositories │  │   Models    │  │   Database  │  │  Cache   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Pré-requisitos

### Conhecimentos
- ✅ **Tutorial 1 concluído** (Fundamentos de Arquitetura)
- JavaScript/Node.js intermediário
- TypeScript básico
- Conceitos de OOP (classes, interfaces, herança)
- SQL básico

### Ferramentas
- [Node.js 18+](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/) com extensões TypeScript

## 🛠️ Stack Tecnológica

| Componente | Tecnologia | Versão | Responsabilidade |
|------------|------------|---------|------------------|
| **Runtime** | Node.js + TypeScript | 18 + 5.0 | Ambiente de execução |
| **Framework** | Express.js | 4.x | API REST |
| **ORM** | Prisma | 5.x | Mapeamento objeto-relacional |
| **Database** | PostgreSQL | 15 | Persistência principal |
| **Cache** | Redis | 7 | Cache e sessões |
| **Tests** | Jest + Supertest | Latest | Testes unitários e integração |
| **Validation** | Zod | Latest | Validação de dados |
| **Container** | Docker + Compose | Latest | Containerização |

## 🚀 Como Executar

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/ernanegit/02-padroes-arquiteturais.git
cd 02-padroes-arquiteturais

# 2. Instale dependências
npm install

# 3. Configure ambiente
cp .env.example .env

# 4. Inicie containers
docker-compose up -d

# 5. Execute migrations
npm run db:migrate

# 6. Seed do banco
npm run db:seed

# 7. Inicie desenvolvimento
npm run dev
```

### Acessar Aplicações

- **🌐 API:** http://localhost:8000
- **📊 API Docs:** http://localhost:8000/docs
- **💓 Health Check:** http://localhost:8000/health
- **🗄️ Database:** localhost:5432
- **💾 Redis:** localhost:6379

## 📚 Conteúdo do Tutorial

### Parte 1: 🏗️ Arquitetura em Camadas
- **Presentation Layer**: Controllers, Routes, DTOs
- **Business Layer**: Services, Use Cases, Domain
- **Data Layer**: Repositories, Models, Database
- **Exercício**: Implementar CRUD de produtos

### Parte 2: 🎭 MVC Pattern
- **Model**: Entidades e regras de negócio
- **View**: Serialização de dados (JSON responses)
- **Controller**: Orquestração de requests
- **Exercício**: Sistema de autenticação

### Parte 3: 🔷 Arquitetura Hexagonal
- **Domain**: Lógica de negócio pura
- **Ports**: Interfaces (abstrações)
- **Adapters**: Implementações concretas
- **Exercício**: Processamento de pedidos

### Parte 4: 📦 Repository Pattern
- **Interface Repository**: Contrato de dados
- **Implementação Concreta**: Prisma Repository
- **Mock Repository**: Para testes
- **Exercício**: Sistema de carrinho

### Parte 5: 🏭 Dependency Injection
- **Container IoC**: Gerenciamento de dependências
- **Service Locator**: Registro de serviços
- **Constructor Injection**: Injeção via construtor
- **Exercício**: Gateway de pagamento

### Parte 6: 🧪 Testes e Qualidade
- **Testes Unitários**: Lógica de negócio
- **Testes de Integração**: APIs completas
- **Mocks e Stubs**: Isolamento de dependências
- **Coverage**: Cobertura de código

## 📁 Estrutura Detalhada do Projeto

```
02-padroes-arquiteturais/
├── 📄 docker-compose.yml          # Orquestração containers
├── 📄 package.json               # Dependências e scripts
├── 📄 tsconfig.json              # Configuração TypeScript
├── 📄 jest.config.js             # Configuração testes
├── 📄 .env.example               # Variáveis de ambiente
├── 📄 README.md                  # Este arquivo
│
├── 📁 src/                       # 💻 Código fonte
│   ├── 📁 presentation/          # 🎨 Camada de apresentação
│   │   ├── 📁 controllers/       # Controllers REST
│   │   ├── 📁 middlewares/       # Middlewares Express
│   │   ├── 📁 routes/            # Definição de rotas
│   │   └── 📁 dtos/              # Data Transfer Objects
│   │
│   ├── 📁 business/              # ⚙️ Camada de negócio
│   │   ├── 📁 services/          # Serviços de aplicação
│   │   ├── 📁 usecases/          # Casos de uso
│   │   ├── 📁 domain/            # Entidades de domínio
│   │   └── 📁 interfaces/        # Contratos (ports)
│   │
│   ├── 📁 data/                  # 🗄️ Camada de dados
│   │   ├── 📁 repositories/      # Implementações Repository
│   │   ├── 📁 models/            # Models Prisma
│   │   ├── 📁 migrations/        # Migrations database
│   │   └── 📁 seeders/           # Seeds de dados
│   │
│   ├── 📁 infrastructure/        # 🔧 Infraestrutura
│   │   ├── 📁 database/          # Configuração banco
│   │   ├── 📁 cache/             # Configuração Redis
│   │   ├── 📁 container/         # IoC Container
│   │   └── 📁 external/          # APIs externas
│   │
│   ├── 📁 shared/                # 🤝 Código compartilhado
│   │   ├── 📁 utils/             # Utilitários
│   │   ├── 📁 constants/         # Constantes
│   │   ├── 📁 errors/            # Classes de erro
│   │   └── 📁 validators/        # Validadores Zod
│   │
│   └── 📄 app.ts                 # Entry point aplicação
│
├── 📁 tests/                     # 🧪 Testes
│   ├── 📁 unit/                  # Testes unitários
│   ├── 📁 integration/           # Testes integração
│   ├── 📁 mocks/                 # Mocks e stubs
│   └── 📁 fixtures/              # Dados de teste
│
├── 📁 docs/                      # 📚 Documentação
│   ├── 📄 architecture.md        # Decisões arquiteturais
│   ├── 📄 patterns.md            # Padrões implementados
│   └── 📄 api.md                 # Documentação API
│
└── 📁 scripts/                   # 🚀 Scripts automação
    ├── 📄 start.sh              # Iniciar desenvolvimento
    ├── 📄 test.sh               # Executar testes
    └── 📄 deploy.sh             # Deploy aplicação
```

## 🏛️ Padrões Arquiteturais Implementados

### 1. 🏗️ Arquitetura em Camadas (Layered)

**Implementação:**
```typescript
// Presentation Layer
class ProductController {
  constructor(private productService: ProductService) {}
  
  async create(req: Request, res: Response) {
    const dto = CreateProductDTO.parse(req.body);
    const product = await this.productService.create(dto);
    res.status(201).json(product);
  }
}

// Business Layer  
class ProductService {
  constructor(private repository: ProductRepository) {}
  
  async create(data: CreateProductDTO): Promise<Product> {
    const product = new Product(data);
    return this.repository.save(product);
  }
}

// Data Layer
class PrismaProductRepository implements ProductRepository {
  async save(product: Product): Promise<Product> {
    return this.prisma.product.create({ data: product });
  }
}
```

### 2. 🎭 MVC Pattern

**Estrutura implementada:**
- **Model**: Entidades de domínio com regras de negócio
- **View**: Serialização JSON com DTOs  
- **Controller**: Orquestração HTTP requests

### 3. 🔷 Arquitetura Hexagonal

**Ports & Adapters:**
```typescript
// Port (Interface)
interface PaymentGateway {
  processPayment(data: PaymentData): Promise<PaymentResult>;
}

// Adapter (Implementação)
class StripeAdapter implements PaymentGateway {
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    // Implementação específica Stripe
  }
}
```

### 4. 📦 Repository Pattern

**Abstração de dados:**
```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

class PrismaUserRepository implements UserRepository {
  // Implementação com Prisma
}

class InMemoryUserRepository implements UserRepository {
  // Implementação para testes
}
```

### 5. 🏭 Dependency Injection

**Container IoC:**
```typescript
class Container {
  private services = new Map();
  
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }
  
  resolve<T>(token: string): T {
    const factory = this.services.get(token);
    return factory();
  }
}
```

## 🧪 Exercícios Práticos

### Exercício 1: Implementar Camada de Produtos
```bash
# Criar toda estrutura para gestão de produtos
npm run exercise:products
```

### Exercício 2: Sistema de Autenticação MVC
```bash
# Implementar auth completo seguindo MVC
npm run exercise:auth
```

### Exercício 3: Carrinho com Repository Pattern
```bash
# Criar carrinho usando Repository Pattern
npm run exercise:cart
```

### Exercício 4: Gateway de Pagamento Hexagonal
```bash
# Implementar pagamento com Ports & Adapters
npm run exercise:payment
```

### Exercício 5: Testes com Dependency Injection
```bash
# Criar testes usando DI e mocks
npm run exercise:tests
```

## 📊 Endpoints da API

| Método | Endpoint | Descrição | Padrão Aplicado |
|--------|----------|-----------|-----------------|
| `GET` | `/health` | Health check | - |
| `POST` | `/auth/login` | Login usuário | MVC |
| `GET` | `/products` | Listar produtos | Layered |
| `POST` | `/products` | Criar produto | Repository |
| `GET` | `/cart` | Ver carrinho | Hexagonal |
| `POST` | `/orders` | Criar pedido | DI + Use Cases |
| `POST` | `/payments` | Processar pagamento | Adapter Pattern |

### Exemplos de Uso

```bash
# Autenticação
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "123456"}'

# Criar produto
curl -X POST http://localhost:8000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notebook Gamer",
    "price": 2999.99,
    "category": "electronics"
  }'

# Adicionar ao carrinho
curl -X POST http://localhost:8000/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "123", "quantity": 1}'
```

## 🔍 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Modo desenvolvimento com hot reload
npm run build            # Build para produção
npm run start            # Iniciar produção

# Banco de dados
npm run db:migrate       # Executar migrations
npm run db:seed          # Popular com dados iniciais
npm run db:reset         # Reset completo
npm run db:studio        # Abrir Prisma Studio

# Testes
npm run test             # Executar todos os testes
npm run test:unit        # Apenas testes unitários
npm run test:integration # Apenas testes integração
npm run test:coverage    # Cobertura de código

# Qualidade
npm run lint             # Verificar código
npm run lint:fix         # Corrigir automaticamente
npm run type-check       # Verificar tipos TypeScript

# Docker
npm run docker:up        # Subir containers
npm run docker:down      # Parar containers
npm run docker:logs      # Ver logs
```

## 🎯 Checkpoint: O que você aprendeu

Após completar este tutorial, marque os itens que você domina:

### Padrões Arquiteturais
- [ ] **Layered Architecture**: Organização em camadas bem definidas
- [ ] **MVC Pattern**: Separação Model-View-Controller
- [ ] **Hexagonal Architecture**: Isolamento do domínio
- [ ] **Repository Pattern**: Abstração de acesso a dados
- [ ] **Dependency Injection**: Inversão de controle

### Conceitos Avançados
- [ ] **Domain-Driven Design**: Modelagem focada no domínio
- [ ] **Clean Architecture**: Arquitetura limpa e testável
- [ ] **SOLID Principles**: Princípios de design aplicados
- [ ] **IoC Container**: Gerenciamento de dependências
- [ ] **Unit Testing**: Testes isolados e mocados

### Tecnologias
- [ ] **TypeScript**: Tipagem estática avançada
- [ ] **Prisma ORM**: Mapeamento objeto-relacional
- [ ] **Zod Validation**: Validação de schemas
- [ ] **Jest Testing**: Framework de testes
- [ ] **Docker Multi-stage**: Builds otimizadas

## 🔄 Comparação com Tutorial 1

| Aspecto | Tutorial 1 (Fundamentos) | Tutorial 2 (Padrões) |
|---------|---------------------------|----------------------|
| **Foco** | Conceitos básicos | Padrões avançados |
| **Linguagem** | JavaScript | TypeScript |
| **Arquitetura** | Containers separados | Camadas organizadas |
| **Testes** | Health checks | Testes unitários completos |
| **Complexidade** | Sistema simples | E-commerce completo |
| **Padrões** | Separação básica | 5+ padrões implementados |

## 🚀 Próximos Passos

### Melhorias Sugeridas
1. **Implementar Event Sourcing**
2. **Adicionar CQRS pattern**
3. **Criar API GraphQL**
4. **Implementar Circuit Breaker**
5. **Adicionar observabilidade completa**

### Continuar Aprendizado
**➡️ [Próximo Tutorial: Microsserviços na Prática](https://github.com/ernanegit/03-microservicos-pratica)**

Onde você aprenderá:
- Decomposição de monólitos
- API Gateway pattern
- Service Discovery
- Distributed Tracing

## 📚 Referências e Links Úteis

- [Clean Architecture - Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

## 🤝 Contribuições

Encontrou algum problema ou tem sugestões?

1. Fork este repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 👨‍💻 Autor

**Erne** - Estudante de Arquitetura de Software
- GitHub: [@ernanegit](https://github.com/ernanegit)

## 📄 Licença

Este projeto é para fins educacionais e de aprendizado.

---

> **💡 Dica:** Este tutorial eleva significativamente o nível! Reserve tempo para praticar cada padrão individualmente antes de prosseguir.

---

**📚 [← Voltar ao Índice Principal](https://github.com/ernanegit/00-arquitetura-software-index)** | **[← Tutorial Anterior: Fundamentos](https://github.com/ernanegit/01-fundamentos-arquitetura-software)** | **[Próximo Tutorial: Microsserviços →](https://github.com/ernanegit/03-microservicos-pratica)**
