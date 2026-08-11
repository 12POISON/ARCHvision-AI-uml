export interface EditorTemplate {
  id: string;
  name: string;
  description: string;
  category: "diagram" | "uml" | "flow" | "planning";
  icon: string;
  build: () => string;
}

const graph = (type: string, body: string): string => `${type} TD
${body}`;

export const TEMPLATES: EditorTemplate[] = [
  {
    id: "todo",
    name: "Todo App",
    description: "Single-responsibility services in a clean architecture flow",
    category: "diagram",
    icon: "✓",
    build: () => graph("flowchart", `A[User] --> B[UI Layer]
B --> C[Todo Service]
C --> D[Todo Store]
D --> E[(SQLite)]
C --> F[Notification Service]
F --> A`),
  },
  {
    id: "payment",
    name: "Payment Flow",
    description: "Online checkout with fraud check and webhook retries",
    category: "flow",
    icon: "♻",
    build: () => graph("flowchart", `Start([Checkout]) --> C{Card valid?}
C -- Yes --> R[Charge Gateway]
C -- No --> E[Show Error]
R --> F[Webhook]
F -->|retry x3| G[Update Order]
G --> Done([Receipt])`),
  },
  {
    id: "er-shop",
    name: "E-commerce ER",
    description: "Users, orders, products and their relations",
    category: "diagram",
    icon: "▤",
    build: () => `erDiagram
USER ||--o{ ORDER : places
ORDER ||--|{ ORDER_ITEM : contains
PRODUCT ||--o{ ORDER_ITEM : included_in
PRODUCT }o--|| CATEGORY : belongs_to
ADDRESS ||--o{ USER : has`,
  },
  {
    id: "class-library",
    name: "Library Class",
    description: "Domain model with inheritance and composition",
    category: "uml",
    icon: "☰",
    build: () => `classDiagram
class Book {
  +String title
  +String isbn
  +read() void
}
class EBook {
  +String format
  +download() void
}
class Library {
  +List~Book~ books
  +add(Book) void
}
Book <|-- EBook
Library *-- Book
Library o-- Member : "borrows"`,
  },
  {
    id: "seq-login",
    name: "Login Sequence",
    description: "Token-based auth flow between four actors",
    category: "uml",
    icon: "⇢",
    build: () => `sequenceDiagram
participant U as User
participant C as Client
participant S as Auth Server
participant D as User DB
U->>C: username + password
C->>S: POST /login
S->>D: SELECT user
D-->>S: hash
S-->>C: JWT token
C-->>U: session cookie`,
  },
  {
    id: "state-order",
    name: "Order States",
    description: "Order lifecycle with transitions and guards",
    category: "diagram",
    icon: "◉",
    build: () => `stateDiagram-v2
[*] --> Pending
Pending --> Paid : payment received
Paid --> Shipped : item dispatched
Shipped --> Delivered : signature
Delivered --> [*]
Paid --> Refunded : cancelled
Refunded --> [*]`,
  },
  {
    id: "graph-social",
    name: "Social Graph",
    description: "Friends and follow relations in a small network",
    category: "diagram",
    icon: "◍",
    build: () => graph("graph", `A[Alice] --- B[Bob]
B --- C[Carol]
C --- A
A --- D[Dan]
B --- E[Erin]
D --- F[Fay]`),
  },
  {
    id: "mindmap-project",
    name: "Project Mindmap",
    description: "Break a release into workstreams and tasks",
    category: "planning",
    icon: "✸",
    build: () => `mindmap
  root((Release 1.0))
    Frontend
      Design system
      Auth screens
      Settings
    Backend
      API gateway
      Payments
      Search
    Ops
      CI pipeline
      Monitoring
      Migrations`,
  },
  {
    id: "timeline-onboarding",
    name: "Onboarding Timeline",
    description: "Week-by-week plan for a new engineer",
    category: "planning",
    icon: "▤",
    build: () => `timeline
title Engineering Onboarding
Week 1 : Setup laptop : Meet team : Read runbooks
Week 2 : First ticket : Pair with mentor
Week 3 : Deploy a service : On-call shadow
Week 4 : Take full ownership`,
  },
  {
    id: "class-abstract-factory",
    name: "Abstract Factory",
    description: "Families of UI controls without concrete classes",
    category: "uml",
    icon: "◫",
    build: () => `classDiagram
    class UIFactory {
      <<interface>>
      +createButton() Button
      +createInput() Input
    }
    class WindowsFactory {
      +createButton() Button
      +createInput() Input
    }
    class MacFactory {
      +createButton() Button
      +createInput() Input
    }
    class Button {
      <<interface>>
      +render() void
    }
    class WindowsButton {
      +render() void
    }
    class MacButton {
      +render() void
    }
    class App {
      -factory: UIFactory
      +init(factory) void
    }
    UIFactory <|-- WindowsFactory
    UIFactory <|-- MacFactory
    Button <|-- WindowsButton
    Button <|-- MacButton
    App --> UIFactory
    WindowsFactory ..> WindowsButton : creates
    MacFactory ..> MacButton : creates`,
  },
  {
    id: "class-decorator",
    name: "Decorator",
    description: "Wrap notifications with logging, retry and encryption",
    category: "uml",
    icon: "◫",
    build: () => `classDiagram
    class Notifier {
      <<interface>>
      +send(message) void
    }
    class BaseNotifier {
      +send(message) void
    }
    class NotifierDecorator {
      #wrapped: Notifier
    }
    class LoggingDecorator {
      +send(message) void
    }
    class RetryDecorator {
      +send(message) void
    }
    class EncryptedDecorator {
      +send(message) void
    }
    Notifier <|-- BaseNotifier
    Notifier <|-- NotifierDecorator
    NotifierDecorator o-- Notifier : wraps
    NotifierDecorator <|-- LoggingDecorator
    NotifierDecorator <|-- RetryDecorator
    NotifierDecorator <|-- EncryptedDecorator`,
  },
  {
    id: "class-adapter",
    name: "Adapter",
    description: "Make a legacy payment gateway match the new interface",
    category: "uml",
    icon: "◫",
    build: () => `classDiagram
    class PaymentGateway {
      <<interface>>
      +pay(amount) void
      +refund(txnId) void
    }
    class StripeGateway {
      +pay(amount) void
      +refund(txnId) void
    }
    class LegacyPayProcessor {
      +processUSD(amount) void
      +reverseUSD(txnId) void
    }
    class LegacyAdapter {
      -legacy: LegacyPayProcessor
      +pay(amount) void
      +refund(txnId) void
    }
    class Checkout {
      -gateway: PaymentGateway
      +checkout(cart) void
    }
    PaymentGateway <|-- StripeGateway
    PaymentGateway <|-- LegacyAdapter
    LegacyAdapter --> LegacyPayProcessor
    Checkout --> PaymentGateway`,
  },
  {
    id: "class-repository",
    name: "Repository",
    description: "Data access abstraction over SQL and cache",
    category: "uml",
    icon: "◫",
    build: () => `classDiagram
    class UserRepository {
      <<interface>>
      +findById(id) User
      +save(user) void
      +delete(id) void
    }
    class SqlUserRepository {
      -db: Database
      +findById(id) User
      +save(user) void
      +delete(id) void
    }
    class CachedUserRepository {
      -inner: UserRepository
      +findById(id) User
      +save(user) void
      +delete(id) void
    }
    class UserService {
      -repo: UserRepository
      +getUser(id) User
      +register(user) void
    }
    UserRepository <|-- SqlUserRepository
    UserRepository <|-- CachedUserRepository
    CachedUserRepository o-- UserRepository : delegates
    SqlUserRepository --> Database
    UserService --> UserRepository`,
  },
  {
    id: "class-singleton",
    name: "Singleton",
    description: "One global configuration object for the app",
    category: "uml",
    icon: "◫",
    build: () => `classDiagram
    class Config {
      -static instance: Config
      -settings: Map
      -Config()
      +static getInstance() Config
      +get(key) string
      +set(key, value) void
    }
    class AppServer {
      -config: Config
      +start() void
    }
    class Metrics {
      -config: Config
      +record(event) void
    }
    AppServer ..> Config : uses
    Metrics ..> Config : uses`,
  },
  {
    id: "class-strategy",
    name: "Strategy",
    description: "Swap pricing rules at runtime",
    category: "uml",
    icon: "◫",
    build: () => `classDiagram
    class PricingStrategy {
      <<interface>>
      +calculate(base) double
    }
    class FlatPricing {
      +calculate(base) double
    }
    class TieredPricing {
      +calculate(base) double
    }
    class SeasonalPricing {
      +calculate(base) double
    }
    class Cart {
      -strategy: PricingStrategy
      +setStrategy(s) void
      +total() double
    }
    PricingStrategy <|-- FlatPricing
    PricingStrategy <|-- TieredPricing
    PricingStrategy <|-- SeasonalPricing
    Cart o-- PricingStrategy`,
  },
  {
    id: "class-observer",
    name: "Observer",
    description: "Notify subscribers when stock changes",
    category: "uml",
    icon: "◫",
    build: () => `classDiagram
    class Subject {
      <<interface>>
      +attach(observer) void
      +detach(observer) void
      +notify() void
    }
    class Stock {
      -observers: List
      -price: double
      +setPrice(price) void
      +notify() void
    }
    class Observer {
      <<interface>>
      +update(symbol, price) void
    }
    class PriceChart {
      +update(symbol, price) void
    }
    class AlertEmail {
      +update(symbol, price) void
    }
    Subject <|-- Stock
    Observer <|-- PriceChart
    Observer <|-- AlertEmail
    Stock o-- Observer : notifies`,
  },
  {
    id: "class-state",
    name: "State Pattern",
    description: "Order moves between states, each handling its own behavior",
    category: "uml",
    icon: "◫",
    build: () => `classDiagram
    class Order {
      -state: OrderState
      +ship() void
      +cancel() void
      +setState(s) void
    }
    class OrderState {
      <<interface>>
      +ship(order) void
      +cancel(order) void
    }
    class PendingState {
      +ship(order) void
      +cancel(order) void
    }
    class PaidState {
      +ship(order) void
      +cancel(order) void
    }
    class ShippedState {
      +ship(order) void
      +cancel(order) void
    }
    OrderState <|-- PendingState
    OrderState <|-- PaidState
    OrderState <|-- ShippedState
    Order o-- OrderState : state`,
  },
];

export const TEMPLATE_CATEGORIES: EditorTemplate["category"][] = [
  "diagram",
  "flow",
  "uml",
  "planning",
];

export function templateById(id: string): EditorTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
