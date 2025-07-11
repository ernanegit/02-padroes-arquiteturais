# 2. Padrões Arquiteturais

> **📚 [← Voltar ao Índice Principal](https://github.com/ernanegit/00-arquitetura-software-index)** | **[← Tutorial Anterior: Fundamentos](https://github.com/ernanegit/01-fundamentos-arquitetura-software)** | **[Próximo Tutorial: Microsserviços →](https://github.com/ernanegit/03-microservicos-pratica)**

Sistema de e-commerce **100% funcional** desenvolvido para demonstrar na prática os principais **padrões arquiteturais** usando TypeScript, Clean Architecture e Design Patterns.

## 🎯 Objetivos de Aprendizado

Ao completar este tutorial, você será capaz de:

- ✅ **Implementar Arquitetura em Camadas** (Layered Architecture)
- ✅ **Aplicar MVC Pattern** na prática
- ✅ **Construir Arquitetura Hexagonal** (Ports & Adapters)
- ✅ **Usar Repository Pattern** para abstração de dados
- ✅ **Implementar Dependency Injection** para baixo acoplamento
- ✅ **Aplicar Domain-Driven Design** básico
- ✅ **Configurar ambiente de desenvolvimento** eficiente

## 🏗️ O que vamos construir

Um **sistema de e-commerce completo** aplicando diferentes padrões arquiteturais:

- 🛒 **Gestão de Produtos** (CRUD com validações Zod)
- 👤 **Gestão de Usuários** (Autenticação JWT e autorização)
- 🛍️ **Carrinho de Compras** (Cache Redis e estado)
- 📦 **Processamento de Pedidos** (Workflow complexo)
- 🔐 **Sistema de Autenticação** (JWT + Refresh tokens)

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
| **Validation** | Zod | Latest | Validação de schemas |
| **Auth** | JWT + bcrypt | Latest | Autenticação segura |
| **Container** | Docker + Compose | Latest | Containerização |

## 🚀 Como Executar

### 🔥 **Setup Automático (Recomendado)**

```bash
# 1. Clone o repositório
git clone https://github.com/ernanegit/02-padroes-arquiteturais.git
cd 02-padroes-arquiteturais

# 2. Instale dependências
npm install

# 3. Configure ambiente (cria .env automaticamente)
npm run dev:setup
```

### ⚡ **Setup Manual**

```bash
# 1. Clone e instale
git clone https://github.com/ernanegit/02-padroes-arquiteturais.git
cd 02-padroes-arquiteturais
npm install

# 2. Configure ambiente
cp .env.example .env

# 3. Inicie dependências (PostgreSQL + Redis)
npm run docker:deps

# 4. Aguarde 10 segundos para containers iniciarem
# ...

# 5. Execute migrations e seed
npm run db:migrate
npm run db:seed

# 6. Inicie desenvolvimento (porta 3001)
npm run dev:local
```

### 🎯 **Acessar Aplicação**

- **🌐 API Desenvolvimento:** http://localhost:3001
- **📊 API Docs:** http://localhost:3001/docs
- **💓 Health Check:** http://localhost:3001/health
- **🗄️ Database:** localhost:5432
- **💾 Redis:** localhost:6379

### 🔑 **Credenciais de Teste**

```
Admin: admin@ecommerce.com / password123
Customer: customer@example.com / password123
```

## 📚 Scripts Disponíveis

### 🔧 **Desenvolvimento**
```bash
npm run dev:setup      # Setup completo automático
npm run dev:local      # Aplicação local (porta 3001)
npm run docker:deps    # Apenas PostgreSQL + Redis
```

### 🚀 **Produção**
```bash
npm run prod:up        # Aplicação completa Docker (porta 8000)
npm run prod:down      # Parar produção
npm run prod:logs      # Ver logs produção
```

### 🗄️ **Database**
```bash
npm run db:migrate     # Executar migrations
npm run db:seed        # Popular com dados de teste
npm run db:reset       # Reset completo
npm run db:studio      # Interface visual Prisma
```

### 🧪 **Testes e Qualidade**
```bash
npm run test           # Executar testes
npm run test:coverage  # Cobertura de código
npm run lint           # Verificar código
npm run type-check     # Verificar tipos TypeScript
```

## 🏛️ Padrões Arquiteturais Implementados

### 1. 🏗️ **Arquitetura em Camadas (Layered)**

Separação clara de responsabilidades em camadas bem definidas:

```typescript
// 🎨 PRESENTATION LAYER
class ProductController {
  constructor(private productService: ProductService) {}
  
  async create(req: Request, res: Response) {
    const dto = CreateProductDTO.parse(req.body);
    const product = await this.productService.create(dto);
    res.status(201).json(product);
  }
}

// ⚙️ BUSINESS LAYER  
class ProductService {
  constructor(private repository: ProductRepository) {}
  
  async create(data: CreateProductDTO): Promise<Product> {
    const product = new Product(data);
    return this.repository.save(product);
  }
}

// 🗄️ DATA LAYER
class PrismaProductRepository implements ProductRepository {
  async save(product: Product): Promise<Product> {
    return this.prisma.product.create({ data: product });
  }
}
```

### 2. 🎭 **MVC Pattern**

Estrutura Model-View-Controller implementada:
- **Model**: Entidades de domínio com regras de negócio
- **View**: Serialização JSON com DTOs validados  
- **Controller**: Orquestração de HTTP requests

### 3. 🔷 **Arquitetura Hexagonal (Ports & Adapters)**

Isolamento do domínio através de interfaces:

```typescript
// 🔌 PORT (Interface)
interface PaymentGateway {
  processPayment(data: PaymentData): Promise<PaymentResult>;
}

// 🔧 ADAPTER (Implementação)
class StripeAdapter implements PaymentGateway {
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    // Implementação específica Stripe
  }
}
```

### 4. 📦 **Repository Pattern**

Abstração completa de acesso a dados:

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// Implementação real
class PrismaUserRepository implements UserRepository {
  // Implementação com Prisma
}

// Implementação para testes
class InMemoryUserRepository implements UserRepository {
  // Implementação em memória
}
```

### 5. 🏭 **Dependency Injection**

Container IoC completo para gerenciamento de dependências:

```typescript
class Container {
  private services = new Map();
  
  registerSingleton<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }
  
  resolve<T>(token: string): T {
    const factory = this.services.get(token);
    return factory();
  }
}
```

## 📊 Endpoints da API

| Método | Endpoint | Descrição | Padrão Aplicado |
|--------|----------|-----------|-----------------|
| `GET` | `/health` | Health check | Monitoring |
| `GET` | `/docs` | Documentação | - |
| `POST` | `/api/v1/auth/login` | Login usuário | MVC + JWT |
| `GET` | `/api/v1/products` | Listar produtos | Layered + Repository |
| `POST` | `/api/v1/products` | Criar produto | DI + Validation |
| `GET` | `/api/v1/cart` | Ver carrinho | Hexagonal + Cache |
| `POST` | `/api/v1/orders` | Criar pedido | Clean Architecture |
| `GET` | `/api/v1/users` | Listar usuários | Authorization |

### 🧪 **Exemplos de Teste**

```bash
# Health Check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecommerce.com", "password": "password123"}'

# Listar produtos
curl http://localhost:3001/api/v1/products

# Criar usuário
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## 📁 Estrutura do Projeto

```
02-padroes-arquiteturais/
├── 📁 src/                       # 💻 Código fonte
│   ├── 📁 presentation/          # 🎨 Camada de apresentação
│   │   ├── 📁 controllers/       # Controllers REST
│   │   ├── 📁 middlewares/       # Auth, Validation, Error handling
│   │   ├── 📁 routes/            # Definição de rotas
│   │   └── 📁 dtos/              # Data Transfer Objects (Zod)
│   │
│   ├── 📁 business/              # ⚙️ Camada de negócio
│   │   ├── 📁 services/          # Serviços de aplicação
│   │   ├── 📁 domain/            # Entidades de domínio
│   │   └── 📁 interfaces/        # Contratos (ports)
│   │
│   ├── 📁 data/                  # 🗄️ Camada de dados
│   │   ├── 📁 repositories/      # Repository implementations
│   │   └── 📁 seeders/           # Database seeders
│   │
│   ├── 📁 infrastructure/        # 🔧 Infraestrutura
│   │   ├── 📁 database/          # Configuração Prisma
│   │   ├── 📁 cache/             # Configuração Redis
│   │   └── 📁 container/         # IoC Container
│   │
│   ├── 📁 shared/                # 🤝 Código compartilhado
│   │   ├── 📁 utils/             # Utilitários
│   │   ├── 📁 errors/            # Classes de erro
│   │   └── 📁 validators/        # Validadores Zod
│   │
│   └── 📄 app.ts                 # Entry point aplicação
│
├── 📁 prisma/                    # 🗃️ Database
│   └── schema.prisma             # Schema do banco
│
├── 📁 tests/                     # 🧪 Testes
│   ├── 📁 fixtures/              # Dados de teste
│   ├── 📁 unit/                  # Testes unitários
│   └── 📁 integration/           # Testes integração
│
├── 📁 scripts/                   # 🚀 Scripts automação
│   └── dev.ps1                   # Script desenvolvimento Windows
│
├── 📄 docker-compose.yml         # 🐳 Orquestração containers
├── 📄 docker-compose.dev.yml     # 🔧 Containers desenvolvimento
├── 📄 package.json              # Dependências e scripts
└── 📄 .env.example              # Variáveis de ambiente
```

## 🎯 Funcionalidades Implementadas

### ✅ **Sistema de Autenticação**
- Login com JWT tokens
- Refresh tokens automáticos
- Hash de senhas com bcrypt
- Middleware de autenticação/autorização
- Diferentes níveis de acesso (Admin, Customer, Moderator)

### ✅ **Gestão de Produtos**
- CRUD completo com validações
- Sistema de categorias
- Controle de estoque
- Busca e filtros
- Ativação/desativação

### ✅ **Sistema de Carrinho**
- Sessões com Redis
- Adição/remoção de itens
- Cálculo automático de totais
- Validação de estoque
- Merge de carrinho de guest/usuário

### ✅ **Processamento de Pedidos**
- Workflow completo de pedidos
- Estados bem definidos
- Cálculo de impostos e frete
- Histórico de status
- Integração com estoque

### ✅ **Infraestrutura Robusta**
- Health checks
- Logs estruturados
- Error handling centralizado
- Validação de schemas
- Cache inteligente

## 🔍 Configuração de Desenvolvimento vs Produção

### 🔧 **Desenvolvimento**
- **Porta**: 3001
- **Database**: Docker PostgreSQL
- **Cache**: Docker Redis  
- **Aplicação**: Local (hot reload)
- **Logs**: Detalhados

### 🚀 **Produção**
- **Porta**: 8000
- **Setup**: Docker Compose completo
- **Otimizações**: Multi-stage builds
- **Logs**: Estruturados

## 🎯 Checkpoint: O que você domina

Marque os padrões que você implementou com sucesso:

### Padrões Arquiteturais
- [x] **Layered Architecture**: ✅ Implementado
- [x] **MVC Pattern**: ✅ Implementado
- [x] **Hexagonal Architecture**: ✅ Implementado
- [x] **Repository Pattern**: ✅ Implementado
- [x] **Dependency Injection**: ✅ Implementado

### Conceitos Avançados
- [x] **Domain-Driven Design**: ✅ Implementado
- [x] **Clean Architecture**: ✅ Implementado
- [x] **SOLID Principles**: ✅ Aplicados
- [x] **IoC Container**: ✅ Funcional
- [x] **Data Validation**: ✅ Zod schemas

### Tecnologias
- [x] **TypeScript**: ✅ Tipagem avançada
- [x] **Prisma ORM**: ✅ Migrations e queries
- [x] **Redis Cache**: ✅ Sessões e performance
- [x] **JWT Auth**: ✅ Segurança implementada
- [x] **Docker**: ✅ Containerização completa

## 🚀 Próximos Passos

### Melhorias Sugeridas
1. **Implementar Event Sourcing**
2. **Adicionar CQRS pattern**
3. **Criar testes unitários completos**
4. **Implementar Circuit Breaker**
5. **Adicionar observabilidade (metrics/tracing)**

### Continuar Aprendizado
**➡️ [Próximo Tutorial: Microsserviços na Prática](https://github.com/ernanegit/03-microservicos-pratica)**

Onde você aprenderá:
- Decomposição de monólitos
- API Gateway pattern
- Service Discovery
- Distributed Tracing

## 🛠️ Troubleshooting

### Problemas Comuns

**🔴 Erro de porta em uso:**
```bash
# Verificar processos na porta
netstat -ano | findstr :3001
# Usar script automático
npm run dev:setup
```

**🔴 Banco não conecta:**
```bash
# Verificar containers
docker-compose ps
# Restart dependências
npm run docker:deps
```

**🔴 Erro de dependências:**
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📚 Referências e Links Úteis

- [Clean Architecture - Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Validation](https://zod.dev/)

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

> **🎉 Sucesso Garantido:** Este tutorial foi testado e está 100% funcional! Siga os passos e você terá uma aplicação completa rodando em minutos.

---

**📚 [← Voltar ao Índice Principal](https://github.com/ernanegit/00-arquitetura-software-index)** | **[← Tutorial Anterior: Fundamentos](https://github.com/ernanegit/01-fundamentos-arquitetura-software)** | **[Próximo Tutorial: Microsserviços →](https://github.com/ernanegit/03-microservicos-pratica)**