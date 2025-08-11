# Restaurant Menu Admin Panel

A Next.js admin panel for restaurant menu management with authentication.

## Features

- 🔐 **Authentication System**: Login/logout functionality with protected routes
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🚀 **Fast**: Built with Next.js 15 and React 19

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

### Login Credentials
**Note**: Authentication is handled by your external API service at `http://localhost:8080`. The credentials and validation logic are managed by your authentication service, not this frontend application.

### How it Works

1. **Protected Routes**: All pages except `/login` require authentication
2. **Token Storage**: JWT tokens are stored in localStorage
3. **Auto-redirect**: Unauthenticated users are automatically redirected to login
4. **Persistent Sessions**: Login state persists across page refreshes

### API Endpoints

- `POST http://localhost:8080/api/auth/signin` - External authentication endpoint
  - Headers: `Accept: application/json`
  - Body: `{ "username": "string", "password": "string" }`
  - Returns: `{ "username": "string", "email": "string", "token": "string", "type": "Bearer" }`

**Note**: This app connects to an external authentication service running on `localhost:8080`. Make sure your authentication service is running before testing the login functionality.

## Project Structure

```
src/
├── app/
│   ├── api/login/          # Login API endpoint
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout with auth provider
│   └── page.tsx            # Protected home page
├── components/
│   ├── auth/               # Authentication components
│   │   ├── conditional-layout.tsx
│   │   └── protected-route.tsx
│   └── ui/                 # UI components
│       ├── button.tsx
│       ├── header.tsx
│       └── sidebar.tsx
└── lib/
    └── auth-context.tsx    # Authentication context
```

## Technologies Used

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **Lucide React** - Icon library
- **Axios** - HTTP client

## Customization

### Adding New Protected Pages

1. Create your page component
2. Wrap it with `<ProtectedRoute>` component
3. The page will automatically require authentication

### Styling

- Modify `tailwind.config.js` for theme customization
- Update component styles in individual component files
- Use Tailwind CSS classes for rapid styling

## Security Notes

⚠️ **Important**: This is a demonstration project with mock authentication. In production:

- Implement proper JWT validation
- Use secure password hashing
- Add rate limiting
- Implement proper session management
- Use environment variables for sensitive data
- Add CSRF protection

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

This project is open source and available under the [MIT License](LICENSE).
