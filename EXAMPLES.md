# Product Maker - Example Prompts

This file contains battle-tested prompts for different types of products.

## SaaS Applications

### Project Management Tool

```bash
/product-maker:build-product "
Build a project management SaaS called TaskFlow:

Core Features:
- User authentication with email/password and Google OAuth
- Project creation and management (CRUD)
- Task system with status tracking (todo, in-progress, done)
- Task assignment to team members
- Due dates and priority levels
- Comments and activity feed
- File attachments for tasks
- Team collaboration with real-time updates

Technical Stack:
- Frontend: Next.js 14 with App Router + TypeScript
- UI: Tailwind CSS + shadcn/ui components
- Backend: tRPC for type-safe APIs
- Database: PostgreSQL with Prisma ORM
- Auth: NextAuth.js
- Real-time: WebSockets via Socket.io
- File storage: AWS S3 or Cloudinary
- Deployment: Vercel

Quality Requirements:
- Test coverage > 80% (Vitest + React Testing Library)
- TypeScript strict mode enabled
- ESLint + Prettier configured
- API documentation via tRPC
- Error boundaries for all routes
- Loading states for all async operations
- Toast notifications for user actions

Success Criteria:
- All features implemented and working
- User can sign up, create projects, add tasks
- Real-time collaboration working
- File uploads functional
- All tests passing
- Deployed to Vercel with SSL
- README with setup instructions

Output <promise>TASKFLOW_DEPLOYED</promise> when complete.
" --max-iterations 150 --completion-promise "TASKFLOW_DEPLOYED"
```

### E-commerce Platform

```bash
/product-maker:build-product "
Build an e-commerce platform called ShopSwift:

Features:
- Product catalog with search and filters
- Shopping cart with quantity management
- Checkout process with Stripe integration
- Order history and tracking
- User accounts and authentication
- Admin panel for product management
- Inventory tracking
- Email notifications for orders
- Responsive mobile-first design

Tech Stack:
- Frontend: React + Vite + TypeScript
- State: Zustand for global state
- Styling: Tailwind CSS
- Backend: Express.js + TypeScript
- Database: MongoDB with Mongoose
- Payment: Stripe
- Email: SendGrid
- Deployment: Frontend on Vercel, Backend on Railway

Requirements:
- Payment flow fully tested with Stripe test mode
- Order confirmation emails
- Admin can add/edit/delete products
- Product images optimized
- SEO-friendly URLs
- Test coverage >75%

Completion:
- All user flows working
- Payment processing tested
- Admin panel functional
- Deployed to production
- SSL configured
- Performance score >90 on Lighthouse

Output <promise>SHOP_LIVE</promise> when ready.
" --max-iterations 180 --completion-promise "SHOP_LIVE"
```

## API Services

### REST API for Mobile App

```bash
/product-maker:build-product "
Build a REST API for a fitness tracking mobile app:

Endpoints Required:
- POST /api/auth/register - User registration
- POST /api/auth/login - User login with JWT
- GET /api/user/profile - Get user profile
- PUT /api/user/profile - Update profile
- POST /api/workouts - Log workout
- GET /api/workouts - List user workouts
- GET /api/workouts/:id - Get workout details
- DELETE /api/workouts/:id - Delete workout
- GET /api/stats - Get user statistics
- POST /api/goals - Set fitness goals

Technical:
- Framework: Fastify (for performance)
- Language: TypeScript
- Database: PostgreSQL + Prisma
- Auth: JWT tokens
- Validation: Zod schemas
- Documentation: Swagger/OpenAPI
- Rate limiting: 100 req/min per user
- Testing: Vitest + Supertest
- Deployment: Railway with CI/CD

Quality Standards:
- All inputs validated with Zod
- Proper error handling (400, 401, 404, 500)
- Database migrations for schema
- API versioning (/api/v1/)
- Request logging
- CORS configured
- Environment variables for secrets
- Test coverage 100%

Success Criteria:
- All endpoints working and documented
- Swagger UI accessible at /api/docs
- All tests passing
- Database migrations working
- Deployed with SSL
- Performance: <100ms avg response time

Output <promise>API_PRODUCTION_READY</promise> when complete.
" --max-iterations 100 --completion-promise "API_PRODUCTION_READY"
```

## Automation Tools

### n8n Workflow Automation Platform

```bash
/product-maker:build-product "
Build a workflow automation platform similar to n8n:

Core Features:
- Visual workflow editor (drag-and-drop)
- Pre-built nodes for common services:
  * Gmail (send, read)
  * Slack (post message, read channels)
  * HTTP Request (GET, POST, PUT, DELETE)
  * Google Sheets (read, write)
  * Database (PostgreSQL, MySQL)
  * Schedule (cron triggers)
  * Webhooks (incoming/outgoing)
- Workflow execution engine
- Execution history and logs
- Error handling and retry logic
- Environment variables per workflow
- User authentication and workspaces

Technical Stack:
- Frontend: React + React Flow for visual editor
- Backend: Node.js + Express
- Database: PostgreSQL (workflows) + Redis (queue)
- Queue: Bull for job processing
- Auth: Clerk
- Deployment: Docker on DigitalOcean

Requirements:
- Workflows saved as JSON
- Real-time execution status
- Webhook testing playground
- Credential management (encrypted)
- Rate limiting per workflow
- Export/import workflows
- Template library

Success Metrics:
- Can create a workflow visually
- Execute workflows manually and on schedule
- Webhooks trigger workflows
- Error handling works correctly
- All integrations functional
- Test coverage >70%
- Deployed with Docker Compose

Output <promise>AUTOMATION_LIVE</promise> when deployed.
" --max-iterations 200 --completion-promise "AUTOMATION_LIVE"
```

## Internal Tools

### Admin Dashboard

```bash
/product-maker:build-product "
Build an admin dashboard for managing a SaaS application:

Features:
- User management (view, edit, delete, ban)
- Analytics dashboard with charts
- Transaction history
- Support ticket system
- System health monitoring
- Activity logs
- Email campaign manager
- Feature flags management
- API key management

Tech Stack:
- Frontend: Next.js + TypeScript
- UI: Ant Design or Material-UI
- Charts: Recharts
- Backend: Next.js API routes
- Database: PostgreSQL + Prisma
- Auth: Role-based access control
- Deployment: Vercel

Requirements:
- Real-time metrics
- Export data to CSV
- Search and filtering for all tables
- Pagination for large datasets
- Audit logs for admin actions
- Dark mode support
- Mobile responsive

Completion Criteria:
- All admin functions working
- Charts displaying real data
- Export functionality tested
- RBAC implemented correctly
- Audit logs recording actions
- Deployed to production
- Test coverage >75%

Output <promise>DASHBOARD_DEPLOYED</promise> when live.
" --max-iterations 120 --completion-promise "DASHBOARD_DEPLOYED"
```

## Mobile Applications

### React Native App

```bash
/product-maker:build-product "
Build a React Native mobile app for expense tracking:

Features:
- User authentication (email/password)
- Add/edit/delete expenses
- Category management
- Monthly budget tracking
- Expense analytics with charts
- Receipt photo capture
- Export to PDF/CSV
- Offline mode with sync
- Push notifications for budget alerts

Technical:
- Framework: React Native (Expo)
- Navigation: React Navigation
- State: Redux Toolkit
- Backend: Firebase (Auth, Firestore, Storage)
- Charts: Victory Native
- Camera: expo-camera
- Notifications: expo-notifications

Requirements:
- Works on iOS and Android
- Offline-first architecture
- Data syncs when online
- Receipt images compressed
- Test coverage >60%
- App icons and splash screen
- Beta testing with TestFlight/Play Console

Success Criteria:
- App builds successfully
- All features working on both platforms
- Offline mode functional
- Published to TestFlight and Play Console (beta)
- Basic tests passing
- README with build instructions

Output <promise>APP_IN_BETA</promise> when published to beta.
" --max-iterations 150 --completion-promise "APP_IN_BETA"
```

## Migrations & Refactors

### Framework Migration

```bash
/product-maker:build-product "
Migrate existing Express.js API to Fastify:

Current State:
- Express.js with CommonJS
- 45 API endpoints
- MongoDB with Mongoose
- Passport.js authentication
- Jest for testing

Target State:
- Fastify with TypeScript
- All 45 endpoints migrated
- Keep MongoDB + Mongoose
- Switch to JWT authentication
- Vitest for testing
- 40% performance improvement

Migration Steps:
1. Set up Fastify project with TypeScript
2. Migrate routes group by group
3. Update authentication to JWT
4. Convert tests to Vitest
5. Add request validation with Zod
6. Performance benchmarking
7. Deploy to staging
8. Run load tests

Requirements:
- All endpoints maintain same behavior
- No breaking changes to API contracts
- Response time improved by 40%
- All tests updated and passing
- API documentation updated
- Staging deployment successful

Output <promise>MIGRATION_COMPLETE</promise> when:
- All endpoints migrated
- Performance benchmarks met
- Tests at 100% passing
- Deployed to staging
- Documentation updated

" --max-iterations 80 --completion-promise "MIGRATION_COMPLETE"
```

## Quick Templates

### Simple CRUD API

```bash
/product-maker:build-product "
Build a simple CRUD API for [RESOURCE]:
- Express + TypeScript
- PostgreSQL + Prisma
- JWT auth
- Full CRUD operations
- Input validation
- Error handling
- Test coverage >80%
- Deploy to Railway

Output <promise>API_DEPLOYED</promise> when live.
" --max-iterations 50 --completion-promise "API_DEPLOYED"
```

### Landing Page

```bash
/product-maker:build-product "
Build a landing page for [PRODUCT]:
- Next.js + Tailwind
- Hero section
- Features section
- Pricing table
- FAQ
- Contact form
- SEO optimized
- Mobile responsive
- Deploy to Vercel

Output <promise>LANDING_LIVE</promise> when deployed.
" --max-iterations 40 --completion-promise "LANDING_LIVE"
```

### Chrome Extension

```bash
/product-maker:build-product "
Build a Chrome extension for [FUNCTIONALITY]:
- Manifest V3
- React for popup
- Background service worker
- Content scripts
- Chrome storage
- Options page
- Published to Chrome Web Store (unlisted)

Output <promise>EXTENSION_PUBLISHED</promise> when submitted.
" --max-iterations 60 --completion-promise "EXTENSION_PUBLISHED"
```

## Tips for Writing Prompts

1. **Be Specific**: Include exact tech stack, not just "modern stack"
2. **Define Success**: Clear completion criteria, not "make it good"
3. **Include Quality Metrics**: Test coverage, performance, etc.
4. **Specify Deployment**: Where and how the product goes live
5. **Break Down Large Projects**: Use phases for >200 iteration projects
6. **Use Verifiable Promises**: Things that can be objectively checked
7. **Include Error Handling**: Explicitly mention edge cases
8. **Think Like a PM**: What would you put in a PRD?

## Prompt Template

```bash
/product-maker:build-product "
Build a [PRODUCT TYPE] called [NAME]:

Core Features:
- Feature 1: [details]
- Feature 2: [details]
- Feature 3: [details]

Technical Stack:
- Frontend: [framework]
- Backend: [framework]
- Database: [system]
- Deployment: [platform]

Quality Standards:
- Test coverage > [N]%
- Performance: [specific metrics]
- Documentation: [what docs needed]

Success Criteria:
- Criteria 1
- Criteria 2
- Criteria 3

Output <promise>SPECIFIC_UNIQUE_PROMISE</promise> when complete.
" --max-iterations [N] --completion-promise "SPECIFIC_UNIQUE_PROMISE"
```

---

Use these examples as starting points and customize for your specific needs!
