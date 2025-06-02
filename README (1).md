# KFC Voucher System

A React-based web application for managing KFC vouchers. This application allows users to create, view, and manage vouchers for KFC orders.

## Features

- Create new vouchers with custom codes, discount percentages, and expiry dates
- View all available vouchers
- Track voucher status (active/expired)
- Modern and responsive UI with Tailwind CSS

## Prerequisites

- Node.js (version 14 or higher)
- npm (version 6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kfc-voucher
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

- `src/` - Source code directory
  - `components/` - Reusable React components
  - `pages/` - Page components
  - `App.jsx` - Main application component
  - `main.jsx` - Application entry point

## API Integration

The application is currently set up with mock API endpoints. To integrate with a real backend:

1. Update the API endpoints in:
   - `src/pages/Vouchers.jsx`
   - `src/pages/CreateVoucher.jsx`

2. Add any necessary authentication headers or tokens

## Technologies Used

- React
- React Router
- Axios
- Tailwind CSS
- Vite

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 